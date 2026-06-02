// Brand lockup: the official origami-boat glyph + "TriesteImmobiliare" wordmark.
// The boat is drawn with currentColor so the same component works on light
// (header) and dark (footer / hero) backgrounds.

type Tone = "brand" | "light";

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
  const word = tone === "light" ? "text-white" : "text-neutral-900";
  const accent = tone === "light" ? "text-white" : "text-brand";
  const mark = tone === "light" ? "text-white" : "text-brand";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 120 80"
        className={`${mark} ${markClassName}`}
        fill="currentColor"
        aria-hidden
      >
        {/* sail */}
        <path d="M60 12 98 56 22 56 Z" />
        {/* hull */}
        <path d="M16 56 H104 L90 73 H30 Z" />
      </svg>
      <span className={`font-semibold tracking-tight ${word} ${wordClassName}`}>
        Trieste<span className={accent}>Immobiliare</span>
      </span>
    </span>
  );
}
