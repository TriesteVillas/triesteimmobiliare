import AutoVideo from "./AutoVideo";
import EtichettaVideo from "./EtichettaVideo";
import SegnoAi from "./SegnoAi";
import { videoDelSito } from "@/lib/video-sito";
import type { VideoAi } from "@/lib/trasparenza-video";

// Un video di sfondo del sito (le clip mute in loop di home, vendi,
// investimenti, contatti) dentro il suo riquadro, con la trasparenza AI del
// registro dei video del CRM: etichetta in alto a destra sul video e sul
// poster, didascalia sotto il riquadro. Senza riga nel registro: il riquadro
// di prima, identico, più nulla.
//
// `percorso` è insieme la src e la chiave del registro (`tsi:<percorso>`): il
// prebuild (scripts/check-video-registro.mjs) legge i percorsi da qui per
// elencare i video senza riga.
//
// `discreto` = un video della HOME (SPEC v1.3 §11.1, 02/10/2026): niente
// pillola e niente didascalia sotto il riquadro, solo un testo piccolo in alto
// a destra («video AI», «simulazione») quando il video è animato o generato
// con l'AI. La didascalia intera resta nell'aria-label e nel `title` del segno.
// Fuori dalla home (vendi, investimenti, contatti) tutto come prima.
export default async function VideoSito({
  percorso,
  poster,
  ariaLabel,
  locale,
  riquadro,
  videoClassName = "h-full w-full object-cover",
  className,
  reveal,
  lazy = true,
  tono = "chiaro",
  ripiego = null,
  discreto = false,
}: {
  percorso: string;
  poster: string;
  ariaLabel: string;
  locale: string;
  /** Le classi del riquadro: proporzioni, bordo, angoli, ombra. */
  riquadro: string;
  videoClassName?: string;
  /** Le classi del <figure>: margini, posto nella griglia. */
  className?: string;
  reveal?: "now" | true;
  lazy?: boolean;
  /** Lo sfondo su cui cade la didascalia. */
  tono?: "chiaro" | "scuro";
  ripiego?: VideoAi | null;
  /** In home: il segno discreto al posto di etichetta e didascalia. */
  discreto?: boolean;
}) {
  const ai = await videoDelSito(percorso, locale, ripiego);
  if (discreto) {
    return (
      <figure className={className} {...(reveal !== undefined ? { "data-reveal": reveal } : {})}>
        <div className={`relative overflow-hidden ${riquadro}`}>
          <AutoVideo src={percorso} poster={poster} ariaLabel={ariaLabel} className={videoClassName} lazy={lazy} />
          {ai?.segno && (
            <div className="pointer-events-none absolute right-3 top-3 z-[1] sm:right-4 sm:top-4">
              <SegnoAi testo={ai.segno} aria={`${ai.segno} — ${ai.didascalia ?? ai.etichetta}`} />
            </div>
          )}
        </div>
      </figure>
    );
  }
  return (
    <figure className={className} {...(reveal !== undefined ? { "data-reveal": reveal } : {})}>
      <div className={`relative overflow-hidden ${riquadro}`}>
        <AutoVideo src={percorso} poster={poster} ariaLabel={ariaLabel} className={videoClassName} lazy={lazy} />
        <EtichettaVideo ai={ai} />
      </div>
      {ai?.didascalia && (
        <figcaption
          className={`mt-2.5 text-xs leading-snug ${tono === "scuro" ? "text-white/75" : "text-neutral-500"}`}
        >
          {ai.didascalia}
        </figcaption>
      )}
    </figure>
  );
}
