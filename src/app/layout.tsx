import type { Metadata, Viewport } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.shortName}` },
  description: site.description,
  applicationName: site.name,
  keywords: [...site.keywords],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // La imagen OG/Twitter la genera src/app/opengraph-image.tsx.
  openGraph: {
    title: site.title,
    description: site.description,
    url: "/",
    siteName: site.name,
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fdf8f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
