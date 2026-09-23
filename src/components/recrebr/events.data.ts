export type EventIcon = "birthday" | "school" | "church" | "business" | "family";

export const events: { name: string; icon: EventIcon; message: string }[] = [
  { name: "Cumpleaños", icon: "birthday", message: "Hola! Quiero armar un cumpleaños con RECREBR." },
  { name: "Colegio", icon: "school", message: "Hola! Estoy organizando un evento escolar." },
  { name: "Iglesia", icon: "church", message: "Hola! Estoy organizando una actividad de iglesia." },
  { name: "Empresa", icon: "business", message: "Hola! Quiero una propuesta para un evento de empresa." },
  { name: "Familia", icon: "family", message: "Hola! Quiero organizar un encuentro familiar." },
];
