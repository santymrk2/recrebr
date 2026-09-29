// `photo` apunta a public/games/. Las fotos salen de eventos reales (Drive de
// B&R) y se exportan a WebP de 1200px: el original de cámara pesa ~10MB.
export type Game = {
  name: string;
  tagline: string;
  detail: string;
  tone: string;
  photo?: { src: string; alt: string };
};

export const games: Game[] = [
  {
    name: "Gel Blaster",
    tagline: "Estrategia, equipos y adrenalina",
    detail: "Exterior · con antiparras",
    tone: "red",
    photo: { src: "/games/gel-blaster.webp", alt: "Chicos con antiparras jugando al Gel Blaster detrás de una trinchera" },
  },
  {
    name: "Sumo",
    tagline: "El choque más divertido",
    detail: "Exterior · de a dos",
    tone: "yellow",
    photo: { src: "/games/sumo.webp", alt: "Dos chicos con trajes inflables de sumo luchando sobre el tatami" },
  },
  {
    name: "Dinos inflables",
    tagline: "Llegan los T-Rex a la fiesta",
    detail: "Interior o exterior",
    tone: "green",
    photo: { src: "/games/dinos-inflables.webp", alt: "Cuatro disfraces inflables de T-Rex de colores posando juntos" },
  },
  {
    name: "Torpedo",
    tagline: "Todos juntos o nadie llega",
    detail: "Exterior · por equipos",
    tone: "blue",
    photo: { src: "/games/torpedo.webp", alt: "Equipos corriendo con torpedos inflables de colores entre las piernas" },
  },
  {
    name: "Jenga XL",
    tagline: "La torre que nadie quiere tirar",
    detail: "Interior o exterior",
    tone: "orange",
    photo: { src: "/games/jenga-xl.webp", alt: "Chico sacando una pieza de una torre de Jenga gigante" },
  },
  {
    name: "Balance XL",
    tagline: "Pulso firme y nervios de acero",
    detail: "Mesa · todas las edades",
    tone: "aqua",
    photo: { src: "/games/balance-xl.webp", alt: "Chicos apilando piezas de madera sobre la bandeja colgante del Balance XL" },
  },
  {
    name: "4 en línea",
    tagline: "El clásico, en tamaño gigante",
    detail: "Interior o exterior · de a dos",
    tone: "blue",
    photo: { src: "/games/4-en-linea.webp", alt: "Chicos jugando al 4 en línea gigante de madera" },
  },
  {
    name: "Quién Soy",
    tagline: "Preguntar, descartar y adivinar",
    detail: "Interior o exterior · de a dos",
    tone: "purple",
    photo: { src: "/games/quien-soy.webp", alt: "Dos jugadores frente a frente con los tableros gigantes del Quién Soy" },
  },
  {
    name: "Básquet Pileta",
    tagline: "Volcadas en el agua",
    detail: "Pileta · por equipos",
    tone: "orange",
    photo: { src: "/games/basquet-pileta.webp", alt: "Chico saltando en la pileta para encestar en un aro inflable" },
  },
  {
    name: "Vóley Pileta",
    tagline: "La red, en el medio del agua",
    detail: "Pileta · por equipos",
    tone: "yellow",
    photo: { src: "/games/voley-pileta.webp", alt: "Chicos saltando a la red inflable en un partido de vóley en la pileta" },
  },
  {
    name: "Arco Pileta",
    tagline: "Goles con salpicadura",
    detail: "Pileta · por equipos",
    tone: "green",
    photo: { src: "/games/arco-pileta.webp", alt: "Chicos en la pileta disputando la pelota frente a un arco inflable" },
  },
  {
    name: "Tejo Pileta",
    tagline: "Puntería flotante",
    detail: "Pileta · todas las edades",
    tone: "aqua",
    photo: { src: "/games/tejo-pileta.webp", alt: "Tejo volando hacia el blanco inflable que flota en la pileta" },
  },
  { name: "Combo a medida", tagline: "Tu evento, tu manera", detail: "Armado personalizado", tone: "pink" },
];
