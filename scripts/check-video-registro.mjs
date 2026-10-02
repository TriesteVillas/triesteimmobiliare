// Avviso del prebuild (01/10/2026, SPEC v1.2 §10.1): i video che il sito
// mostra e che il registro dei video del CRM (`video_trasparenza`) non
// conosce. Un video senza riga esce SENZA etichetta: se è AI, è proprio il
// buco che la trasparenza deve chiudere — ma non si sa da qui, quindi è un
// AVVISO e la build non si ferma mai (exit 0 sempre, anche col CRM giù).
//
// Cosa conta come «video del sito»:
//   · i file del sito: ogni percorso `/video/<nome>.<mp4|webm|mov|m4v>`
//     scritto in src/ (VideoSito, AutoVideo) → chiave `tsi:<percorso>`;
//   · i video di testata delle schede (02/10/2026): le voci del registro del
//     sito src/content/annunciVideo.ts → chiave `tsi:<percorso del 1080>`
//     (il 720 è lo stesso filmato e nel CRM non ha una riga sua);
//   · i YouTube delle schede: `youtube_urls` del catalogo pubblico della
//     vetrina (la stessa regola di pubblicazione del sito) → `youtube:<id>`.
// Il registro si legge dalla vista `vista=trasparenza` (chiave `video`).
//
// Sui video di testata, in più, senza bisogno della rete (02/10/2026):
//   · un file citato dal registro del sito che in public/ non c'è (la scheda
//     resta sulla copertina: SfondoVideo è fail-safe, ma il video non si vede);
//   · un file sotto public/media/annunci/ che nessuna voce cita (caricato e
//     mai registrato: non si vede da nessuna parte);
// e, con la rete: una voce per un codice che il catalogo pubblico non ha (non
// si vede), una riga `tsi:/media/annunci/…` del CRM il cui file non c'è, e una
// voce `ai: true` la cui riga del CRM non dà etichetta (sul video resta la
// frase del sito, ma la pillola del registro no).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const VETRINA_URL = process.env.VETRINA_URL ?? "https://tsv-pg.vercel.app/api/vetrina";
const SITO = "triesteimmobiliare.com";
const PREFISSO = "tsi";
const TIMEOUT_MS = 8000;
const PUBLIC = "public";
const CARTELLA_ANNUNCI = "/media/annunci/";
const REGISTRO_ANNUNCI = "src/content/annunciVideo.ts";

const avvisi = [];
const avvisiAnnunci = [];
const note = [];

function fileSorgente(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) fileSorgente(p, out);
    else if (/\.(tsx?|mjs|js)$/.test(n)) out.push(p);
  }
  return out;
}

// I file del sito, con dove compaiono.
const fileVideo = new Map();
try {
  for (const f of fileSorgente("src")) {
    const testo = readFileSync(f, "utf8");
    for (const m of testo.matchAll(/["'`](\/video\/[\w.-]+\.(?:mp4|webm|mov|m4v))["'`]/g)) {
      const chiave = `${PREFISSO}:${m[1]}`;
      if (!fileVideo.has(chiave)) fileVideo.set(chiave, new Set());
      fileVideo.get(chiave).add(f);
    }
  }
} catch (e) {
  note.push(`sorgenti non lette (${e instanceof Error ? e.message : String(e)}): i file del sito non sono controllati`);
}

// ── I video di testata delle schede ────────────────────────────────────────
// Il registro del sito, eseguito davvero (transpilato: non importa niente).
/** codice → voce del registro del sito */
let annunci = new Map();
try {
  const js = ts.transpileModule(readFileSync(REGISTRO_ANNUNCI, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const { ANNUNCI_VIDEO } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  annunci = new Map(Object.entries(ANNUNCI_VIDEO ?? {}));
} catch (e) {
  note.push(`registro dei video di testata non letto (${e instanceof Error ? e.message : String(e)}): i video delle schede non sono controllati`);
}

/** I file serviti da public/media/annunci/, come percorsi del sito. */
function fileAnnunci(dir = path.join(PUBLIC, CARTELLA_ANNUNCI), out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) fileAnnunci(p, out);
    else if (!n.startsWith(".")) out.push(`/${path.relative(PUBLIC, p).split(path.sep).join("/")}`);
  }
  return out;
}

const suDisco = new Set(fileAnnunci());
const citati = new Set();
for (const [codice, v] of annunci) {
  for (const campo of ["mp4", "mp4Sm", "poster", "posterSm"]) {
    const f = v?.[campo];
    if (typeof f !== "string") continue;
    citati.add(f);
    if (!f.startsWith(CARTELLA_ANNUNCI)) {
      avvisiAnnunci.push(`${codice}.${campo} = ${f} — fuori da ${CARTELLA_ANNUNCI}: la voce si scarta, la scheda resta sulla copertina`);
    } else if (!suDisco.has(f)) {
      avvisiAnnunci.push(`${codice}.${campo} = ${f} — il file non è in ${PUBLIC}/: la scheda resta sulla copertina`);
    }
  }
  if (typeof v?.mp4 === "string") {
    const chiave = `${PREFISSO}:${v.mp4}`;
    if (!fileVideo.has(chiave)) fileVideo.set(chiave, new Set());
    fileVideo.get(chiave).add(`${REGISTRO_ANNUNCI} (${codice}, video di testata)`);
  }
}
for (const f of suDisco) {
  if (!citati.has(f)) avvisiAnnunci.push(`${PUBLIC}${f} — nessuna voce di ${REGISTRO_ANNUNCI} lo cita: non si vede da nessuna parte`);
}
note.push(`${annunci.size} video di testata nel registro del sito, ${suDisco.size} file in ${PUBLIC}${CARTELLA_ANNUNCI}`);

const idYoutube = (u) =>
  u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/)?.[1] ?? null;

async function json(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

try {
  const [vista, catalogo] = await Promise.allSettled([
    json(`${VETRINA_URL}?sito=${SITO}&vista=trasparenza`),
    json(`${VETRINA_URL}?sito=${SITO}`),
  ]);

  // I YouTube delle schede pubblicate.
  const youtube = new Map();
  if (catalogo.status === "fulfilled" && Array.isArray(catalogo.value?.immobili)) {
    const codici = new Set();
    for (const r of catalogo.value.immobili) {
      if (typeof r?.tsv_prop_id === "string") codici.add(r.tsv_prop_id.trim().toUpperCase());
      for (const u of String(r?.youtube_urls ?? "").split(/\s+/)) {
        const id = idYoutube(u);
        if (!id) continue;
        const chiave = `youtube:${id}`;
        if (!youtube.has(chiave)) youtube.set(chiave, new Set());
        youtube.get(chiave).add(r.tsv_prop_id ?? r.airtable_id ?? "?");
      }
    }
    // Una voce del registro del sito per un codice che il catalogo pubblico
    // non ha: innocua, ma il video non si vede (scheda offline, codice
    // scritto male).
    for (const codice of annunci.keys()) {
      if (!codici.has(codice.trim().toUpperCase()))
        avvisiAnnunci.push(`${codice} — non è nel catalogo pubblico di ${SITO}: il suo video di testata non si vede`);
    }
  } else {
    note.push(
      `catalogo della vetrina non letto (${catalogo.status === "rejected" ? catalogo.reason?.message : "forma inattesa"}): i YouTube delle schede non sono controllati`,
    );
  }

  const registro = vista.status === "fulfilled" ? vista.value?.video : undefined;
  if (vista.status === "rejected" || !Array.isArray(registro)) {
    note.push(
      `registro dei video non letto (${
        vista.status === "rejected"
          ? vista.reason?.message
          : registro === null
            ? "`video: null`"
            : `stato: ${vista.value?.stato ?? "?"}`
      }): nessun confronto possibile`,
    );
  } else {
    const righe = new Map(registro.filter((v) => typeof v?.chiave === "string").map((v) => [v.chiave, v]));
    for (const [chiave, dove] of fileVideo) {
      if (!righe.has(chiave)) avvisi.push(`${chiave} — in ${[...dove].join(", ")}`);
    }
    for (const [chiave, schede] of youtube) {
      if (!righe.has(chiave)) avvisi.push(`${chiave} — nella scheda ${[...schede].join(", ")}`);
    }
    // Video di testata: il sito dice AI, la riga del CRM nessuna etichetta.
    for (const [codice, v] of annunci) {
      const riga = typeof v?.mp4 === "string" ? righe.get(`${PREFISSO}:${v.mp4}`) : undefined;
      if (v?.ai === true && riga && !riga.etichetta)
        avvisiAnnunci.push(
          `${codice}: il registro del sito dice \`ai: true\`, la riga del CRM («${riga.trattamento}») nessuna etichetta — sul video resta la sola frase del sito`,
        );
    }
    // Righe del CRM per file di testata di questo sito che in public/ non ci sono.
    for (const chiave of righe.keys()) {
      const f = chiave.startsWith(`${PREFISSO}:${CARTELLA_ANNUNCI}`) ? chiave.slice(PREFISSO.length + 1) : null;
      if (f && !suDisco.has(f)) avvisiAnnunci.push(`${chiave} — riga del CRM per un file che in ${PUBLIC}/ non c'è`);
    }
    note.push(
      `${fileVideo.size} file del sito e ${youtube.size} YouTube delle schede confrontati con ${righe.size} righe del registro`,
    );
  }
} catch (e) {
  note.push(`controllo saltato: ${e instanceof Error ? e.message : String(e)}`);
}

for (const n of note) console.log(`check-video-registro: ${n}`);
if (avvisiAnnunci.length) {
  console.warn(`check-video-registro: ⚠️ ${avvisiAnnunci.length} avvisi sui video di testata delle schede:`);
  for (const a of avvisiAnnunci) console.warn(`  · ${a}`);
}
if (avvisi.length) {
  console.warn(
    `check-video-registro: ⚠️ ${avvisi.length} video senza riga nel registro del CRM (escono SENZA etichetta AI):`,
  );
  for (const a of avvisi) console.warn(`  · ${a}`);
  console.warn("  → censirli nel CRM (tsv-pg: node scripts/trasparenza-video-carica.mjs, sito triesteimmobiliare.com)");
} else if (!note.some((n) => n.includes("non letto") || n.includes("saltato"))) {
  console.log("check-video-registro: ogni video del sito ha la sua riga nel registro");
}
process.exit(0);
