import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedGames } from "./FeaturedGames";
import type { Product } from "@/lib/types";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Producto",
    description: overrides.description ?? null,
    price_ars: overrides.price_ars ?? 50000,
    price_original_ars: overrides.price_original_ars ?? null,
    image_urls: overrides.image_urls ?? ["https://example.supabase.co/foto.jpg"],
    is_bookable: overrides.is_bookable ?? false,
    is_active: overrides.is_active ?? true,
    is_featured: overrides.is_featured ?? true,
    category: overrides.category ?? null,
    sort_order: overrides.sort_order ?? 0,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00Z",
  };
}

describe("FeaturedGames", () => {
  test("muestra el nombre de cada producto destacado", () => {
    const products = [
      makeProduct({ id: "a", name: "Castillo inflable" }),
      makeProduct({ id: "b", name: "Metegol humano" }),
    ];
    render(<FeaturedGames products={products} />);
    expect(screen.getByText("Castillo inflable")).toBeInTheDocument();
    expect(screen.getByText("Metegol humano")).toBeInTheDocument();
  });

  test("nunca muestra más de 3 productos, aunque reciba más", () => {
    const products = [
      makeProduct({ id: "a", name: "Uno" }),
      makeProduct({ id: "b", name: "Dos" }),
      makeProduct({ id: "c", name: "Tres" }),
      makeProduct({ id: "d", name: "Cuatro" }),
    ];
    render(<FeaturedGames products={products} />);
    expect(screen.queryByText("Cuatro")).not.toBeInTheDocument();
  });

  test("no muestra precio ni botón de acción, solo foto y nombre", () => {
    const products = [makeProduct({ id: "a", name: "Castillo", price_ars: 75000 })];
    render(<FeaturedGames products={products} />);
    expect(screen.queryByText(/75\.000|\$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("sin productos destacados, muestra un mensaje en vez de quedar vacío", () => {
    render(<FeaturedGames products={[]} />);
    expect(
      screen.getByText(/estamos actualizando nuestra selecci.n/i),
    ).toBeInTheDocument();
  });
});
