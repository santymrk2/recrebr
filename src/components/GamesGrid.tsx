import { buildConsultaLink } from "@/lib/whatsapp";
import { games } from "@/components/recrebr/games.data";

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

// Cada tarjeta es el link a WhatsApp con el mensaje "quiero consultar por X".
export function GamesGrid() {
  return (
    <>
      {games.map((game, index) => (
        <a
          key={game.name}
          className="game-card game-card-wa reveal"
          style={{ "--tone": tones[game.tone] ?? "#ff7a00", "--tilt": `${(index % 3) - 1}deg` } as React.CSSProperties}
          href={buildConsultaLink(game.name)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Consultar por ${game.name} por WhatsApp`}
        >
          <div className="game-photo">
            <span className="game-photo-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="game-body">
            <h3>{game.name}</h3>
            <p>{game.tagline}</p>
            <span className="game-detail">{game.detail}</span>
          </div>
        </a>
      ))}
    </>
  );
}
