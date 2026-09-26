import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Vista previa al compartir el link (WhatsApp, Instagram, Google). Antes el
// metadata apuntaba a /legacy/og-cover.jpg, que no existe: la preview salía
// vacía. Cuando haya una foto real de un evento conviene reemplazar esto por
// un opengraph-image.jpg de 1200x630 en esta misma carpeta.
export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#fdf8f2",
          color: "#241505",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 200, fontWeight: 900, color: "#00b4d8", lineHeight: 1 }}>
          B&amp;R
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 800, color: "#ff7a00", marginTop: 24 }}>
          Recreación e Inflables
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 28, color: "#7a6a5a" }}>
          Inflables, juegos y animación para eventos en Buenos Aires
        </div>
      </div>
    ),
    size,
  );
}
