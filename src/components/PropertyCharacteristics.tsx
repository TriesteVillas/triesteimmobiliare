"use client";

import { useState, type ReactNode } from "react";

export type Characteristic = { icon: keyof typeof ICONS; label: string; value: string };

const ICONS = {
  home: (
    <>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  contract: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </>
  ),
  surface: (
    <>
      <path d="M3 8V3h5" />
      <path d="M21 8V3h-5" />
      <path d="M3 16v5h5" />
      <path d="M21 16v5h-5" />
    </>
  ),
  rooms: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 12h18M12 3v18" />
    </>
  ),
  baths: (
    <>
      <path d="M5 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2" />
      <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M7 19l-1 2M17 19l1 2" />
    </>
  ),
  floor: (
    <>
      <path d="M4 20h4v-4h4v-4h4v-4h4" />
    </>
  ),
  elevator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 8l3-3 3 3M9 16l3 3 3-3" />
    </>
  ),
  furnished: (
    <>
      <path d="M3 11V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
      <path d="M2 13a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2z" />
      <path d="M5 17v2M19 17v2" />
    </>
  ),
  parking: (
    <>
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M4 13h16v4H4z" />
      <circle cx="7.5" cy="17.5" r="1" />
      <circle cx="16.5" cy="17.5" r="1" />
    </>
  ),
  pool: (
    <>
      <path d="M2 12c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M2 17c2 0 2 1.5 4 1.5s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
    </>
  ),
  energy: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a7 7 0 0 1-10 10z" />
      <path d="M2 22 9 15" />
    </>
  ),
  year: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6" />
    </>
  ),
  condition: (
    <>
      <path d="M17 3l4 4-9 9-4 1 1-4z" />
      <path d="M14 6l4 4" />
      <path d="M4 21h7" />
    </>
  ),
  bedroom: (
    <>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 14h18" />
      <path d="M3 18v2M21 18v2" />
      <path d="M7 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
    </>
  ),
  kitchen: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.4" />
      <circle cx="15" cy="9" r="1.4" />
      <path d="M7 14h10" />
    </>
  ),
  terrace: (
    <>
      <path d="M4 21h16" />
      <path d="M6 21v-7M10 21v-7M14 21v-7M18 21v-7" />
      <path d="M5 14h14" />
      <path d="M6 14v-3h12v3" />
    </>
  ),
  heating: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M8 6v12M12 6v12M16 6v12" />
      <path d="M6 18v2M18 18v2" />
    </>
  ),
  availability: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M10.8 10.8 20 20" />
      <path d="M16 16l-2 2M19 19l2-2" />
    </>
  ),
  balcony: (
    <>
      <path d="M7 11V7h10v4" />
      <path d="M4 21h16" />
      <path d="M5 21v-9h14v9" />
      <path d="M5 16h14" />
      <path d="M9 12v4M15 12v4" />
    </>
  ),
  garden: (
    <>
      <path d="M12 22v-7" />
      <path d="M12 15c-3 0-5-2-5-5 3 0 5 2 5 5z" />
      <path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5z" />
    </>
  ),
  accessible: (
    <>
      <circle cx="13" cy="4.5" r="1.5" />
      <path d="M13 7v5h5l2 5" />
      <path d="M13 12a5 5 0 1 0 3 9" />
    </>
  ),
  ownership: (
    <>
      <path d="M3 10l9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 14l2 2 4-4" />
    </>
  ),
  grade: (
    <>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export default function PropertyCharacteristics({
  title,
  items,
  primaryCount = 8,
  moreLabel,
  lessLabel,
}: {
  title: string;
  items: Characteristic[];
  // How many of the most salient characteristics stay visible by default.
  primaryCount?: number;
  moreLabel: string;
  lessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  const hasMore = items.length > primaryCount;
  const visible = !hasMore || open ? items : items.slice(0, primaryCount);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
        {visible.map((it) => (
          <div
            key={it.label}
            className="flex items-center gap-3 border-b border-neutral-100 py-3"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 text-brand-light"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {ICONS[it.icon]}
            </svg>
            <dt className="text-sm text-neutral-500">{it.label}</dt>
            <dd className="ml-auto text-right text-sm font-medium text-neutral-800">
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
      {hasMore && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="btn-press mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-brand hover:text-brand"
        >
          {open ? lessLabel : moreLabel}
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </section>
  );
}
