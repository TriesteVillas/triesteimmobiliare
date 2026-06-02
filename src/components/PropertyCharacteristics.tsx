import type { ReactNode } from "react";

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
} satisfies Record<string, ReactNode>;

export default function PropertyCharacteristics({
  title,
  items,
}: {
  title: string;
  items: Characteristic[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
        {items.map((it) => (
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
    </section>
  );
}
