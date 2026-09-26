import { faqs, northZoneAreas } from "@/components/faq.data";
import { games } from "@/components/games.data";

// Fuente única de los datos del negocio para metadata, sitemap, robots y
// JSON-LD. Si algo cambia (dominio, teléfono, redes), se cambia acá.
export const site = {
  // URL canónica. NEXT_PUBLIC_SITE_URL solo sirve para pisarla (por ejemplo
  // en un preview); por defecto es el dominio real.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://recrebr.com.ar").replace(/\/$/, ""),
  name: "B&R Recreación e Inflables",
  shortName: "B&R",
  title: "Alquiler de Inflables y Recreación en Buenos Aires | B&R",
  description:
    "Alquiler de inflables, juegos y animación para cumpleaños, colegios, iglesias y empresas en CABA y Zona Norte. 10 años y +600 eventos. Consultá disponibilidad por WhatsApp.",
  phone: "+5491165383672",
  locality: "Buenos Aires",
  country: "AR",
  sameAs: ["https://www.instagram.com/recrebr/", "https://www.threads.com/@recrebr"],
  keywords: [
    "alquiler de inflables",
    "alquiler de inflables Buenos Aires",
    "alquiler de inflables CABA",
    "alquiler de inflables Zona Norte",
    "inflables para cumpleaños",
    "recreación para eventos",
    "animación infantil",
    "animación de cumpleaños",
    "juegos para eventos",
    "fútbol inflable",
    "plaza blanda",
    "kermesse",
    "recreación para colegios",
    "juegos para iglesias",
    "eventos corporativos",
  ],
} as const;

// Datos estructurados (schema.org) que Google usa para el panel del negocio y
// los resultados enriquecidos. Solo datos verificables: nada de reseñas ni
// direcciones inventadas (Google penaliza el markup engañoso).
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${site.url}/#business`,
    name: site.name,
    alternateName: ["B&R", "RECREBR", "B&R Recreación"],
    description: site.description,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    logo: `${site.url}/icon`,
    telephone: site.phone,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: site.locality,
      addressCountry: site.country,
    },
    areaServed: [
      { "@type": "City", name: "Ciudad Autónoma de Buenos Aires" },
      ...northZoneAreas.map((name) => ({ "@type": "City", name })),
      { "@type": "AdministrativeArea", name: "Gran Buenos Aires" },
    ],
    sameAs: site.sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.phone,
      contactType: "reservations",
      availableLanguage: "Spanish",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Juegos y recreación para eventos",
      itemListElement: games.map((game) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: game.name,
          description: `${game.tagline}. ${game.detail}.`,
          areaServed: "CABA y Zona Norte",
        },
      })),
    },
  };
}

// FAQPage con las mismas preguntas que se ven en la home. Google ya no muestra
// el desplegable de FAQ en resultados para sitios comerciales (solo gobierno y
// salud, desde 2023), pero el markup es válido y ayuda a entender la página.
export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
