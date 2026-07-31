"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

// Filtro per categoria delle Risorse. Tutto è precalcolato e serializzato dalla
// pagina server (titoli già nella lingua giusta): qui si filtra un array — niente
// fetch, niente cookie, la pagina resta statica e indicizzabile.
export type LibraryItem = {
  slug: string;
  title: string;
  abstract: string;
  categoria: string | null;
  stages: string[];
  minutes: string; // già localizzato, es. "6 min"
  featured: boolean;
};

export default function LibraryBrowser({
  items,
  allLabel,
}: {
  items: LibraryItem[];
  allLabel: string;
}) {
  const categories = useMemo(() => {
    const seen = new Map<string, number>();
    for (const i of items) if (i.categoria) seen.set(i.categoria, (seen.get(i.categoria) ?? 0) + 1);
    return [...seen.entries()];
  }, [items]);

  const [active, setActive] = useState<string | null>(null);
  const shown = active ? items.filter((i) => i.categoria === active) : items;

  const chip = (selected: boolean) =>
    `btn-press rounded-full border px-4 py-2 text-sm transition-colors ${
      selected
        ? "border-brand bg-brand text-white"
        : "border-brand/25 text-neutral-600 hover:border-brand hover:text-brand-dark"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-2.5" data-reveal>
        <button type="button" className={chip(active === null)} onClick={() => setActive(null)}>
          {allLabel} · {items.length}
        </button>
        {categories.map(([cat, n]) => (
          <button
            key={cat}
            type="button"
            className={chip(active === cat)}
            onClick={() => setActive(active === cat ? null : cat)}
          >
            {cat} · {n}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <Link
            key={i.slug}
            href={`/risorse/${i.slug}`}
            className="group flex min-h-[240px] flex-col justify-between rounded-2xl border border-brand/15 bg-white p-6 shadow-[0_18px_50px_-38px_rgba(28,74,107,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_26px_60px_-34px_rgba(28,74,107,0.6)]"
          >
            <div>
              {i.categoria ? <p className="eyebrow text-xs">{i.categoria}</p> : null}
              <h3 className="mt-3 text-balance text-xl font-semibold leading-snug text-brand-dark transition-colors group-hover:text-brand">
                {i.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">{i.abstract}</p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-neutral-500">
              <span>{i.minutes}</span>
              <span className="text-brand transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
