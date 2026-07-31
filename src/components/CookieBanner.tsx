"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Banner di consenso ai cookie di statistica.
//
// Il sito ha una sola finalità non necessaria — Google Analytics — e nessuna
// pubblicità: le categorie sono una, quindi un pannello a categorie sarebbe
// finto. Due scelte, stesso peso visivo, e il link alla privacy.
//
// Il "no" deve costare quanto il "sì": stessa dimensione, stesso contrasto,
// nessun bottone grigio accanto a uno colorato. È la regola che i banner
// costruiti per essere fastidiosi violano di proposito, e la prima cosa che
// guarda chi controlla.
//
// Cosa NON fa, deliberatamente:
//  · non blocca la pagina: chi vuole leggere legge, la scelta resta lì;
//  · non ha una X: chiudere senza scegliere sarebbe un consenso implicito;
//  · non riappare a ogni pagina — la scelta si ricorda, e si può cambiare dal
//    link in fondo al sito.
//
// La chiave è versionata: se un domani cambiano le finalità si alza il numero e
// la domanda si rifà, invece di dare per buono un consenso dato per altro.
// ─────────────────────────────────────────────────────────────────────────────

export const CHIAVE_CONSENSO = "tsi_consenso_v1";
export const EVENTO_APRI = "tsi:cookie";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function leggi(): "si" | "no" | null {
  try {
    const v = localStorage.getItem(CHIAVE_CONSENSO);
    return v === "si" || v === "no" ? v : null;
  } catch {
    return null; // storage bloccato (Safari privato, estensioni): si richiede
  }
}

export default function CookieBanner() {
  const t = useTranslations("cookie");
  const [aperto, setAperto] = useState(false);

  // Solo dopo il mount: il server non sa cosa ha scelto questa persona, e
  // renderizzare il banner lato server romperebbe l'idratazione.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la scelta vive in localStorage, che sul server non esiste: si può leggere solo dopo il mount
    if (!leggi()) setAperto(true);
    const apri = () => setAperto(true);
    window.addEventListener(EVENTO_APRI, apri);
    return () => window.removeEventListener(EVENTO_APRI, apri);
  }, []);

  const decidi = useCallback((ok: boolean) => {
    try {
      localStorage.setItem(CHIAVE_CONSENSO, ok ? "si" : "no");
    } catch {
      /* niente storage: la scelta vale per questa visita */
    }
    // Consent Mode: l'aggiornamento vale SUBITO, senza ricaricare la pagina.
    window.gtag?.("consent", "update", {
      analytics_storage: ok ? "granted" : "denied",
    });
    setAperto(false);
  }, []);

  if (!aperto) return null;

  return (
    <div className="cc-bar" role="dialog" aria-modal="false" aria-label={t("aria")}>
      <div className="cc-inner">
        <p className="cc-text">
          {t("testo")}{" "}
          <Link href="/privacy" className="cc-link">
            {t("privacy")}
          </Link>
        </p>
        <div className="cc-actions">
          <button type="button" className="cc-btn" onClick={() => decidi(false)}>
            {t("rifiuta")}
          </button>
          <button type="button" className="cc-btn" onClick={() => decidi(true)}>
            {t("accetta")}
          </button>
        </div>
      </div>
    </div>
  );
}
