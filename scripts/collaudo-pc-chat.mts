// Collaudo della SECONDA STRADA DELLA CHAT — il concierge servito dalla porta
// firmata del v4 invece che dal bridge del v1 (cantiere PC, 23/09/2026).
//
//   npx tsx scripts/collaudo-pc-chat.mts
//
// ⚠️ NESSUNA RETE, e men che meno verso un modello: `fetch` è finto e il
// collaudo verifica anche che l'unico indirizzo toccato sia quello della porta.
// Il segreto e l'URL sono finti; il database, Airtable e la centrale AI non
// vengono sfiorati.
//
// Le due domande a cui risponde, che sono poi le due che contano prima di
// mettere mano a un sito in produzione:
//
//   ① A INTERRUTTORE SPENTO IL PERCORSO È IDENTICO A PRIMA. Si prova in due
//      modi, perché uno solo non basterebbe: (a) senza `PC_CHAT_SORGENTE` la
//      costante che fa da guardia vale `false`, e (b) leggendo il sorgente
//      della rotta, `chatDallaPorta` compare SOLO dentro il blocco guardato da
//      quella costante. Le due insieme dicono che a interruttore spento non
//      gira una riga della strada nuova.
//
//   ② A INTERRUTTORE ACCESO LA RICHIESTA VA ALLA PORTA FIRMATA GIUSTA: giusto
//      indirizzo, giusta `x-porta`, firma HMAC ricalcolata qui in modo
//      indipendente sul corpo esatto, e nel corpo nient'altro che le quattro
//      cose che devono viaggiare — in particolare NIENTE email, NIENTE ip,
//      NIENTE nome di sessione.
//
// ⚠️ `tsx` non è una dipendenza del repo: `npx` se lo scarica. Serve anche lo
// stub locale di `server-only`, che Next fornisce solo in build: questo file se
// lo crea da sé (in node_modules, che è materiale usa e getta) invece di
// chiedere all'operatore di eseguire tre comandi prima.
import { createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const QUESTO = fileURLToPath(import.meta.url);
const SEGRETO = "segreto-finto-del-collaudo";
const URL_PORTA = "https://porta.invalid/api/pc-sito";
const ROTTA = "src/app/api/private/chat/route.ts";

// ── lo stub di `server-only` ────────────────────────────────────────────────
// `porta.ts` lo importa per non finire mai in un bundle del browser. Fuori da
// `next build` il pacchetto non esiste e l'import fallirebbe.
if (!existsSync("node_modules/server-only")) {
  mkdirSync("node_modules/server-only", { recursive: true });
  writeFileSync("node_modules/server-only/package.json", '{"name":"server-only","version":"0.0.0-stub","main":"index.js"}');
  writeFileSync("node_modules/server-only/index.js", "");
}

let ko = 0;
const prova = (atteso: unknown, avuto: unknown, cosa: string) => {
  const ok = JSON.stringify(atteso) === JSON.stringify(avuto);
  if (!ok) ko++;
  console.log(`${ok ? "✓" : "✗"} ${cosa}${ok ? "" : ` — atteso ${JSON.stringify(atteso)}, avuto ${JSON.stringify(avuto)}`}`);
};

// La porta attesa si LEGGE dal sorgente invece di scriverla qui: così questo
// file resta identico nei due repo dei siti, ed è il gemello di `porta.ts` a
// dire se si chiama `pc-tsv` o `pc-tsi`. Se un giorno i due file divergessero,
// diverge anche il collaudo, che è esattamente quello che si vuole.
const SORGENTE_PORTA = readFileSync("src/lib/private/porta.ts", "utf8");
const NOME_PORTA = SORGENTE_PORTA.match(/const PORTA = "([a-z0-9-]+)"/)?.[1] ?? "";

// Il cartello che porta.ts deve portare SE E SOLO SE questo sito non ha la
// rotta della chat (misurato il 23/09/2026: TriesteImmobiliare non ce l'ha).
// Una sola stringa per le due prove speculari più in basso, così non si può
// aggiustarne una e lasciare l'altra a cercare un testo che non esiste più.
const CARTELLO_SENZA_CHIAMANTE = "SENZA CHIAMANTE SU QUESTO SITO";

type Chiamata = { url: string; porta: string; firma: string; corpo: string; cache: string; metodo: string };

/** `fetch` finto: registra quello che vede e risponde quello che gli si dice. */
function fingiFetch(risposta: () => Promise<Response>): Chiamata[] {
  const viste: Chiamata[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    viste.push({
      url: String(typeof u === "object" && "url" in u ? u.url : u),
      porta: h.get("x-porta") ?? "",
      firma: h.get("x-firma") ?? "",
      corpo: typeof init?.body === "string" ? init.body : "",
      cache: String(init?.cache ?? ""),
      metodo: String(init?.method ?? ""),
    });
    return risposta();
  }) as typeof fetch;
  return viste;
}

const rispondi = (stato: number, corpo: unknown) => async () =>
  new Response(JSON.stringify(corpo), { status: stato, headers: { "content-type": "application/json" } });

const MESSAGGI = [
  { role: "user" as const, content: "Avete qualcosa con vista sul golfo?" },
  { role: "assistant" as const, content: "Certo." },
  { role: "user" as const, content: "Quanto costa?" },
];

// ═══════════════════════════════════════════════════════════════════════════
// I FIGLI — la costante si legge all'import, quindi ogni posizione
// dell'interruttore vuole un processo suo.
// ═══════════════════════════════════════════════════════════════════════════
const FASE = process.env.COLLAUDO_FASE ?? "";

if (FASE === "spento") {
  const { PC_CHAT_DA_POSTGRES, PC_CHAT_MANCA_SEGRETO } = await import("../src/lib/private/porta");
  prova(false, PC_CHAT_DA_POSTGRES, "senza PC_CHAT_SORGENTE la guardia è spenta: la rotta non entra mai nel ramo del v4");
  prova(false, PC_CHAT_MANCA_SEGRETO, "e non c'è niente da segnalare nei log: nessuno ha acceso niente");
  process.exit(ko === 0 ? 0 : 1);
}

if (FASE === "mezzo") {
  const { PC_CHAT_DA_POSTGRES, PC_CHAT_MANCA_SEGRETO } = await import("../src/lib/private/porta");
  prova(false, PC_CHAT_DA_POSTGRES, "interruttore acceso ma segreto assente: la strada del v4 resta SPENTA (firmerebbe a vuoto e la porta risponderebbe 401 a ogni turno)");
  prova(true, PC_CHAT_MANCA_SEGRETO, "e la rotta ha di che gridarlo nei log a ogni turno, invece di ripiegare in silenzio");
  process.exit(ko === 0 ? 0 : 1);
}

if (FASE === "acceso") {
  const { PC_CHAT_DA_POSTGRES, chatDallaPorta } = await import("../src/lib/private/porta");
  prova(true, PC_CHAT_DA_POSTGRES, "con PC_CHAT_SORGENTE=pg e il segreto, la strada del v4 è accesa");

  // ── ② la richiesta va alla porta firmata giusta ──────────────────────────
  const viste = fingiFetch(rispondi(200, { ok: true, testo: "Ecco.", sessione: "pc_x", turno: 3 }));
  let r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "de" });

  prova(1, viste.length, "un turno = una sola chiamata in rete");
  prova([URL_PORTA], viste.map((c) => c.url), "e l'unico indirizzo toccato è la porta: nessuna chiamata a un modello, a Airtable o al bridge del v1");
  prova("POST", viste[0]?.metodo, "in POST");
  prova(NOME_PORTA, viste[0]?.porta, `con x-porta: ${NOME_PORTA} — il marchio lo decide la porta, non il corpo`);
  prova("no-store", viste[0]?.cache, "e senza cache: una risposta del concierge servita due volte sarebbe il turno di un'altra persona");

  // La firma si ricalcola QUI, da zero, sul corpo esatto che è partito: se
  // `porta.ts` firmasse un'altra stringa (il corpo riserializzato, per dire)
  // la porta risponderebbe 401 e questo collaudo non se ne accorgerebbe.
  prova(createHmac("sha256", SEGRETO).update(viste[0]?.corpo ?? "", "utf8").digest("hex"), viste[0]?.firma,
    "la firma è l'HMAC del corpo ESATTO che è partito");

  const corpo = JSON.parse(viste[0]?.corpo ?? "{}") as Record<string, unknown>;
  prova(["azione", "codice", "messaggi", "lingua"], Object.keys(corpo),
    "nel corpo ci sono quattro cose e basta: NIENTE email (il v4 la ignora e l'identità la dà il grant), NIENTE ip (il v1 non l'ha mai ricevuto), NIENTE nome di sessione (lo deriva il v4, e imporne uno spezzerebbe il conteggio della recidiva)");
  prova("chat", corpo.azione, "l'azione è `chat`");
  prova("TSV-AAAA-1111", corpo.codice, "il codice è quello del grant riletto da chi chiama, non quello del browser");
  prova(MESSAGGI, corpo.messaggi, "i messaggi passano come sono: a ripulirli ha già pensato la rotta, e li ricontrolla il v4");
  prova("de", corpo.lingua, "la lingua è quella in cui l'ospite sta navigando adesso");

  prova({ esito: "ok", testo: "Ecco.", bloccato: false }, r, "200 con testo → il concierge ha parlato");

  // ── la lettura della risposta ────────────────────────────────────────────
  fingiFetch(rispondi(200, { ok: true, testo: "Basta così.", bloccato: true }));
  prova({ esito: "ok", testo: "Basta così.", bloccato: true },
    await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" }),
    "`bloccato` arriva fino al widget: è quello che riporta l'ospite al gate");

  fingiFetch(rispondi(200, { ok: true, testo: "" }));
  r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" });
  prova("guasto", r.esito, "200 con testo vuoto è un guasto travestito, non una risposta: senza questo il widget mostrerebbe una bolla vuota");

  // ── ① il verdetto non è un guasto: 403 NON ripiega ───────────────────────
  fingiFetch(rispondi(403, { ok: false, errore: "accesso non valido" }));
  prova({ esito: "accesso-negato" },
    await chatDallaPorta({ codice: "TSV-ZZZZ-9999", messaggi: MESSAGGI, lingua: "it" }),
    "403 = la porta ha riletto il grant e dice che non apre. Niente ripiego sul v1: sarebbe rifare la domanda ad Airtable, la copia che restava d'accordo per ore dopo una sospensione");

  // ── il guasto rapido ripiega ─────────────────────────────────────────────
  fingiFetch(rispondi(500, { errore: "errore interno" }));
  r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" });
  prova(["guasto", true], [r.esito, r.esito === "guasto" && r.rapido], "500 subito = guasto rapido: c'è ancora tempo per il v1, si ripiega");

  fingiFetch(async () => { throw new TypeError("fetch failed"); });
  r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" });
  prova(["guasto", true], [r.esito, r.esito === "guasto" && r.rapido], "porta irraggiungibile = guasto rapido: si ripiega");

  fingiFetch(rispondi(401, { errore: "firma non valida" }));
  r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" });
  prova(["guasto", true], [r.esito, r.esito === "guasto" && r.rapido], "segreto sbagliato = guasto rapido: il cliente non resta muto mentre si ripara la configurazione");

  // ⚠️ Questo è lo stato VERO della produzione al 23/09/2026: misurato bussando
  // alla porta con la firma giusta, `chat` risponde «azione sconosciuta» perché
  // il v4 che serve oggi non ha ancora quell'azione. Cioè: accendere
  // l'interruttore prima che il v4 sia in linea non fa ammutolire nessuno — fa
  // ripiegare ogni turno sul v1, esattamente come oggi, lasciando una riga nei
  // log a ogni colpo. È la rete di sicurezza nel caso che conta di più.
  fingiFetch(rispondi(400, { errore: "azione sconosciuta" }));
  r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" });
  prova(["guasto", true], [r.esito, r.esito === "guasto" && r.rapido], "porta di una versione più vecchia, che `chat` non ce l'ha ancora = guasto rapido: si ripiega sul v1 e il cliente non se ne accorge");

  // ── il guasto LENTO non ripiega ──────────────────────────────────────────
  // L'orologio si sposta invece di aspettare davvero venti secondi: la soglia
  // che si vuole provare è quella vera, il tempo no.
  const oraVera = Date.now;
  fingiFetch(async () => {
    Date.now = () => oraVera() + 20_000;
    throw new Error("the operation was aborted");
  });
  r = await chatDallaPorta({ codice: "TSV-AAAA-1111", messaggi: MESSAGGI, lingua: "it" });
  Date.now = oraVera;
  prova(["guasto", false], [r.esito, r.esito === "guasto" && r.rapido],
    "guasto dopo venti secondi = NIENTE ripiego: nei 60″ della lambda non ci sta un secondo turno intero, e il v4 potrebbe star finendo di scrivere il suo (due turni nel registro, due chiamate al modello pagate per una domanda sola)");

  process.exit(ko === 0 ? 0 : 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// IL PADRE — prima legge il sorgente della rotta, poi manda i figli.
// ═══════════════════════════════════════════════════════════════════════════
console.log(`porta di questo sito: ${NOME_PORTA || "(non trovata in porta.ts!)"}\n`);
prova(true, NOME_PORTA.length > 0, "porta.ts dichiara una porta");

console.log("\n── ① a interruttore spento, la strada nuova non esiste ──");
if (existsSync(ROTTA)) {
  const rotta = readFileSync(ROTTA, "utf8");
  // Si ritaglia il blocco guardato dalla costante, contando le graffe: quello
  // che sta dentro gira SOLO a interruttore acceso.
  const apre = rotta.indexOf("if (PC_CHAT_DA_POSTGRES) {");
  let dentro = "";
  if (apre >= 0) {
    let liv = 0, i = rotta.indexOf("{", apre);
    const inizio = i;
    for (; i < rotta.length; i++) {
      if (rotta[i] === "{") liv++;
      else if (rotta[i] === "}" && --liv === 0) break;
    }
    dentro = rotta.slice(inizio, i + 1);
  }
  prova(true, apre >= 0, "la rotta guarda la strada nuova con `if (PC_CHAT_DA_POSTGRES)`");
  prova(1, rotta.split("chatDallaPorta(").length - 1, "e chiama `chatDallaPorta` una volta sola");
  prova(true, dentro.includes("chatDallaPorta("), "quella chiamata sta DENTRO il blocco guardato: a interruttore spento non gira");
  prova(false, dentro.includes("fetch(bridgeUrl"), "il bridge del v1 sta FUORI dal blocco: è la strada che si percorre quando l'interruttore è spento, e per ripiego quando è acceso");
  prova(true, rotta.includes("fetch(bridgeUrl"), "e la strada del v1 è ancora tutta lì");
  // Il ripiego esiste solo se dal blocco si può USCIRE: un `return` messo in
  // fondo «per chiarezza» lo spegnerebbe in silenzio, e nessuna prova
  // sull'esito della porta se ne accorgerebbe — il widget resterebbe muto
  // davanti a un cliente proprio nel caso per cui il ripiego è stato scritto.
  const nudo = dentro.split("\n").map((r) => r.replace(/\/\/.*$/, "").trim()).filter(Boolean).join(" ");
  const chiudeConReturn = /return[^;]*;\s*\}$/.test(nudo);
  // Un `return` CONDIZIONATO in fondo va benissimo: è proprio il «guasto lento
  // non ripiega». Quello che non deve esserci è un return che esce SEMPRE.
  const eCondizionato = /\bif\s*\([^)]*\)\s*return[^;]*;\s*\}$/.test(nudo);
  prova(false, chiudeConReturn && !eCondizionato, "e dal blocco si ESCE: in fondo non c'è un `return` incondizionato, quindi un guasto rapido prosegue davvero sul v1");
  // Tripwire sulla combinazione che mette le due strade in disaccordo: chat sul
  // v4 e ingresso ancora su Airtable. Chi la toglie deve prima rileggere il
  // perché, non scoprirlo da un cliente a cui il concierge dice di no.
  prova(true, rotta.includes("PC_CHAT_DA_POSTGRES && !PC_DA_POSTGRES"), "e la rotta avvisa se la chat legge il v4 mentre l'ingresso legge ancora Airtable");
  // Il cartello «senza chiamante» è il gemello speculare del ramo qui sotto:
  // dove la rotta ESISTE quel cartello direbbe il falso, e un cartello falso è
  // peggio di nessun cartello — chi legge porta.ts crederebbe che questo sito
  // non abbia un concierge proprio mentre ne ha uno in produzione.
  prova(false, SORGENTE_PORTA.includes(CARTELLO_SENZA_CHIAMANTE),
    "e porta.ts NON porta il cartello «senza chiamante»: qui la rotta c'è, quel cartello mentirebbe (toglilo da porta.ts)");
} else {
  // Misurato il 23/09/2026: il concierge della Private Collection esiste solo
  // su triestevillas.com. Su triesteimmobiliare.com non c'è la rotta, non c'è
  // il widget, e in `pc_log` non è mai stato scritto un evento `chat` per TSI.
  // Qui il gemello `porta.ts` porta comunque la strada, così il giorno in cui
  // la collezione TSI avrà un concierge non si riapre questo cantiere.
  console.log(`· ${ROTTA} non esiste in questo repo: questo sito non ha (ancora) il concierge della collezione.`);
  console.log("  La strada in porta.ts c'è e si prova lo stesso, qui sotto.");
  // Il fatto va SCRITTO dove lo legge chi apre il file, non solo qui dove lo
  // legge chi lancia il collaudo: senza cartello, `chatDallaPorta` è codice che
  // nessuno chiama e nessuno sa perché c'è — e la prima manutenzione o lo toglie
  // (facendo divergere i gemelli) o lo crede vivo. Il giorno in cui questo sito
  // avrà la rotta, il ramo di sopra pretende che il cartello sparisca.
  prova(true, SORGENTE_PORTA.includes(CARTELLO_SENZA_CHIAMANTE),
    `porta.ts dice a chi lo apre che qui la strada nuova non ha chiamanti (cerca «${CARTELLO_SENZA_CHIAMANTE}»)`);
}

console.log("\n── l'interruttore, nelle sue tre posizioni ──");
for (const [fase, env, titolo] of [
  ["spento", {}, "SPENTO (il default)"],
  ["mezzo", { PC_CHAT_SORGENTE: "pg" }, "ACCESO ma senza segreto"],
  ["acceso", { PC_CHAT_SORGENTE: "pg", PC_PORTA_SEGRETO: SEGRETO, PC_PORTA_URL: URL_PORTA }, "ACCESO"],
] as [string, Record<string, string>, string][]) {
  console.log(`\n· ${titolo}`);
  const r = spawnSync("npx", ["tsx", QUESTO], {
    stdio: "inherit",
    env: { ...process.env, COLLAUDO_FASE: fase, PC_CHAT_SORGENTE: "", PC_PORTA_SEGRETO: "", ...env },
  });
  if (r.status !== 0) ko++;
}

console.log(`\n${ko === 0 ? "PROVE PASSATE" : `${ko} PROVE FALLITE`}`);
process.exit(ko === 0 ? 0 : 1);
