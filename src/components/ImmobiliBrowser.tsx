"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import PropertyCard from "./PropertyCard";
import type { PropertyView } from "@/lib/propertyView";

type Group = { code: string; label: string; items: PropertyView[] };

export default function ImmobiliBrowser({
  groups,
  photosComing,
}: {
  groups: Group[];
  photosComing: string;
}) {
  const t = useTranslations("listing");
  const tImmobili = useTranslations("immobili");
  const [active, setActive] = useState<string | null>(null);

  // Preselect a zona filter from a /immobili#CODE deep-link (homepage "view more").
  useEffect(() => {
    const code = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (code && groups.some((g) => g.code === code)) setActive(code);
  }, [groups]);

  const total = useMemo(
    () => groups.reduce((n, g) => n + g.items.length, 0),
    [groups],
  );
  const visible = active ? groups.filter((g) => g.code === active) : groups;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-paper px-6 py-14 text-center text-neutral-600">
        {t("empty")}
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive(null)}
          aria-pressed={active === null}
          className={chip(active === null)}
        >
          {tImmobili("filterAll")} ({total})
        </button>
        {groups.map((g) => (
          <button
            key={g.code}
            type="button"
            onClick={() => setActive(g.code)}
            aria-pressed={active === g.code}
            className={chip(active === g.code)}
          >
            {g.label} ({g.items.length})
          </button>
        ))}
      </div>

      <div key={active ?? "all"} className="filter-pop">
        {visible.map((g) => (
          <section key={g.code} className="mb-12">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-brand-dark">
                {g.label}
              </h2>
              <span className="text-sm text-neutral-400">
                {t("count", { count: g.items.length })}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((v) => (
                <PropertyCard key={v.slug} view={v} photosComing={photosComing} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function chip(activeState: boolean): string {
  return activeState
    ? "btn-press rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand/30"
    : "btn-press rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium text-neutral-600 hover:border-brand hover:text-brand";
}
