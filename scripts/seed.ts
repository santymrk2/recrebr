// Carga scripts/catalogo-br.json en la tabla `products` de Supabase.
// Uso: npm run seed  (necesita SUPABASE_SECRET_KEY en .env.local)
//
// OJO: catalogo-br.json viene de una transcripción manual de capturas
// de pantalla del catálogo de WhatsApp. Varias descripciones están
// truncadas (terminan en "...") y algunos precios están marcados como
// dudosos en su campo "notas". Revisá y completá esos datos en el
// backoffice (/admin/products) después de correr el seed — no lo uses
// como catálogo final tal cual.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type CatalogItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  descripcion_truncada: boolean;
  precio_actual: number | null;
  precio_original: number | null;
  notas?: string;
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en el entorno (.env.local).",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const filePath = path.join(process.cwd(), "scripts", "catalogo-br.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    items: CatalogItem[];
  };

  const rows = raw.items
    .filter((item) => item.nombre) // se salta el item ambiguo #1 si no tiene nombre confiable
    .map((item, index) => ({
      name: item.nombre,
      description: item.descripcion,
      price_ars: item.precio_actual,
      price_original_ars: item.precio_original,
      image_urls: [] as string[], // completar en el admin con las fotos reales
      is_bookable: false, // marcar manualmente en el admin los que sí llevan calendario
      is_active: true,
      sort_order: index,
    }));

  console.log(`Insertando ${rows.length} productos...`);

  const { error } = await supabase.from("products").insert(rows);
  if (error) {
    console.error("Error al insertar:", error);
    process.exit(1);
  }

  console.log(
    "Listo. Revisá /admin/products para completar fotos, precios dudosos y qué",
  );
  console.log("productos marcar como reservables por calendario.");
}

main();
