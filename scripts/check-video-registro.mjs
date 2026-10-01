// Avviso del prebuild (01/10/2026, SPEC v1.2 §10.1): i video che il sito
// mostra e che il registro dei video del CRM (`video_trasparenza`) non
// conosce. Un video senza riga esce SENZA etichetta: se è AI, è proprio il
// buco che la trasparenza deve chiudere — ma non si sa da qui, quindi è un
// AVVISO e la build non si ferma mai (exit 0 sempre, anche col CRM giù).
//
// Cosa conta come «video del sito»:
//   · i file del sito: ogni percorso `/video/<nome>.<mp4|webm|mov|m4v>`
//     scritto in src/ (VideoSito, AutoVideo) → chiave `tsi:<percorso>`;
//   · i YouTube delle schede: `youtube_urls` del catalogo pubblico della
//     vetrina (la stessa regola di pubblicazione del sito) → `youtube:<id>`.
// Il registro si legge dalla vista `vista=trasparenza` (chiave `video`).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const VETRINA_URL = process.env.VETRINA_URL ?? "https://tsv-pg.vercel.app/api/vetrina";
const SITO = "triesteimmobiliare.com";
const PREFISSO = "tsi";
const TIMEOUT_MS = 8000;

const avvisi = [];
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
    for (const r of catalogo.value.immobili) {
      for (const u of String(r?.youtube_urls ?? "").split(/\s+/)) {
        const id = idYoutube(u);
        if (!id) continue;
        const chiave = `youtube:${id}`;
        if (!youtube.has(chiave)) youtube.set(chiave, new Set());
        youtube.get(chiave).add(r.tsv_prop_id ?? r.airtable_id ?? "?");
      }
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
    const conosciute = new Set(registro.map((v) => v?.chiave).filter((c) => typeof c === "string"));
    for (const [chiave, dove] of fileVideo) {
      if (!conosciute.has(chiave)) avvisi.push(`${chiave} — in ${[...dove].join(", ")}`);
    }
    for (const [chiave, schede] of youtube) {
      if (!conosciute.has(chiave)) avvisi.push(`${chiave} — nella scheda ${[...schede].join(", ")}`);
    }
    note.push(
      `${fileVideo.size} file del sito e ${youtube.size} YouTube delle schede confrontati con ${conosciute.size} righe del registro`,
    );
  }
} catch (e) {
  note.push(`controllo saltato: ${e instanceof Error ? e.message : String(e)}`);
}

for (const n of note) console.log(`check-video-registro: ${n}`);
if (avvisi.length) {
  console.warn(
    `check-video-registro: ⚠️ ${avvisi.length} video senza riga nel registro del CRM (escono SENZA etichetta AI):`,
  );
  for (const a of avvisi) console.warn(`  · ${a}`);
} else if (!note.some((n) => n.includes("non letto") || n.includes("saltato"))) {
  console.log("check-video-registro: ogni video del sito ha la sua riga nel registro");
}
process.exit(0);
