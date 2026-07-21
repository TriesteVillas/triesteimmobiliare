import "server-only";

// L'identità di brand della Private Collection di QUESTO sito.
//
// Perché esiste. Dal 2026-07-21 le Private Collection sono DUE: questa
// (TriesteImmobiliare, mid-market) e quella di TriesteVillas (off-market di alto
// valore). Vivono in due progetti Vercel distinti e in due repo distinti, ma
// condividono la stessa base Airtable e le stesse tabelle PC_RICHIESTE /
// PC_ACCESS_LOG. Senza un discriminante, un codice emesso per un brand aprirebbe
// il portale dell'altro: findGrantByCode cercava per solo {codice}.
//
// Come si legge questo file. `triestevillas-web/src/lib/private/brand.ts` ha la
// STESSA struttura con valori diversi: è l'unico punto in cui le due copie di
// lib/private divergono di proposito (insieme a bands.ts, dove le fasce sono per
// forza diverse). Se un giorno il `diff` fra i due lib/private mostra differenze
// FUORI da questi due file, è divergenza accidentale da riconciliare.
//
// Tre lucchetti indipendenti separano i due portali, e servono tutti e tre:
//   1. il CODICE è namespaced (TSI-… / TSV-…) e il lookup filtra su {brand},
//      quindi una query dimenticata altrove non può diventare un accesso;
//   2. il SEGRETO del cookie (PRIVATE_GATE_SECRET) ha valore diverso per
//      progetto Vercel, quindi un token firmato da un brand non verifica
//      sull'altro;
//   3. il claim `b` dentro il payload firmato, che regge anche nel caso —
//      da evitare ma possibile per errore umano — in cui i due segreti
//      coincidano.

export const BRAND = {
  /** Valore scritto e filtrato su PC_RICHIESTE.brand e PC_ACCESS_LOG.brand. */
  code: "TSI",
  /** Prefisso dei codici di accesso: TSI-XXXX-XXXX. Namespacing, non estetica. */
  codePrefix: "TSI",
  /** Nome del cookie di sessione. Diverso da quello di TriesteVillas così i due portali non si sovrascrivono la sessione a vicenda su un browser che li visita entrambi. */
  cookieName: "tsi_pc",
  /** Opzione di PROPRIETA.pc_visibile_su che espone un immobile in QUESTA collezione. */
  pcDomain: "triesteimmobiliare.com",
  /** Nome commerciale, per i testi delle mail. */
  displayName: "TriesteImmobiliare",
  /** Durata della credenziale in giorni. */
  validityDays: 15,
} as const;

/** URL pubblico del sito, senza slash finale. */
// Stessa trappola di lib/seo.ts: `??` non intercetta una variabile definita ma
// VUOTA — ed è esattamente ciò che restituisce `vercel env pull` per le variabili
// marcate Sensitive. Il fallback deve scattare anche sulla stringa vuota, altrimenti
// i link nelle mail diventano "/it/private?c=…" senza dominio.
export const SITE_URL = (
  (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
  (process.env.SITE_URL || "").trim() ||
  "https://www.triesteimmobiliare.com"
).replace(/\/$/, "");

/**
 * Mittente delle mail transazionali della PC.
 *
 * Nota operativa onesta: il canale d'invio VERO delle credenziali è il CRM, che
 * manda via Gmail con l'alias send-as del brand. Questo mittente vale solo per
 * le mail che partono dal sito (l'acknowledgement del form) e solo se
 * RESEND_API_KEY è configurata — oggi non lo è su nessuno dei due progetti,
 * quindi quelle mail semplicemente non partono e il dato resta su Airtable.
 */
export const MAIL_FROM =
  process.env.RESEND_FROM_PRIVATE ??
  "TriesteImmobiliare Private Collection <info@triesteimmobiliare.com>";

/** Indirizzo a cui rispondono i clienti. */
export const MAIL_REPLY_TO = process.env.PC_REPLY_TO ?? "info@triesteimmobiliare.com";

/** Riga di contatto in coda alle mail. Numeri italiani senza +39 (convenzione di gruppo). */
export const MAIL_CONTACT = "info@triesteimmobiliare.com · WhatsApp 331 8940822";

/** Destinatario del digest interno delle nuove richieste. */
export const DIGEST_TO = process.env.PC_DIGEST_TO ?? "martino@triestevillas.com";

/**
 * Clausola Airtable da AND-are in OGNI query su PC_RICHIESTE / PC_ACCESS_LOG.
 * Esiste come funzione, e non come stringa copiata, perché il modo in cui questo
 * progetto si rompe è che qualcuno aggiunga una query e dimentichi il filtro:
 * avere un solo nome da cercare rende l'omissione visibile in grep.
 *
 * Qui la clausola è STRETTA (nessuna tolleranza sul brand vuoto, a differenza di
 * TriesteVillas che assorbe i record storici): una riga TSI senza brand non deve
 * esistere, e se esiste è un bug da vedere, non da assorbire in silenzio.
 */
export function brandClause(): string {
  return `{brand}='${BRAND.code}'`;
}
