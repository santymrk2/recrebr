const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491165383672";

export function buildWhatsAppLink(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function buildConsultaLink(productName: string) {
  return buildWhatsAppLink(`Hola! Quiero consultar por ${productName}`);
}

export function buildReservaLink(params: {
  productName: string;
  date: string; // YYYY-MM-DD, ya formateada para mostrar
  customerName: string;
  eventLocation?: string;
}) {
  const { productName, date, customerName, eventLocation } = params;
  const lines = [
    `Hola! Soy ${customerName}.`,
    `Quiero reservar "${productName}" para el ${date}.`,
  ];
  if (eventLocation) lines.push(`Localidad del evento: ${eventLocation}.`);
  lines.push("Te dejé la solicitud cargada en la web, ¿lo coordinamos?");
  return buildWhatsAppLink(lines.join(" "));
}
