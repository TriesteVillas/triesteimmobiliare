// Opzioni delle preferenze strutturate dell'account (chips cliccabili al posto
// del testo libero). I codici zona sono quelli del portfolio (ZONE_ORDER di
// lib/properties: le etichette localizzate vivono nel namespace i18n "zones").
// Le fasce budget sono di BRAND: questo file diverge di proposito dal gemello
// TriesteVillas (qui si parla mid-market, non luxury). Le stringhe sono i valori canonici che
// finiscono in WEB_ACCOUNTS.criteri_json.

export const PREF_ZONES = [
  "CENTRO",
  "SEMICENTRO",
  "BARCOLA",
  "BARCOLA-MIRAMARE",
  "COSTIERA",
  "SISTIANA-DUINO",
  "ALTE",
  "MUGGIA",
  "FVG",
] as const;

export const PREF_BUDGETS = ["<100k", "100-200k", "200-350k", "350k+"] as const;

export const PREF_TIPOLOGIE = [
  "Appartamento",
  "Attico",
  "Villa",
  "Casa indipendente",
  "Nuova costruzione",
  "Da ristrutturare",
] as const;

export const PREF_MUST = [
  "terrazzo",
  "giardino",
  "garage",
  "ascensore",
] as const;

export const PREF_ACQUISTO = ["prima", "seconda"] as const;

// Le preferenze strutturate come viaggiano (criteri_json) e come si validano.
export type CriteriJson = {
  v: 1;
  zones: string[];
  budget: string;
  tipologie: string[];
  camereMin: number | null;
  must: string[];
  acquisto: "prima" | "seconda" | "";
  note: string;
};

export function emptyCriteri(): CriteriJson {
  return { v: 1, zones: [], budget: "", tipologie: [], camereMin: null, must: [], acquisto: "", note: "" };
}

export function parseCriteriJson(raw: string): CriteriJson {
  try {
    const d = JSON.parse(raw) as Partial<CriteriJson>;
    return sanitizeCriteri(d);
  } catch {
    return emptyCriteri();
  }
}

export function sanitizeCriteri(d: Partial<CriteriJson>): CriteriJson {
  const inList = (v: unknown, list: readonly string[]) => typeof v === "string" && list.includes(v);
  const pick = (arr: unknown, list: readonly string[], max: number) =>
    Array.isArray(arr) ? [...new Set(arr.filter((x): x is string => inList(x, list)))].slice(0, max) : [];
  const cam = d.camereMin;
  return {
    v: 1,
    zones: pick(d.zones, PREF_ZONES, PREF_ZONES.length),
    budget: inList(d.budget, PREF_BUDGETS) ? (d.budget as string) : "",
    tipologie: pick(d.tipologie, PREF_TIPOLOGIE, PREF_TIPOLOGIE.length),
    camereMin: typeof cam === "number" && cam >= 1 && cam <= 6 ? Math.round(cam) : null,
    must: pick(d.must, PREF_MUST, PREF_MUST.length),
    acquisto: inList(d.acquisto, PREF_ACQUISTO) ? (d.acquisto as "prima" | "seconda") : "",
    note: typeof d.note === "string" ? d.note.trim().slice(0, 600) : "",
  };
}

// Riassunto leggibile per WEB_ACCOUNTS.criteri: è ciò che vedono operatore CRM
// e motore (profilo_ai) — sempre in italiano, il linguaggio interno del CRM.
export function criteriSummary(c: CriteriJson): string {
  const parts: string[] = [];
  if (c.zones.length) parts.push(`Zone: ${c.zones.join(", ")}`);
  if (c.budget) parts.push(`Budget: ${c.budget}`);
  if (c.tipologie.length) parts.push(`Tipologia: ${c.tipologie.join(", ")}`);
  if (c.camereMin) parts.push(`Camere: ${c.camereMin}+`);
  if (c.must.length) parts.push(`Irrinunciabili: ${c.must.join(", ")}`);
  if (c.acquisto) parts.push(`Acquisto: ${c.acquisto} casa`);
  if (c.note) parts.push(`Note: ${c.note}`);
  return parts.join(" · ");
}
