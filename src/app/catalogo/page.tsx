import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo — B&R Recreación e Inflables",
  description: "Todos los juegos e inflables disponibles para tu evento en Buenos Aires.",
};

async function getAllActiveProducts(): Promise<Product[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as Product[];
  } catch (err) {
    console.warn("No se pudo leer el catálogo de Supabase:", err);
    return [];
  }
}

export default async function CatalogoPage() {
  const products = await getAllActiveProducts();

  return (
    <>
      <link rel="stylesheet" href="/legacy/styles.css" />
      <link rel="stylesheet" href="/legacy/catalog-extra.css" />

      <header className="catalogo-header">
        <Link href="/" className="catalogo-header-logo" aria-label="Volver al inicio">
          <span className="display">B&amp;R</span>
        </Link>
        <a
          className="btn-wsp"
          href={buildWhatsAppLink("Hola! Vi el catálogo en la web y quiero consultar.")}
          target="_blank"
          rel="noopener"
        >
          WhatsApp
        </a>
      </header>

      <CatalogExplorer products={products} />

      <footer className="catalogo-footer">
        <div className="wrap">
          <p>
            <Link href="/" className="display catalogo-footer-brand">
              B&amp;R
            </Link>
          </p>
          <p>Alquiler de inflables, animación y eventos en Buenos Aires.</p>
          <p>
            <a
              href={buildWhatsAppLink("Hola! Quiero consultar por un evento")}
              target="_blank"
              rel="noopener"
            >
              WhatsApp +54 9 11 6538-3672
            </a>
          </p>
          <p>© {new Date().getFullYear()} B&amp;R. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
