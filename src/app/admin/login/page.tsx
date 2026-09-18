import { login } from "../actions";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div style={{ maxWidth: 380 }}>
      <h1>Ingresar al backoffice</h1>
      <form action={login} className="admin-form">
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" required />
        </label>
        {searchParams.error && <p className="admin-error">{searchParams.error}</p>}
        <button type="submit" className="admin-btn">
          Ingresar
        </button>
      </form>
    </div>
  );
}
