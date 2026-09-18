"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CatalogGrid } from "./CatalogGrid";
import type { Product } from "@/lib/types";

// La sección "Juegos" del sitio legado se inyecta como HTML estático
// (para no tocar el markup original) con un <div id="catalog-root">
// vacío adentro. Este componente espera a que ese nodo exista en el
// DOM y hace un portal del catálogo (React) ahí adentro.
export function CatalogPortal({ products }: { products: Product[] }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const existing = document.getElementById("catalog-root");
    if (existing) {
      setRoot(existing);
      return;
    }
    // Por si el HTML legado todavía no se pintó cuando este componente
    // se monta, reintentamos con un observer chico.
    const observer = new MutationObserver(() => {
      const node = document.getElementById("catalog-root");
      if (node) {
        setRoot(node);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!root) return null;
  return createPortal(<CatalogGrid products={products} />, root);
}
