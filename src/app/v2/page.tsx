import type { Metadata } from "next";
import { RecrebrLanding } from "@/components/recrebr/RecrebrLanding";

export const metadata: Metadata = {
  title: "RECREBR — La recreación se vive",
  description:
    "Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.",
  alternates: { canonical: "/v2" },
};

export default function RecrebrV2Page() {
  return <RecrebrLanding />;
}
