import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { addBlock, removeBlock } from "./actions";
import type { Product, AvailabilityBlock } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: products }, { data: blocks }] = await Promise.all([
    supabase.from("products").select("*").eq("is_bookable", true).order("name"),
    supabase
      .from("availability_blocks")
      .select("*")
      .gte("blocked_date", new Date().toISOString().slice(0, 10))
      .order("blocked_date", { ascending: true }),
  ]);

  const productMap = new Map((products as Product[] | null)?.map((p) => [p.id, p.name]) ?? []);

  return (
    <>
      <h1>Disponibilidad</h1>

      <div className="admin-card">
        <p style={{ marginTop: 0, color: "var(--br-text-soft)", fontSize: "0.85rem" }}>
          Bloqueá una fecha para un producto puntual, o elegí "General" para bloquearla en
          todo el negocio (ej. un feriado en el que no salen inflables).
        </p>
        <form action={addBlock} className="admin-form">
          <label>
            Producto
            <select name="product_id" required>
              <option value="general">General (todo el negocio)</option>
              {(products as Product[] | null)?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" name="blocked_date" required />
          </label>
          <label>
            Motivo (opcional)
            <input name="reason" placeholder="Reservado, mantenimiento, feriado…" />
          </label>
          <button type="submit" className="admin-btn">
            Bloquear fecha
          </button>
        </form>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Motivo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(blocks as AvailabilityBlock[] | null)?.map((b) => (
              <tr key={b.id}>
                <td>{b.blocked_date}</td>
                <td>{b.product_id ? productMap.get(b.product_id) ?? "—" : "General"}</td>
                <td>{b.reason || "—"}</td>
                <td>
                  <form
                    action={async () => {
                      "use server";
                      await removeBlock(b.id);
                    }}
                  >
                    <button type="submit" className="admin-btn danger">
                      Quitar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!blocks || blocks.length === 0) && (
              <tr>
                <td colSpan={4}>No hay fechas bloqueadas próximamente.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
