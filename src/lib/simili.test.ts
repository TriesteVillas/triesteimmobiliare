// Casi noti e invarianti degli «immobili simili» (scegliSimili, funzione pura).
//
// Gemello del test di triestevillas-web (src/lib/simili.test.ts): stesse
// invarianti, stesso metro, stesso modulo sotto prova (simili.ts è identico nei
// quattro portali). Gira da `npm test`, quindi dal prebuild.
//
// ⚠️ LA FIXTURE È INVENTATA, e deve restarlo: questo repo è PUBBLICO. Quella di
// TSV è il catalogo vero (codici di catalogo, coordinate, prezzi, case vendute):
// qui no — codici «CASA-…», coordinate arrotondate a quartieri plausibili,
// prezzi e superfici di fantasia. Riproduce le FORME dei difetti misurati il
// 02/10 (una casa venduta nella fascia, un cantiere con più unità, due
// etichette per Barcola, una casa indipendente fra gli appartamenti), non le case.
//
// IL METRO DEVE SAPER DIRE DI NO: le stesse invarianti girano anche sulla
// funzione di prima (`vecchia`, copiata com'era fino al 02/10) e devono
// trovarla in difetto. Se un giorno non la trovano più, il metro è rotto.
import { scegliSimili, puntiLuogo, puntiPrezzo, type CasaPerSimili } from "./simili";

let falliti = 0;
function pari(nome: string, avuto: unknown, atteso: unknown) {
  const a = JSON.stringify(avuto);
  const b = JSON.stringify(atteso);
  if (a === b) return;
  falliti += 1;
  console.error(`✗ ${nome}: atteso ${b}, avuto ${a}`);
}

type Riga = CasaPerSimili & { coverPhoto: boolean };

const casa = (
  slug: string,
  tipologia: string | null,
  zona: string,
  comune: string,
  lat: number | null,
  lng: number | null,
  priceSale: number | null,
  mq: number | null,
  extra: Partial<Riga> = {},
): Riga => ({
  slug, contratto: "VENDITA", tipologia, zona, comune, lat, lng, priceSale, priceRent: null, mq,
  progetto: null, statusCommerciale: "ACTIVE", coverPhoto: true, vistaMare: false, ...extra,
});

const VENDUTA = { statusCommerciale: "SOLD" } as const;
const CANTIERE_A = { progetto: "CANTIERE-A" } as const;
const CANTIERE_B = { progetto: "CANTIERE-B" } as const;

const CATALOGO: Riga[] = [
  // Centro
  casa("CASA-01", "Appartamento", "CENTRO", "Trieste", 45.651, 13.772, 300_000, 80),
  casa("CASA-02", "Appartamento", "CENTRO", "Trieste", 45.648, 13.769, 340_000, 90),
  casa("CASA-03", "Appartamento", "CENTRO", "Trieste", 45.653, 13.776, 420_000, 110),
  casa("CASA-04", "Attico - Mansarda", "CENTRO", "Trieste", 45.645, 13.766, 650_000, 140),
  casa("CASA-05", "Appartamento", "CENTRO", "Trieste", 45.649, 13.774, 380_000, 95, VENDUTA),
  // un cantiere con quattro unità nello stesso palazzo
  casa("CASA-06", "Appartamento", "CENTRO", "Trieste", 45.646, 13.767, 400_000, 100, CANTIERE_A),
  casa("CASA-07", "Appartamento", "CENTRO", "Trieste", 45.646, 13.767, 410_000, 102, CANTIERE_A),
  casa("CASA-08", "Appartamento", "CENTRO", "Trieste", 45.646, 13.767, 430_000, 108, CANTIERE_A),
  casa("CASA-09", "Appartamento", "CENTRO", "Trieste", 45.646, 13.767, 450_000, 115, CANTIERE_A),
  // Semicentro
  casa("CASA-10", "Villa", "SEMICENTRO", "Trieste", 45.655, 13.786, 900_000, 300),
  casa("CASA-11", "Appartamento", "SEMICENTRO", "Trieste", 45.656, 13.784, 280_000, 75),
  casa("CASA-12", "Villa", "SEMICENTRO", "Trieste", 45.659, 13.781, 650_000, 250),
  casa("CASA-13", "Casa indipendente", "SEMICENTRO", "Trieste", 45.657, 13.789, 310_000, 120),
  // Altipiano
  casa("CASA-14", "Villa", "ALTE", "Trieste", 45.676, 13.801, 700_000, 220),
  casa("CASA-15", "Villetta a schiera", "ALTE", "Trieste", 45.672, 13.795, 450_000, 180),
  // Barcola: due etichette per la stessa costa
  casa("CASA-16", "Appartamento", "BARCOLA", "Trieste", 45.682, 13.755, 585_000, 132),
  casa("CASA-17", "Appartamento", "BARCOLA-MIRAMARE", "Trieste", 45.679, 13.756, 540_000, 150),
  casa("CASA-18", "Attico - Mansarda", "BARCOLA", "Trieste", 45.693, 13.739, 1_290_000, 147),
  casa("CASA-19", "Villa", "BARCOLA", "Trieste", 45.690, 13.743, 800_000, 230),
  casa("CASA-20", "Appartamento", "BARCOLA", "Trieste", 45.688, 13.746, 820_000, 160),
  casa("CASA-21", "Attico - Mansarda", "BARCOLA", "Trieste", 45.686, 13.748, 350_000, 70),
  casa("CASA-22", "Appartamento", "BARCOLA", "Trieste", 45.691, 13.741, 860_000, 170),
  // Costiera: metà delle ville sono vendute
  casa("CASA-23", "Villa", "COSTIERA", "Trieste", 45.728, 13.690, 1_580_000, 300),
  casa("CASA-24", "Villa", "COSTIERA", "Trieste", 45.713, 13.709, 3_800_000, 700, VENDUTA),
  casa("CASA-25", "Villa", "COSTIERA", "Trieste", 45.713, 13.709, 2_420_000, 470, VENDUTA),
  casa("CASA-26", "Appartamento", "COSTIERA", "Trieste", 45.727, 13.691, 980_000, 150),
  casa("CASA-27", "Villa", "COSTIERA", "Trieste", 45.732, 13.686, 950_000, 205),
  // Muggia
  casa("CASA-28", "Villa", "MUGGIA", "Muggia", 45.598, 13.748, 1_800_000, 470),
  casa("CASA-29", "Villa", "MUGGIA", "Muggia", 45.599, 13.751, 980_000, 250),
  casa("CASA-30", "Villa", "MUGGIA", "Muggia", 45.598, 13.748, 890_000, 222),
  casa("CASA-31", "Villa", "MUGGIA", "Muggia", 45.597, 13.751, 680_000, 180),
  // Sistiana-Duino: un altro cantiere, e un attico di pregio
  casa("CASA-32", "Appartamento", "SISTIANA-DUINO", "Duino-Aurisina", 45.774, 13.603, 396_000, 102, CANTIERE_B),
  casa("CASA-33", "Appartamento", "SISTIANA-DUINO", "Duino-Aurisina", 45.774, 13.603, 261_000, 70, CANTIERE_B),
  casa("CASA-34", "Appartamento", "SISTIANA-DUINO", "Duino-Aurisina", 45.774, 13.603, 441_000, 97, CANTIERE_B),
  casa("CASA-35", "Appartamento", "SISTIANA-DUINO", "Duino-Aurisina", 45.774, 13.603, 350_000, 97, CANTIERE_B),
  casa("CASA-36", "Villetta a schiera", "SISTIANA-DUINO", "Duino-Aurisina", null, null, 575_000, 259),
  casa("CASA-37", "Appartamento", "SISTIANA-DUINO", "Duino-Aurisina", 45.768, 13.638, 1_350_000, 156),
  casa("CASA-43", "Appartamento", "SISTIANA-DUINO", "Duino-Aurisina", 45.765, 13.642, 1_100_000, 140),
  casa("CASA-44", "Attico - Mansarda", "COSTIERA", "Trieste", 45.722, 13.697, 1_250_000, 180),
  // FVG: un'etichetta larga, da Ronchi a Sappada
  casa("CASA-38", "Villa", "FVG", "Ronchi dei Legionari", 45.824, 13.500, 555_000, 474),
  casa("CASA-39", "Villa", "FVG", "San Canzian d'Isonzo", 45.823, 13.465, 350_000, 268),
  casa("CASA-40", "Appartamento", "FVG", "Sappada", 46.566, 12.680, 485_000, 83, VENDUTA),
  casa("CASA-41", "Villa", "FVG", "Cervignano del Friuli", null, null, 1_460_000, 450),
  casa("CASA-42", null, "FVG", "Grado", 45.678, 13.398, 3_000_000, null),
];

const per = (slug: string) => {
  const c = CATALOGO.find((x) => x.slug === slug);
  if (!c) throw new Error(`fixture senza ${slug}`);
  return c;
};
const slugs = (xs: Riga[]) => xs.map((x) => x.slug);
type Sceglitore = (c: Riga, tutte: Riga[]) => Riga[];
const nuova: Sceglitore = (c, tutte) => scegliSimili(c, tutte);
// La scheda ne chiede quattro (la quarta si vede solo nella griglia da due).
const nuova4: Sceglitore = (c, tutte) => scegliSimili(c, tutte, 4);

// La funzione com'era fino al 02/10/2026, identica nei quattro siti.
const vecchia: Sceglitore = (current, all) => {
  const price = current.priceSale ?? current.priceRent ?? null;
  return all
    .filter((p) => p.slug !== current.slug && p.contratto === current.contratto)
    .map((p) => {
      const pp = p.priceSale ?? p.priceRent ?? null;
      let score = 0;
      if (current.zona && p.zona === current.zona) score += 3;
      else if (current.comune && p.comune === current.comune) score += 1;
      let dist = Number.POSITIVE_INFINITY;
      if (price && pp) {
        dist = Math.abs(pp - price) / price;
        if (dist <= 0.3) score += 2;
        else if (dist <= 0.6) score += 1;
      }
      return { p, score, dist };
    })
    .sort((a, b) => b.score - a.score || a.dist - b.dist)
    .slice(0, 4)
    .map((x) => x.p);
};

// --- Invarianti su TUTTE le schede ------------------------------------------
const FAM: Record<string, string> = {
  APPARTAMENTO: "o", "ATTICO - MANSARDA": "o", VILLA: "i", "VILLETTA A SCHIERA": "i", "CASA INDIPENDENTE": "i",
};
const fam = (r: Riga) => FAM[(r.tipologia ?? "").toUpperCase()] ?? "";
const zona = (r: Riga) => ((r.zona ?? "").toUpperCase() === "BARCOLA-MIRAMARE" ? "BARCOLA" : (r.zona ?? "").toUpperCase());
const gruppo = (r: Riga) => r.progetto ?? (r.lat != null && r.lng != null ? `${r.lat.toFixed(4)},${r.lng.toFixed(4)}` : r.slug);
const prezzo = (r: Riga) => r.priceSale ?? r.priceRent ?? 0;

function difetti(fn: Sceglitore) {
  const d = { venduta: 0, stessoGruppo: 0, gemelloIgnorato: 0, quanteNonTre: 0, famiglieMescolate: 0 };
  for (const c of CATALOGO) {
    const s = fn(c, CATALOGO);
    if (s.some((x) => x.statusCommerciale !== "ACTIVE")) d.venduta += 1;
    const gruppi = s.map(gruppo);
    if (new Set(gruppi).size < gruppi.length) d.stessoGruppo += 1;
    if (s.length !== 3) d.quanteNonTre += 1;
    // Il caso di Barcola, generalizzato: esiste una casa attiva della stessa
    // zona, della stessa famiglia, entro ±25% di prezzo — e non è proposta.
    const gemelli = CATALOGO.filter(
      (x) => x.slug !== c.slug && x.statusCommerciale === "ACTIVE" && zona(x) && zona(x) === zona(c) &&
        fam(x) && fam(x) === fam(c) && Math.abs(prezzo(x) - prezzo(c)) <= 0.25 * prezzo(c),
    );
    if (gemelli.length > 0 && !s.some((x) => gemelli.includes(x))) d.gemelloIgnorato += 1;
    // Famiglie mescolate: a chi guarda un appartamento si propone una casa
    // indipendente (o il contrario) mentre il catalogo ha almeno tre case
    // attive della SUA famiglia nello stesso comune, entro ±50% di prezzo.
    const affini = CATALOGO.filter(
      (x) => x.slug !== c.slug && x.statusCommerciale === "ACTIVE" && fam(x) === fam(c) && x.comune === c.comune &&
        Math.abs(prezzo(x) - prezzo(c)) <= 0.5 * prezzo(c),
    );
    if (fam(c) && affini.length >= 3 && s.some((x) => fam(x) && fam(x) !== fam(c))) d.famiglieMescolate += 1;
  }
  return d;
}

const prima = difetti(vecchia);
const dopo = difetti(nuova);
console.log("prima:", JSON.stringify(prima));
console.log("dopo: ", JSON.stringify(dopo));
// Il metro dice di no alla funzione di prima…
pari("metro: la vecchia propone case vendute", prima.venduta > 0, true);
pari("metro: la vecchia raddoppia i progetti", prima.stessoGruppo > 0, true);
pari("metro: la vecchia ignora il gemello di Barcola", prima.gemelloIgnorato > 0, true);
pari("metro: la vecchia mescola le famiglie", prima.famiglieMescolate > 0, true);
// …e di sì alla nuova.
pari("nessuna casa venduta proposta", dopo.venduta, 0);
pari("mai due card dello stesso progetto o edificio", dopo.stessoGruppo, 0);
pari("il gemello di zona c'è sempre", dopo.gemelloIgnorato, 0);
pari("sempre tre card", dopo.quanteNonTre, 0);
pari("indipendenti con indipendenti, appartamenti con appartamenti", dopo.famiglieMescolate, 0);

const dopo4 = difetti(nuova4);
pari("con quattro: nessuna venduta", dopo4.venduta, 0);
pari("con quattro: mai due dello stesso progetto o edificio", dopo4.stessoGruppo, 0);
pari(
  "con quattro: le prime tre sono le stesse",
  CATALOGO.filter((c) => slugs(nuova4(c, CATALOGO)).slice(0, 3).join() !== slugs(nuova(c, CATALOGO)).join()).length,
  0,
);

// --- Casi noti (le forme dei difetti del 02/10) --------------------------------
// Barcola con due etichette: si vedono a vicenda, per prime.
pari("Barcola → prima l'altra di Barcola", slugs(nuova(per("CASA-16"), CATALOGO))[0], "CASA-17");
pari("Barcola-Miramare → prima l'altra di Barcola", slugs(nuova(per("CASA-17"), CATALOGO))[0], "CASA-16");
pari("Barcola 585k: niente attico da 1,29 M€ (fuori budget)", slugs(nuova(per("CASA-16"), CATALOGO)).includes("CASA-18"), false);
// Un cantiere: una sola sorella, il resto fuori dal palazzo.
pari("cantiere → una sola unità del cantiere", nuova(per("CASA-07"), CATALOGO).filter((x) => x.progetto === "CANTIERE-A").length, 1);
// Costiera: le ville vendute non si propongono.
pari(
  "villa in Costiera → nessuna delle vendute",
  slugs(nuova(per("CASA-23"), CATALOGO)).filter((s) => ["CASA-24", "CASA-25"].includes(s)),
  [],
);
// Un trilocale di cantiere da 441.000 non è un'alternativa a un attico da 1,35 M€.
pari("attico da 1,35 M€ → niente trilocale da 441k", slugs(nuova(per("CASA-37"), CATALOGO)).includes("CASA-34"), false);
// Chi guarda una villa da 900k vede case indipendenti.
pari(
  "villa da 900k → solo indipendenti",
  nuova(per("CASA-10"), CATALOGO).map((x) => fam(x)),
  ["i", "i", "i"],
);
// Una casa venduta ha ancora la sua scheda (badge per 30 giorni): i simili servono.
pari("casa venduta → tre simili", nuova(per("CASA-05"), CATALOGO).length, 3);

// --- Le etichette di zona larghe ---------------------------------------------
pari("FVG: Sappada e San Canzian non sono «stessa zona»", puntiLuogo(per("CASA-40"), per("CASA-39")), 40);
pari("FVG: Ronchi e San Canzian sì", puntiLuogo(per("CASA-38"), per("CASA-39")), 100);
pari("alias: BARCOLA = BARCOLA-MIRAMARE", puntiLuogo(per("CASA-17"), per("CASA-16")), 100);

// --- Prezzo ------------------------------------------------------------------
pari("prezzo: identico 70", puntiPrezzo(500_000, 500_000), 70);
pari("prezzo: bordo fascia 20", puntiPrezzo(625_000, 500_000), 20);
pari("prezzo: una volta e mezza 0", puntiPrezzo(750_000, 500_000), 0);
pari("prezzo: il doppio −29", puntiPrezzo(1_000_000, 500_000), -29);
pari("prezzo: la metà −29, come il doppio", puntiPrezzo(250_000, 500_000), -29);
pari("prezzo: un terzo −69, come il triplo", [puntiPrezzo(500_000, 1_500_000), puntiPrezzo(1_500_000, 500_000)], [-69, -69]);
pari("prezzo: assente 0", puntiPrezzo(null, 500_000), 0);

// --- Stabilità e dati mancanti -------------------------------------------------
const rovescio = [...CATALOGO].reverse();
pari(
  "l'ordine del catalogo non cambia la scelta",
  CATALOGO.filter((c) => slugs(nuova(c, CATALOGO)).join() !== slugs(nuova(c, rovescio)).join()).map((c) => c.slug),
  [],
);
const nuda: Riga = {
  slug: "X-NUDA", contratto: "VENDITA", tipologia: null, zona: null, comune: null, lat: null, lng: null,
  priceSale: null, priceRent: null, mq: null, progetto: null, statusCommerciale: null, coverPhoto: true, vistaMare: false,
};
pari("una casa senza dati ha comunque tre simili", nuova(nuda, [...CATALOGO, nuda]).length, 3);
const senzaFoto: Riga = { ...per("CASA-17"), slug: "X-SENZA-FOTO", coverPhoto: false };
pari(
  "una casa senza copertina non si propone",
  slugs(nuova(per("CASA-16"), [...CATALOGO, senzaFoto])).includes("X-SENZA-FOTO"),
  false,
);
// Un affitto si confronta sul canone anche se il record porta un prezzo di vendita.
const affitto = (slug: string, canone: number, vendita: number | null): Riga => ({
  ...nuda, slug, contratto: "AFFITTO", zona: "CENTRO", comune: "Trieste", priceRent: canone, priceSale: vendita,
});
pari(
  "affitto: conta il canone, non un vecchio prezzo di vendita",
  slugs(scegliSimili(affitto("X-A", 900, null), [affitto("X-A", 900, null), affitto("X-VECCHIO", 850, 220_000), affitto("X-CARO", 3000, null)], 1)),
  ["X-VECCHIO"],
);
// A pari punti vince la casa più vicina, non l'ordine alfabetico dello slug.
const qui = (slug: string, lat: number): Riga => ({ ...nuda, slug, zona: "CENTRO", lat, lng: 13.77 });
pari(
  "pareggio: vince la più vicina, non lo slug",
  slugs(scegliSimili(qui("X-QUI", 45.65), [qui("A-LONTANA", 45.66), qui("Z-VICINA", 45.651)], 2)),
  ["Z-VICINA", "A-LONTANA"],
);
pari("affitto con affitto", nuova({ ...nuda, contratto: "AFFITTO" }, CATALOGO).length, 0);

if (falliti > 0) {
  console.error(`${falliti} casi falliti`);
  process.exit(1);
}
console.log("✓ simili.test: tutti i casi noti passano");
