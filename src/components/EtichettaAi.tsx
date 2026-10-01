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
export default function EtichettaAi({
  testo,
  aria,
  forma = "glifo",
  className = "",
}: {
  testo: string;
  aria: string;
  forma?: "glifo" | "estesa";
  className?: string;
}) {
  if (!testo) return null;
  return (
    <span
      role="img"
      aria-label={aria}
      title={aria}
      className={`pointer-events-auto inline-flex select-none items-center whitespace-nowrap rounded-md bg-ink/85 font-semibold leading-none text-white shadow-md ring-1 ring-white/30 backdrop-blur-sm ${
        forma === "estesa" ? "px-2 py-1.5 text-xs tracking-wide" : "px-1.5 py-1 text-[10px] tracking-wider"
      } ${className}`}
    >
      {testo}
    </span>
  );
}
