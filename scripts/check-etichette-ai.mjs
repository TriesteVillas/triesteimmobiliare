// Cancello del prebuild per la trasparenza AI dopo lo SNELLIMENTO
// (SPEC v1.3 §11, 02/10/2026). Martino, guardando i siti: «Bellissima… ma in
// certi punti mi sembra quasi troppo… snellisci, lasciando ciò che serve, non
// ciò che aggiunge rumore». Le regole che questo cancello tiene ferme:
//
//   A. LA REGOLA, sulla parte pura (src/lib/trasparenza.ts, eseguita davvero):
//      1. `ai_luce` e `tecnico` — lo STILE — non danno etichetta, glifo né
//         didascalia, in nessuna lingua; con l'originale resta solo quello;
//      2. la SOSTANZA (`ai`, `ai_pulizia`, `ai_aggiunte`, `ai_rendering`) e il
//         `rendering` l'etichetta la tengono, in tutte e quattro le lingue —
//         il cancello deve anche impedire di snellire troppo;
//      3. la marcatura IPTC nel file resta anche su `ai_luce`;
//      4. il segno discreto della home: «simulazione» su `ai_aggiunte` e
//         `ai_rendering`, «rendering» sul render, niente sul resto; per i
//         video «video AI» su `ai_animato`, «simulazione» su `ai_generato`;
//      5. l'og:image tratta la foto di sola luce come una foto normale;
//      6. la riga del riepilogo: calcolata, senza segnaposto rimasti, coi
//         plurali giusti (sloveno compreso: 1 je / 2 sta / 3 so / 5 je);
//      7. i conteggi per tipo che il riepilogo legge.
//   B. LA HOME (src/app/[locale]/page.tsx, letta come albero TypeScript):
//      nessuna pillola (<EtichettaAi>, <EtichettaVideo>, <VideoYoutube>);
//      ogni card costruita con `{ home: true }`; ogni <VideoSito> `discreto`;
//      ogni <AutoVideo> con il suo <SegnoAi> nel riquadro.
//   C. IL RIEPILOGO della scheda (la sezione `id="foto-ai"`): un <details>
//      chiuso di default; fuori dal <details> niente nota, niente conteggi per
//      tipo, niente link e niente numeri grandi (text-2xl…); dentro, la nota.
//
// Non prova che i dati del CRM dicano il vero (`ai_luce` si assegna solo dopo
// il controllo foto per foto, SPEC §11.4): prova che il sito li mostri secondo
// la regola. Non si spegne per «sbloccare» la build.
//
// Uso: node scripts/check-etichette-ai.mjs [radice]   (prebuild: radice = .)
// Prova che sa dire di no: node scripts/check-etichette-ai.prova.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const RADICE = process.argv[2] ?? ".";
const errori = [];
const err = (m) => errori.push(m);

// ─────────────────────────────────────────────────────────────────────────────
// A. La regola, eseguita
// ─────────────────────────────────────────────────────────────────────────────
const sorgenteRegola = readFileSync(join(RADICE, "src/lib/trasparenza.ts"), "utf8");
// Solo `import type` lassù: tolti i tipi, il modulo non importa niente.
const js = ts.transpileModule(sorgenteRegola, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
if (/^\s*import\s[^;]*from\s/m.test(js)) err("trasparenza.ts importa valori: il cancello non può eseguirla da sola");
const R = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

const LINGUE = ["it", "en", "de", "sl"];
const TUTTE = { it: "didascalia it", en: "caption en", de: "Bildunterschrift de", sl: "napis sl" };
const ORIG = { m: "https://x/m", xl: "https://x/xl", larghezza: 2560, altezza: 1707 };
const riga = (trattamento, extra = {}) => ({
  trattamento,
  fonte: "crm",
  bloccoDifetti: false,
  didascalia: TUTTE,
  originale: null,
  ...extra,
});

for (const l of LINGUE) {
  // A.1 lo stile: niente sulla foto
  for (const t of ["ai_luce", "tecnico"]) {
    const v = R.fotoAi(riga(t), l);
    if (v !== null) err(`A.1 ${t}/${l}: fotoAi deve dare null senza originale, dà ${JSON.stringify(v)}`);
    const o = R.fotoAi(riga(t, { originale: ORIG }), l);
    if (!o || o.etichetta || o.glifo || o.didascalia || o.aria || !o.originale)
      err(`A.1 ${t}/${l} con l'originale: solo l'originale, senza etichetta né didascalia — dà ${JSON.stringify(o)}`);
  }
  // A.2 la sostanza: l'etichetta resta
  for (const t of ["ai", "ai_pulizia", "ai_aggiunte", "ai_rendering", "rendering"]) {
    const v = R.fotoAi(riga(t), l);
    if (!v?.etichetta || !v?.glifo) err(`A.2 ${t}/${l}: deve avere etichetta e glifo, dà ${JSON.stringify(v)}`);
    else if (t !== "ai" && t !== "rendering" && v.didascalia !== TUTTE[l])
      err(`A.2 ${t}/${l}: la didascalia del CRM deve uscire nella vista singola`);
  }
  for (const fonte of ["nome", "precauzione"]) {
    const v = R.fotoAi({ trattamento: "ai", fonte, bloccoDifetti: false, didascalia: null, originale: null }, l);
    if (!v?.etichetta) err(`A.2 «AI» generica da ${fonte}/${l}: l'etichetta resta finché non è classificata`);
  }
}
// A.3 la marcatura nel file resta
for (const t of ["ai", "ai_luce", "ai_pulizia", "ai_aggiunte", "ai_rendering"])
  if (!R.marcaXmp(t)) err(`A.3 marcaXmp(${t}): la marcatura IPTC deve restare`);
// A.4 il segno discreto della home
const attesiFoto = { ai_aggiunte: "simulazione", ai_rendering: "simulazione", rendering: "rendering" };
for (const t of ["tecnico", "ai", "ai_luce", "ai_pulizia", "ai_aggiunte", "ai_rendering", "rendering"])
  if ((R.segnoHome(t) ?? null) !== (attesiFoto[t] ?? null))
    err(`A.4 segnoHome(${t}) = ${R.segnoHome(t)}, atteso ${attesiFoto[t] ?? null}`);
const attesiVideo = { ai_animato: "video", ai_generato: "simulazione", ai_montaggio: null, reale: null };
for (const [t, a] of Object.entries(attesiVideo))
  if ((R.segnoVideoHome(t) ?? null) !== a) err(`A.4 segnoVideoHome(${t}) = ${R.segnoVideoHome(t)}, atteso ${a}`);
for (const l of LINGUE)
  for (const k of ["simulazione", "rendering", "video"])
    if (!R.testiTrasparenza(l).segno?.[k]) err(`A.4 testo del segno «${k}» assente in ${l}`);

// A.5 / A.7 — un immobile finto passato per la funzione vera
const foto = (n) => ({ id: `att${n}`, url: `https://x/${n}.jpg`, filename: `${n}.jpg`, alt: "", width: 10, height: 10 });
const casa = (righe) => {
  const fotos = righe.map((_, i) => foto(`f${i}`));
  return {
    recId: "recPROVA0000000000",
    coverPhoto: fotos[0],
    topPhotos: [],
    photos: fotos,
    vista: {
      nota: null,
      foto: righe
        .map((t, i) => (t ? { filename: `f${i}.jpg`, trattamento: t, blocco_difetti: false, didascalia: TUTTE, originale: null } : null))
        .filter(Boolean),
      conteggi: { ai_non_abbinate: 0, ai: null, foto_pubblicate: null },
    },
  };
};
const applica = (c) => {
  const { vista, ...p } = c;
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    return R.applicaTrasparenza([p], new Map([[p.recId, vista]]), "https://x")[0];
  } finally {
    console.warn = origWarn;
  }
};
{
  const p = applica(casa(["ai_luce", "ai_pulizia", null]));
  const og = R.fotoPerAnteprima(p);
  if (og?.filename !== "f0.jpg") err(`A.5 og:image: con la copertina di sola luce deve restare la copertina, dà ${og?.filename}`);
  const q = applica(casa(["ai_pulizia", "ai_luce", null]));
  if (R.fotoPerAnteprima(q)?.filename !== "f1.jpg")
    err(`A.5 og:image: con la copertina ritoccata nella sostanza deve passare alla prima foto senza etichetta (f1)`);
}
{
  const p = applica(casa(["ai_luce", "ai_luce", "ai_pulizia", "ai_aggiunte", "ai_rendering", "tecnico", "rendering", null]));
  const c = p.trasparenza?.conteggi;
  const pt = p.trasparenza?.perTipo ?? {};
  if (!c || c.pubblicate !== 8 || c.ai !== 5 || c.luce !== 2 || c.simulazioni !== 2)
    err(`A.7 conteggi: attesi pubblicate 8, ai 5, luce 2, simulazioni 2 — dà ${JSON.stringify(c)}`);
  if (pt.ai_luce !== 2 || pt.tecnico !== 1 || pt.rendering !== 1 || pt.ai_pulizia !== 1)
    err(`A.7 perTipo: ${JSON.stringify(pt)}`);
}

// A.6 la riga del riepilogo
const C = (o) => ({ pubblicate: 0, ai: 0, luce: 0, simulazioni: 0, ricontrollo: 0, bloccoDifetti: 0, ...o });
const scenari = [
  C({ pubblicate: 40, ai: 40, luce: 40 }),
  C({ pubblicate: 40, ai: 39, luce: 39 }),
  C({ pubblicate: 20, ai: 19, luce: 5, simulazioni: 2, bloccoDifetti: 3 }),
  C({ pubblicate: 16, ai: 16 }),
  C({ pubblicate: 1, ai: 1 }),
  C({ pubblicate: 29, ai: 4, simulazioni: 1, ricontrollo: 1 }),
  C({ pubblicate: 10, ricontrollo: 2 }),
];
for (const l of LINGUE) {
  for (const s of scenari) {
    const r = R.rigaRiepilogo(s, l);
    if (!r || /[{}]|undefined|NaN|null/.test(r)) err(`A.6 riga ${l} ${JSON.stringify(s)}: «${r}»`);
    else if (s.ai > 0 && s.ai < s.pubblicate && !r.includes(String(s.ai)))
      err(`A.6 riga ${l}: il numero delle foto AI (${s.ai}) deve comparire — «${r}»`);
    else if (s.ai === s.luce && s.ai === s.pubblicate && s.ai > 0 && /\d/.test(r))
      err(`A.6 riga ${l} tutta di sola luce: la forma della SPEC non ha numeri — «${r}»`);
  }
  if (R.rigaRiepilogo(C({ pubblicate: 5 }), l) !== null) err(`A.6 riga ${l}: senza foto AI deve essere null`);
}
const sim = (k, l) => R.rigaRiepilogo(C({ pubblicate: 30, ai: 20, luce: 10, simulazioni: k }), l) ?? "";
for (const [k, frammento] of [
  [1, "je 1 simulacija"],
  [2, "sta 2 simulaciji"],
  [3, "so 3 simulacije"],
  [4, "so 4 simulacije"],
  [5, "je 5 simulacij"],
  [101, "je 101 simulacija"],
])
  if (!sim(k, "sl").includes(frammento)) err(`A.6 sloveno, ${k} simulazioni: atteso «${frammento}» in «${sim(k, "sl")}»`);
if (!sim(1, "it").includes("1 è una simulazione")) err(`A.6 italiano, 1 simulazione: «${sim(1, "it")}»`);
if (!sim(3, "it").includes("3 sono simulazioni")) err(`A.6 italiano, 3 simulazioni: «${sim(3, "it")}»`);
{
  const r = R.rigaRiepilogo(C({ pubblicate: 1, ai: 1 }), "sl") ?? "";
  if (!r.includes("od 1 fotografije")) err(`A.6 sloveno, «od 1»: genitivo singolare atteso — «${r}»`);
  const r2 = R.rigaRiepilogo(C({ pubblicate: 20, ai: 20 }), "sl") ?? "";
  if (!r2.includes("od 20 fotografij")) err(`A.6 sloveno, «od 20»: genitivo plurale atteso — «${r2}»`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Gli alberi TSX
// ─────────────────────────────────────────────────────────────────────────────
function albero(rel) {
  const testo = readFileSync(join(RADICE, rel), "utf8");
  return ts.createSourceFile(rel, testo, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
const nomeTag = (n) =>
  ts.isJsxElement(n) ? n.openingElement.tagName.getText() : ts.isJsxSelfClosingElement(n) ? n.tagName.getText() : null;
const attributi = (n) =>
  (ts.isJsxElement(n) ? n.openingElement.attributes : ts.isJsxSelfClosingElement(n) ? n.attributes : null)?.properties ?? [];
const attr = (n, nome) => attributi(n).find((a) => ts.isJsxAttribute(a) && a.name.getText() === nome);
function visita(n, f, antenati = []) {
  f(n, antenati);
  const prossimi = nomeTag(n) ? [...antenati, n] : antenati;
  ts.forEachChild(n, (c) => visita(c, f, prossimi));
}
const contiene = (n, pred) => {
  let si = false;
  visita(n, (x) => {
    if (!si && pred(x)) si = true;
  });
  return si;
};
const riga_ = (sf, n) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;

// ─────────────────────────────────────────────────────────────────────────────
// B. La home
// ─────────────────────────────────────────────────────────────────────────────
{
  const rel = "src/app/[locale]/page.tsx";
  const sf = albero(rel);
  const PILLOLE = new Set(["EtichettaAi", "EtichettaVideo", "VideoYoutube"]);
  let card = 0;
  visita(sf, (n, antenati) => {
    if (ts.isImportDeclaration(n) && /components\/(EtichettaAi|EtichettaVideo|VideoYoutube)["']/.test(n.moduleSpecifier.getText()))
      err(`B ${rel}:${riga_(sf, n)}: la home importa una pillola (${n.moduleSpecifier.getText()})`);
    const tag = nomeTag(n);
    if (tag && PILLOLE.has(tag)) err(`B ${rel}:${riga_(sf, n)}: <${tag}> in home — in home niente pillole (SPEC §11.1)`);
    if (tag === "VideoSito") {
      const a = attr(n, "discreto");
      const vero = a && (!a.initializer || /^\{\s*true\s*\}$/.test(a.initializer.getText()));
      if (!vero) err(`B ${rel}:${riga_(sf, n)}: <VideoSito> in home senza \`discreto\``);
    }
    if (tag === "AutoVideo") {
      const riquadro = antenati[antenati.length - 1];
      if (!riquadro || !contiene(riquadro, (x) => nomeTag(x) === "SegnoAi"))
        err(`B ${rel}:${riga_(sf, n)}: <AutoVideo> in home senza il suo <SegnoAi> nello stesso riquadro`);
    }
    if (ts.isCallExpression(n) && n.expression.getText() === "buildPropertyView") {
      card++;
      const o = n.arguments[4];
      const home =
        o &&
        ts.isObjectLiteralExpression(o) &&
        o.properties.some(
          (p) => ts.isPropertyAssignment(p) && p.name.getText() === "home" && p.initializer.kind === ts.SyntaxKind.TrueKeyword,
        );
      if (!home) err(`B ${rel}:${riga_(sf, n)}: buildPropertyView in home senza \`{ home: true }\` (le card porterebbero le pillole)`);
    }
  });
  if (card === 0) err(`B ${rel}: nessuna card trovata — il cancello non guarda più dove dovrebbe`);
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Il riepilogo della scheda
// ─────────────────────────────────────────────────────────────────────────────
{
  const rel = "src/app/[locale]/annuncio/[slug]/page.tsx";
  const sf = albero(rel);
  let sezione = null;
  visita(sf, (n) => {
    if (!sezione && nomeTag(n) && attr(n, "id")?.initializer?.getText() === '"foto-ai"') sezione = n;
  });
  if (!sezione) err(`C ${rel}: la sezione id="foto-ai" non c'è più`);
  else {
    const dettagli = [];
    visita(sezione, (n) => {
      if (nomeTag(n) === "details") dettagli.push(n);
    });
    if (dettagli.length !== 1) err(`C ${rel}: il riepilogo deve avere UN <details> («Leggi come le abbiamo ritoccate»), ne ha ${dettagli.length}`);
    for (const d of dettagli) if (attr(d, "open")) err(`C ${rel}:${riga_(sf, d)}: il <details> del riepilogo deve essere chiuso di default`);
    const dentro = (n) => dettagli.some((d) => n.getStart() >= d.getStart() && n.getEnd() <= d.getEnd());
    const SOLO_DENTRO = new Set(["notaDettaglio", "perTipo", "linkAi", "notaAi"]);
    let riga = false;
    let chiusura = false;
    visita(sezione, (n) => {
      if (ts.isIdentifier(n) && SOLO_DENTRO.has(n.text) && !dentro(n))
        err(`C ${rel}:${riga_(sf, n)}: \`${n.text}\` fuori dal <details>: nella parte visibile solo titolo, riga e chiusura`);
      if (ts.isIdentifier(n) && (n.text === "rigaAi" || n.text === "rigaRiepilogo") && !dentro(n)) riga = true;
      if (ts.isPropertyAccessExpression(n) && n.name.text === "chiusura" && !dentro(n)) chiusura = true;
      const tag = nomeTag(n);
      if (tag && !dentro(n)) {
        if (tag === "dl") err(`C ${rel}:${riga_(sf, n)}: <dl> nella parte visibile del riepilogo (le tessere coi numeri)`);
        const cls = attr(n, "className")?.initializer?.getText() ?? "";
        if (/\btext-(?:2xl|3xl|4xl|5xl)\b/.test(cls))
          err(`C ${rel}:${riga_(sf, n)}: numeri grandi nella parte visibile del riepilogo («40 / 40»)`);
      }
    });
    if (!riga) err(`C ${rel}: la riga calcolata (rigaRiepilogo) non è nella parte visibile del riepilogo`);
    if (!chiusura) err(`C ${rel}: «La visita resta l'unico riferimento.» non è nella parte visibile del riepilogo`);
    if (!dettagli.some((d) => contiene(d, (x) => ts.isIdentifier(x) && x.text === "notaDettaglio")))
      err(`C ${rel}: la nota del CRM non è dentro il <details>`);
  }
}

if (errori.length) {
  console.error(`check-etichette-ai: ✗ ${errori.length} violazioni della trasparenza AI snellita (SPEC v1.3 §11):`);
  for (const e of errori) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(
  "✓ check-etichette-ai: stile senza etichetta, sostanza etichettata (4 lingue), home senza pillole, riepilogo corto col dettaglio chiuso",
);
