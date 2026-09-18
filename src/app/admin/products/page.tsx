import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteProduct } from "./actions";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Product[];
}

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <>
      <h1>Productos</h1>
      <div className="admin-card">
        <Link href="/admin/products/new" className="admin-btn">
          + Nuevo producto
        </Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Reservable</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.price_ars ? `$${p.price_ars.toLocaleString("es-AR")}` : "—"}</td>
                <td>{p.is_bookable ? "Sí" : "No"}</td>
                <td>{p.is_active ? "Sí" : "No"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <Link href={`/admin/products/${p.id}`} className="admin-btn secondary">
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteProduct(p.id);
                    }}
                  >
                    <button type="submit" className="admin-btn danger">
                      Borrar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5}>Todavía no hay productos cargados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
