import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

export function CatalogGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="br-catalog-empty">Muy pronto vamos a sumar el catálogo acá.</p>;
  }

  return (
    <>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </>
  );
}
