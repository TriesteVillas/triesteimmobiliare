// ─────────────────────────────────────────────────────────────────────────────
// «IMMOBILI SIMILI» — le card in fondo alla scheda annuncio.
//
// ⚠️ GEMELLO IDENTICO in triestevillas-web, triesteimmobiliare, friulivillas e
// triesteaffitti (src/lib/simili.ts): si cambia in tutti e quattro, o i siti
// tornano a proporre con quattro logiche diverse. Modulo PURO: niente fetch,
// niente import — riceve il catalogo e sceglie.
//
// PERCHÉ È STATO RIFATTO (02/10/2026). La versione precedente, copiata uguale
// nei quattro repo, dava +3 alla zona IDENTICA come stringa, +1 al comune, +2/+1
// al prezzo entro ±30/60%. Misurata sulle 58 schede di triestevillas.com:
//  · 20 schede proponevano una casa VENDUTA (nessun filtro sullo stato);
//  · 35 avevano due o più unità dello stesso progetto o edificio (le 7 di
//    Palazzo Haggi si rubavano le card a vicenda);
//  · 26 mescolavano ville e appartamenti (la tipologia non contava) — 14 pur
//    avendo almeno tre alternative della famiglia giusta nello stesso comune;
//  · l'appartamento di Barcola a 585.000 non vedeva l'altro di Barcola a
//    540.000: uno è taggato BARCOLA, l'altro BARCOLA-MIRAMARE, e il confronto
//    era fra stringhe — l'alias che il resto del sito applica (ZONE_ALIAS in
//    properties.ts) qui non passava;
//  · e ne mostrava 4 in una griglia da 3: una card orfana su desktop.
//
// LE REGOLE sono quelle che Martino ha dato il 04/08 per le «case simili»
// della conferma visita nel CRM (tsv-pg web/lib/conferma/case-simili.ts):
// fascia di prezzo ±25% simmetrica, la ZONA pesa più della tipologia, col
// VICINATO; nessun criterio esclude — se coi criteri stretti non ce ne sono
// abbastanza la scelta si allarga da sola, perché i punti degradano invece di
// azzerarsi. Le zone confinanti sono le stesse coppie della configurazione
// viva del CRM (`visitconfirm_cfg`, letta il 02/10/2026).
//
// IN PIÙ rispetto al CRM, per difetti misurati qui:
//  · BARCOLA e BARCOLA-MIRAMARE sono la STESSA zona (stesso alias del sito);
//  · la DISTANZA dalle coordinate: a pochi passi conta come stessa zona anche
//    se l'etichetta dice altro, e un'etichetta larga come «FVG» (Sappada e
//    Grado nello stesso secchio) smette di valere «stessa zona» oltre 25 km;
//  · la SUPERFICIE: a chi guarda 132 m² non si propone una villa di 394;
//  · un prezzo MOLTO fuori budget pesa CONTRO, non solo «non aiuta»;
//  · al massimo UNA unità per progetto o edificio;
//  · niente case senza copertina (una card senza foto non è una card).
//
// I FILTRI DURI non si allargano mai, nemmeno per arrivare a n: stessa casa,
// contratto diverso, stato diverso da ACTIVE (venduta, sotto offerta), niente
// copertina. Sono le condizioni perché la card non menta.
// ─────────────────────────────────────────────────────────────────────────────

/** I soli campi che la scelta legge. I campi facoltativi mancano in alcuni dei
 *  quattro siti: dove mancano, quel criterio semplicemente non dà punti. */
export type CasaPerSimili = {
  slug: string;
  contratto: string | null;
  tipologia: string | null;
  zona: string | null;
  comune: string | null;
  lat: number | null;
  lng: number | null;
  priceSale: number | null;
  priceRent: number | null;
  mq: number | null;
  progetto?: string | null;
  statusCommerciale?: string | null;
  coverPhoto?: unknown;
  /** Booleano su TSV, stringa su TriesteAffitti («No», «true»…). */
  vistaMare?: boolean | string | null;
};

const norm = (s: unknown) => String(s ?? "").trim().toUpperCase().replace(/\s*-\s*/g, "-");

// Due etichette per lo stesso tratto di costa, usate negli anni in modo
// intercambiabile. Stessa fusione di ZONE_ALIAS in triestevillas-web.
const ZONA_ALIAS: Record<string, string> = { "BARCOLA-MIRAMARE": "BARCOLA" };
const zonaDi = (z: string | null) => {
  const n = norm(z);
  return ZONA_ALIAS[n] ?? n;
};

// ⚠️ UN GIUDIZIO, NON UN DATO: le coppie della configurazione del CRM
// (Regole conferma → zone confinanti), già con l'alias applicato.
const VICINATO: [string, string][] = [
  ["CENTRO", "SEMICENTRO"],
  ["SEMICENTRO", "ALTE"],
  ["SEMICENTRO", "BARCOLA"],
  ["BARCOLA", "COSTIERA"],
  ["COSTIERA", "SISTIANA-DUINO"],
];
const confinanti = (a: string, b: string) =>
  VICINATO.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// Un attico e un loft sono cugini di un appartamento; una villetta a schiera
// lo è di una villa. La famiglia vale meno della tipologia identica.
const FAMIGLIA: Record<string, string> = {
  APPARTAMENTO: "orizzontale",
  "ATTICO-MANSARDA": "orizzontale",
  LOFT: "orizzontale",
  VILLA: "indipendente",
  "VILLETTA A SCHIERA": "indipendente",
  "CASA INDIPENDENTE": "indipendente",
};

export const FASCIA = 0.25;
/** Oltre questa distanza un'etichetta di zona comune non vale più «stessa zona». */
const ZONA_TROPPO_LARGA_KM = 25;

function km(a: CasaPerSimili, b: CasaPerSimili): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Luogo, max 100: stessa zona 100 · confinante 70 · stesso comune 40 — oppure
 *  la distanza, se dice di più (100 entro 800 m, a scendere fino a 6 km). In
 *  linea d'aria: Muggia e il Centro sono vicini sulla carta e lontani in
 *  strada, per questo la distanza si spegne presto. */
export function puntiLuogo(c: CasaPerSimili, v: CasaPerSimili): number {
  const za = zonaDi(v.zona);
  const zb = zonaDi(c.zona);
  const d = km(c, v);
  let etichetta = 0;
  if (za && za === zb) etichetta = d != null && d > ZONA_TROPPO_LARGA_KM ? 40 : 100;
  else if (za && zb && confinanti(za, zb)) etichetta = 70;
  else if (norm(v.comune) && norm(v.comune) === norm(c.comune)) etichetta = 40;
  const vicinanza = d == null ? 0 : d <= 0.8 ? 100 : Math.max(0, Math.round(100 * (1 - (d - 0.8) / 5.2)));
  return Math.max(etichetta, vicinanza);
}

/** Tipologia: identica 60 · stessa famiglia 35 · famiglia DIVERSA −40.
 *  Il −40 non c'è nel CRM, ed è voluto: lì una villa e un appartamento si
 *  separano solo per i 60 punti mancanti, e qui superficie e distanza — che
 *  il CRM non ha — bastavano a colmarli (la villa di Via Buonarroti si vedeva
 *  proporre due appartamenti prima di una villa). A parità di famiglia la zona
 *  resta il criterio che pesa di più. */
export function puntiTipologia(c: CasaPerSimili, v: CasaPerSimili): number {
  const a = norm(v.tipologia);
  const b = norm(c.tipologia);
  if (!a || !b) return 0;
  if (a === b) return 60;
  if (!FAMIGLIA[a] || !FAMIGLIA[b]) return 0;
  return FAMIGLIA[a] === FAMIGLIA[b] ? 35 : -40;
}

/** Prezzo: dentro la fascia ±25% da 70 a 20. Fuori si ragiona sul RAPPORTO,
 *  perché un terzo del prezzo e il triplo sono lontani uguale (in percentuale
 *  sarebbero −67% e +200%, e la casa più economica la passerebbe liscia): fino
 *  a 1,5 volte (o due terzi) scende a 0, oltre pesa contro — −29 al doppio,
 *  −69 al triplo, tetto −80. Una casa da 1,29 M€ non è «simile» per chi ne
 *  guarda una da 585.000, né un trilocale da 441.000 per chi guarda un attico
 *  da 1,35 M€. */
export function puntiPrezzo(prezzo: number | null, target: number | null): number {
  if (!(prezzo != null && prezzo > 0) || !(target != null && target > 0)) return 0;
  const d = Math.abs(prezzo - target) / target;
  if (d <= FASCIA) return Math.round(20 + 50 * (1 - d / FASCIA));
  const r = Math.abs(Math.log(prezzo / target));
  const bordo = Math.log(prezzo > target ? 1 + FASCIA : 1 / (1 - FASCIA));
  const limite = Math.log(1.5);
  if (r <= limite) return Math.round(18 * (1 - (r - bordo) / (limite - bordo)));
  return Math.max(-80, Math.round(-(r - limite) * 100));
}

/** Superficie, sul rapporto (132 contro 165 pesa come 132 contro 106): entro
 *  ±25% da 30 a 10; fino al doppio scende a 0; oltre pesa contro, tetto −30. */
export function puntiSuperficie(mq: number | null, target: number | null): number {
  if (!(mq != null && mq > 0) || !(target != null && target > 0)) return 0;
  const r = Math.abs(Math.log(mq / target));
  const stretta = Math.log(1.25);
  const larga = Math.log(2);
  if (r <= stretta) return Math.round(10 + 20 * (1 - r / stretta));
  if (r <= larga) return Math.round(8 * (1 - (r - stretta) / (larga - stretta)));
  return Math.max(-30, Math.round(-(r - larga) * 30));
}

// Il prezzo che il sito MOSTRA, secondo il contratto (stessa regola di
// priceLabel): un affitto si confronta sul canone. Il 0292 di TriesteAffitti
// porta nel record anche un vecchio prezzo di vendita (220.000) accanto al
// canone di 820 — con «priceSale prima» veniva confrontato su quello.
const prezzoDi = (p: CasaPerSimili) =>
  norm(p.contratto) === "AFFITTO" ? (p.priceRent ?? p.priceSale ?? null) : (p.priceSale ?? p.priceRent ?? null);
// Stessa lettura del `si()` della scheda di TriesteAffitti.
const conVista = (v: CasaPerSimili["vistaMare"]) =>
  typeof v === "string" ? !/^(no|false|0)?$/i.test(v.trim()) : Boolean(v);

export function punteggio(c: CasaPerSimili, v: CasaPerSimili): number {
  return (
    puntiLuogo(c, v) +
    puntiTipologia(c, v) +
    puntiPrezzo(prezzoDi(c), prezzoDi(v)) +
    puntiSuperficie(c.mq, v.mq) +
    (conVista(v.vistaMare) && conVista(c.vistaMare) ? 10 : 0)
  );
}

// Lo stesso progetto (Haggi, Dreher, Duino…) o lo stesso edificio (stesse
// coordinate a ~10 m) è UN gruppo: una card sola per gruppo.
function gruppo(p: CasaPerSimili): string {
  if (norm(p.progetto)) return `progetto:${norm(p.progetto)}`;
  if (p.lat != null && p.lng != null) return `edificio:${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
  return `casa:${p.slug}`;
}

/** Le n case da proporre sotto `corrente`, già ordinate. Meno di n solo se il
 *  catalogo non ne ha altre che passano i filtri duri. */
export function scegliSimili<T extends CasaPerSimili>(corrente: T, tutte: T[], n = 3): T[] {
  const target = prezzoDi(corrente);
  const candidate = tutte
    .filter(
      (c) =>
        c.slug !== corrente.slug &&
        norm(c.contratto) === norm(corrente.contratto) &&
        // Vuoto = non lo sappiamo e si passa; qualunque altro stato no.
        (!c.statusCommerciale || norm(c.statusCommerciale) === "ACTIVE") &&
        Boolean(c.coverPhoto),
    )
    .map((c) => ({ c, punti: punteggio(c, corrente), km: km(c, corrente) }))
    .sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      // A parità: il prezzo più vicino, poi la casa più vicina, poi lo slug —
      // senza un ultimo criterio stabile la stessa scheda cambierebbe vicini a
      // ogni giro di cache. La distanza prima dello slug non è un dettaglio: su
      // TriesteAffitti metà delle case non ha canone né metri quadri, i pareggi
      // sono la norma, e lo slug è il nome della via — l'ordine alfabetico delle
      // strade decideva chi compariva.
      const pa = prezzoDi(a.c);
      const pb = prezzoDi(b.c);
      if (target && pa && pb && pa !== pb) return Math.abs(pa - target) - Math.abs(pb - target);
      if (a.km != null && b.km != null && a.km !== b.km) return a.km - b.km;
      return a.c.slug < b.c.slug ? -1 : a.c.slug > b.c.slug ? 1 : 0;
    })
    .map((x) => x.c);

  const scelte: T[] = [];
  const gruppiUsati = new Set<string>();
  for (const c of candidate) {
    if (scelte.length === n) break;
    const g = gruppo(c);
    if (gruppiUsati.has(g)) continue;
    scelte.push(c);
    gruppiUsati.add(g);
  }
  // Catalogo piccolo (TSI ha 6 unità di Duino su 17): se una per gruppo non
  // basta a riempire, si completa coi migliori rimasti invece di mostrarne meno.
  for (const c of candidate) {
    if (scelte.length === n) break;
    if (!scelte.includes(c)) scelte.push(c);
  }
  return scelte;
}
