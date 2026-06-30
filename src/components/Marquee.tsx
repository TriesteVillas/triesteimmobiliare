// Edge-to-edge scrolling ribbon of short phrases. Pure CSS (the track is
// rendered twice for a seamless -50% loop). Colour is inherited from the
// parent className so it works on light and dark bands; decorative only.
export default function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <div className="marquee-track">
        {row.map((it, i) => (
          <span
            key={i}
            className="mx-5 inline-flex items-center gap-5 text-sm font-medium uppercase tracking-[0.2em]"
          >
            {it}
            <span className="opacity-40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
