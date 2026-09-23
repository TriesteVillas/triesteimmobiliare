// Collaudo — IL GIRO SMETTE DI SPEDIRE DI NASCOSTO (23/09/2026).
// Airtable in finta, Resend in finta, porta del CRM in finta: NESSUNA chiamata
// vera, NESSUN invio, NESSUNA scrittura da nessuna parte.
//
//   npx tsx scripts/collaudo-pc-traccia-cron.mts
//
// ⚠️ `tsx` non è una dipendenza del repo: `npx` se lo scarica. Serve anche lo
// stub locale di `server-only`, che Next fornisce solo in build:
//   mkdir -p node_modules/server-only
//   printf '{"name":"server-only","version":"0.0.0-stub","main":"index.js"}' > node_modules/server-only/package.json
//   printf '' > node_modules/server-only/index.js
//
// Le domande:
//   ① A interruttore SPENTO il giro chiama qualcuno? (deve essere: nessuno)
//   ② Acceso, quello che manda è firmato e ha dentro le cose giuste?
//   ③ Se la porta del CRM è rotta, lenta o dice di no: il giro sopravvive?
//   ④ `inviaMail` dice PERCHÉ ha fallito, o torna il `false` muto di prima?
//   ⑤ Il giro intero DICHIARA i fallimenti invece di contare solo i successi?
//      (è il caso `diego@…`: 22 giorni nella coda, ~2.100 passaggi, zero log)
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";

const SEGRETO = "segreto-finto-del-collaudo";
const FIGLIO = process.env.COLLAUDO_RAMO === "spento";

process.env.AIRTABLE_TOKEN ||= "finto-per-il-collaudo";
process.env.AIRTABLE_BASE_ID ||= "app1ZDay9vQNU5V2u";
process.env.CRON_SECRET ||= "cron-finto-del-collaudo";
// ⛔ ASSEGNAZIONE SECCA, non `||=`: se questa macchina avesse in ambiente la
// chiave VERA di Resend, un `||=` la lascerebbe in piedi — e basterebbe un buco
// nel finto `fetch` qui sotto perché il collaudo spedisse posta a clienti veri.
// La chiave finta è anche l'ultima rete: con questa, una chiamata sfuggita al
// finto verrebbe comunque rifiutata da Resend.
process.env.RESEND_API_KEY = "re_finta_del_collaudo_non_valida";
process.env.PC_PORTA_URL = "https://crm.finto.invalid/api/pc-sito";
if (!FIGLIO) {
  process.env.PC_PORTA_SEGRETO = SEGRETO;
  process.env.PC_TRACCIA_CRON = "pg";
} else {
  delete process.env.PC_TRACCIA_CRON;
  process.env.PC_PORTA_SEGRETO = SEGRETO;
}

let ko = 0;
const prova = (c: boolean, cosa: string) => { if (!c) ko++; console.log(`${c ? "✓" : "✗"} ${cosa}`); };

// ── Il mondo finto. Ogni chiamata in uscita finisce qui e viene REGISTRATA:
//    «nessuno ha chiamato» è una prova, non un'assenza di prove.
type Chiamata = { url: string; headers: Record<string, string>; corpo: string };
const chiamate: Chiamata[] = [];
let rispostaPorta: () => Response = () =>
  new Response(JSON.stringify({ ok: true, scritto: "invio", nota: "finto" }),
               { status: 200, headers: { "content-type": "application/json" } });
let rispostaResend: () => Response = () =>
  new Response(JSON.stringify({ id: "finto" }), { status: 200, headers: { "content-type": "application/json" } });

const FRA_UN_ANNO = new Date(Date.now() + 365 * 86_400_000).toISOString();
const min = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
// Una riga sola, vecchia abbastanza da essere servita subito: è la forma della
// riga `recKPr7u9PQ2GD8He` che il giro non riesce a consegnare dal 01/09.
const RECORDS = [
  { id: "recFERMA", fields: {
      stato: "Approved", brand: "TSI", codice: "TSI-FVKN-582M", email: "ferma@collaudo.invalid",
      lingua: "it", issued_at: min(60 * 24 * 22), expires_at: FRA_UN_ANNO } },
];

const vero = globalThis.fetch;
globalThis.fetch = (async (u: string | URL | Request, init?: RequestInit) => {
  const url = String(typeof u === "object" && "url" in u ? u.url : u);
  const headers = Object.fromEntries(new Headers(init?.headers ?? {}).entries());
  chiamate.push({ url, headers, corpo: String(init?.body ?? "") });
  if (url.includes("api.airtable.com")) {
    // Le liste tornano i record; i PATCH tornano ok e non scrivono niente.
    return new Response(JSON.stringify({ records: RECORDS }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (url.includes("api.resend.com")) return rispostaResend();
  if (url.includes("crm.finto.invalid")) return rispostaPorta();
  throw new Error(`il collaudo ha provato a uscire davvero verso ${url}`);
}) as typeof fetch;

const { segnalaConsegnaCredenziali, PC_TRACCIA_CRON } = await import("../src/lib/private/porta");
const { inviaMail } = await import("../src/lib/private/mail");

// ═══ ① A INTERRUTTORE SPENTO NON SI MUOVE NIENTE ════════════════════════════
if (FIGLIO) {
  prova(PC_TRACCIA_CRON === false, "senza PC_TRACCIA_CRON l'interruttore è spento");
  const r = await segnalaConsegnaCredenziali({
    richiesta: "recX", codice: "TSI-AAAA-1111", email: "x@y.invalid", inviata: true,
  });
  prova(r.esito === "spenta", "e la dichiarazione non parte");
  prova(chiamate.length === 0, "NESSUNA chiamata in uscita: il giro resta esattamente quello di ieri");
  console.log(`\n${ko === 0 ? "RAMO SPENTO: PROVE PASSATE" : `${ko} PROVE FALLITE`}`);
  process.exit(ko === 0 ? 0 : 1);
}

console.log("① il ramo a interruttore spento, in un processo suo");
try {
  const out = execFileSync("npx", ["tsx", "scripts/collaudo-pc-traccia-cron.mts"], {
    encoding: "utf8", env: { ...process.env, COLLAUDO_RAMO: "spento" },
  });
  prova(out.includes("RAMO SPENTO: PROVE PASSATE"), "a interruttore spento non parte niente");
  console.log(out.split("\n").filter((r) => r.startsWith("✓") || r.startsWith("✗")).map((r) => `  ${r}`).join("\n"));
} catch (e) {
  prova(false, `il ramo spento è fallito: ${String((e as { stdout?: string }).stdout ?? e).slice(0, 400)}`);
}

// ═══ ② QUELLO CHE MANDA È FIRMATO, E DICE LE COSE GIUSTE ════════════════════
console.log("\n② la dichiarazione al CRM");
prova(PC_TRACCIA_CRON === true, "con PC_TRACCIA_CRON=pg e il segreto, l'interruttore è acceso");
chiamate.length = 0;
const r2 = await segnalaConsegnaCredenziali({
  richiesta: "recFERMA", codice: "TSI-FVKN-582M", email: "ferma@collaudo.invalid",
  inviata: false, errore: "Resend ha risposto 422: invalid recipient",
  lingua: "it", oggetto: "Il suo accesso", mittente: "luxury@triesteimmobiliare.com",
});
prova(r2.esito === "scritta", "il CRM l'ha presa");
const c = chiamate[0];
prova(!!c && c.headers["x-porta"] === "pc-tsi", "bussa alla porta del proprio marchio (pc-tsi)");
prova(!!c && c.headers["x-firma"] === createHmac("sha256", SEGRETO).update(c.corpo, "utf8").digest("hex"),
      "la firma è l'HMAC del corpo ESATTO che parte");
const b = JSON.parse(c?.corpo ?? "{}") as Record<string, unknown>;
prova(b.azione === "credenziali-spedite" && b.inviata === false, "dichiara l'azione e che NON è partita");
prova(typeof b.errore === "string" && (b.errore as string).includes("422"),
      "e porta il motivo vero, quello che oggi si legge solo sul cruscotto Resend");
prova(!("html" in b) && !("corpo" in b), "non porta il corpo della mail: lì dentro c'è la password");

// ═══ ③ LA PORTA ROTTA NON FERMA LA CONSEGNA ═════════════════════════════════
console.log("\n③ se il CRM è rotto o dice di no");
rispostaPorta = () => new Response("boom", { status: 500 });
prova((await segnalaConsegnaCredenziali({ richiesta: "recFERMA", codice: "TSI-FVKN-582M", email: "ferma@collaudo.invalid", inviata: true })).esito === "guasto",
      "500: guasto dichiarato, nessuna eccezione");
rispostaPorta = () => new Response(JSON.stringify({ ok: false, perche: "il codice non combacia" }), { status: 200 });
const r3 = await segnalaConsegnaCredenziali({ richiesta: "recFERMA", codice: "TSI-ZZZZ-9999", email: "ferma@collaudo.invalid", inviata: true });
prova(r3.esito === "guasto" && r3.perche.includes("non combacia"), "un «no» ragionato del CRM si legge, non si ripete");
rispostaPorta = () => { throw new Error("rete giù"); };
prova((await segnalaConsegnaCredenziali({ richiesta: "recFERMA", codice: "TSI-FVKN-582M", email: "ferma@collaudo.invalid", inviata: true })).esito === "guasto",
      "rete giù: guasto dichiarato, nessuna eccezione");
rispostaPorta = () => new Response(JSON.stringify({ ok: true, scritto: "invio", nota: "finto" }), { status: 200 });

// ═══ ④ `inviaMail` DICE PERCHÉ ══════════════════════════════════════════════
console.log("\n④ il motivo del rifiuto smette di essere un segreto");
rispostaResend = () => new Response(JSON.stringify({ message: "Invalid `to` field" }), { status: 422 });
const m = await inviaMail("rotta@collaudo.invalid", "x", "<p>y</p>");
prova(m.inviata === false && m.perche.includes("422") && m.perche.includes("Invalid"),
      `il motivo arriva fino a chi chiama: «${m.inviata === false ? m.perche.slice(0, 90) : ""}»`);

// ═══ ⑤ IL GIRO INTERO DICHIARA I FALLIMENTI ═════════════════════════════════
console.log("\n⑤ il giro: prima contava solo i successi");
const { GET } = await import("../src/app/api/private/cron/route");
const risposta = await GET(new Request(`https://x.invalid/api/private/cron?key=${process.env.CRON_SECRET}`));
const corpo = await risposta.json() as {
  issued: number; falliti: { id: string; email: string; perche: string }[];
  traccia: { acceso: boolean; scritte: number; guasti: number };
};
prova(corpo.issued === 0, "Resend rifiuta: nessuna consegna contata");
prova(corpo.falliti.length === 1 && corpo.falliti[0].id === "recFERMA",
      "la riga non servita COMPARE nella risposta invece di sparire in silenzio");
prova(corpo.falliti[0]?.perche.includes("422"), `col motivo vero: «${corpo.falliti[0]?.perche.slice(0, 80)}»`);
prova(corpo.traccia.acceso === true && corpo.traccia.scritte === 1,
      "e il CRM ne ha ricevuto la dichiarazione");
prova(!chiamate.some((x) => x.url.includes("api.airtable.com") && x.corpo.includes("credenziali_inviate")),
      "⛔ il flag NON è stato acceso su una mail mai partita (regola del caso Weiss)");

// ═══ ⑥ IL CASO PEGGIORE: LA MAIL PARTE E IL FLAG NO ═════════════════════════
// Password in viaggio, flag spento: al giro dopo il cliente riceve la stessa
// lettera. Prima non restava traccia nemmeno di questo.
console.log("\n⑥ la mail parte e il PATCH del flag salta");
rispostaResend = () => new Response(JSON.stringify({ id: "finto" }), { status: 200 });
const fettaPrima = chiamate.length;
const veroFetch2 = globalThis.fetch;
globalThis.fetch = (async (u: string | URL | Request, init?: RequestInit) => {
  const url = String(typeof u === "object" && "url" in u ? u.url : u);
  if (url.includes("api.airtable.com") && init?.method === "PATCH") throw new Error("Airtable giù");
  return veroFetch2(u as never, init);
}) as typeof fetch;
const risposta2 = await GET(new Request(`https://x.invalid/api/private/cron?key=${process.env.CRON_SECRET}`));
globalThis.fetch = veroFetch2;
const corpo2 = await risposta2.json() as {
  issued: number; falliti: { perche: string }[]; traccia: { scritte: number };
};
prova(corpo2.issued === 0 && corpo2.falliti.length === 1 && corpo2.falliti[0].perche.startsWith("eccezione"),
      "il giro dichiara l'eccezione invece di contarla come successo");
prova(corpo2.traccia.scritte === 1,
      "e la consegna RIUSCITA arriva comunque al CRM: la traccia non muore col flag");
const dichiarata = chiamate.slice(fettaPrima).filter((x) => x.url.includes("crm.finto.invalid"));
prova(dichiarata.some((x) => JSON.parse(x.corpo).inviata === true),
      "e dice che la mail è PARTITA — è l'unico posto in cui resterà scritto");

console.log(`\n${ko === 0 ? "PROVE PASSATE" : `${ko} PROVE FALLITE`}`);
process.exit(ko === 0 ? 0 : 1);
