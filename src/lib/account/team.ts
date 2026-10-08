// Contatti del team per l'area riservata (sezione "Le tue visite"): l'email
// personale dell'operatore è pubblica (pagina team del sito); il telefono è
// SEMPRE quello aziendale — i cellulari personali non si espongono.
// VISITE.operatore è testo libero (es. "Cécile"): match accent-insensitive
// sulla prima parola, mai substring (regola namematch del CRM).

// Linea unica del gruppo, telefono e WhatsApp (regola di Martino del
// 09/06/2026): sostituisce il 040 dell'ufficio.
export const AGENCY_PHONE = "331 8940822";
export const AGENCY_PHONE_HREF = "tel:+393318940822";

const OPERATORS: { key: string; email: string }[] = [
  { key: "giada", email: "giada@triestevillas.com" },
  { key: "cecile", email: "cecile@triestevillas.com" },
  { key: "davide", email: "davide@triestevillas.com" },
  { key: "martino", email: "martino@triestevillas.com" },
  { key: "paolo", email: "paolo@triesteimmobiliare.com" },
];

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function operatorEmail(operatore: string): string | null {
  const first = fold(operatore).split(/\s+/)[0] ?? "";
  if (!first) return null;
  return OPERATORS.find((o) => o.key === first)?.email ?? null;
}
