"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { subscribe, getSnapshot, getServerSnapshot } from "./favstore";

// La voce "Account" dell'header. Client-only di proposito: l'header vive su
// pagine statiche (SSG/ISR) e leggere il cookie server-side lì renderebbe
// dinamico l'intero sito. Da anonimi mostra l'icona con "Accedi"; da loggati
// il nome e, se ci sono cuori, il contatore.
export default function AccountLink() {
  const t = useTranslations("account");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const n = s.favs.size;
  return (
    <Link
      href="/account"
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-neutral-700 transition-colors hover:text-brand-dark"
      aria-label={s.authed && s.nome ? s.nome : t("signIn")}
    >
      <span className="relative inline-flex">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {n > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-neutral-900">
            {n > 9 ? "9+" : n}
          </span>
        )}
      </span>
      <span className="hidden md:inline">{s.authed && s.nome ? s.nome : t("signIn")}</span>
    </Link>
  );
}
