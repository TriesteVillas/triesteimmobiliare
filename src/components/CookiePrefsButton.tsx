"use client";

import { useTranslations } from "next-intl";
import { EVENTO_APRI } from "./CookieBanner";

// Il modo per cambiare idea. Senza questo, un consenso dato una volta resta
// dato per sempre e non c'è nessuna porta per revocarlo: è il requisito che i
// banner dimenticano più spesso, e l'unica ragione per cui questo bottone
// esiste in fondo a ogni pagina.
export default function CookiePrefsButton({ className = "" }: { className?: string }) {
  const t = useTranslations("cookie");
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_APRI))}
    >
      {t("preferenze")}
    </button>
  );
}
