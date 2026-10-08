import Image from "next/image";

// Brand lockup — the REAL origami paper-boat artwork + "TriesteImmobiliare"
// wordmark. The boat is the exact logo (same artwork as the favicon + OG card),
// served transparent for light surfaces and as a clean white silhouette for dark
// ones. Decorative (alt=""/aria-hidden): the adjacent wordmark conveys the brand.

type Tone = "brand" | "light";

export function BoatMark({
  tone = "brand",
  className = "h-7 w-auto",
}: {
  tone?: Tone;
  className?: string;
}) {
  // WebP a 320×169 (08/10/2026): il PNG 531×280 pesava 141 KB (62 il bianco)
  // per un segno alto 20–56 px; 169 px coprono il più grande a DPR 3, e i file
  // scendono a 17 e 8 KB. `eager`: è nella testata, sopra la piega — in lazy il
  // browser lo dipingeva in ritardo. I PNG restano in public/ per chi li linka.
  return (
    <Image
      src={tone === "light" ? "/brand/boat-white.webp" : "/brand/boat.webp"}
      alt=""
      aria-hidden
      width={320}
      height={169}
      loading="eager"
      className={className}
    />
  );
}

export default function Logo({
  tone = "brand",
  className = "",
  markClassName = "h-7 w-auto",
  wordClassName = "text-lg",
}: {
  tone?: Tone;
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  const word = tone === "light" ? "text-white" : "text-[#14344a]";
  const accent = tone === "light" ? "text-white/85" : "text-brand";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BoatMark tone={tone} className={markClassName} />
      <span className={`font-bold tracking-tight ${word} ${wordClassName}`}>
        Trieste<span className={`font-medium ${accent}`}>Immobiliare</span>
      </span>
    </span>
  );
}
