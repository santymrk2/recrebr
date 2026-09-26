import fs from "node:fs";
import path from "node:path";
import { renderFaqMarkup } from "@/components/faqMarkup";
import { renderGamesMarkup } from "@/components/gamesMarkup";
import { buildFaqJsonLd, buildLocalBusinessJsonLd } from "@/lib/site";

// El hero 3D, el nav flotante, el menú mobile y el footer se traen
// TAL CUAL del sitio original (public/legacy/markup.html), para no
// arriesgar romper nada de esas animaciones al portarlas a JSX a mano.
function readLegacyFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "legacy", relativePath), "utf-8");
}

const CATALOG_MOUNT = '<div class="games-grid" id="catalog-root" data-catalog-root="true"></div>';
const FAQ_MOUNT = '<div id="faq-root"></div>';

function fillMount(markup: string, mount: string, html: string) {
  if (!markup.includes(mount)) {
    throw new Error(`markup.html: no se encontró el mount point ${mount}`);
  }
  return markup.replace(mount, mount.replace("></div>", `>${html}</div>`));
}

// Las tarjetas de juegos y las preguntas frecuentes se renderizan en el
// servidor DENTRO del markup legado. Antes los juegos se montaban con un
// portal en useEffect: no venían en el HTML inicial y Google tenía que
// ejecutar JS para ver el catálogo.
function buildMarkup() {
  let markup = readLegacyFile("markup.html");
  markup = fillMount(markup, CATALOG_MOUNT, renderGamesMarkup());
  markup = fillMount(markup, FAQ_MOUNT, renderFaqMarkup());
  return markup;
}

export default function HomePage() {
  const markup = buildMarkup();
  const criticalCss = readLegacyFile("critical.css");
  const loaderJs = readLegacyFile("scripts/loader.js");
  const interactionsJs = readLegacyFile("scripts/interactions.js");

  const importMap = JSON.stringify({
    imports: {
      three: "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/",
    },
  });

  // `<` escapado: el JSON va dentro de un <script> y no puede cerrarlo.
  const jsonLd = JSON.stringify([buildLocalBusinessJsonLd(), buildFaqJsonLd()]).replace(
    /</g,
    "\\u003c",
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {/* Los <link> de abajo se renderizan al comienzo del <body>, así que el
          navegador los descubre tarde (un request extra) y en el refresh se
          veía la página sin estilos. El CSS crítico va inlineado para que el
          overlay de carga ya salga con fondo y tipografía en el primer paint. */}
      <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      <link rel="stylesheet" href="/legacy/styles.css" />
      <link rel="stylesheet" href="/legacy/catalog-extra.css" />

      <div dangerouslySetInnerHTML={{ __html: markup }} />

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
