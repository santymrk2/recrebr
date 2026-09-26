import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B&R Recreación e Inflables — La recreación se vive",
  description:
    "Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.",
  alternates: { canonical: "/" },
};

import fs from "node:fs";
import path from "node:path";
import { CatalogPortal } from "@/components/CatalogPortal";
import { GamesGrid } from "@/components/GamesGrid";

// El hero 3D, el nav flotante, el menú mobile y el footer se traen
// TAL CUAL del sitio original (public/legacy/markup.html), para no
// arriesgar romper nada de esas animaciones al portarlas a JSX a mano.
// La sección "Juegos" es la única parte reemplazada por un mount point
// (#catalog-root) donde se porta el <GamesGrid> (cada juego abre WhatsApp).
function readLegacyFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "legacy", relativePath), "utf-8");
}

export default function HomePage() {
  const markup = readLegacyFile("markup.html");
  const loaderJs = readLegacyFile("scripts/loader.js");
  const interactionsJs = readLegacyFile("scripts/interactions.js");

  const importMap = JSON.stringify({
    imports: {
      three: "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/",
    },
  });

  return (
    <>
      <link rel="stylesheet" href="/legacy/styles.css" />
      <link rel="stylesheet" href="/legacy/catalog-extra.css" />

      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <a href="/v2" style={{ position: "fixed", top: 12, left: 12, zIndex: 10000, padding: "8px 10px", borderRadius: 99, background: "#ffffffdd", color: "#111", fontFamily: "Arial, sans-serif", fontSize: 12, textDecoration: "none" }}>Conocé la nueva RECREBR</a>
      <CatalogPortal>
        <GamesGrid />
      </CatalogPortal>

      {/* ===== Scripts, en el mismo orden que el sitio original ===== */}
      <script dangerouslySetInnerHTML={{ __html: loaderJs }} />
      <script type="importmap" dangerouslySetInnerHTML={{ __html: importMap }} />
      <script type="module" src="/legacy/scripts/hero3d.js" />
      <script type="module" src="/legacy/scripts/icons3d.js" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" />
      <script dangerouslySetInnerHTML={{ __html: interactionsJs }} />
    </>
  );
}
