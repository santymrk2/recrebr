import { buildWhatsAppLink } from "@/lib/whatsapp";
import { RecrebrIcon } from "./RecrebrIcons";

const floatMessage = "Hola! Quiero armar mi evento con RECREBR.";

export function RecrebrFloat() {
  return (
    <a
      className="recrebr-float"
      href={buildWhatsAppLink(floatMessage)}
      target="_blank"
      rel="noreferrer"
      aria-label="Hablar por WhatsApp para armar un evento"
    >
      <span aria-hidden="true"><RecrebrIcon name="chat" /></span>
      ¿Armamos tu evento?
    </a>
  );
}
