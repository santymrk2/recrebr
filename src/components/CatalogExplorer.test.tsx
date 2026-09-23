import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogExplorer } from "./CatalogExplorer";
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
    is_featured: overrides.is_featured ?? false,
    category: overrides.category ?? null,
    sort_order: overrides.sort_order ?? 0,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00Z",
  };
}

const CASTILLO = makeProduct({
  id: "a",
  name: "Castillo inflable",
  category: "Inflables",
  price_ars: 30000,
});
const METEGOL = makeProduct({
  id: "b",
  name: "Metegol humano",
  category: "Animación",
  price_ars: 80000,
});

describe("CatalogExplorer", () => {
  test("muestra todos los productos al inicio", () => {
    render(<CatalogExplorer products={[CASTILLO, METEGOL]} />);
    expect(screen.getByText("Castillo inflable")).toBeInTheDocument();
    expect(screen.getByText("Metegol humano")).toBeInTheDocument();
  });

  test("el buscador filtra los productos visibles", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorer products={[CASTILLO, METEGOL]} />);

    await user.type(screen.getByLabelText("Buscar juego"), "castillo");

    expect(screen.getByText("Castillo inflable")).toBeInTheDocument();
    expect(screen.queryByText("Metegol humano")).not.toBeInTheDocument();
  });

  test("solo muestra pills de categorías que realmente tienen productos", () => {
    render(<CatalogExplorer products={[CASTILLO]} />);
    expect(screen.getByRole("button", { name: "Inflables" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Animación" })).not.toBeInTheDocument();
  });

  test("clickear una pill de categoría filtra los productos", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorer products={[CASTILLO, METEGOL]} />);

    await user.click(screen.getByRole("button", { name: "Animación" }));

    expect(screen.getByText("Metegol humano")).toBeInTheDocument();
    expect(screen.queryByText("Castillo inflable")).not.toBeInTheDocument();
  });

  test("si el catálogo está vacío de entrada, avisa que todavía no hay productos", () => {
    render(<CatalogExplorer products={[]} />);
    expect(screen.getByText(/todav.a no hay productos/i)).toBeInTheDocument();
  });

  test("si los filtros no matchean nada, avisa que no hay resultados (no que el catálogo está vacío)", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorer products={[CASTILLO, METEGOL]} />);

    await user.type(screen.getByLabelText("Buscar juego"), "metegol gigante inexistente");

    expect(screen.getByText(/no encontramos juegos con esos filtros/i)).toBeInTheDocument();
    expect(screen.queryByText(/todav.a no hay productos/i)).not.toBeInTheDocument();
  });

  test("ordenar por precio ascendente reordena las tarjetas visibles", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorer products={[METEGOL, CASTILLO]} />);

    await user.selectOptions(screen.getByLabelText("Ordenar por"), "price-asc");

    const names = screen.getAllByRole("heading", { level: 3 }).map((el) => el.textContent);
    expect(names).toEqual(["Castillo inflable", "Metegol humano"]);
  });
});
