import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/routing";

// ═══════════════════════════════════════════════════════════════════════════
// IL LINK ALLA PAGINA «COME USIAMO L'AI» DAL RIEPILOGO DELLA SCHEDA (01/10/2026)
//
// Su questo sito la pagina /ai non c'è ancora (404 in tutte le lingue): il
// riepilogo `#foto-ai` punta a quella del gruppo su triestevillas.com — ma SOLO
// nelle lingue in cui risponde 200. Un link morto proprio nel riquadro della
// trasparenza toglierebbe fiducia, quindi la si PROVA invece di darla per
// scontata: se TriesteVillas la toglie, o non ha la lingua, il link sparisce
// da solo alla rigenerazione successiva.
//
// Gli URL sono i canonici della pagina (letti dal suo <link rel="canonical">
// il 01/10): l'italiano senza prefisso, perché `/it/ai` risponde 307 verso
// `/ai`, e niente www, che risponde 308. Si prova con `redirect: "manual"`:
// vale solo un 200 diretto, così non si linka mai un URL che rimbalza altrove.
// ═══════════════════════════════════════════════════════════════════════════

const PAGINA_AI: Record<Locale, string> = {
  it: "https://triestevillas.com/ai",
  en: "https://triestevillas.com/en/ai",
  de: "https://triestevillas.com/de/ai",
  sl: "https://triestevillas.com/sl/ai",
};

const TIMEOUT_MS = 4000;
const REVALIDATE_SECONDS = 3600;
// Dopo un guasto di rete non si riprova a ogni pagina: la build ne genera
// ~150 per lingua, e con TriesteVillas giù sarebbero altrettante attese.
const PAUSA_DOPO_GUASTO_MS = 60_000;
let guastoFinoA = 0;

type Esiti = Partial<Record<Locale, boolean>>;

/** Le quattro prove; lancia se la rete non risponde (così il guasto non
 *  finisce in cache per un'ora), mentre un 404 è una risposta e si tiene. */
async function prova(): Promise<Esiti> {
  const esiti = await Promise.all(
    (Object.entries(PAGINA_AI) as [Locale, string][]).map(async ([lingua, url]) => {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return [lingua, res.status === 200] as const;
    }),
  );
  return Object.fromEntries(esiti);
}

const provaInCache = unstable_cache(prova, ["pagina-ai-gruppo", ...Object.values(PAGINA_AI)], {
  revalidate: REVALIDATE_SECONDS,
});

/** L'URL della pagina «Come usiamo l'AI» nella lingua, o null se oggi non
 *  risponde 200. Mai lancia: nel dubbio, niente link. */
export const linkPaginaAi = cache(async (lingua: string): Promise<string | null> => {
  const url = PAGINA_AI[lingua as Locale];
  if (!url || Date.now() < guastoFinoA) return null;
  try {
    return (await provaInCache())[lingua as Locale] ? url : null;
  } catch (e) {
    guastoFinoA = Date.now() + PAUSA_DOPO_GUASTO_MS;
    console.warn(
      `[pagina-ai] triestevillas.com non risponde (${e instanceof Error ? e.message : e}): riepilogo senza link`,
    );
    return null;
  }
});
