# Rediseño del admin B&R — sistema de componentes, identidad visual y disponibilidad

## 1. Contexto y motivación

El admin (`/admin`) se armó rápido en la fase inicial (ver `docs/brief.md`) y hoy tiene tres problemas reales, no solo estéticos:

1. **Cero componentes propios.** Cada pantalla repite `className="admin-btn secondary"` a mano sobre HTML crudo. Cambiar un estilo implica tocar 7 archivos.
2. **Un bug funcional confirmado**: en `src/app/admin/bookings/page.tsx:47`, el resaltado del tab activo es código muerto (el ternario devuelve el mismo string en ambas ramas) — el usuario nunca sabe en qué filtro está parado.
3. **El modelo de disponibilidad no soporta múltiples unidades del mismo producto.** El negocio confirmó tener varias unidades físicas de al menos un juego. Hoy, `setBookingStatus` (`src/app/admin/bookings/actions.ts:33-42`) inserta un bloqueo en `availability_blocks` apenas se confirma UNA reserva, tapando la fecha para todo el producto sin importar cuántas unidades queden libres. Esto es una pérdida de reservas real, no un caso límite.

Este documento cubre el rediseño completo: identidad visual, sistema de componentes, y el modelo de disponibilidad corregido, inspirado en los conceptos de **Cal.com** (Availability Schedule, Date Overrides, Round Robin) adaptados a un negocio que reserva por día completo, no por franjas horarias.

## 2. Decisiones de arquitectura (ya validadas)

| Decisión | Elegido | Descartado | Por qué |
|---|---|---|---|
| Backend/datos | Seguir en Supabase | Airtable | Ya hay Postgres relacional, RLS, auth y migraciones funcionando. Airtable solo tendría sentido si alguien no técnico necesitara usar SU interfaz nativa — no es el caso: el admin va a tener UI propia igual. |
| Storage de imágenes | Supabase Storage, upload propio desde el admin | Google Drive | Drive es gratis pero no está pensado para hotlinking público a escala: archivos compartidos "con cualquiera" tienen un límite de vistas/descargas no documentado que bloquea el archivo 24hs si se supera. Riesgo real para fotos que se muestran en el catálogo público. |
| Identidad visual | Opción C — admin oscuro con paleta de marca (`#ff7a00`, `#00b4d8`, `#201205`) | Opciones A/B (fiel a marca clara / sobrio neutro) | Elegida por el usuario tras ver los 3 mockups. Diferencia claramente "estoy en el admin" de "estoy en la web pública". |
| Stack CSS | Tailwind v4, scoped a `/admin` | CSS Modules a mano | Consistente con cómo el usuario ya trabaja en otros proyectos. Ver §5 para el riesgo de preflight y su mitigación. |

## 3. Modelo de disponibilidad (rediseño central)

### 3.1 Qué se copia de Cal.com y por qué

- **Availability Schedule** (horario semanal reusable) → cubre el pedido de reglas recurrentes ("cerrado todos los lunes") sin motor de RRULE.
- **Date Overrides** (excepciones puntuales sobre el horario) → es literalmente lo que ya hace la tabla `availability_blocks`; se mantiene, pero deja de llenarse automáticamente.
- **Round Robin** (N hosts intercambiables, se ofrece el turno si alguno está libre) → adaptado como conteo de unidades: N unidades físicas de un mismo producto, se ofrece la fecha si hay al menos una libre.

**Explícitamente NO se copia**: franjas horarias de minutos, timezones, "tipos de evento" múltiples, embeds públicos tipo Calendly. El negocio reserva por día completo; meter granularidad horaria sería complejidad sin uso.

### 3.2 Cambios de esquema (nueva migración `0002_availability_v2.sql`)

```sql
-- Unidades físicas por producto (agregado, sin tracking individual —
-- decisión explícita del usuario: no hace falta bloquear una unidad puntual).
alter table products add column unit_count integer not null default 1;

-- Horario semanal general del negocio (Availability Schedule de Cal.com).
-- 7 filas fijas, una por día de la semana. Sin horario cargado = todo abierto.
create table weekly_schedule (
  weekday integer primary key check (weekday between 0 and 6), -- 0=domingo
  is_open boolean not null default true
);
insert into weekly_schedule (weekday, is_open)
  select generate_series(0, 6), true
  on conflict do nothing;
```

`availability_blocks` no cambia de estructura — cambia su significado: pasa a ser exclusivamente para excepciones manuales (feriado, mantenimiento), nunca generadas por el sistema.

### 3.3 Lógica de disponibilidad (reemplaza el bloqueo automático)

Una fecha `D` está disponible para un producto `P` si, **en este orden**:

1. `weekly_schedule.is_open` es `true` para el día de la semana de `D`.
2. No existe una fila en `availability_blocks` para `(P, D)` ni para `(general, D)`.
3. `count(booking_requests donde product_id=P, requested_date=D, status='confirmada') < P.unit_count`.

**Cambio de código requerido**: `setBookingStatus` (`bookings/actions.ts`) deja de insertar en `availability_blocks` al confirmar. Solo actualiza el `status` de la reserva. `getBlockedDates` (`actions/booking.ts`) se reemplaza por una función que aplica las 3 reglas de arriba sobre un rango de fechas, no solo lee `availability_blocks`.

**Salvaguarda (soft, no hard-block)**: si un admin confirma una reserva y eso deja `confirmadas >= unit_count` para ese día, se muestra un `InlineBanner` de advertencia ("Vas a superar tu capacidad para este producto ese día") — no se bloquea la acción, porque puede haber una razón válida (unidad extra prestada, etc.) que el sistema no conoce.

## 4. Sistema de componentes (`src/components/admin/`)

10 piezas, ninguna más de lo que las 7 pantallas actuales necesitan:

`Button` (primary/ghost/danger) · `Badge` (estado) · `Card` · `Table` · `FormField` · `Tabs` · `FileUpload` · `ConfirmSubmitButton` · `InlineBanner` · `Switch` (nuevo, para el horario semanal).

`Calendar.tsx` (ya existe, usado hoy por `BookingModal` público) **se extiende, no se duplica**: gana soporte para mostrar densidad por día (pendiente/confirmada/bloqueada, reusando los colores de `Badge`) y selección de rango (para cargar un bloqueo manual de varios días de una).

**Detalle de día seleccionado**: se reusa el patrón que ya existe en `BookingModal.tsx:98` (al elegir una fecha, aparece un panel debajo con el detalle/formulario) — no se construye un sistema de modales nuevo para esto.

## 5. Riesgo técnico identificado y su mitigación: Tailwind preflight

Next.js App Router **no aísla** un CSS global importado en un layout anidado a esa sola ruta — sigue siendo CSS global una vez cargado, y Next.js documenta que no siempre remueve la hoja de estilos al navegar entre rutas. Si el preflight de Tailwind (reset de `box-sizing`, márgenes, `<button>`, `<a>`, etc.) llegara a coexistir en el mismo documento que `public/legacy/styles.css`, rompe el sitio público (hero 3D, nav, animaciones GSAP).

**Mitigación (verificada para v3 y v4 de Tailwind)**: no se importa el preflight.
- Tailwind v4: `@import "tailwindcss/theme.css" layer(theme);` + `@import "tailwindcss/utilities.css" layer(utilities);`, omitiendo `tailwindcss/preflight.css`.
- El resto de las utility classes son inertes por diseño — solo afectan elementos que llevan exactamente esa clase, nunca se filtran al markup del sitio público.

## 6. Bugs que se resuelven de arranque (gratis, ya que se toca cada pantalla)

- Tab activo roto en Reservas (ternario muerto).
- `<a>` planos en los filtros de Reservas → `next/link` con estado activo real vía `usePathname`.
- Borrar producto / Cancelar reserva piden confirmación (`ConfirmSubmitButton`, sin modal).
- Feedback post-acción (guardar/confirmar/cancelar/borrar) vía `InlineBanner`, reusando el patrón `searchParams` que ya existe en el login.
- Checkboxes nativos con `accent-color` de marca, focus states visibles.
- Responsive: la tabla pasa a modo tarjetas apiladas por debajo de ~640px.

## 7. Upload de imágenes

Bucket público `products` en Supabase Storage. `FileUpload` sube el archivo desde un Server Action y guarda la URL pública en `image_urls`. Se elimina el textarea de "pegá el link".

## 8. Explícitamente fuera de alcance

- Tests automatizados (el repo no tiene ninguno hoy; no se inventa infraestructura de testing sin que se pida).
- Librería de modales.
- Toggle claro/oscuro (el admin queda fijo en oscuro).
- Paginación de tablas (se suma si el volumen de productos/reservas crece).
- Franjas horarias, timezones, tipos de evento múltiples, embeds públicos.
- Tracking de unidades individuales (solo conteo agregado `unit_count`).
