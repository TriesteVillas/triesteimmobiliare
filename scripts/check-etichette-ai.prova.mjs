// La prova che il cancello check-etichette-ai.mjs sa dire di NO.
//
// Un cancello che non morde è peggio di nessuno: dà verde e fa credere che le
// regole tengano. Qui lo si AGGIRA apposta, su una copia dei tre sorgenti che
// guarda (la regola, la home, la scheda, la card, il video), una manomissione
// alla volta: ogni
// manomissione è un modo realistico di rompere la SPEC v1.3 §11 — rimettere
// la pillola in home, etichettare di nuovo la sola luce, snellire TROPPO
// togliendo l'etichetta alla sostanza, riaprire il dettaglio, rimettere le
// tessere coi numeri grandi, sbagliare un plurale sloveno… — e il cancello
// deve fermarla. La copia intatta deve passare.
//
// Uso: node scripts/check-etichette-ai.prova.mjs   (exit 0 = il cancello morde)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const FILE = {
  regola: "src/lib/trasparenza.ts",
  home: "src/app/[locale]/page.tsx",
  scheda: "src/app/[locale]/annuncio/[slug]/page.tsx",
  vista: "src/lib/propertyView.ts",
  galleria: "src/components/CardGallery.tsx",
  video: "src/components/VideoSito.tsx",
};
const originali = Object.fromEntries(Object.entries(FILE).map(([k, f]) => [k, readFileSync(f, "utf8")]));

/** [nome, file, da, a] — `da` deve esserci nel sorgente, o la prova è vecchia. */
const MANOMISSIONI = [
  ["la pillola del video torna in home", "home", "        {staging?.segno && (", "        <EtichettaVideo ai={staging} />\n        {staging?.segno && ("],
  ["le card della home senza `home: true`", "home", ", { home: true })", ")"],
  ["il video dell'hero senza `discreto`", "home", "<VideoSito\n            discreto", "<VideoSito"],
  ["il video di staging senza il suo segno", "home", "            <SegnoAi\n              testo={staging.segno}", "            <span\n              data-testo={staging.segno}"],
  ["la sola luce torna etichettata", "regola", 'return t === "ai_luce" || t === "tecnico";', 'return t === "tecnico";'],
  ["snellito troppo: la pulizia perde l'etichetta", "regola", 'return t === "ai_luce" || t === "tecnico";', 'return t === "ai_luce" || t === "tecnico" || t === "ai_pulizia";'],
  ["la marcatura IPTC tolta alla sola luce", "regola", 'if (t === "ai" || t === "ai_luce" || t === "ai_pulizia"', 'if (t === "ai" || t === "ai_pulizia"'],
  ["la simulazione perde il segno in home", "regola", 'if (t === "ai_aggiunte" || t === "ai_rendering") return "simulazione";', 'if (t === "ai_rendering") return "simulazione";'],
  ["l'og:image torna a scartare la sola luce", "regola", "const etichettata = (ph: Photo) => !!ph.trasparenza && !eStile(ph.trasparenza.trattamento);", "const etichettata = (ph: Photo) => !!ph.trasparenza;"],
  ["un plurale sloveno sbagliato", "regola", "two: `Med njimi sta ${k} simulaciji.`,", "two: `Med njimi so ${k} simulacije.`,"],
  ["un segnaposto rimasto nella riga", "regola", "`${k} sono simulazioni.`", "`{K} sono simulazioni.`"],
  ["il dettaglio aperto di default", "scheda", '<details className="mt-3 max-w-prose">', '<details open className="mt-3 max-w-prose">'],
  [
    "le tessere coi numeri grandi tornano",
    "scheda",
    "                {chiusuraAi}\n              </p>",
    '                {chiusuraAi}\n              </p>\n              <p className="text-2xl font-semibold">{trasp.conteggi.ai} / {trasp.conteggi.pubblicate}</p>',
  ],
  [
    "la nota del CRM di nuovo in vista",
    "scheda",
    "                {chiusuraAi}\n              </p>",
    "                {chiusuraAi}\n              </p>\n              {notaDettaglio && <p>{notaDettaglio}</p>}",
  ],
  ["il link a /ai fuori dal dettaglio", "scheda", '              <details className="mt-3 max-w-prose">', '              {linkAi && <a href={linkAi}>ai</a>}\n              <details className="mt-3 max-w-prose">'],
  ["la chiusura tolta dalla parte visibile", "scheda", "                {chiusuraAi}\n              </p>", "              </p>"],
  // la riga deve dire il VERO di ogni gruppo (review del 02/10)
  ["una generica torna «con le modifiche indicate»", "regola", "const s = c.pulizia + c.aggiunte;", "const s = c.pulizia + c.aggiunte + c.generiche;"],
  ["i render contati fra le foto «su M»", "regola", "const m = Math.max(c.pubblicate - immagini, tutteLeFoto);", "const m = Math.max(c.pubblicate, tutteLeFoto);"],
  ["la chiusura sparisce anche dove ci sono foto", "regola", "return soloImmagini(c) ? null : testiTrasparenza(locale).chiusura;", "return null;"],
  ["il comando promette una nota che non c'è", "regola", "return conNota ? tx.dettaglioNota : tx.dettaglioBreve;", "return tx.dettaglioNota;"],
  ["il video di staging torna «simulazione»", "regola", 'if (t === "ai_generato" || t === "ai_animato" || t === null) return "video";', 'if (t === "ai_generato") return "simulazione" as never;\n  if (t === "ai_animato" || t === null) return "video";'],
  // la card della home: la regola e chi la chiama
  ["il glifo torna nelle card della home", "regola", "  if (home) {\n    const s = segnoHome(d?.trattamento);", "  if (home && d?.trattamento === \"rendering\") {\n    const s = segnoHome(d?.trattamento);"],
  ["propertyView salta etichettaCard", "vista", "return etichettaCard(ph.trasparenza, locale, home);", "void home;\n  const ai = fotoAi(ph.trasparenza, locale);\n  return ai?.glifo ? { ai: { glifo: ai.glifo, aria: ai.aria } } : {};"],
  ["propertyView perde il `home` della card", "vista", "return etichettaCard(ph.trasparenza, locale, home);", "return etichettaCard(ph.trasparenza, locale, false);"],
  ["CardGallery mostra il glifo dal segno", "galleria", "<EtichettaAi testo={photos[i].ai!.glifo}", "<EtichettaAi testo={photos[i].segno?.testo ?? photos[i].ai!.glifo}"],
  ["la pillola nel video discreto della home", "video", "          {ai?.segno && (", "          <EtichettaVideo ai={ai} />\n          {ai?.segno && ("],
];

const base = mkdtempSync(join(tmpdir(), "prova-etichette-ai-"));
function copia(dir, sostituzioni = {}) {
  for (const [k, f] of Object.entries(FILE)) {
    const dest = join(dir, f);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, sostituzioni[k] ?? originali[k]);
  }
}
function gira(dir) {
  try {
    execFileSync(process.execPath, ["scripts/check-etichette-ai.mjs", dir], { stdio: "pipe" });
    return { ok: true, out: "" };
  } catch (e) {
    return { ok: false, out: String(e.stderr ?? "") };
  }
}

const fallite = [];
try {
  const intatta = join(base, "intatta");
  copia(intatta);
  const r0 = gira(intatta);
  console.log(`${r0.ok ? "✓" : "✗"} copia intatta: ${r0.ok ? "passa" : "NON passa\n" + r0.out}`);
  if (!r0.ok) fallite.push("copia intatta");

  MANOMISSIONI.forEach(([nome, file, da, a], i) => {
    if (!originali[file].includes(da)) {
      console.log(`✗ ${nome}: il pezzo da manomettere non c'è più in ${FILE[file]} — aggiornare la prova`);
      fallite.push(nome);
      return;
    }
    const dir = join(base, `m${i}`);
    copia(dir, { [file]: originali[file].replace(da, a) });
    const r = gira(dir);
    const motivo = r.out.split("\n").find((l) => l.trim().startsWith("·"))?.trim() ?? "";
    console.log(`${r.ok ? "✗" : "✓"} ${nome}: ${r.ok ? "PASSA — il cancello non morde" : `fermata ${motivo.slice(0, 140)}`}`);
    if (r.ok) fallite.push(nome);
  });
} finally {
  rmSync(base, { recursive: true, force: true });
}

if (fallite.length) {
  console.error(`\nprova: ✗ ${fallite.length} esiti sbagliati: ${fallite.join(" · ")}`);
  process.exit(1);
}
console.log(`\nprova: ✓ il cancello ferma tutte le ${MANOMISSIONI.length} manomissioni e lascia passare la copia intatta`);
