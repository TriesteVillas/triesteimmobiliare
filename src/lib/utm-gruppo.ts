"use client";

import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// I LINK FRA I SITI DEL GRUPPO PORTANO LA LORO PROVENIENZA (09/10/2026).
// Copia gemella, identica in ogni sito del gruppo: chi corregge una copia
// corregge tutte (SloveniaVillas fa lo stesso dentro components/site/Analytics.tsx).
//
// Il problema misurato il 09/10: i piè di pagina e le pagine /gruppo escono con
// `rel="noreferrer"` e senza UTM, e il sito che riceve registrava quel traffico
// come «diretto»: nessuno sapeva che il clic era partito da un sito fratello.
// Ora, al CLIC (non nell'HTML, che resta pulito per i motori), un link verso un
// altro sito del gruppo prende utm_source=<questo sito>, utm_medium=referral,
// utm_campaign=gruppo e, in utm_content, il punto della pagina: `data-dove` se
// c'è, altrimenti testata, piede o pagina. Un link che ha già le sue UTM non si
// tocca. Non è tracciamento su questo sito: sono parametri del link, e chi
// riceve li legge solo col consenso di chi visita.
// ─────────────────────────────────────────────────────────────────────────────

const DOMINI = [
  "triestevillas.com", "triesteimmobiliare.com", "triesteaffitti.com", "friulivillas.com",
  "lignanovillas.com", "sappadavillas.com", "triestebusiness.it", "sloveniavillas.com",
];
const radice = (h: string) => h.toLowerCase().replace(/^www\./, "");

export function useUtmGruppo(sorgente: string): void {
  useEffect(() => {
    const qui = radice(location.hostname);
    const decora = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      let u: URL;
      try { u = new URL(a.href); } catch { return; }
      const h = radice(u.hostname);
      if (h === qui || !DOMINI.some((d) => h === d || h.endsWith(`.${d}`)) || u.searchParams.has("utm_source")) return;
      const dove = a.closest("[data-dove]")?.getAttribute("data-dove") ?? (a.closest("header") ? "testata" : a.closest("footer") ? "piede" : "pagina");
      u.searchParams.set("utm_source", sorgente);
      u.searchParams.set("utm_medium", "referral");
      u.searchParams.set("utm_campaign", "gruppo");
      u.searchParams.set("utm_content", dove.slice(0, 60));
      a.href = u.toString();
    };
    document.addEventListener("click", decora, true);
    document.addEventListener("auxclick", decora, true);
    return () => {
      document.removeEventListener("click", decora, true);
      document.removeEventListener("auxclick", decora, true);
    };
  }, [sorgente]);
}
