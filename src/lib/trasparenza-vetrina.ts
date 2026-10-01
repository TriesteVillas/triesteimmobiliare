import "server-only";
import { LINGUE, normalizzaTrattamento, type Testi, type TrasparenzaVetrina } from "./trasparenza";

// ─────────────────────────────────────────────────────────────────────────────
// LA TRASPARENZA AI DAL CRM — la seconda chiamata alla vetrina (01/10/2026).
//
// La trasparenza NON sta nel catalogo (SPEC v1.1 §9.1): il CRM la serve in una
// vista a sé, `/api/vetrina?sito=triesteimmobiliare.com&vista=trasparenza`,
// per non riportare il catalogo sopra il tetto dei 2 MB della Data Cache.
// Risposta: { stato, totali, immobili: [{ airtable_id, tsv_prop_id,
// trasparenza }] }, con `trasparenza` null per chi non ha dati.
//
// Si legge SEMPRE, qualunque sia la sorgente del catalogo (Airtable o
// Postgres): l'abbinamento è per airtable_id, che entrambe le strade portano
// in `recId`. Stessa cache del catalogo (600 s, tag "properties"): il
// campanello /api/revalidate che il CRM suona dopo un carico la rinfresca
// insieme al resto.
//
// ⛔ TOLLERANTE PER COSTRUZIONE. Qualunque guasto — rete, timeout, 4xx/5xx,
// JSON storto, forma inattesa — vale «nessuna trasparenza»: il sito si
// comporta esattamente come prima che questo file esistesse. Il guasto si
// scrive nel log, non in pagina. Un singolo elemento malformato si scarta da
// solo, senza far cadere gli altri.
//
// COLLAUDO LOCALE: VETRINA_URL (la stessa variabile del catalogo) può puntare
// a un server di prova che risponde alla vista; l'origine di VETRINA_URL è
// anche la base degli originali (SPEC §5.6). Vedi la nota in fondo al file.
// ─────────────────────────────────────────────────────────────────────────────

const VETRINA_URL = process.env.VETRINA_URL ?? "https://tsv-pg.vercel.app/api/vetrina";
const SITO = "triesteimmobiliare.com";
const REVALIDATE_SECONDS = 600;
// La build e la rigenerazione non devono restare appese a un CRM lento: oltre
// questo tempo si va avanti senza trasparenza (e la prossima rigenerazione
// riprova). La Data Cache resta valida anche con un signal.
const TIMEOUT_MS = 8000;

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
  const nonAbbinate = typeof c.ai_non_abbinate === "number" && c.ai_non_abbinate > 0 ? c.ai_non_abbinate : 0;
  const nota = testi(o.nota);
  if (!foto.length && !nota && !nonAbbinate) return null;
  return { nota, foto, conteggi: { ai_non_abbinate: nonAbbinate } };
}

// Dopo un guasto non si richiama il CRM a ogni pagina: la build ne genera
// ~150, e con la vista in errore erano ~150 chiamate (e ~150 righe di log)
// tutte uguali. Per un minuto si va avanti senza, poi si riprova. Una risposta
// buona, invece, la tiene la Data Cache di Next (600 s, tag "properties").
const PAUSA_DOPO_GUASTO_MS = 60_000;
let guastoFinoA = 0;

/** airtable_id → trasparenza, solo per gli immobili che ne hanno. Mai lancia. */
export async function getTrasparenzaSito(): Promise<Map<string, TrasparenzaVetrina>> {
  const out = new Map<string, TrasparenzaVetrina>();
  if (Date.now() < guastoFinoA) return out;
  try {
    const res = await fetch(`${VETRINA_URL}?sito=${SITO}&vista=trasparenza`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["properties"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      guastoFinoA = Date.now() + PAUSA_DOPO_GUASTO_MS;
      console.warn(`[trasparenza] vetrina ${res.status}: niente trasparenza, il sito resta com'era`);
      return out;
    }
    const data = (await res.json()) as { immobili?: unknown };
    if (!Array.isArray(data.immobili)) {
      guastoFinoA = Date.now() + PAUSA_DOPO_GUASTO_MS;
      console.warn("[trasparenza] risposta senza `immobili`: niente trasparenza");
      return out;
    }
    for (const r of data.immobili as Record<string, unknown>[]) {
      if (!r || typeof r.airtable_id !== "string") continue;
      const t = leggiTrasparenza(r.trasparenza);
      if (t) out.set(r.airtable_id, t);
    }
  } catch (e) {
    guastoFinoA = Date.now() + PAUSA_DOPO_GUASTO_MS;
    console.warn(
      "[trasparenza] vetrina non letta: niente trasparenza, il sito resta com'era —",
      e instanceof Error ? e.message : e,
    );
    return new Map();
  }
  return out;
}

// ── Collaudo locale ─────────────────────────────────────────────────────────
// Per vedere la trasparenza su dati di prova senza toccare il CRM:
//   VETRINA_URL=http://127.0.0.1:<porta>/api/vetrina
// con un server che inoltra il catalogo alla vetrina vera e risponde lui a
// `vista=trasparenza` e a `/api/vetrina/foto/<rec>/<id>/<s|m|xl>`. Se il
// catalogo deve venire da Postgres serve anche CATALOGO_SORGENTE=pg.
