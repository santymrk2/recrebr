"use client";

import { useEffect, useState } from "react";
import { Calendar } from "./Calendar";
import { getBlockedDates, createBookingRequest } from "@/app/actions/booking";
import { buildReservaLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

export function BookingModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    getBlockedDates(product.id).then((dates) => {
      if (!cancelled) {
        setBlockedDates(dates);
        setLoadingDates(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !name || !phone) return;
    setStatus("submitting");

    const result = await createBookingRequest({
      productId: product.id,
      date: selectedDate,
      customerName: name,
      customerPhone: phone,
      eventLocation: location,
      notes,
    });

    if (!result.ok) {
      setStatus("error");
      return;
    }

    setStatus("done");
    const waLink = buildReservaLink({
      productName: product.name,
      date: selectedDate,
      customerName: name,
      eventLocation: location,
    });
    window.open(waLink, "_blank", "noopener");
  }

  return (
    <div className="br-modal-backdrop" onClick={onClose}>
      <div className="br-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="br-modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <h3>{product.name}</h3>

        {status === "done" ? (
          <div className="br-modal-success">
            <p>
              ¡Listo! Guardamos tu solicitud para el <strong>{selectedDate}</strong>. Te
              abrimos WhatsApp para confirmar los detalles con B&amp;R.
            </p>
            <button type="button" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="br-booking-form">
            <p className="br-modal-hint">Elegí una fecha disponible:</p>
            {loadingDates ? (
              <p>Cargando disponibilidad…</p>
            ) : (
              <Calendar
                blockedDates={blockedDates}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            )}

            {selectedDate && (
              <>
                <label>
                  Nombre y apellido
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  Teléfono
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
                <label>
                  Localidad del evento
                  <input value={location} onChange={(e) => setLocation(e.target.value)} />
                </label>
                <label>
                  Notas (opcional)
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </label>

                {status === "error" && (
                  <p className="br-modal-error">
                    Hubo un error al guardar la solicitud. Probá de nuevo o escribinos directo
                    por WhatsApp.
                  </p>
                )}

                <button type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "Enviando…" : "Solicitar reserva"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
