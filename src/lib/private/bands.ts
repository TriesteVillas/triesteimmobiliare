// Fasce di budget condivise da teaser pubblici, form di richiesta e campo
// Airtable PC_RICHIESTE.budget_bands (le stringhe SONO i nomi delle opzioni).
//
// Sono deliberatamente diverse da quelle di TriesteVillas (<1M / 1-2M / 2-3M /
// 3M+). Su appartamenti mid-market quelle fasce non discriminerebbero nulla:
// cadrebbe tutto nella prima. Qui la scala è calibrata sul portafoglio reale —
// prima casa e immobili da reddito — così la fascia dichiarata dal richiedente
// dice davvero qualcosa a chi legge la coda.
export const BUDGET_BANDS = ["<100k", "100-200k", "200-350k", "350k+"] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

// Prezzo di vendita (EUR) → fascia grossolana. Null/0 → null (nessuna fascia).
export function bandForPrice(price: number | null): BudgetBand | null {
  if (!price || price <= 0) return null;
  if (price < 100_000) return "<100k";
  if (price < 200_000) return "100-200k";
  if (price < 350_000) return "200-350k";
  return "350k+";
}

// Etichetta leggibile. Il valore canonico resta "<100k" ecc.
export function bandLabel(band: BudgetBand): string {
  switch (band) {
    case "<100k":
      return "< € 100k";
    case "100-200k":
      return "€ 100–200k";
    case "200-350k":
      return "€ 200–350k";
    case "350k+":
      return "€ 350k +";
  }
}

// Forbice di prezzo del teaser, in scaglioni da 50k: "€ 150–200k", "€ 250–300k".
// Usata SOLO per le ghost card pubbliche (la cifra resta nascosta, si rivela solo
// la forbice). Lo scaglione è 50k e non 200k come su TriesteVillas: con scaglioni
// da 200k quasi tutto il portafoglio finirebbe in una o due caselle e il teaser
// non direbbe più niente. Null/0 → null.
export function priceSlotLabel(price: number | null): string | null {
  if (!price || price <= 0) return null;
  const STEP = 50_000;
  const lo = Math.floor(price / STEP) * STEP;
  const hi = lo + STEP;
  if (lo === 0) return "< € 50k";
  const part = (v: number): { num: string; unit: "k" | "M" } => {
    if (v < 1_000_000) return { num: String(Math.round(v / 1000)), unit: "k" };
    const m = v / 1_000_000;
    return { num: Number.isInteger(m) ? String(m) : m.toFixed(1).replace(".", ","), unit: "M" };
  };
  const a = part(lo);
  const b = part(hi);
  const body = a.unit === b.unit ? `${a.num}–${b.num}${b.unit}` : `${a.num}${a.unit}–${b.num}${b.unit}`;
  return `€ ${body}`;
}
