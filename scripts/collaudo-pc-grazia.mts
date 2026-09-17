// Collaudo della FINESTRA DI GRAZIA del giro Private Collection, con Airtable
// in finta: nessuna chiamata vera, nessun invio, nessuna scrittura.
//
//   npx tsx scripts/collaudo-pc-grazia.mts          # finestra di default (120′)
//   PC_GRAZIA_MIN=0 npx tsx scripts/collaudo-pc-grazia.mts   # finestra spenta
//
// ⚠️ `tsx` non è una dipendenza del repo: `npx` se lo scarica. Serve anche lo
// stub locale di `server-only`, che Next fornisce solo in build:
//   mkdir -p node_modules/server-only
//   printf '{"name":"server-only","version":"0.0.0-stub","main":"index.js"}' > node_modules/server-only/package.json
//   printf '' > node_modules/server-only/index.js
process.env.AIRTABLE_TOKEN ||= "finto-per-il-collaudo";
process.env.AIRTABLE_BASE_ID ||= "app1ZDay9vQNU5V2u";

const GRAZIA = Number(process.env.PC_GRAZIA_MIN ?? 120);
const min = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const FRA_UN_ANNO = new Date(Date.now() + 365 * 86_400_000).toISOString();

// Quattro righe, scelte per i quattro casi che contano.
const RECORDS = [
  { id: "recFRESCA",  fields: { stato: "Approved", brand: "TSV", codice: "TSV-AAAA-1111", email: "fresca@x.de",  lingua: "de", issued_at: min(4),   expires_at: FRA_UN_ANNO } },
  { id: "recVECCHIA", fields: { stato: "Approved", brand: "TSV", codice: "TSV-BBBB-2222", email: "vecchia@x.it", lingua: "it", issued_at: min(180), expires_at: FRA_UN_ANNO } },
  { id: "recAMANO",   fields: { stato: "Approved", brand: "TSV", email: "amano@x.com", lingua: "en",             expires_at: FRA_UN_ANNO } },
  { id: "recBORDO",   fields: { stato: "Approved", brand: "TSV", codice: "TSV-CCCC-3333", email: "bordo@x.it",  lingua: "it", issued_at: min(GRAZIA), expires_at: FRA_UN_ANNO } },
];

const vero = globalThis.fetch;
globalThis.fetch = (async (u: string | URL | Request, init?: RequestInit) => {
  const url = String(typeof u === "object" && "url" in u ? u.url : u);
  if (url.includes("api.airtable.com"))
    return new Response(JSON.stringify({ records: RECORDS }), { status: 200, headers: { "content-type": "application/json" } });
  return vero(u as never, init);
}) as typeof fetch;

const { listApprovedNeedingCredential } = await import("../src/lib/private/store.ts");

let ko = 0;
const prova = (atteso: unknown, avuto: unknown, cosa: string) => {
  const ok = JSON.stringify(atteso) === JSON.stringify(avuto);
  if (!ok) ko++;
  console.log(`${ok ? "✓" : "✗"} ${cosa}${ok ? "" : ` — atteso ${JSON.stringify(atteso)}, avuto ${JSON.stringify(avuto)}`}`);
};

const r = await listApprovedNeedingCredential();
console.log(`finestra: ${GRAZIA}′`);
console.log(`serve:   ${r.daServire.map((g) => g.id).join(", ") || "(nessuna)"}`);
console.log(`aspetta: ${r.inAttesa.map((a) => `${a.id} fra ${a.fraMinuti}′`).join(", ") || "(nessuna)"}\n`);

if (GRAZIA > 0) {
  prova(["recVECCHIA", "recAMANO", "recBORDO"], r.daServire.map((g) => g.id),
    "serve la riga vecchia, quella senza issued_at (approvata a mano su Airtable) e quella esattamente sul bordo");
  prova(["recFRESCA"], r.inAttesa.map((a) => a.id),
    "trattiene SOLO la riga appena emessa dal CRM");
  prova(GRAZIA - 4, r.inAttesa[0]?.fraMinuti, "e dichiara fra quanti minuti la servirà");
} else {
  // Con la finestra a 0 il giro torna a essere quello di prima: è la via
  // d'uscita se un giorno la grazia dovesse dare fastidio, senza rimettere mano
  // al codice — si cambia `PC_GRAZIA_MIN` su Vercel.
  prova(4, r.daServire.length, "con PC_GRAZIA_MIN=0 le serve tutte, come prima del 16/09");
  prova(0, r.inAttesa.length, "e non ne trattiene nessuna");
}

console.log(`\n${ko === 0 ? "PROVE PASSATE" : `${ko} PROVE FALLITE`}`);
process.exit(ko === 0 ? 0 : 1);
