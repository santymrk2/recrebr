import "./admin.css";
import Link from "next/link";
import { logout } from "./actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <span className="admin-nav-brand">B&amp;R admin</span>
        <Link href="/admin/products">Productos</Link>
        <Link href="/admin/availability">Disponibilidad</Link>
        <Link href="/admin/bookings">Reservas</Link>
        <form action={logout}>
          <button type="submit">Salir</button>
        </form>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
