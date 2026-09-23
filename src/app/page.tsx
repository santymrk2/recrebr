import fs from "node:fs";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CatalogPortal } from "@/components/CatalogPortal";
import { FeaturedGames } from "@/components/FeaturedGames";
import type { Product } from "@/lib/types";

// El hero 3D, el nav flotante, el menú mobile y el footer se traen
// TAL CUAL del sitio original (public/legacy/markup.html), para no
// arriesgar romper nada de esas animaciones al portarlas a JSX a mano.
// La sección de catálogo ("Juegos") es la única parte reemplazada por
// un mount point (#catalog-root) donde se porta el <CatalogGrid> real.
function readLegacyFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "legacy", relativePath), "utf-8");
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as Product[];
  } catch (err) {
    // Si todavía no configuraste Supabase, la home no debe romperse:
    // se muestra vacío y se loguea el motivo en el server.
    console.warn("No se pudo leer el catálogo de Supabase:", err);
    return [];
  }
}

export default async function HomePage() {
  const markup = readLegacyFile("markup.html");
  const loaderJs = readLegacyFile("scripts/loader.js");
  const interactionsJs = readLegacyFile("scripts/interactions.js");
  const featuredProducts = await getFeaturedProducts();

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
      <CatalogPortal>
        <FeaturedGames products={featuredProducts} />
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
