import { ImageResponse } from "next/og";

// Favicon / logo que usa el JSON-LD. El sitio no tenía ninguno: Google muestra
// el favicon al lado del resultado en mobile, así que un globo genérico resta.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#00b4d8",
          borderRadius: 112,
          color: "#fff",
          fontSize: 230,
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        B&amp;R
      </div>
    ),
    size,
  );
}
