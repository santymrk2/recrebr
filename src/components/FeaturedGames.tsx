import Image from "next/image";
import type { Product } from "@/lib/types";

const MAX_FEATURED = 3;

export function FeaturedGames({ products }: { products: Product[] }) {
  const featured = products.slice(0, MAX_FEATURED);

  if (featured.length === 0) {
    return (
      <p className="br-catalog-empty">
        Estamos actualizando nuestra selección — mirá el catálogo completo más abajo.
      </p>
    );
  }

  return (
    <>
      {featured.map((product) => {
        const image = product.image_urls?.[0];
        return (
          <article key={product.id} className="game-card game-card-featured reveal">
            <div className="game-photo">
              {image ? (
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  sizes="280px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="game-photo-placeholder" aria-hidden="true" />
              )}
            </div>
            <div className="game-body">
              <h3>{product.name}</h3>
            </div>
          </article>
        );
      })}
    </>
  );
}
