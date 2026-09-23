import { describe, expect, test } from "vitest";
import { filterProducts, sortProducts } from "./catalog";
import type { Product } from "./types";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Producto",
    description: overrides.description ?? null,
    price_ars: overrides.price_ars ?? null,
    price_original_ars: overrides.price_original_ars ?? null,
    image_urls: overrides.image_urls ?? [],
    is_bookable: overrides.is_bookable ?? false,
    is_active: overrides.is_active ?? true,
    is_featured: overrides.is_featured ?? false,
    category: overrides.category ?? null,
    sort_order: overrides.sort_order ?? 0,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00Z",
  };
}

describe("filterProducts", () => {
  test("sin filtros devuelve todos los productos", () => {
    const products = [makeProduct({ id: "a" }), makeProduct({ id: "b" })];
    expect(filterProducts(products, {})).toEqual(products);
  });

  test("filtra por nombre, sin importar mayúsculas/minúsculas", () => {
    const castillo = makeProduct({ id: "a", name: "Castillo inflable" });
    const metegol = makeProduct({ id: "b", name: "Metegol humano" });
    const result = filterProducts([castillo, metegol], { search: "castillo" });
    expect(result).toEqual([castillo]);
  });

  test("el buscador también matchea la descripción", () => {
    const producto = makeProduct({
      id: "a",
      name: "Combo fiesta",
      description: "Incluye metegol humano y animador",
    });
    const result = filterProducts([producto], { search: "metegol" });
    expect(result).toEqual([producto]);
  });

  test("filtra por categoría exacta", () => {
    const inflable = makeProduct({ id: "a", category: "Inflables" });
    const animacion = makeProduct({ id: "b", category: "Animación" });
    const result = filterProducts([inflable, animacion], { category: "Inflables" });
    expect(result).toEqual([inflable]);
  });

  test("rango de precio: excluye productos fuera del rango", () => {
    const barato = makeProduct({ id: "a", price_ars: 10000 });
    const caro = makeProduct({ id: "b", price_ars: 90000 });
    const result = filterProducts([barato, caro], { minPrice: 50000 });
    expect(result).toEqual([caro]);
  });

  test("rango de precio: excluye productos sin precio cargado", () => {
    const sinPrecio = makeProduct({ id: "a", price_ars: null });
    const conPrecio = makeProduct({ id: "b", price_ars: 20000 });
    const result = filterProducts([sinPrecio, conPrecio], { maxPrice: 50000 });
    expect(result).toEqual([conPrecio]);
  });

  test("combina búsqueda y categoría (intersección)", () => {
    const match = makeProduct({ id: "a", name: "Castillo grande", category: "Inflables" });
    const soloNombre = makeProduct({ id: "b", name: "Castillo chico", category: "Animación" });
    const soloCategoria = makeProduct({ id: "c", name: "Metegol", category: "Inflables" });
    const result = filterProducts([match, soloNombre, soloCategoria], {
      search: "castillo",
      category: "Inflables",
    });
    expect(result).toEqual([match]);
  });
});

describe("sortProducts", () => {
  test("'default' preserva el orden original sin mutar el array", () => {
    const products = [makeProduct({ id: "b" }), makeProduct({ id: "a" })];
    const original = [...products];
    const result = sortProducts(products, "default");
    expect(result).toEqual(original);
    expect(result).not.toBe(products);
  });

  test("'price-asc' ordena de menor a mayor precio", () => {
    const caro = makeProduct({ id: "a", price_ars: 90000 });
    const barato = makeProduct({ id: "b", price_ars: 10000 });
    const result = sortProducts([caro, barato], "price-asc");
    expect(result.map((p) => p.id)).toEqual(["b", "a"]);
  });

  test("'price-desc' ordena de mayor a menor precio", () => {
    const caro = makeProduct({ id: "a", price_ars: 90000 });
    const barato = makeProduct({ id: "b", price_ars: 10000 });
    const result = sortProducts([barato, caro], "price-desc");
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });

  test("los productos sin precio quedan siempre al final, en ambas direcciones", () => {
    const sinPrecio = makeProduct({ id: "a", price_ars: null });
    const conPrecio = makeProduct({ id: "b", price_ars: 10000 });

    expect(sortProducts([sinPrecio, conPrecio], "price-asc").map((p) => p.id)).toEqual([
      "b",
      "a",
    ]);
    expect(sortProducts([sinPrecio, conPrecio], "price-desc").map((p) => p.id)).toEqual([
      "b",
      "a",
    ]);
  });
});
