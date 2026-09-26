import { buildWhatsAppLink } from "@/lib/whatsapp";
import { events } from "./events.data";
import { games } from "./games.data";
import { RecrebrIcon } from "./RecrebrIcons";
import { RecrebrNav } from "./RecrebrNav";
import { RecrebrReveal } from "./RecrebrReveal";
import { RecrebrSeo } from "./RecrebrSeo";

const eventMessage = "Hola! Quiero armar mi evento con RECREBR.";
const wa = (message: string) => buildWhatsAppLink(message);

export function RecrebrLanding() {
  return <main className="recrebr">
    <link rel="stylesheet" href="/recrebr/landing.css" />
    <RecrebrSeo />
    <RecrebrNav />
    <section className="hero" id="inicio">
      <div className="hero-art" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="hero-letter">R</div>
      </div>
      <div className="hero-copy">
        <p className="eyebrow">B&amp;R RECREACIÓN PRESENTA</p>
        <h1>LA<br /><em>RECREACIÓN</em><br />SE VIVE.</h1>
        <p className="hero-text">Juegos, inflables y recreación para cumpleaños, colegios, iglesias y empresas en Buenos Aires.</p>
        <div className="hero-actions">
          <a className="button button-primary" href={wa(eventMessage)} target="_blank" rel="noreferrer">Quiero armar mi evento <b>→</b></a>
          <a className="button button-quiet" href="#juegos">Ver juegos <b>↓</b></a>
        </div>
        <p className="hero-trust">Respondemos por WhatsApp · Propuestas a medida · 10 años jugando</p>
      </div>
      <div className="hero-bottom">
        <div className="marquee" aria-hidden="true">RECREBR · RECREBR · RECREBR · RECREBR ·</div>
        <div className="hero-chips">{events.map((event) => <span key={event.name}>{event.name}</span>)}</div>
      </div>
    </section>

    <section id="experiencias" className="section experiences"><RecrebrReveal><p className="eyebrow">LO QUE PASA CUANDO JUGAMOS</p><h2>ESTO ES <em>RECREBR.</em></h2></RecrebrReveal><div className="experience-grid"><div className="experience-card photo-one"><span>Risas sin permiso</span></div><div className="experience-card photo-two"><span>Manos arriba</span></div><div className="experience-card photo-three"><span>Todos adentro</span></div><div className="experience-card photo-four"><span>Recuerdos reales</span></div></div></section>

    <section className="section about"><RecrebrReveal><div className="about-collage" aria-label="Collage de experiencias RECREBR"><i /><i /><i /></div><div className="about-copy"><p className="eyebrow">HOLA, SOMOS RECREBR</p><h2>Un matrimonio.<br />Recreativos.<br /><em>RECREBR.</em></h2><p>Hacemos lugar para jugar, encontrarse y celebrar lo que importa.</p></div></RecrebrReveal></section>

    <section id="juegos" className="section games"><RecrebrReveal><p className="eyebrow">ELEGÍ CÓMO QUERÉS JUGAR</p><h2>HAY JUEGO<br />PARA <em>TODOS.</em></h2></RecrebrReveal><div className="games-grid">{games.map((game, index) => <article className={`game-card ${game.tone}`} key={game.name}><div className="game-image"><span>{String(index + 1).padStart(2, "0")}</span></div><div className="game-content"><h3>{game.name}</h3><p>{game.tagline}</p><small>{game.detail}</small><a href={wa(`Hola! Quiero consultar por ${game.name}.`)} target="_blank" rel="noreferrer">Consultar <b>↗</b></a></div></article>)}</div></section>

    <section className="section event-types"><RecrebrReveal><p className="eyebrow">¿QUÉ ESTÁS ORGANIZANDO?</p><h2>CONTANOS EL <em>PLAN.</em></h2></RecrebrReveal><div className="event-grid">{events.map((event) => <a href={wa(event.message)} target="_blank" rel="noreferrer" key={event.name}><span className="event-icon"><RecrebrIcon name={event.icon} /></span><strong>{event.name}</strong><b aria-hidden="true"><RecrebrIcon name="arrow" /></b></a>)}</div></section>

    <section className="combo"><div><p className="eyebrow">COMBINÁ, DISFRUTÁ, REPETÍ</p><h2>VOS PONÉS EL EVENTO.<br /><em>NOSOTROS PONEMOS EL JUEGO.</em></h2></div><ul><li><b>01</b> Te escuchamos</li><li><b>02</b> Armamos el combo</li><li><b>03</b> Llegamos a jugar</li></ul><a className="button button-dark" href={wa(eventMessage)} target="_blank" rel="noreferrer">Armemos un combo →</a></section>

    <section id="proposito" className="section purpose"><RecrebrReveal><p className="eyebrow">MÁS QUE ENTRETENIMIENTO</p><h2>JUGAR TAMBIÉN ES<br /><em>HACER EL BIEN.</em></h2><div className="purpose-chips"><span>FE</span><span>FAMILIA</span><span>SERVICIO</span><span>RECREACIÓN</span></div><blockquote>“Según tengamos oportunidad, hagamos bien a todos.” <cite>Gálatas 6:10</cite></blockquote><p className="purpose-text">Hace 10 años elegimos poner la recreación al servicio de las personas. Con cada evento, también podés sumar un <strong>Ticket Solidario</strong>.</p><div className="tickets"><div><b>$5K</b><span>una sonrisa más</span></div><div><b>$25K</b><span>juego compartido</span></div><div><b>$100K</b><span>evento con propósito</span></div></div></RecrebrReveal></section>

    <section id="contacto" className="closing"><RecrebrReveal><p className="eyebrow">EMPECEMOS POR UNA CHARLA</p><h2>¿TENÉS UN EVENTO<br />EN <em>MENTE?</em></h2><div className="questions"><span>¿Cuándo es?</span><span>¿Para quiénes?</span><span>¿Dónde?</span><span>¿Qué imaginás?</span></div><p className="credibility">10 años · cientos de eventos · colegios, iglesias, empresas y familias</p><a className="button button-primary button-big" href={wa(eventMessage)} target="_blank" rel="noreferrer">Quiero cotizar mi evento <b>→</b></a></RecrebrReveal></section>
    <footer><a className="recrebr-logo" href="#inicio" aria-label="B y R Recreación, inicio">B&amp;R</a><p>B&amp;R RECREACIÓN<br /><b>LA RECREACIÓN SE VIVE</b></p><div><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="https://threads.net" target="_blank" rel="noreferrer">Threads</a><a href={wa(eventMessage)} target="_blank" rel="noreferrer">WhatsApp</a></div><small>© {new Date().getFullYear()} RECREBR · <a href="/">Ver sitio clásico</a></small></footer>
  </main>;
}
