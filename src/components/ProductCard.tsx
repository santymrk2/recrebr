"use client";

import { useState } from "react";
import Image from "next/image";
import { buildConsultaLink } from "@/lib/whatsapp";
import { BookingModal } from "./BookingModal";
import type { Product } from "@/lib/types";

function formatPrice(value: number | null) {
  if (value === null) return null;
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export function ProductCard({ product }: { product: Product }) {
  const [showBooking, setShowBooking] = useState(false);
  const image = product.image_urls?.[0];

  return (
    <article className="game-card reveal">
      <div className="game-photo">
        {image ? (
          <Image src={image} alt={product.name} fill sizes="280px" style={{ objectFit: "cover" }} />
        ) : (
          <div className="game-photo-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="game-body">
        <h3>{product.name}</h3>
        {product.description && <p>{product.description}</p>}
        <p className="game-price">
          {product.price_original_ars && (
            <span className="game-price-original">{formatPrice(product.price_original_ars)}</span>
          )}
          {formatPrice(product.price_ars) ?? "Consultar precio"}
        </p>

        {product.is_bookable ? (
          <button type="button" className="btn-wsp" onClick={() => setShowBooking(true)}>
            Ver disponibilidad
          </button>
        ) : (
          <a
            className="btn-wsp"
            href={buildConsultaLink(product.name)}
            target="_blank"
            rel="noopener"
          >
            Consultar
          </a>
        )}
      </div>

      {showBooking && <BookingModal product={product} onClose={() => setShowBooking(false)} />}
    </article>
  );
}
