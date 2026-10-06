// SloveniaVillas (sloveniavillas.com, online dal 06/10/2026): l'atlante della
// costa slovena e del Carso del gruppo TriesteVillas. Un solo posto per i suoi
// indirizzi, perché li usano il footer, la pagina del Gruppo, la home e /vendi.
//
// ⚠️ Cosa NON è, e i testi che lo citano lo devono rispettare: in Slovenia
// oggi il gruppo NON fa mediazione (per la legge slovena anche presentare un
// compratore è mediazione). L'avvio è previsto nel corso del 2027. Si parla
// di atlante, guide, strumenti — mai di «nostri immobili in Slovenia» né di
// valutazioni fatte da noi.
//
// Lingue: l'inglese sta alla radice, le altre sotto /it, /de, /sl. Ogni
// indirizzo qui sotto è stato verificato 200 (non 3xx) il 06/10/2026.

type Lingua = "it" | "en" | "de" | "sl";
type Pagina = "home" | "proprietari" | "strumenti" | "guidaVendita";

const BASE = "https://sloveniavillas.com";

const PERCORSI: Record<Lingua, Record<Pagina, string>> = {
  en: { home: "/", proprietari: "/owners", strumenti: "/tools", guidaVendita: "/guides" },
  it: { home: "/it", proprietari: "/it/proprietari", strumenti: "/it/strumenti", guidaVendita: "/it/guide" },
  de: { home: "/de", proprietari: "/de/eigentuemer", strumenti: "/de/werkzeuge", guidaVendita: "/de/ratgeber" },
  // La guida per chi vende a uno straniero esiste come pagina propria solo in
  // sloveno; nelle altre lingue il rimando va all'indice delle guide.
  sl: {
    home: "/sl",
    proprietari: "/sl/za-lastnike",
    strumenti: "/sl/orodja",
    guidaVendita: "/sl/vodniki/prodaja-tujemu-kupcu",
  },
};

function lingua(locale: string): Lingua {
  return (["it", "en", "de", "sl"] as const).includes(locale as Lingua) ? (locale as Lingua) : "en";
}

/** Indirizzo nudo, per gli elenchi del gruppo (footer, /gruppo): lì gli altri
 *  siti sorella non portano UTM e questo non fa eccezione. */
export function sloveniaVillasUrl(locale: string, pagina: Pagina = "home"): string {
  return `${BASE}${PERCORSI[lingua(locale)][pagina]}`;
}

/** Indirizzo con UTM, per i riquadri che lo raccontano (home /sl, /vendi):
 *  i link esterni del sito escono con `noreferrer`, e senza UTM il GA4 di
 *  SloveniaVillas non saprebbe che il clic è partito da qui. Stesso schema
 *  dei rimandi a Elegie Duino (src/lib/elegie.ts). */
export function sloveniaVillasHref(locale: string, pagina: Pagina, collocazione: "home" | "vendi" | "routing"): string {
  const u = new URL(sloveniaVillasUrl(locale, pagina));
  u.searchParams.set("utm_source", "triesteimmobiliare");
  u.searchParams.set("utm_medium", collocazione);
  u.searchParams.set("utm_campaign", "sloveniavillas");
  u.searchParams.set("utm_term", lingua(locale));
  return u.toString();
}
