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
//         video «video AI» su `ai_animato` e `ai_generato`;
//      5. l'og:image tratta la foto di sola luce come una foto normale;
//      6. la riga del riepilogo: calcolata, senza segnaposto rimasti, coi
//         plurali giusti (sloveno compreso: 1 je / 2 sta / 3 so / 5 je) — e
//         VERA: una generica non è «con le modifiche indicate», un render non
//         è una «foto ritoccata» (review del 02/10, falso in 15 annunci su 16);
//      7. i conteggi per gruppo e le righe del dettaglio;
//      8. la card (`etichettaCard`, la regola che propertyView.ts chiama): in
//         home mai il glifo, il segno solo sulle simulazioni; fuori dalla home
//         il glifo sulla sostanza e niente sullo stile.
//   B. LA HOME (src/app/[locale]/page.tsx, letta come albero TypeScript):
//      nessuna pillola (<EtichettaAi>, <EtichettaVideo>, <VideoYoutube>), né
//      lì né nei componenti che importa; ogni card costruita con
//      `{ home: true }`; ogni <VideoSito> `discreto`; ogni <AutoVideo> con il
//      suo <SegnoAi> nel riquadro. E i tre pezzi da cui la home dipende:
//      propertyView.ts passa da `etichettaCard` col suo `home`, CardGallery
//      mostra il glifo solo da `.ai` e il segno solo da `.segno`, il ramo
//      `discreto` di VideoSito non ha pillola né didascalia.
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
const attesiVideo = { ai_animato: "video", ai_generato: "video", ai_montaggio: null, reale: null };
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
  const attesi = { pubblicate: 8, ai: 5, luce: 2, pulizia: 1, aggiunte: 1, aiRendering: 1, rendering: 1, generiche: 0, precauzione: 0 };
  for (const [k, v] of Object.entries(attesi))
    if (c?.[k] !== v) err(`A.7 conteggi.${k}: atteso ${v}, dà ${c?.[k]} — ${JSON.stringify(c)}`);
  if (pt.ai_luce !== 2 || pt.tecnico !== 1 || pt.rendering !== 1 || pt.ai_pulizia !== 1)
    err(`A.7 perTipo: ${JSON.stringify(pt)}`);
  // le righe del dettaglio: ogni pillola è quella che si vede sulla foto
  const righe = R.righeDettaglio(p.trasparenza, "it");
  const di = (k) => righe.find((r) => r.chiave === k);
  if (di("ai_luce")?.pillola !== null || di("tecnico")?.pillola !== null)
    err(`A.7 dettaglio: lo stile non ha pillola — ${JSON.stringify(righe)}`);
  if (di("ai_rendering")?.pillola !== R.testiTrasparenza("it").etichetta.ai_rendering)
    err(`A.7 dettaglio: il render AI con la sua pillola — ${JSON.stringify(di("ai_rendering"))}`);
  if (righe.some((r) => !r.testo || r.n <= 0)) err(`A.7 dettaglio: righe vuote — ${JSON.stringify(righe)}`);
}
{
  // generiche dal CRM e dal nome, render dal nome, etichetta precauzionale
  const c0 = casa(["ai", null, null]);
  c0.photos.push(foto("hf_20260101_101010_12345678-1234-1234-1234-123456789abc"));
  c0.photos.push(foto("progetto-render-1"));
  c0.vista.conteggi.ai_non_abbinate = 1; // → le foto con un nome qualunque diventano «AI» precauzionale
  const p = applica(c0);
  const c = p.trasparenza?.conteggi;
  if (c?.generiche !== 2 || c?.precauzione !== 2 || c?.rendering !== 1 || c?.renderingDalNome !== 1)
    err(`A.7 generiche 2 (CRM + nome), precauzione 2, render dal nome 1 — dà ${JSON.stringify(c)}`);
  const righe = R.righeDettaglio(p.trasparenza, "it");
  const tx = R.testiTrasparenza("it");
  const di = (k) => righe.find((r) => r.chiave === k);
  if (di("renderingDalNome")?.pillola !== tx.etichetta.rendering)
    err(`A.7 dettaglio: il render dal nome porta «Rendering», non «AI» — ${JSON.stringify(di("renderingDalNome"))}`);
  if (di("rendering")) err(`A.7 dettaglio: un render dal nome non è «di progetto, senza AI» — ${JSON.stringify(righe)}`);
  if (di("ricontrollo")?.n !== 2 || di("ai")?.n !== 2) err(`A.7 dettaglio: generiche e precauzionali separate — ${JSON.stringify(righe)}`);
}

// A.8 la card: la regola che propertyView.ts chiama (etichettaCard)
for (const l of LINGUE) {
  for (const t of ["tecnico", "ai", "ai_luce", "ai_pulizia", "ai_aggiunte", "ai_rendering", "rendering"]) {
    for (const fonte of t === "ai" || t === "rendering" ? ["crm", "nome"] : ["crm"]) {
      const d = { ...riga(t), fonte, didascalia: fonte === "crm" ? TUTTE : null };
      const h = R.etichettaCard(d, l, true);
      if (h.ai) err(`A.8 card in home, ${t}/${fonte}/${l}: niente glifo in home — dà ${JSON.stringify(h)}`);
      const atteso = attesiFoto[t] ? R.testiTrasparenza(l).segno[attesiFoto[t]] : undefined;
      if (h.segno?.testo !== atteso) err(`A.8 card in home, ${t}/${fonte}/${l}: segno «${h.segno?.testo}», atteso «${atteso}»`);
      const f = R.etichettaCard(d, l, false);
      if (f.segno) err(`A.8 card fuori dalla home, ${t}/${l}: il segno discreto è solo della home`);
      const stile = t === "ai_luce" || t === "tecnico";
      if (stile ? !!f.ai : !f.ai?.glifo) err(`A.8 card fuori dalla home, ${t}/${l}: ${stile ? "lo stile senza glifo" : "la sostanza col glifo"} — dà ${JSON.stringify(f)}`);
    }
  }
}

// A.6 la riga del riepilogo
const C = (o) => ({
  pubblicate: 0,
  luce: 0,
  pulizia: 0,
  aggiunte: 0,
  generiche: 0,
  precauzione: 0,
  aiRendering: 0,
  rendering: 0,
  bloccoDifetti: 0,
  ...o,
});
const scenari = [
  C({ pubblicate: 40, luce: 40 }),
  C({ pubblicate: 40, luce: 39 }),
  C({ pubblicate: 20, luce: 5, pulizia: 12, aggiunte: 2, bloccoDifetti: 3 }),
  C({ pubblicate: 16, generiche: 16 }),
  C({ pubblicate: 26, generiche: 23 }),
  C({ pubblicate: 1, pulizia: 1 }),
  C({ pubblicate: 10, aggiunte: 5, generiche: 5 }),
  C({ pubblicate: 29, aggiunte: 2, generiche: 2, precauzione: 1 }),
  C({ pubblicate: 5, aiRendering: 4, rendering: 1 }),
  C({ pubblicate: 4, aiRendering: 4 }),
  C({ pubblicate: 12, pulizia: 3, aiRendering: 2 }),
  C({ pubblicate: 10, precauzione: 2 }),
];
for (const l of LINGUE) {
  for (const s of scenari) {
    const r = R.rigaRiepilogo(s, l);
    if (!r || /[{}]|undefined|NaN|null|false/.test(r)) err(`A.6 riga ${l} ${JSON.stringify(s)}: «${r}»`);
    else if (s.luce === s.pubblicate && s.luce > 0 && /\d/.test(r))
      err(`A.6 riga ${l} tutta di sola luce: la forma della SPEC non ha numeri — «${r}»`);
  }
  if (R.rigaRiepilogo(C({ pubblicate: 5 }), l) !== null) err(`A.6 riga ${l}: senza foto AI deve essere null`);
}
// La riga dice il VERO di ogni gruppo (it, le altre lingue hanno lo stesso schema).
const it = (o) => R.rigaRiepilogo(C(o), "it") ?? "";
const VERITA = [
  // Battera 20: la forma mista della SPEC, con le simulazioni
  [{ pubblicate: 20, luce: 5, pulizia: 12, aggiunte: 2 }, (r) =>
    r === "19 foto su 20 ritoccate con l'AI: 5 solo nella luce e nei colori, 14 con modifiche indicate sulla foto. 2 sono simulazioni."],
  // solo generiche: mai «modifiche indicate», mai «ritoccate»
  [{ pubblicate: 26, generiche: 23 }, (r) => /modello generativo/.test(r) && !/indicat|ritoccat|simulazion/.test(r)],
  [{ pubblicate: 16, generiche: 16 }, (r) => /^Tutte le foto sono passate da un modello generativo/.test(r) && !/\d/.test(r)],
  // Roma 23: simulazioni indicate + generiche a parte
  [{ pubblicate: 10, aggiunte: 5, generiche: 5 }, (r) =>
    r === "5 foto su 10 sono simulazioni create con l'AI, indicate sulla foto. Altre 5 sono passate da un modello generativo: cosa è cambiato è in verifica."],
  // Duino: nessuna foto, solo render — mai «foto ritoccate», mai «simulazioni»
  [{ pubblicate: 5, aiRendering: 4, rendering: 1 }, (r) =>
    r === "Nessuna immagine è una fotografia: 4 immagini generate per intero con l'AI e 1 rendering di progetto."],
  [{ pubblicate: 4, aiRendering: 4 }, (r) => /^Nessuna immagine è una fotografia/.test(r) && !/foto ritoccat|simulazion/.test(r)],
  // foto e render insieme: i render non entrano nelle «foto su M»
  [{ pubblicate: 12, pulizia: 3, aiRendering: 2 }, (r) =>
    r.startsWith("3 foto su 10 ritoccate con l'AI") && r.includes("2 immagini generate per intero con l'AI: non sono fotografie.")],
  // la precauzione resta precauzione
  [{ pubblicate: 10, precauzione: 2 }, (r) => /precauzional/.test(r) && !/modello generativo|indicat/.test(r)],
];
for (const [c, ok] of VERITA) if (!ok(it(c))) err(`A.6 riga it ${JSON.stringify(c)}: «${it(c)}» non dice il vero del gruppo`);
for (const l of LINGUE) {
  const tx = R.testiTrasparenza(l);
  if (R.comandoDettaglio(C({ pubblicate: 5, aiRendering: 4, rendering: 1 }), l, true) !== tx.dettaglioNota)
    err(`A.6 ${l}: con soli render il comando non può dire «come le abbiamo ritoccate»`);
  if (R.comandoDettaglio(C({ pubblicate: 10, precauzione: 2 }), l, false) !== tx.dettaglioBreve)
    err(`A.6 ${l}: senza nota il comando non può promettere la nota`);
  if (R.comandoDettaglio(C({ pubblicate: 5, generiche: 5 }), l, false) !== tx.dettaglio)
    err(`A.6 ${l}: con foto passate da un modello il comando è «${tx.dettaglio}»`);
  // la chiusura: sempre, tranne dove nessuna immagine è una fotografia
  for (const s of scenari) {
    const solo = s.aiRendering + s.rendering >= s.pubblicate && s.luce + s.pulizia + s.aggiunte + s.generiche + s.precauzione === 0;
    if ((R.chiusuraRiepilogo(s, l) === tx.chiusura) === solo)
      err(`A.6 ${l} ${JSON.stringify(s)}: chiusura «${R.chiusuraRiepilogo(s, l)}»`);
  }
}
const sim = (k, l) => R.rigaRiepilogo(C({ pubblicate: 30, luce: 10, pulizia: 10, aggiunte: k }), l) ?? "";
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
  const r = R.rigaRiepilogo(C({ pubblicate: 1, pulizia: 1 }), "sl") ?? "";
  if (!r.includes("od 1 fotografije")) err(`A.6 sloveno, «od 1»: genitivo singolare atteso — «${r}»`);
  const r2 = R.rigaRiepilogo(C({ pubblicate: 20, pulizia: 20 }), "sl") ?? "";
  if (!r2.includes("od 20 fotografij")) err(`A.6 sloveno, «od 20»: genitivo plurale atteso — «${r2}»`);
  for (const [n, frammento] of [[1, "1 slika, v celoti ustvarjena"], [2, "2 sliki, v celoti ustvarjeni"], [3, "3 slike, v celoti ustvarjene"], [5, "5 slik, v celoti ustvarjenih"]]) {
    const r3 = R.rigaRiepilogo(C({ pubblicate: n, aiRendering: n }), "sl") ?? "";
    if (!r3.includes(frammento)) err(`A.6 sloveno, ${n} render: atteso «${frammento}» in «${r3}»`);
  }
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
const PILLOLE = new Set(["EtichettaAi", "EtichettaVideo", "VideoYoutube"]);
{
  const rel = "src/app/[locale]/page.tsx";
  const sf = albero(rel);
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

  // I componenti che la home importa: niente pillole dentro, e se costruiscono
  // card da sé, con `{ home: true }`. (PropertyCard e FeaturedCarousel ricevono
  // le card già costruite: il glifo lo mostra CardGallery solo da `.ai`, che in
  // home etichettaCard non dà mai — A.8 e i controlli qui sotto.)
  const importati = [];
  visita(sf, (n) => {
    if (ts.isImportDeclaration(n)) {
      const m = /^["']@\/components\/(.+)["']$/.exec(n.moduleSpecifier.getText());
      if (m) importati.push(`src/components/${m[1]}.tsx`);
    }
  });
  for (const relC of importati) {
    let sfC;
    try {
      sfC = albero(relC);
    } catch {
      continue; // un componente in .ts o in una cartella con index: niente JSX da guardare
    }
    visita(sfC, (n) => {
      const tag = nomeTag(n);
      // VideoSito: la pillola sta nel ramo di fuori dalla home; il ramo
      // `discreto` lo controlla il blocco qui sotto.
      if (tag && PILLOLE.has(tag) && !/\/(?:PropertyCard|CardGallery|VideoSito)\.tsx$/.test(relC))
        err(`B ${relC}:${riga_(sfC, n)}: <${tag}> in un componente della home`);
      if (ts.isCallExpression(n) && n.expression.getText() === "buildPropertyView") {
        const o = n.arguments[4];
        if (!o || !/\bhome\s*:\s*true\b/.test(o.getText()))
          err(`B ${relC}:${riga_(sfC, n)}: buildPropertyView in un componente della home senza \`{ home: true }\``);
      }
    });
  }
}
{
  // propertyView.ts: la card passa SOLO da etichettaCard, col suo `home`
  const rel = "src/lib/propertyView.ts";
  const sf = ts.createSourceFile(rel, readFileSync(join(RADICE, rel), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let chiamate = 0;
  visita(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    const nome = n.expression.getText();
    if (nome === "fotoAi" || nome === "segnoHome")
      err(`B ${rel}:${riga_(sf, n)}: \`${nome}\` chiamata direttamente — la card passa da etichettaCard (lib/trasparenza.ts)`);
    if (nome === "etichettaCard") {
      chiamate++;
      if (n.arguments[2]?.getText() !== "home") err(`B ${rel}:${riga_(sf, n)}: etichettaCard senza il \`home\` della card`);
    }
  });
  if (chiamate === 0) err(`B ${rel}: la card non passa più da etichettaCard`);
}
{
  // CardGallery: il glifo solo da `.ai`, il segno solo da `.segno`
  const rel = "src/components/CardGallery.tsx";
  const sf = albero(rel);
  let segni = 0;
  visita(sf, (n) => {
    const tag = nomeTag(n);
    const testo = attr(n, "testo")?.initializer?.getText() ?? "";
    if (tag === "EtichettaAi" && (!/\.ai\b/.test(testo) || /\.segno\b/.test(testo)))
      err(`B ${rel}:${riga_(sf, n)}: <EtichettaAi> deve leggere solo \`.ai\` — legge ${testo}`);
    if (tag === "SegnoAi") {
      segni++;
      if (!/\.segno\b/.test(testo) || /\.ai\b/.test(testo))
        err(`B ${rel}:${riga_(sf, n)}: <SegnoAi> deve leggere solo \`.segno\` — legge ${testo}`);
    }
  });
  if (segni === 0) err(`B ${rel}: il segno discreto delle card della home non c'è più`);
}
{
  // VideoSito, ramo `discreto`: solo il segno, niente pillola né didascalia
  const rel = "src/components/VideoSito.tsx";
  const sf = albero(rel);
  let ramo = null;
  visita(sf, (n) => {
    if (!ramo && ts.isIfStatement(n) && n.expression.getText() === "discreto") ramo = n.thenStatement;
  });
  if (!ramo) err(`B ${rel}: il ramo \`if (discreto)\` non c'è più`);
  else {
    let segno = false;
    visita(ramo, (n) => {
      const tag = nomeTag(n);
      if (tag === "SegnoAi") segno = true;
      if (tag && (PILLOLE.has(tag) || tag === "EtichettaAi" || tag === "figcaption"))
        err(`B ${rel}:${riga_(sf, n)}: <${tag}> nel ramo discreto (home)`);
    });
    if (!segno) err(`B ${rel}: il ramo discreto senza <SegnoAi>`);
  }
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
    const SOLO_DENTRO = new Set(["notaDettaglio", "perTipo", "righeDettaglio", "linkAi", "notaAi"]);
    let riga = false;
    let chiusura = false;
    visita(sezione, (n) => {
      if (ts.isIdentifier(n) && SOLO_DENTRO.has(n.text) && !dentro(n))
        err(`C ${rel}:${riga_(sf, n)}: \`${n.text}\` fuori dal <details>: nella parte visibile solo titolo, riga e chiusura`);
      // Stampate come figlie JSX (`{rigaAi}`), non solo nominate: un
      // `{rigaAi && chiusuraAi && " "}` nomina la chiusura senza stamparla.
      if (ts.isJsxExpression(n) && n.expression && !dentro(n)) {
        const e = n.expression.getText();
        if (e === "rigaAi" || /^rigaRiepilogo\(/.test(e)) riga = true;
        if (e === "chiusuraAi" || /^chiusuraRiepilogo\(/.test(e)) chiusura = true;
      }
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
    if (!contiene(sf, (x) => ts.isCallExpression(x) && x.expression.getText() === "chiusuraRiepilogo"))
      err(`C ${rel}: la chiusura non passa da chiusuraRiepilogo (lib/trasparenza.ts)`);
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
