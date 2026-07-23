"use client";

import { useEffect, useRef, useState } from "react";

// A small "?" trigger whose explanation lives INSIDE a popover (never shown in
// clear), per Martino: tax/cost figures are AI estimates, fallible, and the
// only certain source is an in-person discussion with the owner. Reused for the
// acquisition-tax box and for the ILIA / TARI annual-cost estimates.
export default function TaxInfo({
  title,
  body,
  criteria,
  criteriaLabel,
  link,
  ariaLabel,
}: {
  title: string;
  body: string[];
  criteria?: string | null;
  criteriaLabel?: string;
  link?: { href: string; label: string };
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-semibold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-700"
      >
        ?
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-6 z-30 w-80 max-w-[80vw] rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-xl"
        >
          <p className="text-sm font-semibold text-neutral-800">{title}</p>
          {body.map((p, i) => (
            <p key={i} className="mt-2 text-xs leading-relaxed text-neutral-600">
              {p}
            </p>
          ))}
          {criteria && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                {criteriaLabel}
              </p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-neutral-600">
                {criteria}
              </p>
            </>
          )}
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-brand underline underline-offset-2"
            >
              {link.label} ↗
            </a>
          )}
        </div>
      )}
    </span>
  );
}
