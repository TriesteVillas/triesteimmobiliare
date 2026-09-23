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

// ═══════════════════════════════════════════════════════════════════════════
// LA RICHIESTA DI ACCESSO NASCE NEL v4 — la terza strada (23/09/2026)
//
// Oggi il modulo `/private/richiedi` scrive su Airtable: `createLeadAndRequest`
// fa due POST — LEAD_ e PC_RICHIESTE — e il CRM nuovo le vede solo dopo la
// copia. Misurato il 23/09 dal lato v4: **151 righe di `pc_richiesta` su 151**
// sono nate così. Finché è così, Airtable non si può spegnere.
//
// Qui c'è l'altra strada: la stessa porta firmata che questo file usa già per i
// codici e per la chat, azione `crea-richiesta`. La riga nasce in Postgres,
// `solo_locale`, e su Airtable non ci va affatto.
//
// ── ⛔ L'INTERRUTTORE NON SI ACCENDE DA SOLO, ED È IL PUNTO ────────────────
// Si accende con **PC_RICHIESTA_SORGENTE=pg**, ma la variabile NON BASTA: la
// strada è viva solo se su questo sito è già acceso `PC_SORGENTE=pg`, cioè se
// questo sito autentica già i codici leggendo Postgres.
//
// Il perché è una catena corta e va letta tutta: una richiesta nata in Postgres
// viene approvata dal pannello del v4, che le scrive il codice **in Postgres**.
// Se questo sito continuasse a risolvere i codici su Airtable, quel codice non
// esisterebbe da nessuna parte per lui: il cliente riceverebbe una mail con una
// password che non apre niente, e nel CRM risulterebbe tutto in ordine. È
// esattamente il difetto che il cartello di `lib/pc-admin.ts` del v4 racconta
// come già successo una volta, al contrario.
//
// Per questo la condizione è nel CODICE e non in una nota: un ordine di
// accensione che vive solo in un documento è un ordine che prima o poi qualcuno
// inverte. Chi accende solo `PC_RICHIESTA_SORGENTE` non ottiene niente, e il
// log glielo dice.
//
// ── COSA SUCCEDE SE LA PORTA NON RISPONDE ─────────────────────────────────
// Si RIPIEGA su Airtable, e qui il ripiego è giusto — al contrario della chat
// (vedi ① là sopra). La differenza: là il v4 emette un VERDETTO su un accesso,
// e rifarlo chiedere al v1 vorrebbe dire rimettere in servizio una copia
// vecchia; qui il v4 esegue una SCRITTURA, e se non riesce l'alternativa non è
// «una risposta meno buona» ma **una richiesta di un cliente che si perde**.
// Fra una riga su Airtable e nessuna riga, vince la riga.
//
// ⚠️ Chi ripiega lo SCRIVE nei log. Una strada nuova che ripiega sempre in
// silenzio sembra, da fuori, una strada nuova che funziona.
// ═══════════════════════════════════════════════════════════════════════════

/** L'interruttore della nascita. Acceso solo se: la variabile c'è, il segreto
 *  pure, E la lettura dei codici è già passata a Postgres. Vedi il cartello. */
export const PC_RICHIESTA_DA_POSTGRES =
  process.env.PC_RICHIESTA_SORGENTE === "pg" && SEGRETO.length > 0 && PC_DA_POSTGRES;

/** Interruttore acceso ma una delle due condizioni manca. Non è un dettaglio da
 *  ignorare: chi l'ha acceso crede di aver spostato la nascita del dato e non
 *  l'ha spostata. Si dice, a ogni richiesta. */
export const PC_RICHIESTA_NON_ARMATA =
  process.env.PC_RICHIESTA_SORGENTE === "pg" && !(SEGRETO.length > 0 && PC_DA_POSTGRES);

/** Perché non è armata, in parole. Vuoto se lo è (o se nessuno l'ha accesa). */
export function pcRichiestaPerche(): string {
  if (!PC_RICHIESTA_NON_ARMATA) return "";
  if (SEGRETO.length === 0) return "manca PC_PORTA_SEGRETO";
  return "PC_SORGENTE non è 'pg': questo sito risolve ancora i codici su Airtable, quindi un codice emesso in Postgres non aprirebbe niente";
}

/** Il modulo, nella forma che la porta del v4 accetta. Gli stessi campi che
 *  `createLeadAndRequest` scrive su Airtable: non si arricchisce e non si
 *  deriva niente qui — zone, fasce, città e lingua le rinormalizza il v4, che
 *  è quello che poi decide su quei valori. */
export interface ModuloPcDaSpedire {
  nome: string; cognome: string; email: string; telefono: string;
  citta: string; intro: string;
  zone: string[]; bands: string[];
  immobileTrigger: string; lingua: string;
}

export type EsitoCreaRichiesta =
  /** Nata in Postgres. `gia` = era già in coda da pochi minuti (doppio invio). */
  | { esito: "creata"; richiestaId: string; gia: boolean }
  /** Il v4 ha rifiutato il modulo: è un giudizio sui DATI, e ripetere la stessa
   *  cosa su Airtable creerebbe una riga che il v4 considera non valida. */
  | { esito: "rifiutato"; errore: string; campo: string }
  /** Guasto: chi chiama ripiega su Airtable. */
  | { esito: "guasto"; perche: string };

/**
 * Fa nascere la richiesta nel v4.
 *
 * ⚠️ Non usa `bussa()`, per la stessa ragione della chat: `bussa` alza su
 * qualunque risposta non-2xx, e così il 400 («questo modulo non è valido») e il
 * 500 («la porta è rotta») diventerebbero lo stesso errore. Qui i due casi
 * portano a decisioni opposte — non riprovare, e riprovare su Airtable.
 */
export async function pgCreaRichiesta(m: ModuloPcDaSpedire): Promise<EsitoCreaRichiesta> {
  const corpo = JSON.stringify({
    azione: "crea-richiesta",
    nome: m.nome, cognome: m.cognome, email: m.email, telefono: m.telefono,
    citta: m.citta, intro: m.intro, zone: m.zone, bands: m.bands,
    immobileTrigger: m.immobileTrigger, lingua: m.lingua,
    // ⚠️ `privacyOk` si manda ESPLICITO e sempre `true`: qui ci si arriva solo
    // dopo che la route ha già rifiutato chi non l'ha spuntata. La porta lo
    // pretende lo stesso — è il campo che poi scrive sulla scheda — e un
    // consenso dedotto non è un consenso.
    privacyOk: true,
    origine: `sito:${PORTA.replace(/^pc-/, "")}/pc-richiesta`,
  });

  let r: Response;
  try {
    r = await fetch(URL_PORTA, {
      method: "POST",
      headers: { "x-porta": PORTA, "x-firma": firmaDi(corpo), "Content-Type": "application/json" },
      body: corpo,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch (e) {
    return { esito: "guasto", perche: `rete: ${String(e).slice(0, 160)}` };
  }

  let dati: { ok?: unknown; richiestaId?: unknown; gia?: unknown; errore?: unknown; campo?: unknown };
  try {
    dati = (await r.json()) as typeof dati;
  } catch {
    return { esito: "guasto", perche: `risposta non è JSON (http ${r.status})` };
  }

  // 400 = giudizio sui dati. Non si ripiega: le stesse regole valgono di qua e
  // di là, e ricreare su Airtable un modulo che il v4 rifiuta vorrebbe dire
  // farsi scrivere una riga che nessuno dei due sistemi considera buona.
  if (r.status === 400) {
    return {
      esito: "rifiutato",
      errore: typeof dati.errore === "string" ? dati.errore : "bad_request",
      campo: typeof dati.campo === "string" ? dati.campo : "",
    };
  }
  if (!r.ok) return { esito: "guasto", perche: `http ${r.status}` };
  const id = typeof dati.richiestaId === "string" ? dati.richiestaId : "";
  // 200 senza id è un guasto travestito: senza questa riga il sito direbbe
  // «grazie» a un cliente la cui richiesta non esiste da nessuna parte.
  if (dati.ok !== true || !id) return { esito: "guasto", perche: "risposta senza richiestaId" };

  return { esito: "creata", richiestaId: id, gia: dati.gia === true };
}

// ═══════════════════════════════════════════════════════════════════════════
// IL GIRO DICHIARA COSA HA SPEDITO — l'ultimo mittente muto (23/09/2026)
//
// Questo sito ha un cron (`/api/private/cron`, **`0 6 * * *`** su Vercel —
// UNA VOLTA AL GIORNO, non ogni quarto d'ora come su TriesteVillas: i due
// siti non sono gemelli, misurato il 23/09/2026) che prende
// ogni riga `Approved` col flag `credenziali_inviate` spento e SPEDISCE LUI le
// credenziali, col testo standard della collezione. È l'ultima mail che parte
// da sola in tutto il sistema, e finora non lasciava riga da nessuna parte:
// accendeva il flag su Airtable e basta.
//
// Il prezzo, pagato due volte su clienti veri e scritto per esteso in
// `progetti/private-collection/PIANO-V4.md` (§04/09 e §16/09):
//  · il CRM, davanti a un lead servito dal giro, diceva all'operatore
//    «credenziali già inviate… probabilmente consegnate a mano» — su un lead
//    mai toccato da nessuno;
//  · e quando il giro sbagliava lingua (caso Holle: un avvocato tedesco
//    registrato `it` perché aveva compilato il form dalla pagina italiana),
//    nessuno poteva nemmeno sapere COSA gli era arrivato.
//
// Da qui in avanti il giro lo dice, passando dalla stessa porta firmata che
// questo file usa già per i codici: azione `credenziali-spedite`. Il CRM scrive
// la riga nei suoi registri — la colonna «Credenziali» del pannello smette di
// rispondere «quando e da chi: non risulta a registro».
//
// ── L'INTERRUTTORE: PC_TRACCIA_CRON=pg, e nasce SPENTO ────────────────────
// Senza la variabile il giro spedisce esattamente come oggi e non chiama
// niente. Il rollback è togliere la variabile — nessun deploy. Stesso schema di
// `PC_SORGENTE` e `PC_CHAT_SORGENTE` qui sopra.
//
// ⚠️ Un interruttore SUO, e non uno dei due che ci sono già: quelli spostano
// da dove il sito LEGGE, questo aggiunge una SCRITTURA nel CRM. Il giorno in cui
// la porta desse problemi, spegnere la traccia non deve rimandare su Airtable
// l'autenticazione di chi ha un accesso vivo.
//
// ⛔ NON CAMBIA NIENTE PER IL CLIENTE. Non decide se spedire, non cambia il
// testo, non tocca il flag: parla DOPO, a cose fatte. L'unico effetto fuori dal
// CRM è che la scheda del lead risulta contattata il giorno in cui la mail è
// partita davvero — che è la verità, e oggi non la sa nessuno.
//
// ⛔ E NON PUÒ FAR FALLIRE UN INVIO: chi chiama non aspetta oltre i secondi
// dichiarati qui sotto e ingoia ogni errore. Una traccia non scritta è un dato
// in meno; un cron che muore mentre consegna credenziali è un cliente che
// aspetta per sempre.
// ═══════════════════════════════════════════════════════════════════════════

/** L'interruttore della traccia. Acceso solo se la variabile c'è E il segreto
 *  pure: senza firma ogni chiamata tornerebbe 401 a ogni giro. */
export const PC_TRACCIA_CRON = process.env.PC_TRACCIA_CRON === "pg" && SEGRETO.length > 0;

/** Acceso ma senza segreto: è un errore di configurazione, e si dice nei log
 *  invece di sparire. */
export const PC_TRACCIA_MANCA_SEGRETO = process.env.PC_TRACCIA_CRON === "pg" && SEGRETO.length === 0;

/** Quanto si aspetta la porta. Corto apposta: il cron ha altre righe da servire
 *  e la traccia non vale un secondo di ritardo sulla consegna successiva. */
const ATTESA_TRACCIA_MS = 8_000;

export type EsitoTracciaCron =
  | { esito: "scritta"; nota: string }
  | { esito: "spenta" }
  | { esito: "guasto"; perche: string };

/**
 * «Ho spedito (o non ci sono riuscito) le credenziali di questa riga.»
 *
 * Non alza MAI: chi la chiama sta consegnando credenziali a clienti veri.
 */
export async function segnalaConsegnaCredenziali(d: {
  /** L'`id` del record PC_RICHIESTE servito. */
  richiesta: string;
  codice: string;
  email: string;
  /** `true` = Resend ha accettato. */
  inviata: boolean;
  /** Il motivo del no, quando c'è. */
  errore?: string;
  lingua?: string;
  oggetto?: string;
  /** Il mittente vero di questo sito (`MITTENTE_EFFETTIVO` in private/mail). */
  mittente?: string;
}): Promise<EsitoTracciaCron> {
  if (PC_TRACCIA_MANCA_SEGRETO) {
    console.error("[pc traccia] PC_TRACCIA_CRON=pg ma PC_PORTA_SEGRETO manca: il giro resta muto.");
    return { esito: "spenta" };
  }
  if (!PC_TRACCIA_CRON) return { esito: "spenta" };

  const corpo = JSON.stringify({
    azione: "credenziali-spedite",
    richiesta: d.richiesta, codice: d.codice, email: d.email,
    inviata: d.inviata,
    ...(d.errore ? { errore: d.errore.slice(0, 500) } : {}),
    ...(d.lingua ? { lingua: d.lingua } : {}),
    ...(d.oggetto ? { oggetto: d.oggetto.slice(0, 300) } : {}),
    ...(d.mittente ? { mittente: d.mittente } : {}),
    quando: new Date().toISOString(),
  });

  try {
    const r = await fetch(URL_PORTA, {
      method: "POST",
      headers: { "x-porta": PORTA, "x-firma": firmaDi(corpo), "Content-Type": "application/json" },
      body: corpo,
      signal: AbortSignal.timeout(ATTESA_TRACCIA_MS),
      cache: "no-store",
    });
    if (!r.ok) {
      const perche = `http ${r.status}`;
      console.error("[pc traccia]", d.richiesta, perche);
      return { esito: "guasto", perche };
    }
    const dati = (await r.json().catch(() => ({}))) as { ok?: unknown; nota?: unknown; perche?: unknown };
    if (dati.ok !== true) {
      // Il CRM ha rifiutato con un perché (codice che non combacia, specchio
      // indietro): non è un guasto di rete e va letto, non ripetuto all'infinito.
      const perche = typeof dati.perche === "string" ? dati.perche : "rifiutata senza motivo";
      console.error("[pc traccia] il CRM non ha registrato", d.richiesta, "—", perche);
      return { esito: "guasto", perche };
    }
    return { esito: "scritta", nota: typeof dati.nota === "string" ? dati.nota : "" };
  } catch (e) {
    const perche = `rete: ${String(e).slice(0, 160)}`;
    console.error("[pc traccia]", d.richiesta, perche);
    return { esito: "guasto", perche };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// IL GIRO DICE CHE È VIVO — la sentinella che mancava (23/09/2026)
//
// Questo cron (`/api/private/cron`) è l'unico processo di tutto il sistema che
// manda PASSWORD a clienti veri, ed è anche l'unico che non ha mai avuto una
// sentinella: nel v4 ogni cron lascia un battito e una riga nel registro dei
// processi, e una spia grida quando tace oltre la soglia. Questo no, perché
// gira in un altro repo e in un altro progetto Vercel. Se si fermasse — un
// `vercel.json` modificato, un deploy andato storto, un progetto sospeso —
// nessuno se ne accorgerebbe: le richieste `Approved` resterebbero in coda e
// i clienti aspetterebbero la loro password senza che niente lo dica.
//
// Da qui in avanti il giro lo dichiara, dalla stessa porta firmata che questo
// file usa già: azione `battito-giro`. Il CRM scrive nel SUO registro dei
// battiti, con le sue spie e il suo pannello — nessun meccanismo nuovo.
//
// ⛔ NON È LA TRACCIA DEGLI INVII (`segnalaConsegnaCredenziali`, qui sopra).
// Quella risponde a «a questa persona le credenziali sono uscite?», questa a
// «la macchina che le manda è viva?». Un giro che passa e non trova niente da
// fare è sano e non scrive nessuna traccia d'invio: senza un battito a parte,
// quel silenzio è indistinguibile da un giro morto.
//
// ⛔ NON MANDA INDIRIZZI NÉ CODICI: solo conteggi. Un canale di sorveglianza
// non è il posto dove far passare i dati di una persona «già che ci siamo».
//
// ── L'INTERRUTTORE: lo stesso `PC_TRACCIA_CRON`, e nasce SPENTO ────────────
// Non un quarto interruttore. I due gesti hanno la stessa natura (il giro
// racconta al CRM quello che ha fatto), lo stesso destinatario, lo stesso
// rischio — nessuno — e lo stesso rollback. Un interruttore in più sarebbe
// solo un modo per accenderne uno e dimenticare l'altro.
//
// ⚠️ IL PATTO, che vale nell'altro verso: dal primo battito il CRM registra il
// processo e comincia a sorvegliarlo. Spegnere `PC_TRACCIA_CRON` da allora in
// poi fa gridare la spia — giustamente, perché il giro torna muto — ma non è
// un guasto. Chi lo spegne deve, nello stesso gesto, mettere `attivo = false`
// sulla riga `processo` del CRM. Sta scritto anche nel campo `come_si_ferma`
// di quella riga, che è dove si va a cercare come si zittisce un allarme.
// ═══════════════════════════════════════════════════════════════════════════

/** Quanto si aspetta la porta. Corto: è una prova di vita, e il giro ha
 *  finito il suo lavoro — non deve tenere aperta una lambda per un battito. */
const ATTESA_BATTITO_MS = 5_000;

/** Il riassunto della corsa. ⛔ Conteggi e basta. */
export interface RiassuntoGiroPc {
  inviate: number;
  falliti: number;
  attesa: number;
  scaduti: number;
  sospetti: number;
  /** La guardia anti-abuso ha potuto GUARDARE? `false` = cieca (dal 26/08 lo è). */
  antiAbusoAttendibile: boolean;
  durataMs: number;
}

/**
 * «Sono passato.» Non alza MAI e non fa fallire niente: chi la chiama ha appena
 * consegnato credenziali a clienti veri, e una prova di vita non scritta vale
 * molto meno di un cron ucciso a metà.
 */
export async function segnalaGiroVivo(r: RiassuntoGiroPc): Promise<EsitoTracciaCron> {
  if (PC_TRACCIA_MANCA_SEGRETO) return { esito: "spenta" };
  if (!PC_TRACCIA_CRON) return { esito: "spenta" };

  const corpo = JSON.stringify({ azione: "battito-giro", giro: r });
  try {
    const risposta = await fetch(URL_PORTA, {
      method: "POST",
      headers: { "x-porta": PORTA, "x-firma": firmaDi(corpo), "Content-Type": "application/json" },
      body: corpo,
      signal: AbortSignal.timeout(ATTESA_BATTITO_MS),
      cache: "no-store",
    });
    if (!risposta.ok) {
      const perche = `http ${risposta.status}`;
      console.error("[pc battito]", perche);
      return { esito: "guasto", perche };
    }
    const dati = (await risposta.json().catch(() => ({}))) as { ok?: unknown; nota?: unknown; perche?: unknown };
    if (dati.ok !== true) {
      const perche = typeof dati.perche === "string" ? dati.perche : "rifiutato senza motivo";
      console.error("[pc battito] il CRM non ha registrato il battito —", perche);
      return { esito: "guasto", perche };
    }
    return { esito: "scritta", nota: typeof dati.nota === "string" ? dati.nota : "" };
  } catch (e) {
    const perche = `rete: ${String(e).slice(0, 160)}`;
    console.error("[pc battito]", perche);
    return { esito: "guasto", perche };
  }
}
