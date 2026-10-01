import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { LINGUE, normalizzaTrattamento, type Testi, type TrasparenzaVetrina } from "./trasparenza";

// ─────────────────────────────────────────────────────────────────────────────
// LA TRASPARENZA AI DAL CRM — la seconda chiamata alla vetrina (01/10/2026).
//
// La trasparenza NON sta nel catalogo (SPEC v1.1 §9.1): il CRM la serve in una
// vista a sé, `/api/vetrina?sito=triesteimmobiliare.com&vista=trasparenza`,
// per non riportare il catalogo sopra il tetto dei 2 MB della Data Cache.
// Risposta: { stato, guardia_nomi, totali, immobili: [{ airtable_id,
// tsv_prop_id, trasparenza }] }, con `trasparenza` null per chi non ha dati.
//
// Si legge SEMPRE, qualunque sia la sorgente del catalogo (Airtable o
// Postgres): l'abbinamento è per airtable_id, che entrambe le strade portano
// in `recId`. Stessa durata del catalogo (600 s, tag "properties"): il
// campanello /api/revalidate che il CRM suona dopo un carico la rinfresca
// insieme al resto.
//
// ⛔ UN GUASTO DEL CRM NON TOGLIE LE ETICHETTE IN SILENZIO. Il punto delicato
// non è la vetrina che non risponde, è quella che risponde MALE con un 200:
// quando le tabelle non si leggono il CRM risponde 200 con
// `stato: "tabelle illeggibili…"` e `trasparenza: null` per tutti. Con una
// fetch nella Data Cache quel 200 si sarebbe scritto SOPRA la versione buona,
// e per 10 minuti ogni foto AI del sito sarebbe uscita senza etichetta, senza
// una riga di log (review del 01/10). Quindi:
//   1. la lettura passa da `unstable_cache`, e la funzione LANCIA su tutto ciò
//      che non è una risposta buona (rete, timeout, 4xx/5xx, JSON storto,
//      `stato` diverso da "letta", forma inattesa). Next, quando una
//      rivalidazione lancia, tiene e serve la voce vecchia (verificato nel
//      sorgente di next 16.2.6, server/web/spec-extension/unstable-cache.js:
//      «Return the stale value on error»): l'ultima risposta buona resta in
//      cache — condivisa fra le istanze e fra i deploy — finché il CRM non
//      torna a rispondere bene;
//   2. se la cache non ha nessuna voce (primo avvio, voce scaduta per
//      revalidateTag) e il CRM è giù, si usa l'ultima mappa buona tenuta in
//      memoria da questa istanza;
//   3. se non c'è nemmeno quella, la mappa è vuota — ma le foto col nome di un
//      generatore portano comunque l'etichetta generica «AI»
//      (trasparenza.ts → trattamentoDalNome), che non dipende dal CRM.
// Ogni guasto si scrive nel log. Una guardia dei nomi disarmata NON è un
// guasto: il CRM toglie didascalie e note e lascia le etichette (è la sua
// regola: «non ho potuto controllare» non vale «va bene»).
//
// COLLAUDO LOCALE: VETRINA_URL (la stessa variabile del catalogo) può puntare
// a un server di prova che risponde alla vista; l'origine di VETRINA_URL è
// anche la base degli originali (SPEC §5.6). Vedi la nota in fondo al file.
// ─────────────────────────────────────────────────────────────────────────────

const VETRINA_URL = process.env.VETRINA_URL ?? "https://tsv-pg.vercel.app/api/vetrina";
const SITO = "triesteimmobiliare.com";
const REVALIDATE_SECONDS = 600;
// La build e la rigenerazione non devono restare appese a un CRM lento: oltre
// questo tempo la lettura fallisce (e vale la voce vecchia della cache). La
// vista risponde in ~0,1-0,4 s.
const TIMEOUT_MS = 6000;

/** `${origine della vetrina}/api/vetrina/foto` — dove il CRM serve gli originali. */
export const BASE_ORIGINALI = (() => {
  try {
    return `${new URL(VETRINA_URL).origin}/api/vetrina/foto`;
  } catch {
    return "https://tsv-pg.vercel.app/api/vetrina/foto";
  }
})();

const ATT = /^att[A-Za-z0-9]{14}$/;

function testi(v: unknown): Testi | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const t = Object.fromEntries(
    LINGUE.map((l) => [l, typeof o[l] === "string" && (o[l] as string).trim() ? (o[l] as string).trim() : null]),
  ) as Testi;
  return LINGUE.some((l) => t[l] !== null) ? t : null;
}

const intero = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
const conto = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;

function leggiTrasparenza(v: unknown): TrasparenzaVetrina | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const foto: TrasparenzaVetrina["foto"] = [];
  if (Array.isArray(o.foto)) {
    for (const f of o.foto as Record<string, unknown>[]) {
      if (!f || typeof f.filename !== "string" || !f.filename) continue;
      const orig = f.originale as Record<string, unknown> | null | undefined;
      foto.push({
        filename: f.filename,
        trattamento: normalizzaTrattamento(f.trattamento),
        blocco_difetti: f.blocco_difetti === true,
        didascalia: testi(f.didascalia),
        // Un id che non ha la forma di un allegato non diventa un URL.
        originale:
          orig && typeof orig.id === "string" && ATT.test(orig.id)
            ? { id: orig.id, larghezza: intero(orig.larghezza), altezza: intero(orig.altezza) }
            : null,
      });
    }
  }
  const c = (o.conteggi ?? {}) as Record<string, unknown>;
  const nonAbbinate = conto(c.ai_non_abbinate) ?? 0;
  const nota = testi(o.nota);
  if (!foto.length && !nota && !nonAbbinate) return null;
  return {
    nota,
    foto,
    conteggi: { ai_non_abbinate: nonAbbinate, ai: conto(c.ai), foto_pubblicate: conto(c.foto_pubblicate) },
  };
}

type Righe = [string, TrasparenzaVetrina][];

// Dopo un guasto non si richiama il CRM a ogni pagina: la build ne genera
// ~150, e con la vista in errore erano ~150 chiamate (e ~150 righe di log)
// tutte uguali. Per un minuto la lettura fallisce subito (e vale la voce
// vecchia della cache), poi si riprova.
const PAUSA_DOPO_GUASTO_MS = 60_000;
let guastoFinoA = 0;
let ultimaBuona: Map<string, TrasparenzaVetrina> | null = null;

class GuastoVetrina extends Error {}

/** UNA lettura della vista; lancia su tutto ciò che non è una risposta buona. */
async function leggiVista(): Promise<Righe> {
  if (Date.now() < guastoFinoA) throw new GuastoVetrina("in pausa dopo un guasto recente");
  let res: Response;
  try {
    res = await fetch(`${VETRINA_URL}?sito=${SITO}&vista=trasparenza`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new GuastoVetrina(`rete: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!res.ok) throw new GuastoVetrina(`HTTP ${res.status}`);
  let data: { stato?: unknown; immobili?: unknown };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new GuastoVetrina("JSON illeggibile");
  }
  // «letta» è l'unico stato in cui `trasparenza: null` vuol dire davvero
  // «nessun dato». Uno stato mancante (vista di un CRM più vecchio) si accetta.
  if (data.stato !== undefined && data.stato !== "letta") throw new GuastoVetrina(`stato: ${String(data.stato)}`);
  if (!Array.isArray(data.immobili)) throw new GuastoVetrina("risposta senza `immobili`");
  const out: Righe = [];
  for (const r of data.immobili as Record<string, unknown>[]) {
    if (!r || typeof r.airtable_id !== "string") continue;
    const t = leggiTrasparenza(r.trasparenza);
    if (t) out.push([r.airtable_id, t]);
  }
  return out;
}

const leggiInCache = unstable_cache(
  async (): Promise<Righe> => {
    try {
      return await leggiVista();
    } catch (e) {
      if (!(e instanceof GuastoVetrina) || !e.message.startsWith("in pausa")) {
        guastoFinoA = Date.now() + PAUSA_DOPO_GUASTO_MS;
        console.warn(
          `[trasparenza] vista del CRM non valida (${e instanceof Error ? e.message : e}): resta l'ultima risposta buona`,
        );
      }
      throw e;
    }
  },
  ["trasparenza-vetrina", SITO, VETRINA_URL],
  { revalidate: REVALIDATE_SECONDS, tags: ["properties"] },
);

/**
 * airtable_id → trasparenza, solo per gli immobili che ne hanno. Mai lancia.
 * `cache` di React: una lettura per richiesta, anche se la pagina chiama
 * getProperties() più volte (metadati, pagina, generateStaticParams).
 */
export const getTrasparenzaSito = cache(async (): Promise<Map<string, TrasparenzaVetrina>> => {
  try {
    const m = new Map(await leggiInCache());
    ultimaBuona = m;
    return m;
  } catch (e) {
    if (ultimaBuona) {
      console.warn("[trasparenza] CRM non raggiungibile: uso l'ultima vista buona di questa istanza");
      return ultimaBuona;
    }
    console.warn(
      "[trasparenza] CRM non raggiungibile e nessuna vista buona: restano le sole etichette dai nomi dei file —",
      e instanceof Error ? e.message : e,
    );
    return new Map();
  }
});

// ── Collaudo locale ─────────────────────────────────────────────────────────
// Per vedere la trasparenza su dati di prova senza toccare il CRM:
//   VETRINA_URL=http://127.0.0.1:<porta>/api/vetrina
// con un server che inoltra il catalogo alla vetrina vera e risponde lui a
// `vista=trasparenza` e a `/api/vetrina/foto/<rec>/<id>/<s|m|xl>`. Se il
// catalogo deve venire da Postgres serve anche CATALOGO_SORGENTE=pg.
