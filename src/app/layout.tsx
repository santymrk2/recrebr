import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tudominio.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "B&R — Recreación e Inflables",
  description:
    "B&R: alquiler de juegos inflables y animación para eventos en Buenos Aires.",
  openGraph: {
    title: "B&R — Recreación e Inflables",
    description:
      "B&R: alquiler de juegos inflables y animación para eventos en Buenos Aires.",
    url: siteUrl,
    siteName: "B&R Recreación e Inflables",
    locale: "es_AR",
    type: "website",
    // TODO: reemplazar por una foto real de un evento (1200x630 aprox).
    images: [{ url: "/legacy/og-cover.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
