# B&R Recreación e Inflables — sitio

Landing de una sola página en Next.js (App Router). No tiene backend: cada
juego y cada botón de contacto abre WhatsApp con un mensaje prearmado.

## Estructura

- `src/app/page.tsx`: arma la home. El hero 3D, el nav, las secciones y el
  footer vienen TAL CUAL del sitio original (`public/legacy/markup.html`) y se
  inyectan como HTML. Las tarjetas de juegos se renderizan en el servidor
  (`src/components/gamesMarkup.ts`) dentro de `#catalog-root`.
- `src/components/games.data.ts`: la lista de juegos (nombre, bajada, detalle).
- `src/lib/site.ts`: datos del negocio para SEO (título, descripción, teléfono,
  redes, JSON-LD de LocalBusiness). Se cambian ahí.
- `src/app/opengraph-image.tsx` / `icon.tsx`: preview al compartir y favicon.
- `public/legacy/scripts/hero3d.js`: letras 3D (Three.js + Rapier) y la mano
  que enseña a arrastrarlas.

## Local

```bash
bun install
cp env.example.txt .env.local
bun dev
```

## Deploy (Vercel)

Configurar en el proyecto de Vercel:

No hace falta ninguna variable: el dominio canónico (`recrebr.com.ar`) y el
WhatsApp tienen valores por defecto. Opcionales: `NEXT_PUBLIC_SITE_URL` y
`NEXT_PUBLIC_WHATSAPP_NUMBER`.
