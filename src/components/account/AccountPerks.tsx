"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { subscribe, getSnapshot, getServerSnapshot } from "./favstore";

// La fascia che SPIEGA le funzioni riservate agli utenti registrati — in alto
// nella scheda, non nascosta in fondo: preferiti, avvisi di prezzo, appunti e
// confronto costi, concierge su misura. Visibile solo da anonimi: a chi è già
// dentro non serve la pubblicità.
export default function AccountPerks() {
  const t = useTranslations("account");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!s.ready || s.authed) return null;

  const items: { icon: React.ReactNode; label: string }[] = [
    { icon: <Dot d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />, label: t("perkFavs") },
    { icon: <Dot d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />, label: t("perkAlert") },
    { icon: <Dot d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />, label: t("perkNotes") },
    { icon: <Dot d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />, label: t("perkConcierge") },
  ];

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" data-reveal>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{t("perksTitle")}</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span className="text-brand">{it.icon}</span>
              {it.label}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href="/account"
        className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        {t("perksCta")}
      </Link>
    </div>
  );
}

function Dot({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
