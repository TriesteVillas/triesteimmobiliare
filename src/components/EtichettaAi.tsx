// L'etichetta AI sopra una foto (01/10/2026 · SPEC §5.1 e §9.3).
//
// In alto a destra, sempre leggibile: fondo scuro semi-opaco e testo chiaro
// PROPRI, mai affidati alla foto che c'è sotto — su un cielo bianco come su un
// interno buio il contrasto resta sopra 9:1 (bianco su ink all'85% sopra il
// bianco ≈ #334755). Due forme: il glifo compatto («AI») per miniature e
// card, l'estesa («AI · modificata») per la vista singola e l'hero.
//
// `role="img"` + `aria-label`: il lettore di schermo legge l'etichetta con la
// didascalia, non la sola sigla; `title` dà la stessa frase a chi passa col
// mouse. Niente hook: si usa da componenti server e client.
//
// Piatta (v1.3, 02/10): niente ombra, anello o sfocatura — il contrasto lo dà
// già il fondo `ink/85`, e il resto era peso visivo senza informazione.
//
// `passante`: i clic attraversano l'etichetta (pointer-events: none). Serve
// sopra un player YouTube, dove l'angolo in alto a destra è dei suoi controlli:
// l'etichetta si vede, ma non li blocca (niente `title` al passaggio, allora:
// lo dicono l'aria-label e la didascalia sotto il player).
export default function EtichettaAi({
  testo,
  aria,
  forma = "glifo",
  className = "",
  passante = false,
}: {
  testo: string;
  aria: string;
  forma?: "glifo" | "estesa";
  className?: string;
  passante?: boolean;
}) {
  if (!testo) return null;
  return (
    <span
      role="img"
      aria-label={aria}
      title={passante ? undefined : aria}
      className={`${passante ? "pointer-events-none" : "pointer-events-auto"} inline-flex select-none items-center whitespace-nowrap rounded-md bg-ink/85 font-semibold leading-none text-white ${
        forma === "estesa" ? "px-2 py-1.5 text-xs tracking-wide" : "px-1.5 py-1 text-[11px] tracking-wider"
      } ${className}`}
    >
      {testo}
    </span>
  );
}
