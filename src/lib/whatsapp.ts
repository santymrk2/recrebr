const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491165383672";

export function buildWhatsAppLink(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function buildConsultaLink(productName: string) {
  return buildWhatsAppLink(`Hola! Quiero consultar por ${productName}`);
}
