import { buildWhatsAppLink } from "@/lib/whatsapp";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://tudominio.com").replace(/\/$/, "");

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "RECREBR",
      inLanguage: "es-AR",
    },
    {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#business`,
      name: "RECREBR — B&R Recreación",
      description: "Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.",
      url: siteUrl,
      telephone: "+54 9 11 6538-3672",
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Buenos Aires, Argentina",
      },
      availableLanguage: "es",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: "+54 9 11 6538-3672",
        url: buildWhatsAppLink("Hola! Quiero armar mi evento con RECREBR."),
        availableLanguage: "es",
      },
      makesOffer: [
        "Alquiler de inflables",
        "Juegos de kermesse",
        "Animación y recreación para eventos",
      ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
    },
  ],
};

export function RecrebrSeo() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
