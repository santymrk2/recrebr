import type { Product } from "@/lib/types";

export function ProductForm({
  action,
  product,
  error,
}: {
  action: (formData: FormData) => void;
  product?: Product;
  error?: string;
}) {
  return (
    <form action={action} className="admin-form">
      <label>
        Nombre
        <input name="name" defaultValue={product?.name} required />
      </label>
      <label>
        Descripción
        <textarea name="description" defaultValue={product?.description ?? ""} rows={3} />
      </label>
      <label>
        Precio (ARS)
        <input
          name="price_ars"
          type="number"
          step="1"
          defaultValue={product?.price_ars ?? ""}
        />
      </label>
      <label>
        Precio anterior / tachado (ARS, opcional)
        <input
          name="price_original_ars"
          type="number"
          step="1"
          defaultValue={product?.price_original_ars ?? ""}
        />
      </label>
      <label>
        Fotos (una URL por línea — subilas a Supabase Storage y pegá el link público)
        <textarea
          name="image_urls"
          rows={3}
          defaultValue={product?.image_urls?.join("\n") ?? ""}
        />
      </label>
      <label>
        Orden (menor = aparece primero)
        <input name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="is_bookable"
          defaultChecked={product?.is_bookable ?? false}
        />
        Reservable por calendario (si no, el botón es "Consultar" directo)
      </label>
      <label className="checkbox-row">
        <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} />
        Visible en la web
      </label>

      {error && <p className="admin-error">{error}</p>}

      <button type="submit" className="admin-btn">
        Guardar
      </button>
    </form>
  );
}
