import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tudominio.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RECREBR — La recreación se vive",
  description:
    "Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.",
  applicationName: "RECREBR",
  keywords: [
    "alquiler de inflables Buenos Aires",
    "recreación para eventos",
    "animación infantil",
    "juegos para cumpleaños",
    "eventos escolares",
    "juegos para iglesias",
    "eventos corporativos",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "RECREBR — La recreación se vive",
    description:
      "Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.",
    url: siteUrl,
    siteName: "RECREBR",
    locale: "es_AR",
    type: "website",
    // TODO: reemplazar por una foto real de un evento (1200x630 aprox).
    images: [{ url: "/legacy/og-cover.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RECREBR — La recreación se vive",
    description:
      "Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.",
    images: ["/legacy/og-cover.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
