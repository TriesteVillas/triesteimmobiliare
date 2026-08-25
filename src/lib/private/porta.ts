import "server-only";
import { createHmac } from "node:crypto";
import type { Grant } from "./store";

// ─────────────────────────────────────────────────────────────────────────────
// LA PRIVATE COLLECTION DA POSTGRES — fase A del taglio Airtable → Postgres.
//
// Oggi questo sito autentica i codici LEGGENDO AIRTABLE a ogni ingresso. Qui
// c'è l'altra strada: la porta firmata `POST /api/pc-sito` di tsv-pg.
//
// Si accende con **PC_SORGENTE=pg**. Senza la variabile il sito legge Airtable
// esattamente come prima, e il rollback è togliere la variabile — stesso schema
// di `CATALOGO_SORGENTE=pg` per la vetrina, che è già in produzione.
//
// ⚠️ NIENTE `pg` IN QUESTO REPO, e non è pigrizia: dare a un sito pubblico le
// credenziali del database per leggere un codice vorrebbe dire allargare la
// superficie d'attacco per risparmiare una fetch. Si passa da HTTP, come per la
// vetrina e per i lead.
//
// ⚠️ IL MARCHIO NON SI MANDA. Lo decide la PORTA (`x-porta: pc-tsi`), non il
// corpo della richiesta: da qui non si può risolvere un codice TriesteVillas
// nemmeno sbagliando. È più forte del `brandClause()` che questo file usa
// altrove, perché non c'è niente che si possa dimenticare di scrivere.
//
// ⚠️ NIENTE CACHE. Un accesso revocato deve smettere di aprire subito.
//
// ── COSA SUCCEDE SE LA PORTA NON RISPONDE ──────────────────────────────────
// Le LETTURE (`risolvi-codice`, `risolvi-id`) rilanciano l'errore: chi chiama
// deve poter distinguere «codice sbagliato» da «non lo so», perché rispondere
// `null` a un guasto vorrebbe dire dire a un cliente col codice giusto che il
// suo codice non vale.
// Le SCRITTURE (`registra-accesso`, `evento`) invece NON fanno rumore: un
// ingresso non contato è un dato in meno, una pagina che non si apre è un
// cliente perso.
// ─────────────────────────────────────────────────────────────────────────────

const URL_PORTA = process.env.PC_PORTA_URL ?? "https://tsv-pg.vercel.app/api/pc-sito";
const PORTA = "pc-tsi";
const SEGRETO = process.env.PC_PORTA_SEGRETO ?? "";

/** L'interruttore. Acceso solo se la variabile c'è E il segreto pure: senza
 *  firma ogni chiamata tornerebbe 401, e il sito sarebbe muto senza dirlo. */
export const PC_DA_POSTGRES = process.env.PC_SORGENTE === "pg" && SEGRETO.length > 0;

/** Vero se qualcuno ha acceso l'interruttore ma dimenticato il segreto: è un
 *  errore di configurazione che va detto, non ignorato in silenzio. */
export const PC_MANCA_SEGRETO = process.env.PC_SORGENTE === "pg" && SEGRETO.length === 0;

async function bussa<T>(corpoObj: Record<string, unknown>): Promise<T> {
  const corpo = JSON.stringify(corpoObj);
  const firma = createHmac("sha256", SEGRETO).update(corpo, "utf8").digest("hex");
  const r = await fetch(URL_PORTA, {
    method: "POST",
    headers: { "x-porta": PORTA, "x-firma": firma, "Content-Type": "application/json" },
    body: corpo,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`pc-sito ${corpoObj.azione}: ${r.status}`);
  return (await r.json()) as T;
}

export async function pgFindGrantByCode(code: string): Promise<Grant | null> {
  const { grant } = await bussa<{ grant: Grant | null }>({ azione: "risolvi-codice", codice: code });
  return grant;
}

export async function pgFindGrantById(id: string): Promise<Grant | null> {
  const { grant } = await bussa<{ grant: Grant | null }>({ azione: "risolvi-id", id });
  return grant;
}

/** Best-effort: un ingresso non contato non deve impedire l'ingresso. */
export async function pgRegisterLogin(id: string): Promise<void> {
  try { await bussa({ azione: "registra-accesso", id }); }
  catch (e) { console.error("[pc] registra-accesso:", e); }
}

/** Best-effort, come sopra. */
export async function pgLogAccess(e: {
  evento: string; codice?: string; email?: string; ip?: string; ua?: string;
  dettaglio?: string; slug?: string; richiesta?: string;
}): Promise<void> {
  try { await bussa({ azione: "evento", ...e }); }
  catch (err) { console.error("[pc] evento:", err); }
}

/**
 * ⚠️ Alla peggio `false`: meglio contare due volte una visita che perderne una.
 * È la stessa scelta del ramo Airtable, e va tenuta uguale — un anti-doppione
 * che sbaglia in un verso è un fastidio, nell'altro cancella un dato.
 */
export async function pgRecentViewExists(codice: string, slug: string, sinceIso: string): Promise<boolean> {
  try {
    const { recente } = await bussa<{ recente: boolean }>({
      azione: "vista-recente", codice, slug, da: sinceIso,
    });
    return recente === true;
  } catch {
    return false;
  }
}
