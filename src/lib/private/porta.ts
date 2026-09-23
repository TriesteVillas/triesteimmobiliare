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

/** L'HMAC sul corpo ESATTO che verrà spedito. Estratto da `bussa` il 23/09
 *  perché la chat firma allo stesso modo ma legge lo stato HTTP invece di
 *  alzare: due copie di questa riga sono due modi di sbagliare la firma. */
function firmaDi(corpo: string): string {
  return createHmac("sha256", SEGRETO).update(corpo, "utf8").digest("hex");
}

async function bussa<T>(corpoObj: Record<string, unknown>): Promise<T> {
  const corpo = JSON.stringify(corpoObj);
  const r = await fetch(URL_PORTA, {
    method: "POST",
    headers: { "x-porta": PORTA, "x-firma": firmaDi(corpo), "Content-Type": "application/json" },
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

// ═══════════════════════════════════════════════════════════════════════════
// IL CONCIERGE DAL v4 — la seconda strada della chat (23/09/2026, cantiere PC)
//
// ⛔ SENZA CHIAMANTE SU QUESTO SITO — leggere prima di usarla o di toglierla.
// Su triesteimmobiliare.com la Private Collection NON ha un concierge: non
// esiste `src/app/api/private/chat/route.ts`, non esiste un `ChatWidget` fra i
// componenti di `src/components/private/`, e il v1 non ne ha mai servito uno
// per questo marchio — misurato sul database del v4 il 23/09/2026: in `pc_log`
// gli eventi `chat` sono 17 e tutti TSV, zero TSI, e le 63 conversazioni di
// `pc_chat_log` sono tutte TSV. Quindi, ed è la cosa che conta per il cantiere:
// **spegnendo il v1, su TriesteImmobiliare non ammutolisce niente.**
//
// Allora perché la strada sta qui? Perché questo file è il GEMELLO di quello di
// triestevillas.com e oggi i due differiscono in tutto per due righe (il nome
// della porta, `pc-tsi` contro `pc-tsv`, e il commento che lo spiega). Toglierla
// di qui significherebbe una terza differenza e, il giorno in cui la collezione
// TSI avrà un concierge, una ricopiatura a mano da un file che nel frattempo si
// è mosso: è così che nascono le coppie di regole che divergono. Tenerla costa
// zero a runtime (nessuno la importa, il bundler non la imbarca) ed è PROVATA
// come su TSV da `scripts/collaudo-pc-chat.mts`, che quando la rotta non c'è
// pretende di trovare questo cartello — e quando la rotta arriva pretende che
// sia stato tolto.
//
// Su triestevillas.com, dove il widget c'è, il concierge vive nel v1: `POST
// /api/private/chat` inoltra a `CRM_BRIDGE_URL`, autenticato dal segreto
// condiviso nell'header `x-bridge-secret`. Quella sì ammutolisce, e questa è
// l'altra strada: la stessa porta firmata che questo file usa già per i codici,
// azione `chat`. Stessa forma, stessa firma, stesso marchio deciso da `x-porta`.
//
// ── PERCHÉ UN INTERRUTTORE SUO, E NON `PC_SORGENTE` ───────────────────────
// `PC_SORGENTE=pg` sposta una LETTURA: da dove il sito va a leggere un codice.
// Questo sposta una CONVERSAZIONE VIVA con un cliente, su un altro motore, con
// un altro registro e un'altra guardia anti-abuso. Sono due rischi di taglia
// diversa e devono accendersi e spegnersi separatamente: il giorno in cui la
// chat desse problemi, togliere `PC_CHAT_SORGENTE` non deve rimandare su
// Airtable anche l'autenticazione delle persone che hanno un accesso vivo.
//
// Si accende con **PC_CHAT_SORGENTE=pg**. Senza la variabile il sito parla col
// v1 esattamente come oggi, e il rollback è togliere la variabile — niente
// altro, nessun deploy di codice. Stesso schema di `PC_SORGENTE` qui sopra e di
// `CATALOGO_SORGENTE=pg` per la vetrina, che è già in produzione.
//
// ── IL RIPIEGO: IL SILENZIO NON È UN'OPZIONE, L'ECO NEMMENO ───────────────
// Se la porta del v4 non risponde, chi chiama può tornare al v1 invece di
// lasciare il widget muto davanti a un cliente. Ma NON in ogni caso, e le due
// eccezioni sono la parte che conta:
//
//  ① NON si ripiega su un VERDETTO. Un 403 della porta vuol dire «questo codice
//     non apre», e il v4 lo dice avendo riletto ADESSO la riga che i siti
//     interrogano davvero. Rifare la stessa domanda al v1 vuol dire farla ad
//     Airtable, cioè alla copia che fino al 26/08 rispondeva «sì» per ore dopo
//     una sospensione decisa nel pannello. Un ripiego che riapre quella porta
//     non è una rete di sicurezza: è quel guasto, rimesso in servizio.
//
//  ② NON si ripiega su un'ATTESA LUNGA, ed è aritmetica. La lambda del proxy
//     vive 60 secondi (`maxDuration`) e un turno vero del concierge può
//     prendersene quasi tutti: se il v4 ne ha già bruciati trenta, un secondo
//     turno intero non ci sta e si farebbe solo tagliare a metà. Peggio — il v4
//     dichiara `maxDuration = 90` proprio per restare vivo a SCRIVERE il turno
//     dopo averlo composto, quindi un ripiego partito su un timeout lascerebbe
//     due turni nel registro e due chiamate al modello pagate per una sola
//     domanda. Si ripiega solo su un guasto RAPIDO — porta irraggiungibile,
//     segreto sbagliato, 500 — che è poi l'unico caso in cui il v1 farebbe
//     davvero in tempo a rispondere.
//
// ⚠️ Chi ripiega lo SCRIVE nei log. Una strada nuova che non funziona mai e
// ripiega in silenzio sembra, da fuori, una strada nuova che funziona.
//
// ── COSA NON SI MANDA, E PERCHÉ ───────────────────────────────────────────
//  · l'EMAIL. Il v4 la ignora di proposito (l'identità la dà il grant che
//    rilegge lui): mandarla sarebbe un dato personale che attraversa un confine
//    per essere buttato via.
//  · l'IP dell'ospite. Il v1 non l'ha mai ricevuto e la chat non ne ha mai
//    avuto bisogno; accenderlo è una decisione a sé, non un effetto collaterale
//    di un trasloco.
//  · il NOME DELLA SESSIONE. Il widget non ne tiene uno (la chat sta in
//    `sessionStorage` sotto una chiave fissa) e il v4 lo deriva da sé, come fa
//    già il v1. Mandare qualcosa di nostro qui — `rid`, per dire — farebbe di
//    tutte le conversazioni di una persona un'unica sessione, e la soglia di
//    recidiva della guardia conta proprio le sessioni distinte.
// ═══════════════════════════════════════════════════════════════════════════

/** Un turno di conversazione, nella forma che la porta del v4 accetta. */
export type TurnoChat = { role: "user" | "assistant"; content: string };

/** L'interruttore della chat. Acceso solo se la variabile c'è E il segreto pure:
 *  senza firma ogni chiamata tornerebbe 401 e ripiegherebbe a ogni turno. */
export const PC_CHAT_DA_POSTGRES = process.env.PC_CHAT_SORGENTE === "pg" && SEGRETO.length > 0;

/** Interruttore acceso ma segreto dimenticato. Non fa ripiegare in silenzio:
 *  chi chiama deve dirlo nei log a ogni turno. A differenza dell'ingresso
 *  (`PC_MANCA_SEGRETO`, che alza un'eccezione perché altrimenti non entra
 *  nessuno) qui la strada vecchia esiste ancora e funziona: far tacere il
 *  widget per punire un errore di configurazione punirebbe il cliente. */
export const PC_CHAT_MANCA_SEGRETO = process.env.PC_CHAT_SORGENTE === "pg" && SEGRETO.length === 0;

/** Quanto si aspetta la porta del v4. Uguale all'attesa che il proxy concede
 *  oggi al v1: il tetto vero lo mette comunque `maxDuration` della lambda. */
const ATTESA_CHAT_MS = 60_000;

/** Sotto questa soglia un guasto è «rapido», e ripiegare ha senso: restano
 *  ~48 secondi dei 60 della lambda, che a un turno del v1 bastano. Sopra, no —
 *  vedi ② nel cartello qui sopra. */
const SOGLIA_RIPIEGO_MS = 12_000;

export type EsitoChatPorta =
  /** Il concierge ha parlato. `bloccato` = l'accesso è stato sospeso adesso. */
  | { esito: "ok"; testo: string; bloccato: boolean }
  /** Verdetto del v4: il codice non apre. Non si ripiega — vedi ①. */
  | { esito: "accesso-negato" }
  /** Guasto. `rapido` dice se è successo in tempo perché il v1 possa provarci. */
  | { esito: "guasto"; perche: string; rapido: boolean };

/**
 * Un turno di chat attraverso la porta firmata del v4.
 *
 * ⚠️ Non usa `bussa()` e non è una svista: `bussa` alza un'eccezione su
 * qualunque risposta non-2xx, e così il 403 («questo codice non apre») e il 500
 * («la porta è rotta») diventerebbero lo stesso errore. Qui quei due casi
 * portano a decisioni opposte, quindi lo stato HTTP si legge e si distingue.
 */
export async function chatDallaPorta(d: {
  /** Dal grant appena riletto da chi chiama, MAI dal browser. */
  codice: string;
  messaggi: TurnoChat[];
  /** La lingua in cui l'ospite sta navigando adesso. */
  lingua: string;
}): Promise<EsitoChatPorta> {
  const partito = Date.now();
  const rapido = () => Date.now() - partito < SOGLIA_RIPIEGO_MS;

  const corpo = JSON.stringify({
    azione: "chat", codice: d.codice, messaggi: d.messaggi, lingua: d.lingua,
  });

  let r: Response;
  try {
    r = await fetch(URL_PORTA, {
      method: "POST",
      headers: { "x-porta": PORTA, "x-firma": firmaDi(corpo), "Content-Type": "application/json" },
      body: corpo,
      signal: AbortSignal.timeout(ATTESA_CHAT_MS),
      cache: "no-store",
    });
  } catch (e) {
    // Rete, DNS, timeout. `rapido()` separa «la porta non c'è» (istantaneo, si
    // ripiega) da «la porta ci ha messo troppo» (niente ripiego).
    return { esito: "guasto", perche: `rete: ${String(e).slice(0, 160)}`, rapido: rapido() };
  }

  // 403 è l'unica risposta che è un GIUDIZIO e non un guasto: la porta ha
  // riletto il grant e dice di no. Vedi ① nel cartello.
  if (r.status === 403) return { esito: "accesso-negato" };
  if (!r.ok) return { esito: "guasto", perche: `http ${r.status}`, rapido: rapido() };

  let dati: { ok?: unknown; testo?: unknown; bloccato?: unknown };
  try {
    dati = (await r.json()) as typeof dati;
  } catch {
    return { esito: "guasto", perche: "risposta non è JSON", rapido: rapido() };
  }

  const testo = typeof dati.testo === "string" ? dati.testo : "";
  // 200 con corpo vuoto è un guasto travestito: senza questa riga il widget
  // mostrerebbe una bolla vuota al posto di una risposta.
  if (dati.ok !== true || !testo) return { esito: "guasto", perche: "risposta vuota", rapido: rapido() };

  return { esito: "ok", testo, bloccato: dati.bloccato === true };
}
