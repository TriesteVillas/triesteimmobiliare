// SappadaVillas (sappadavillas.com, online dal 07/10/2026): il sito del gruppo
// TriesteVillas per Sappada/Plodn, in montagna. Un solo posto per i suoi
// indirizzi, perché li usano il footer, la pagina del Gruppo, la home e /vendi.
// Gemello di lib/sloveniavillas.ts, nato il giorno prima.
//
// ⚠️ Cosa si può dire, e i testi che lo citano lo devono rispettare: a Sappada
// NON abbiamo una sede (la sede è a Trieste, a Sappada si va su appuntamento);
// non si scrivono numeri di case, superlativi né rendimenti; si risponde in
// italiano e in inglese, e il tedesco e lo sloveno non si promettono (le
// pagine in quelle lingue lo dicono a chi le legge).
//
// Lingue: l'italiano sta alla radice, le altre sotto /en, /de, /sl. Ogni
// indirizzo qui sotto è stato verificato 200 (non 3xx) il 07/10/2026.

type Lingua = "it" | "en" | "de" | "sl";
type Pagina = "home" | "vendere" | "borgate" | "mercato";

const BASE = "https://sappadavillas.com";

const PERCORSI: Record<Lingua, Record<Pagina, string>> = {
  it: { home: "/", vendere: "/vendere", borgate: "/borgate", mercato: "/mercato" },
  en: { home: "/en", vendere: "/en/sell", borgate: "/en/hamlets", mercato: "/en/market" },
  de: { home: "/de", vendere: "/de/verkaufen", borgate: "/de/weiler", mercato: "/de/markt" },
  sl: { home: "/sl", vendere: "/sl/prodaja", borgate: "/sl/zaselki", mercato: "/sl/trg" },
};

function lingua(locale: string): Lingua {
  return (["it", "en", "de", "sl"] as const).includes(locale as Lingua) ? (locale as Lingua) : "en";
}

/** Indirizzo nudo, per gli elenchi del gruppo (footer, /gruppo): lì gli altri
 *  siti sorella non portano UTM e questo non fa eccezione. */
export function sappadaVillasUrl(locale: string, pagina: Pagina = "home"): string {
  return `${BASE}${PERCORSI[lingua(locale)][pagina]}`;
}

/** Indirizzo con UTM, per i punti che lo raccontano (riga in home, /vendi):
 *  i link esterni del sito escono con `noreferrer`, e senza UTM il GA4 di
 *  SappadaVillas non saprebbe che il clic è partito da qui. Stesso schema di
 *  lib/sloveniavillas.ts. */
export function sappadaVillasHref(locale: string, pagina: Pagina, collocazione: "vendi" | "routing"): string {
  const u = new URL(sappadaVillasUrl(locale, pagina));
  u.searchParams.set("utm_source", "triesteimmobiliare");
  u.searchParams.set("utm_medium", collocazione);
  u.searchParams.set("utm_campaign", "sappadavillas");
  u.searchParams.set("utm_term", lingua(locale));
  return u.toString();
}
