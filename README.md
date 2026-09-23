# B&R Recreación e Inflables — sitio + reservas + backoffice

Next.js (App Router) + Supabase. Portado del `index.html` original manteniendo
el hero 3D, las animaciones y el diseño tal como estaban, y sumando catálogo
dinámico, calendario de disponibilidad → solicitud de reserva por WhatsApp, y
un backoffice simple.

## ⚠️ Léelo antes que nada: qué NO pude hacer yo mismo

Armé todo el código, pero en este entorno no tengo acceso a internet ni
puedo crear cuentas en servicios externos. Eso significa que:

1. **No corrí `npm install` ni `npm run build`.** El código está escrito a
   mano siguiendo los patrones estándar de Next.js 14 + Supabase, pero no
   quedó verificado compilando. Al correrlo por primera vez puede aparecer
   algún error de tipeo o de tipos que haya que corregir — es esperable en
   un proyecto de este tamaño armado sin poder ejecutarlo.
2. **No creé el proyecto de Supabase.** Tenés que crearlo vos (es gratis) y
   pegar las credenciales en `.env.local`.
3. **No pude copiar la fuente 3D** (`Arial Rounded MT.json`) que usa el hero
   — el `index.html` que subiste la cargaba desde una carpeta `fonts/` que
   no estaba incluida en el upload. Ver `public/legacy/fonts/README.txt`.
   Sin ese archivo, el resto del sitio funciona igual; solo el hero 3D va a
   mostrar el overlay de error que el propio código original ya contempla.
4. **No hice el deploy a Vercel** ni configuré dominio.

Todo lo demás (estructura del proyecto, esquema de base de datos, catálogo,
calendario, reservas, backoffice) está implementado y listo para correr en
cuanto sigas los pasos de abajo.

## Qué se portó tal cual vs. qué es nuevo

- **Tal cual del sitio original** (copiado directo de tu `index.html`, no
  retipeado a mano, para no arriesgar romper nada): el CSS completo, el hero
  3D con Three.js + Rapier, el nav flotante, el menú mobile, las secciones
  Nosotros/Proceso/Servicios, el footer y el botón flotante de WhatsApp.
  Viven en `public/legacy/` y se inyectan en `src/app/page.tsx`.
- **Nuevo (React + Supabase):** la grilla de "Juegos" (ahora sale de la
  base de datos en vez de estar hardcodeada), el calendario de
  disponibilidad, el flujo de solicitud de reserva → WhatsApp, y todo
  `/admin`.

## 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) y creá un proyecto nuevo
   (plan Free alcanza).
2. En **SQL Editor**, pegá y corré el contenido de
   `supabase/migrations/0001_init.sql`. Esto crea las tablas `products`,
   `availability_blocks`, `booking_requests` y las reglas de seguridad.
3. En **Authentication → Users**, creá manualmente un usuario (tu email +
   una contraseña) — ese va a ser el login del backoffice. No hace falta
   sistema de registro público, solo este usuario.
4. En **Project Settings → API Keys** (pestaña "Publishable and secret API
   keys" — Supabase está migrando de `anon`/`service_role` a este esquema
   nuevo), copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY` (¡nunca la
     subas a un repo público ni la uses en código de cliente!)

   Si tu proyecto todavía muestra las keys viejas (`anon` / `service_role`
   en vez de `publishable` / `secret`), también funcionan: pegá la `anon`
   en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y la `service_role` en
   `SUPABASE_SECRET_KEY`, son intercambiables durante la migración.

## 2. Configurar variables de entorno

El archivo `.env.example` es un **archivo oculto** (empieza con punto), así
que tu explorador de archivos puede no mostrarlo por defecto — en Mac
Finder tocá `Cmd + Shift + .` para ver ocultos, en Windows activá "elementos
ocultos" en la pestaña Vista del Explorador. Si preferís, en el zip también
te dejé una copia visible sin el punto: `env.example.txt`.

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores de Supabase del paso anterior, y tu
número de WhatsApp en `NEXT_PUBLIC_WHATSAPP_NUMBER`.

## 3. Instalar y correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`. Si el catálogo aparece vacío, es porque
todavía no cargaste productos (seguí con el paso 4).

## 4. Cargar el catálogo inicial

`scripts/catalogo-br.json` tiene la transcripción de tu catálogo de
WhatsApp que armamos en el chat. Varias descripciones están truncadas
("...") y hay precios marcados como dudosos en su campo `notas` — convendría
revisarlos antes o después de cargarlos.

```bash
npm run seed
```

Esto inserta todos los productos con `image_urls: []` (sin fotos todavía) e
`is_bookable: false` (sin calendario todavía). Después, desde
`http://localhost:3000/admin/products`:

- Subí las fotos reales a **Supabase Storage** (creá un bucket público
  `product-images`) y pegá los links públicos en cada producto.
- Marcá como "Reservable por calendario" los productos donde tenga sentido
  ofrecer el flujo de fecha + solicitud (inflables grandes, combos), y
  dejá el resto con el botón "Consultar" directo a WhatsApp.

## 5. Probar el flujo de reserva

1. En la home, un producto marcado como reservable muestra "Ver
   disponibilidad" en vez de "Consultar".
2. Al elegir una fecha libre y completar el formulario, se guarda la
   solicitud con estado `pendiente` y se abre WhatsApp con un mensaje
   prearmado.
3. En `/admin/bookings` vas a ver esa solicitud. Al tocar "Confirmar" (una
   vez que coordinaste la seña por WhatsApp como ya hacés hoy), el sistema
   bloquea automáticamente esa fecha para ese producto en
   `/admin/availability`.

## 6. Deploy a Vercel

1. Subí este proyecto a un repo de GitHub.
2. Importalo en [vercel.com](https://vercel.com) (plan Free).
3. Cargá las mismas variables de entorno de `.env.local` en
   **Project Settings → Environment Variables**.
4. Deploy. Con esto quedás en el mismo esquema de infra que ya usás hoy
   (Vercel), sumando Supabase (Free) como base de datos.

## Estructura del proyecto

```
public/legacy/            CSS, HTML y JS originales, servidos tal cual
src/app/page.tsx          Home: inyecta lo legado + catálogo dinámico
src/app/admin/            Backoffice (productos, disponibilidad, reservas)
src/app/actions/          Server actions públicas (booking)
src/components/           Catálogo, tarjetas de producto, modal de reserva, calendario
src/lib/supabase/         Clientes de Supabase (browser / server / admin)
supabase/migrations/      Esquema SQL
scripts/                  Catálogo transcripto + script de carga inicial
```

## Qué falta para la fase 2 (a propósito, no lo implementé)

Pago online / checkout, envío de productos comprados, y notificaciones
automáticas por WhatsApp Cloud API. Como charlamos, la idea de esta primera
etapa es validar que la gente use el calendario antes de invertir en eso.
