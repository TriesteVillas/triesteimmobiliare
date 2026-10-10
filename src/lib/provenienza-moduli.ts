"use client";

import { useEffect } from "react";
import { INTESTAZIONE_PROVENIENZA, leggiProvenienza } from "./provenienza";

// ─────────────────────────────────────────────────────────────────────────────
// LA PROVENIENZA SU OGNI INVIO VERSO QUESTO SITO (10/10/2026) — modulo gemello.
//
// Un innesto solo, montato una volta (in Analytics, che è in ogni pagina), al
// posto di toccare ogni modulo: ogni richiesta NON-GET verso questo stesso
// sito — le fetch delle rotte /api dei moduli e le server action di Next, che
// passano anch'esse da fetch — esce con l'intestazione `x-provenienza`. Sul
// server la legge chi bussa alla porta del CRM. Così anche un modulo scritto
// domani porta la sua provenienza senza che nessuno se ne ricordi.
//
// ⛔ Solo verso il PROPRIO dominio: mai verso Google, il CRM o altri siti.
// ⛔ Non salva niente sul dispositivo (lib/provenienza.ts): legge la navigazione
// del documento al momento dell'invio.
// Se qualcosa va storto la richiesta parte com'era: la provenienza è un di più,
// il modulo no.
// ─────────────────────────────────────────────────────────────────────────────

type Fetch = typeof window.fetch;

export function useProvenienzaModuli(): void {
  useEffect(() => {
    const w = window as unknown as { __provenienzaFetch?: boolean; fetch: Fetch };
    if (w.__provenienzaFetch) return;
    w.__provenienzaFetch = true;
    const originale: Fetch = window.fetch.bind(window);
    w.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const req = typeof Request !== "undefined" && input instanceof Request ? input : null;
        const metodo = (init?.method ?? req?.method ?? "GET").toUpperCase();
        const indirizzo = new URL(req ? req.url : input instanceof URL ? input.href : String(input), location.href);
        if (metodo !== "GET" && metodo !== "HEAD" && indirizzo.origin === location.origin) {
          const p = leggiProvenienza();
          if (p) {
            const h = new Headers(init?.headers ?? req?.headers ?? undefined);
            if (!h.has(INTESTAZIONE_PROVENIENZA)) h.set(INTESTAZIONE_PROVENIENZA, encodeURIComponent(p));
            init = { ...(init ?? {}), headers: h };
          }
        }
      } catch {
        /* la richiesta parte com'era */
      }
      return originale(input, init);
    }) as Fetch;
  }, []);
}
