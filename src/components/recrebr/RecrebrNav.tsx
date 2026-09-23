"use client";

import { useEffect, useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const links = [
  ["experiencias", "Experiencias"], ["juegos", "Juegos"], ["proposito", "Propósito"], ["contacto", "Contacto"],
] as const;

export function RecrebrNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("experiencias");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    }), { rootMargin: "-35% 0px -55% 0px" });
    const sections = links
      .map(([id]) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return <header className="recrebr-nav">
    <a className="recrebr-logo" href="#inicio" aria-label="RECREBR, inicio">RECRE<span>BR</span></a>
    <button className="nav-menu" aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}><i /><i /><i /></button>
    <nav id="site-menu" className={open ? "open" : ""} aria-label="Navegación principal">
      {links.map(([id, label]) => <a className={active === id ? "active" : ""} href={`#${id}`} onClick={() => setOpen(false)} key={id}>{label}</a>)}
      <a className="nav-v1" href="/v1">Ver sitio clásico</a>
    </nav>
    <a className="nav-wa" href={buildWhatsAppLink("Hola! Quiero armar mi evento con RECREBR.")} target="_blank" rel="noreferrer">WhatsApp <b>↗</b></a>
  </header>;
}
