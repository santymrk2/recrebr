// Fuente única de zonas y preguntas frecuentes: se usa para la sección
// visible de la home (faqMarkup.ts) y para los datos estructurados (site.ts).
// Las respuestas solo afirman lo que el negocio confirmó; lo demás se deriva
// a WhatsApp, que es donde se cierra todo.

export const mainZones = ["CABA", "Zona Norte"] as const;

// Partidos de Zona Norte nombrados explícitamente: la gente busca
// "inflables en San Isidro", no "inflables en Zona Norte".
export const northZoneAreas = [
  "Vicente López",
  "San Isidro",
  "San Fernando",
  "Tigre",
  "San Martín",
  "Pilar",
  "Escobar",
] as const;

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "¿En qué zonas trabajan?",
    answer:
      "Principalmente en CABA y Zona Norte (Vicente López, San Isidro, San Fernando, Tigre y alrededores). También llegamos a otras zonas del AMBA: escribinos por WhatsApp y vemos la disponibilidad para tu fecha y ubicación.",
  },
  {
    question: "¿Qué tipos de eventos hacen?",
    answer:
      "Cumpleaños infantiles, eventos de colegios, iglesias y campamentos, Family Days y eventos de empresas, instituciones y grandes grupos. Armamos la propuesta según la edad, la cantidad de chicos y el espacio.",
  },
  {
    question: "¿Qué juegos incluyen?",
    answer:
      "Inflables, fútbol inflable, plaza blanda para los más chicos (1 a 4 años), kermesse, juegos de mesa XL, mini desafíos por equipos y animación con recreadores. Podés elegir un juego suelto o armar un combo a medida para tu evento.",
  },
  {
    question: "¿Cuándo tienen disponibilidad?",
    answer:
      "Depende de la fecha: la disponibilidad se confirma por WhatsApp. Los fines de semana son los días más pedidos, así que conviene consultar con tiempo para asegurar tu fecha.",
  },
  {
    question: "¿Cómo reservo?",
    answer:
      "Nos escribís por WhatsApp con la fecha, la zona y el tipo de evento, te pasamos las opciones disponibles y coordinamos todo por ahí mismo.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Depende de los juegos que elijas, la duración y la zona del evento. Contanos qué tenés en mente por WhatsApp y te pasamos un presupuesto a medida.",
  },
];
