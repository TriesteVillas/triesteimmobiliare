import EtichettaAi from "./EtichettaAi";
import type { VideoAi } from "@/lib/trasparenza-video";

// L'etichetta AI di un video (SPEC v1.2 §10.1): in alto a destra, sopra il
// video e il suo poster, per tutta la riproduzione — è un fratello del
// <video>/<iframe> nello stesso riquadro, non dipende da cosa c'è sotto.
// Il genitore deve essere `relative`. `passante` sopra un player con
// controlli (YouTube): si vede, ma i clic arrivano al player.
// `data-etichetta-video` serve al collaudo.
export default function EtichettaVideo({
  ai,
  className = "right-3 top-3 sm:right-4 sm:top-4",
  passante = false,
}: {
  ai: VideoAi | null | undefined;
  className?: string;
  passante?: boolean;
}) {
  if (!ai?.etichetta) return null;
  return (
    <div data-etichetta-video className={`pointer-events-none absolute z-[1] ${className}`}>
      <EtichettaAi testo={ai.etichetta} aria={ai.aria} forma="estesa" passante={passante} />
    </div>
  );
}
