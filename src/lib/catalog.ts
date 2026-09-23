import type { Product } from "./types";

export type CatalogFilters = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type CatalogSort = "default" | "price-asc" | "price-desc";

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const search = filters.search?.trim().toLowerCase();
  const hasPriceFilter = filters.minPrice !== undefined || filters.maxPrice !== undefined;

  return products.filter((product) => {
    if (search) {
      const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.category && product.category !== filters.category) {
      return false;
    }

    if (hasPriceFilter) {
      if (product.price_ars === null) return false;
      if (filters.minPrice !== undefined && product.price_ars < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && product.price_ars > filters.maxPrice) return false;
    }

    return true;
  });
}

export function sortProducts(products: Product[], sort: CatalogSort): Product[] {
  const copy = [...products];
  if (sort === "default") return copy;

  const direction = sort === "price-asc" ? 1 : -1;
  return copy.sort((a, b) => {
    if (a.price_ars === null && b.price_ars === null) return 0;
    if (a.price_ars === null) return 1;
    if (b.price_ars === null) return -1;
    return (a.price_ars - b.price_ars) * direction;
  });
}
