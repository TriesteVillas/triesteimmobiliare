// ─────────────────────────────────────────────────────────────────────────────
// SPLIT CONSERVATIVO "Nome Cognome" → { nome, cognome } per i form del sito.
//
// Il form dell'annuncio ha UN campo nome libero: la gente ci scrive "Mario
// Rossi" intero, e il lead nasceva con il nome pieno in `nome` e `cognome`
// vuoto — è così che il portale proprietari è arrivato a mostrare cognomi
// interi dei lead (visto da Martino il 30/07). `nome_completo` conserva SEMPRE
// la stringa intera; qui si separano SOLO i casi certi, il resto passa intero
// (li bonifica il CRM: stessa euristica in tsv-crm src/lib/nomesplit.ts, che è
// la versione MADRE — se cambi qualcosa qui, allineala lì e viceversa).
// ─────────────────────────────────────────────────────────────────────────────

const PARTICELLE = new Set([
  "de", "di", "del", "della", "delle", "dei", "degli", "dell", "da", "dal", "dalla",
  "la", "le", "lo", "li", "van", "von", "der", "den", "ter", "ten", "op", "mc", "mac",
  "al", "el", "bin", "ben", "abu", "dos", "das", "du", "des", "st", "san", "santa", "d", "de'",
]);
const SECONDI_NOMI = new Set([
  "maria", "grazia", "teresa", "rita", "luisa", "paola", "laura", "rosa", "pia",
  "cristina", "chiara", "francesca", "elena", "anna", "giulia", "carla", "lucia", "antonietta", "giuseppina",
]);
const PRIMI_COMPOSTI = new Set(["gian", "pier"]);
const AZIENDA = /(^|[\s.,])(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?|gmbh|a\.?g\.?|ltd|llc|inc|kft|b\.?v\.?|sarl|oy|ab|d\.?o\.?o\.?|immobiliare|immobiliari|agenzia|agency|studio|impresa|costruzioni|amministrazioni|amministratore|condominio|associazione|societ[aà]|company|holding|group|gruppo|real\s*estate|properties|servizi|tecnocasa|remax|re\/max|gabetti)([\s.,]|$)/i;

/** Split SOLO nei casi certi; null = lasciare il nome intero com'è. */
export function splitNomeCerta(raw: string): { nome: string; cognome: string } | null {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!s || /[\d@,]/.test(s) || AZIENDA.test(s)) return null;
  const t = s.split(" ");
  if (t.length < 2 || t.length > 4) return null;
  if (t.some((x) => /^[A-Za-zÀ-ÿ]\.?$/.test(x))) return null; // iniziali puntate
  const low = t.map((x) => x.toLowerCase().replace(/[.']+$/, ""));
  if (PARTICELLE.has(low[0])) return null; // "De Rossi Mario": ordine incerto

  // particella in mezzo → il cognome inizia lì ("Andrea De Rossi" → De Rossi);
  // certa solo in seconda posizione, o in terza dietro un doppio nome noto
  // ("Maria Grazia De Rossi") — altrimenti può essere un cognome composto
  // ("Martino Coppola di Canzano") e non si decide qui.
  for (let i = 1; i < t.length - 1; i++) {
    if (!PARTICELLE.has(low[i])) continue;
    if (i === 1 || (i === 2 && (SECONDI_NOMI.has(low[1]) || PRIMI_COMPOSTI.has(low[0])))) {
      return { nome: t.slice(0, i).join(" "), cognome: t.slice(i).join(" ") };
    }
    return null;
  }
  if (t.length === 2) {
    // "Anna Maria" / "Gian Marco": più probabilmente un nome doppio senza cognome.
    if (SECONDI_NOMI.has(low[1]) || PRIMI_COMPOSTI.has(low[0])) return null;
    return { nome: t[0], cognome: t[1] };
  }
  if (t.length === 3 && (SECONDI_NOMI.has(low[1]) || PRIMI_COMPOSTI.has(low[0]))) {
    return { nome: t.slice(0, 2).join(" "), cognome: t[2] }; // "Maria Grazia Rossi"
  }
  return null;
}
