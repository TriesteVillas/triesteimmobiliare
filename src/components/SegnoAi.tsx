// Il segno DISCRETO dell'AI (SPEC v1.3 §11.1, 02/10/2026): solo in HOME, dove
// la pillola non va più. Martino: «Toglierei l'icona AI da: animazione header
// homepage, tutte le icone/card in homepage». Resta un testo piccolo SOLO su
// ciò che mostra cose che non esistono — «simulazione», «rendering», «video
// AI» — perché lì chi guarda la card deve poterlo capire senza aprire la
// scheda. La dichiarazione completa resta nella scheda (o, per i video del
// sito, nell'aria-label e nel `title`: chi ci passa sopra la legge intera).
//
// Discreto ma leggibile: 10 px, peso medio, minuscolo, niente anello, ombra o
// sfocatura (la pillola li ha tutti). Il fondo è suo e non della foto — nero al
// 60%: bianco su quel fondo sopra un cielo bianco fa ≈ 5,7:1, sopra un interno
// buio di più. `data-segno-ai` serve al collaudo e al cancello del prebuild.
export default function SegnoAi({
  testo,
  aria,
  className = "",
}: {
  testo: string;
  /** Il nome accessibile: il segno più la didascalia, se c'è. */
  aria?: string;
  className?: string;
}) {
  if (!testo) return null;
  const nome = aria || testo;
  return (
    <span
      role="img"
      aria-label={nome}
      title={nome}
      data-segno-ai
      className={`pointer-events-auto inline-block select-none whitespace-nowrap rounded-[3px] bg-black/60 px-1.5 py-[3px] text-[10px] font-medium leading-none tracking-wide text-white ${className}`}
    >
      {testo}
    </span>
  );
}
