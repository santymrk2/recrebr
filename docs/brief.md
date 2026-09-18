# Prompt para opencode — B&R Recreación e Inflables

Copiá y pegá todo este documento como instrucción inicial. Está pensado para que el agente arranque un proyecto nuevo en Next.js, migrando el sitio actual y agregando un flujo de reservas por calendario que deriva a WhatsApp, más un backoffice simple.

---

## 1. Contexto del negocio

B&R es un negocio de alquiler de inflables y animación de eventos en Buenos Aires, Argentina. Hoy tienen:

- Un sitio web estático (un solo `index.html` con CSS y JS vanilla) con:
  - Un hero con letras 3D interactivas ("B&R") hechas con Three.js + Rapier (física) que el usuario puede arrastrar, más un marquee de fondo con la palabra "RECREACIÓN".
  - Animaciones de scroll con GSAP (reveals, texto que se resalta, nav flotante que cambia de sección activa).
  - Secciones: Hero, Nosotros, Cómo funciona (proceso), Servicios, Juegos (catálogo en tarjetas), Footer/Contacto.
  - Nav flotante inferior + menú hamburguesa en mobile.
  - Cada juego tiene un botón "Consultar" que abre WhatsApp con un mensaje prearmado (`wa.me/5491165383672?text=...`).
- Un catálogo de productos real en WhatsApp Business Catalog (con fotos reales, descripciones y precios en ARS), que es más completo que lo que hoy muestra la web.
- Todo el negocio opera hoy conversacionalmente por WhatsApp: cotización, coordinación de fecha, seña, confirmación.

## 2. Objetivo de este proyecto

Migrar el sitio a Next.js (App Router) manteniendo el diseño y las animaciones actuales, y agregar:

1. Un catálogo real (con fotos), alimentado por datos en vez de hardcodeado en HTML.
2. Un **calendario de disponibilidad** público: el visitante elige un producto/servicio y ve qué fechas están disponibles u ocupadas.
3. Un flujo de **solicitud de reserva**: el visitante elige fecha + producto, completa datos básicos (nombre, teléfono, localidad del evento), y el sistema:
   - Guarda la solicitud en la base de datos con estado `pendiente`.
   - Redirige/abre WhatsApp con un mensaje prearmado que incluye el producto y la fecha elegida, para que la confirmación final (seña, detalles) se termine de coordinar por WhatsApp como ya lo hacen hoy.
4. Un **backoffice simple** (`/admin`), protegido por login, donde el dueño pueda:
   - Cargar/editar/borrar productos del catálogo (nombre, descripción, precio, fotos, si es "reservable por calendario" o no).
   - Marcar fechas como bloqueadas/ocupadas por producto (o de forma general si aplica a todo el negocio).
   - Ver la lista de solicitudes de reserva con su estado (`pendiente`, `confirmada`, `cancelada`) y poder cambiar el estado manualmente después de coordinar por WhatsApp.

**Fuera de alcance por ahora (fase 2, no lo implementes todavía):** pago online, checkout tipo tienda, envío de productos comprados. Esta fase es solo catálogo + calendario + solicitud de reserva que deriva a WhatsApp + backoffice.

## 3. Stack técnico (decisión ya tomada, no la cuestiones)

- **Next.js (App Router) + TypeScript**, desplegado en **Vercel** (free tier), reemplazando el hosting estático actual.
- **Supabase** (Postgres) para datos: catálogo, disponibilidad, reservas. Usar también **Supabase Auth** solo para el login de admin (un único usuario administrador alcanza por ahora, no hace falta sistema de roles complejo).
- **Supabase Storage** para las fotos de los productos.
- Mantené todo dentro de los free tiers de Vercel y Supabase; no agregues servicios pagos ni de pago obligatorio en esta fase.
- CSS: podés mantener el enfoque actual (CSS plano con variables) migrado a módulos CSS o Tailwind, lo que genere menos fricción para portar los estilos existentes sin romper las animaciones. Priorizá no romper el hero 3D ni las animaciones de scroll existentes.

## 4. Migración del sitio actual

- Portá el `index.html` adjunto a una página Next.js (`app/page.tsx` o similar), conservando:
  - El hero 3D con Three.js + Rapier tal cual funciona hoy (como client component, con carga diferida/lazy para no romper el SSR).
  - Las animaciones GSAP + ScrollTrigger.
  - El nav flotante, el menú mobile, el footer con redes sociales y el botón flotante de WhatsApp.
  - Todas las secciones de contenido (Nosotros, Proceso, Servicios) tal como están.
- La sección "Juegos" pasa a alimentarse desde la base de datos/catálogo (ver punto 5), no hardcodeada en el componente.
- No hace falta rehacer el diseño visual; el objetivo de esta etapa es portar sin regresiones, no rediseñar.

## 5. Modelo de datos (Supabase / Postgres)

Diseñá al menos estas tablas (ajustá nombres/tipos si hace falta, pero mantené estos conceptos):

**`products`**
- `id`, `name`, `description`, `price_ars` (numeric), `price_original_ars` (numeric, nullable, para mostrar descuentos), `image_urls` (array o tabla relacionada `product_images`), `is_bookable` (boolean — si aplica el flujo de calendario/reserva), `is_active` (boolean), `created_at`, `updated_at`.

**`availability_blocks`**
- `id`, `product_id` (nullable — si es null, aplica a todo el negocio en general), `date` (o rango `start_date`/`end_date`), `reason` (texto libre, ej. "reservado", "mantenimiento"), `created_by`.
- Esto representa fechas NO disponibles. Por defecto, toda fecha futura sin bloqueo se considera disponible.

**`booking_requests`**
- `id`, `product_id`, `requested_date`, `customer_name`, `customer_phone`, `event_location` (texto libre), `notes` (opcional), `status` (`pendiente` | `confirmada` | `cancelada`), `created_at`.
- Al crear una `booking_request` con estado `pendiente`, NO se bloquea automáticamente la fecha en `availability_blocks` — eso lo hace el admin manualmente desde el backoffice cuando confirma por WhatsApp que la reserva es firme (evitar que solicitudes sin seña bloqueen fechas reales).

Incluí las migraciones SQL de Supabase para crear estas tablas, con índices razonables (ej. por `product_id` + `date`).

## 6. Flujo público (frontend)

- **Catálogo** (`/catalogo` o integrado en la home): lista de productos con foto, nombre, descripción y precio, tomados de `products`. Reemplaza los íconos SVG actuales por fotos reales (usar las que están en el catálogo de WhatsApp; te paso el archivo `catalogo-br.json` con la transcripción de nombres/descripciones/precios como punto de partida — hay que completar descripciones truncadas y subir las fotos reales a Supabase Storage).
- Cada producto con `is_bookable = true` tiene un botón "Ver disponibilidad" que abre un calendario (mes actual + próximos 2-3 meses) marcando los días bloqueados (`availability_blocks`) como no disponibles.
- Al elegir una fecha disponible, se muestra un formulario corto: nombre, teléfono, localidad del evento, notas opcionales.
- Al enviar:
  1. Se crea el registro en `booking_requests` (estado `pendiente`) vía Server Action.
  2. Se abre (o redirige a) un link de WhatsApp (`wa.me/5491165383672?text=...`) con un mensaje prearmado que incluya: nombre del producto, fecha elegida, nombre y localidad del cliente — para que el dueño lo vea y confirme manualmente.
- Productos con `is_bookable = false` mantienen el botón "Consultar" actual que abre WhatsApp directo, sin calendario.

## 7. Backoffice (`/admin`)

- Protegido con Supabase Auth (login simple con email/password, un solo usuario admin por ahora).
- Vista **Productos**: tabla con CRUD (crear, editar, borrar, subir/reemplazar fotos, marcar activo/inactivo, marcar reservable o no).
- Vista **Disponibilidad**: calendario o listado donde el admin puede bloquear/desbloquear fechas por producto (o generales).
- Vista **Reservas**: listado de `booking_requests` ordenado por fecha, con filtro por estado, y acción para cambiar el estado (`pendiente` → `confirmada` → bloquea automáticamente esa fecha en `availability_blocks`; o `pendiente` → `cancelada`).

## 8. Otros requisitos

- Responsive mobile-first (la mayoría del tráfico de este negocio es desde el celular vía WhatsApp).
- Agregar metadatos Open Graph (`og:title`, `og:description`, `og:image`) para que el link se vea bien al compartirse por WhatsApp/Instagram — hoy no los tiene.
- Variables de entorno para las credenciales de Supabase (`.env.local`, con `.env.example` documentado).
- Seed script o migración inicial que cargue los productos de `catalogo-br.json` como punto de partida (dejando claro en el código qué campos quedaron incompletos/truncados para completar a mano).
- README con instrucciones de setup local, variables de entorno necesarias, y pasos de deploy a Vercel + Supabase.

## 9. Entregable esperado de esta tarea

- Proyecto Next.js funcionando localmente (`npm run dev`) con:
  - Home migrada del sitio actual, sin romper el hero 3D ni las animaciones.
  - Catálogo dinámico desde Supabase.
  - Flujo de calendario + solicitud de reserva → WhatsApp para productos reservables.
  - Backoffice `/admin` con las tres vistas (Productos, Disponibilidad, Reservas).
- Migraciones SQL de Supabase incluidas en el repo.
- Instrucciones claras de qué variables de entorno configurar y cómo desplegar a Vercel.

No implementes pagos, checkout, ni envío de WhatsApp Cloud API todavía — dejá el flujo de reserva terminando en el link `wa.me` como está descripto arriba.
