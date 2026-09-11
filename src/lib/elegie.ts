// Ponte verso il sito dedicato del progetto Elegie Duino (verifiche del 10/09/2026):
// - l'apex è l'origine vera: www.elegieduino.it è un 301;
// - /de/ non esiste (404): i visitatori tedeschi vanno su /en/;
// - le ancore EN sono diverse da quelle IT (#planimetrie → #plans, #capitolato → #spec).
// Le UTM vivono qui e in nessun altro posto.
export const ELEGIE_PROGETTO = "DUINO RICCESI";
export const ELEGIE_BASE = "https://elegieduino.it";

export type ElegieSito = "triestevillas.com" | "triesteimmobiliare.com";
export type ElegieAnchor = "planimetrie" | "capitolato" | "contatti";

const PATH: Record<string, string> = { it: "/", en: "/en/", de: "/en/" };
const ANCHOR: Record<ElegieAnchor, [it: string, en: string]> = {
  planimetrie: ["planimetrie", "plans"],
  capitolato: ["capitolato", "spec"],
  contatti: ["contatti", "contact"],
};

/** Vero solo per le unità del progetto Elegie Duino (campo Airtable «Progetto»). */
export function isElegieProgetto(progetto: string | null | undefined): boolean {
  return (progetto ?? "").trim().toUpperCase() === ELEGIE_PROGETTO;
}

/** URL del sito dedicato per lingua, con UTM e (opzionale) ancora dopo la query. */
export function elegieHref(
  locale: string,
  propId: string,
  sito: ElegieSito,
  anchor?: ElegieAnchor,
): string {
  const u = new URL(PATH[locale] ?? PATH.en, ELEGIE_BASE);
  u.searchParams.set("utm_source", sito);
  u.searchParams.set("utm_medium", "scheda");
  u.searchParams.set("utm_campaign", "elegie-duino");
  u.searchParams.set("utm_content", propId);
  u.searchParams.set("utm_term", locale);
  if (anchor) u.hash = ANCHOR[anchor][locale === "it" ? 0 : 1];
  return u.toString();
}
