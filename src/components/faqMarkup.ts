import { faqs, mainZones, northZoneAreas } from "@/components/faq.data";
import { escapeHtml } from "@/lib/html";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Sección "Zonas y preguntas frecuentes", renderizada en el servidor dentro
// del markup legado (igual que las tarjetas de juegos). Las respuestas van en
// <details>: el texto está en el HTML aunque esté plegado, así que Google lo
// indexa igual.
export function renderFaqMarkup() {
  const zones = [...mainZones, ...northZoneAreas]
    .map((zone) => `<li>${escapeHtml(zone)}</li>`)
    .join("");
  const items = faqs
    .map(
      (faq) =>
        `<details class="faq-item reveal"><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`,
    )
    .join("");
  const cta = escapeHtml(
    buildWhatsAppLink("Hola! Quiero consultar disponibilidad para mi evento"),
  );
  return `<div class="faq-grid"><div class="faq-zones reveal"><h3>Dónde jugamos</h3><p>Sobre todo en <strong>CABA y Zona Norte</strong>, y en el resto del AMBA consultando disponibilidad.</p><ul class="zone-list">${zones}</ul><a class="faq-cta" href="${cta}" target="_blank" rel="noreferrer">Consultar disponibilidad</a></div><div class="faq-list">${items}</div></div>`;
}
