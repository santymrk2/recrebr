import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default function NewProductPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <h1>Nuevo producto</h1>
      <div className="admin-card">
        <ProductForm action={createProduct} error={searchParams.error} />
      </div>
    </>
  );
}
