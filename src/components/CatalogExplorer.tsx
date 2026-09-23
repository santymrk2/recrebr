"use client";

import { useMemo, useState } from "react";
import { CatalogGrid } from "./CatalogGrid";
import { filterProducts, sortProducts, type CatalogSort } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export function CatalogExplorer({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<CatalogSort>("default");

  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => p.category).filter((c): c is string => Boolean(c)),
    );
    return Array.from(set).sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      search: search || undefined,
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    return sortProducts(filtered, sort);
  }, [products, search, category, minPrice, maxPrice, sort]);

  return (
    <div className="catalog-explorer">
      <div className="catalog-filters">
        <input
          type="search"
          placeholder="Buscar juego..."
          aria-label="Buscar juego"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="catalog-category-pills" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={category === "" ? "active" : ""}
            onClick={() => setCategory("")}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="catalog-price-range">
          <label>
            Precio mín.
            <input
              type="number"
              aria-label="Precio mínimo"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </label>
          <label>
            Precio máx.
            <input
              type="number"
              aria-label="Precio máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </label>
        </div>

        <label>
          Ordenar por
          <select
            aria-label="Ordenar por"
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogSort)}
          >
            <option value="default">Orden del catálogo</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>

      <div className="games-grid">
        {products.length === 0 ? (
          <p className="br-catalog-empty">Todavía no hay productos cargados en el catálogo.</p>
        ) : visibleProducts.length === 0 ? (
          <p className="br-catalog-empty">
            No encontramos juegos con esos filtros. Probá cambiarlos o limpiarlos.
          </p>
        ) : (
          <CatalogGrid products={visibleProducts} />
        )}
      </div>
    </div>
  );
}
