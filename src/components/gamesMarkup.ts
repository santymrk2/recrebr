import { buildConsultaLink } from "@/lib/whatsapp";
import { games } from "@/components/games.data";
import { escapeHtml } from "@/lib/html";

const tones: Record<string, string> = {
  orange: "#ff7a00",
  blue: "#00b4d8",
  yellow: "#ffca05",
  pink: "#ff5095",
  green: "#32a875",
  purple: "#7652b7",
  red: "#f24e3f",
  aqua: "#00b7ac",
};

// Las tarjetas se inyectan como HTML dentro del markup legado (que ya es un
// string), así vienen en el HTML inicial que lee Google. Son links estáticos
// a WhatsApp sin estado, no hace falta React. Cada tarjeta abre WhatsApp con
// "quiero consultar por X".
export function renderGamesMarkup() {
  return games
    .map((game, index) => {
      const tone = tones[game.tone] ?? "#ff7a00";
      const tilt = `${(index % 3) - 1}deg`;
      const name = escapeHtml(game.name);
      // width/height reservan el espacio antes de que cargue (sin saltos de
      // layout); el tamaño real lo manda el CSS con object-fit.
      const photo = game.photo
        ? `<img src="${escapeHtml(game.photo.src)}" alt="${escapeHtml(game.photo.alt)}" width="1200" height="800" loading="lazy" decoding="async">`
        : "";
      return `<a class="game-card game-card-wa reveal" style="--tone:${tone};--tilt:${tilt}" href="${escapeHtml(buildConsultaLink(game.name))}" target="_blank" rel="noreferrer" aria-label="Consultar por ${name} por WhatsApp"><div class="game-photo${photo ? " has-photo" : ""}">${photo}<span class="game-photo-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span></div><div class="game-body"><h3>${name}</h3><p>${escapeHtml(game.tagline)}</p><span class="game-detail">${escapeHtml(game.detail)}</span></div></a>`;
    })
    .join("");
}
