import AutoVideo from "./AutoVideo";
import EtichettaVideo from "./EtichettaVideo";
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
}) {
  const ai = await videoDelSito(percorso, locale, ripiego);
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
