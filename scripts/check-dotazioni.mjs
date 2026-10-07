// Cancello delle dotazioni (07/10/2026): la scheda non dichiara una dotazione
// che il CRM dice di NON avere — né nella tabella «Caratteristiche», né nei
// dati strutturati (JSON-LD → amenityFeature).
//
// Il guasto che previene. Fino al 06/10 la scheda leggeva le dotazioni come
// «campo non vuoto = c'è». Ma il CRM scrive anche i no: `ascensore` vale "Si" o
// "No", `giardino` "Nessuno", `parcheggio` è una frase («Box auto NON
// inclusi…»). Risultato misurato in produzione: `Ascensore: true` nel JSON-LD
// di ogni casa senza ascensore, e su triestevillas.com «Lift: Yes» VISIBILE
// nelle pagine en/de/sl. Nessuna build se n'era mai accorta, perché tabella e
// JSON-LD erano due elenchi scritti a mano, ognuno con la sua lettura.
//
// Cosa controlla:
//   COMPORTAMENTO — la regola vera (src/lib/dotazioni.ts, importata con lo
//     strip dei tipi di Node) sui valori REALI dei cataloghi del 07/10/2026:
//     i campi a scelta, i 35 testi di `parcheggio`, i testi di `piscina`. E la
//     scheda di Sappada per intero: tabella e JSON-LD dalla stessa lettura.
//   IL METRO SA DIRE DI NO — le stesse prove girano sulla lettura di prima
//     («non vuoto = c'è») e DEVONO trovarla in difetto. Se un giorno non la
//     trovano più, il metro è rotto.
//   CABLAGGIO — la scheda costruisce amenityFeature con vociSchema() da
//     statoDotazioni(), non con un elenco fatto a mano; e seo.ts non scrive
//     `value: true` fisso.
//
// GEMELLO IDENTICO nei quattro siti (triestevillas-web, triesteimmobiliare,
// friulivillas, triesteaffitti), come src/lib/dotazioni.ts. Non si spegne per
// «sbloccare» la build: se un testo nuovo del CRM viene letto male, si
// aggiunge il caso qui e si corregge la regola nei quattro repo.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const errori = [];
const prova = (cond, msg) => {
  if (!cond) errori.push(msg);
};

// ── I casi: [valore del CRM, atteso]. true = c'è · false = il CRM dice di no ·
//    null = non si dichiara niente.
const SCELTA = [
  [true, true],
  [false, null], // casella non spuntata: non compilato, non «no»
  [null, null],
  [undefined, null],
  ["", null],
  ["  ", null],
  ["Si", true],
  ["Sì", true],
  ["No", false],
  [" no ", false],
  ["NO", false],
  ["Nessuno", false],
  ["Privato", true],
  ["Condominiale", true],
  ["Privato, circa 800 m²", true],
  ["Parzialmente", true],
  ["true", true],
  ["false", null],
  ["0", null],
];

// Tutti i valori distinti di `parcheggio` nelle vetrine dei quattro siti il
// 07/10/2026 (testo intero o il suo inizio: la regola legge la prima frase).
const PARCHEGGIO = [
  ["1 POSTO AUTO SCOPERTO, 1 POSTO AUTO COPERTO DA TETTOIA", true],
  ["1 garage + 4 posti auto scoperti (Opzione B). Concessione a mare/moletto condivisi con l'Opzione A.", true],
  ["1 posto auto esterno scoperto incluso (condominiale)", true],
  ["1 posto auto esterno scoperto incluso (condominiale) + spazio per auto nel giardino privato", true],
  ["1 posto auto scoperto subito sotto casa", true],
  ["1 posto auto — box auto al piano terra di oltre 30 mq", true],
  ["2 posti auto dedicati (Opzione A). Concessione a mare/moletto condivisi con l'Opzione B.", true],
  ["Allo stato attuale la proprietà non dispone di posti auto né di box. Il muro di contenimento si presta", null],
  ["Ampio box e ulteriori spazi esterni", true],
  ["Autorimessa (C/6, 29 m²) collegata alla dependance dal portico, compresa nel prezzo; cortile interno con viale carrabile e cancello elettrico.", true],
  ["Box auto NON inclusi (i box soppalcabili al piano terra risultano venduti); cantine disponibili.", null],
  ["Box auto doppio + 2 posti auto scoperti; giardino terrazzato privato ~120 mq", true],
  ["Box auto/autorimessa (C/6, sub 18, 33 mq, piano terra) incluso nella vendita. Lastrico solare ad uso esclusivo + poggiolo (attico ai piani 7-8).", true],
  ["Doppio posto auto in box (~27 mq, sub 18, C/6) + cantina (~7 mq, sub 12, C/2), inclusi.", true],
  ["Dépendance ~130 mq (C/2) ad uso autorimessa multipla/deposito/laboratorio + ampio piazzale ghiaiato", true],
  ["Garage doppio al piano interrato + posti auto esterni", true],
  ["Garage doppio interrato 33 mq (sub.58, 2 auto) + posto auto scoperto 13 mq (sub.5, piano terra). Totale 3 posti auto.", true],
  ["In giardino 2 posti scoperti inclusi. Box doppio coperto (52 mq, colonnina di ricarica elettrica) acquistabile a parte a 80.000 €", true],
  ["Nel palazzo non sono previste pertinenze auto (pieno centro storico, zona pedonale). TriesteVillas può però accompagnare l'acquirente nella ricerca", null],
  ["Nessun posto auto compreso nel prezzo. L'edificio dispone di autorimesse seminterrate", null],
  ["Nessun posto auto di pertinenza e nessun box compreso nel prezzo. La zona è però comoda", null],
  ["Nessun posto auto di pertinenza: l'unità comprende il solo alloggio.", null],
  ["Nessun posto auto incluso. Box doppio coperto (52 mq, colonnina EV) acquistabile a parte a 80.000 €.", null],
  ["Nessun posto auto incluso; possibilità di posti auto nelle immediate vicinanze", null],
  ["PIAZZOLA CON DIVERSI PARCHEGGI SCOPERTI, POI ASCENSORE CHE PORTA DA LIVELLO PARK A VILLA.", true],
  ["Pertinenze in vendita a parte (prezzi annuncio): cantina sub 820 € 10.000 · posto auto coperto 18 mq sub 787 € 40.000", null],
  ['Posto auto OPZIONALE (+€50.000, non incluso nel prezzo) nell\'autorimessa "Verdemare"', null],
  ["Posto auto in autorimessa condominiale (comproprietà quota 1/10 dell'autorimessa comune, diritto a parcheggiare un'autovettura).", true],
  ["Posto auto nell'autorimessa condominiale (C/6, 14 m²), compreso nel prezzo.", true],
  ['Ricercabile a parte box o posto auto nel Park San Giusto, la cui uscita superiore (cd. "Ascensore di San Giusto" è a pochi metri)', null],
  ["Tre garage + zona officina (catasto: 2 box C/6 sub 5 e 6, 21 m² cad.; il 3° da verificare). Spazio per collezione moto e banco di lavoro.", true],
  ["Un posto auto acquistabile a parte a € 50.000 (non incluso nel prezzo dell’appartamento).", null],
  ["Zona di accesso auto con portico: due posti auto coperti, in fila, sotto il portico d'ingresso e all'interno della proprietà. Per consuetudine", true],
  ["Piattaforma privata con quattro posti auto, affacciata sul golfo", true],
  ["Posto auto coperto nel garage condominiale", true],
  // casi di principio
  ["No", false],
  ["Nessuno", false],
  ["", null],
  [null, null],
  ["Senza posto auto", null],
];

const PISCINA = [
  ["CONDO HEATED POOL (+GYM&SPA)", true],
  ["CONDOMINIUM POOL, MARINA ENVIRONMENT", true],
  ["Sì — piscina esterna a sfioro", true],
  ["Piscina con rivestimento in mosaico, oggi vuota: va rimessa in funzione", true],
  ["Piscina a sfioro con vista mare prevista dal progetto, nel giardino di 1.200 m²", true],
  ["POOL OPTION", null],
  ["SMALL POOL OPTION", null],
  ["PROJECT WITH POOL", null],
  ["PUBLIC STAIRS TO SECLUDED BEACH AREA", null], // il campo riusato per altro
  ["No", false],
  ["Si", true],
  [null, null],
];

const dice = (v) => (v === true ? "c'è" : v === false ? "NO" : "niente");
const mostra = (v) => (typeof v === "string" ? `«${v.slice(0, 60)}${v.length > 60 ? "…" : ""}»` : String(v));

function giro(nome, casi, leggi) {
  const sbagli = [];
  for (const [valore, atteso] of casi) {
    const avuto = leggi(valore);
    if (avuto !== atteso) sbagli.push(`${nome} ${mostra(valore)}: atteso ${dice(atteso)}, letto ${dice(avuto)}`);
  }
  return sbagli;
}

// ── COMPORTAMENTO, sulla regola vera.
// L'import di un .ts con lo strip dei tipi fa dire a Node che package.json non
// ha "type": "module": un avviso innocuo che nel log di build sembra un guasto.
const emetti = process.emitWarning;
process.emitWarning = (w, ...resto) =>
  /Module type of file/.test(String(w?.message ?? w)) ? undefined : emetti.call(process, w, ...resto);
let D = null;
try {
  D = await import(pathToFileURL(join(ROOT, "src/lib/dotazioni.ts")).href);
} catch (e) {
  // Si salta SOLO su un Node che non sa importare un .ts (< 22.18) e fuori da
  // Vercel: si dice, non si finge. Ogni altro errore d'import ferma la build —
  // dotazioni.ts deve restare importabile da Node senza alias né dipendenze.
  const [maggiore, minore] = process.versions.node.split(".").map(Number);
  const nodeSenzaTs = maggiore < 22 || (maggiore === 22 && minore < 18);
  if (e?.code === "ERR_UNKNOWN_FILE_EXTENSION" && nodeSenzaTs && !process.env.VERCEL) {
    console.warn(`⚠ check-dotazioni: prove di comportamento saltate (Node ${process.version} non importa .ts)`);
  } else {
    errori.push(
      `prove di comportamento impossibili: l'import di src/lib/dotazioni.ts fallisce (${e?.code ?? "errore"}: ${String(e?.message ?? e).split("\n")[0]})`,
    );
  }
}
process.emitWarning = emetti;

if (D) {
  const servono = ["presenza", "presenzaDaTesto", "presenzaPiscina", "soloSiNo", "statoDotazioni", "vociSchema"];
  const mancano = servono.filter((n) => typeof D[n] !== "function");
  for (const n of mancano) errori.push(`manca la funzione della regola: lib/dotazioni.ts · ${n}`);

  if (!mancano.length) {
    errori.push(
      ...giro("scelta", SCELTA, D.presenza),
      ...giro("parcheggio", PARCHEGGIO, D.presenzaDaTesto),
      ...giro("piscina", PISCINA, D.presenzaPiscina),
    );

    prova(D.soloSiNo("Si") && D.soloSiNo("No") && D.soloSiNo(" sì "), "soloSiNo: «Si», «No», «sì» sono solo un sì o un no");
    prova(!D.soloSiNo("Parzialmente") && !D.soloSiNo("Garage doppio") && !D.soloSiNo(null), "soloSiNo: un valore che dice di più non è «solo sì/no»");

    // La scheda di Sappada (Borgata Bach Alta, quarto piano senza ascensore),
    // coi valori della vetrina: il caso da cui è nato il cancello.
    const sappada = D.statoDotazioni({
      terrazzo: true,
      balcone: false,
      giardino: null,
      piscina: null,
      ascensore: "No",
      parcheggio: "Garage doppio interrato 33 mq (sub.58, 2 auto) + posto auto scoperto 13 mq (sub.5, piano terra). Totale 3 posti auto.",
      accessoDisabili: false,
      vistaMare: false,
    });
    const voci = D.vociSchema(sappada, {
      terrazzo: "Terrazzo",
      balcone: "Balcone",
      giardino: "Giardino",
      piscina: "Piscina",
      ascensore: "Ascensore",
      parcheggio: "Box / posti auto",
      accessoDisabili: "Accesso disabili",
      vistaMare: "Vista mare",
    });
    const attese = [
      { name: "Terrazzo", value: true },
      { name: "Ascensore", value: false },
      { name: "Box / posti auto", value: true },
    ];
    prova(
      JSON.stringify(voci) === JSON.stringify(attese),
      `scheda di Sappada: amenityFeature atteso ${JSON.stringify(attese)}, avuto ${JSON.stringify(voci)}`,
    );
    // Tabella e JSON-LD dalla stessa lettura: dove la tabella direbbe «No»
    // (stato false) il JSON-LD non può dire true, e viceversa.
    for (const v of voci) {
      const chiave = { Terrazzo: "terrazzo", Ascensore: "ascensore", "Box / posti auto": "parcheggio" }[v.name];
      prova(sappada[chiave] === v.value, `scheda di Sappada: «${v.name}» vale ${v.value} nel JSON-LD e ${sappada[chiave]} in tabella`);
    }
    // Un giardino «Nessuno» e un parcheggio che non c'è: mai true.
    const centro = D.vociSchema(
      D.statoDotazioni({ giardino: "Nessuno", ascensore: "Si", parcheggio: "Nessun posto auto di pertinenza: l'unità comprende il solo alloggio." }),
      { giardino: "Giardino", ascensore: "Ascensore", parcheggio: "Box / posti auto" },
    );
    prova(
      JSON.stringify(centro) === JSON.stringify([{ name: "Giardino", value: false }, { name: "Ascensore", value: true }]),
      `giardino «Nessuno» + parcheggio assente: avuto ${JSON.stringify(centro)}`,
    );
  }
}

// ── IL METRO SA DIRE DI NO: la lettura di prima, «non vuoto = c'è».
{
  const vecchia = (v) => (v ? true : null);
  const trovati = [
    ...giro("scelta", SCELTA, vecchia),
    ...giro("parcheggio", PARCHEGGIO, vecchia),
    ...giro("piscina", PISCINA, vecchia),
  ];
  const suiNo = trovati.filter((r) => /«(No|Nessuno|Nessun posto|Box auto NON|POOL OPTION)/.test(r));
  prova(
    suiNo.length >= 8,
    `il metro è rotto: la lettura «non vuoto = c'è» dovrebbe sbagliare sui No, sui Nessuno e sui parcheggi assenti, e invece ne sbaglia ${suiNo.length}`,
  );
}

// ── CABLAGGIO, dal sorgente.
{
  const scheda = readFileSync(join(ROOT, "src/app/[locale]/annuncio/[slug]/page.tsx"), "utf8");
  prova(/\bstatoDotazioni\(/.test(scheda), "scheda annuncio: le dotazioni non passano da statoDotazioni() (lib/dotazioni.ts)");
  prova(
    /const amenities = vociSchema\(/.test(scheda),
    "scheda annuncio: `amenities` (JSON-LD) non è costruito con vociSchema() — un elenco fatto a mano torna a dire «non vuoto = c'è»",
  );
  const aMano = scheda.split("\n").filter((r) => /&&\s*t\(\s*"[^"]+"\s*\)\s*,\s*$/.test(r));
  prova(
    aMano.length === 0,
    `scheda annuncio: voci scritte a mano come «campo && t("…")» — ${aMano.map((r) => r.trim()).join(" · ")}`,
  );
  prova(
    !/\?\s*property\.\w+\s*:\s*t\("yes"\)/.test(scheda),
    'scheda annuncio: una riga della tabella dà t("yes") alla sola presenza del campo (è il «Lift: Yes» del 06/10) — usare lo stato di statoDotazioni()',
  );

  const seo = readFileSync(join(ROOT, "src/lib/seo.ts"), "utf8");
  const a = seo.indexOf("amenityFeature:");
  prova(a >= 0, "lib/seo.ts: amenityFeature non trovato");
  if (a >= 0) {
    const blocco = seo.slice(a, a + 260);
    prova(!/value:\s*true/.test(blocco), "lib/seo.ts: amenityFeature scrive `value: true` fisso — il valore viene dalla voce (a.value)");
    prova(/value:\s*a\.value/.test(blocco), "lib/seo.ts: amenityFeature non legge il valore della voce (a.value)");
  }
}

if (errori.length) {
  console.error(`✗ check-dotazioni: ${errori.length} ${errori.length === 1 ? "difetto" : "difetti"}`);
  for (const e of errori) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`✓ check-dotazioni: ${SCELTA.length + PARCHEGGIO.length + PISCINA.length} letture, scheda e JSON-LD dalla stessa regola`);
