import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { setBookingStatus } from "./actions";
import type { BookingRequest, BookingStatus, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createSupabaseAdminClient();

  const filter = searchParams.status as BookingStatus | undefined;

  let query = supabase
    .from("booking_requests")
    .select("*")
    .order("requested_date", { ascending: true });
  if (filter) query = query.eq("status", filter);

  const [{ data: bookings }, { data: products }] = await Promise.all([
    query,
    supabase.from("products").select("id, name"),
  ]);

  const productMap = new Map(
    (products as Pick<Product, "id" | "name">[] | null)?.map((p) => [p.id, p.name]) ?? [],
  );

  const tabs: { label: string; value: BookingStatus | "" }[] = [
    { label: "Todas", value: "" },
    { label: "Pendientes", value: "pendiente" },
    { label: "Confirmadas", value: "confirmada" },
    { label: "Canceladas", value: "cancelada" },
  ];

  return (
    <>
      <h1>Reservas</h1>

      <div className="admin-card" style={{ display: "flex", gap: 8 }}>
        {tabs.map((tab) => (
          <a
            key={tab.value}
            href={tab.value ? `/admin/bookings?status=${tab.value}` : "/admin/bookings"}
            className={`admin-btn secondary${filter === tab.value ? "" : ""}`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(bookings as BookingRequest[] | null)?.map((b) => (
              <tr key={b.id}>
                <td>{b.requested_date}</td>
                <td>{productMap.get(b.product_id) ?? "—"}</td>
                <td>
                  {b.customer_name}
                  {b.event_location ? ` · ${b.event_location}` : ""}
                  {b.notes ? (
                    <div style={{ color: "var(--br-text-soft)", fontSize: "0.8rem" }}>
                      {b.notes}
                    </div>
                  ) : null}
                </td>
                <td>{b.customer_phone}</td>
                <td>
                  <span className={`admin-badge ${b.status}`}>{b.status}</span>
                </td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {b.status !== "confirmada" && (
                    <form
                      action={async () => {
                        "use server";
                        await setBookingStatus(b.id, "confirmada");
                      }}
                    >
                      <button type="submit" className="admin-btn">
                        Confirmar
                      </button>
                    </form>
                  )}
                  {b.status !== "cancelada" && (
                    <form
                      action={async () => {
                        "use server";
                        await setBookingStatus(b.id, "cancelada");
                      }}
                    >
                      <button type="submit" className="admin-btn danger">
                        Cancelar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!bookings || bookings.length === 0) && (
              <tr>
                <td colSpan={6}>No hay solicitudes de reserva todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
