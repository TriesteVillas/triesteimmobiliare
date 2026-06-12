"use client";

// Glass dual-range slider: two overlaid native range inputs on a single
// track; the sand-coloured fill marks the selected span. Values are
// committed via onChange as [min, max].
export default function RangeDual({
  min,
  max,
  step,
  value,
  onChange,
  format,
  maxLabel,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (n: number) => string;
  // Label for the upper bound when it sits at the slider's end ("3M+").
  maxLabel?: string;
}) {
  const [lo, hi] = value;
  const pct = (n: number) => ((n - min) / (max - min)) * 100;

  return (
    <div className="select-none">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-neutral-800">{format(lo)}</span>
        <span className="font-semibold text-neutral-800">
          {hi >= max && maxLabel ? maxLabel : format(hi)}
        </span>
      </div>
      <div className="range-dual relative h-6">
        <div className="range-track absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" />
        <div
          className="range-fill absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          aria-label="min"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          aria-label="max"
        />
      </div>
    </div>
  );
}
