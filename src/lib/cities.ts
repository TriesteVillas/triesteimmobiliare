// Suggerimenti per il campo "In quale città risiedi?" del form di richiesta accesso.
//
// NON è una tassonomia: è un aiuto alla digitazione. Il campo resta LIBERO e accetta
// qualunque stringa — un cliente di Kuala Lumpur deve poter chiedere l'accesso senza
// trovare solo "Altro". Un dropdown chiuso su un form d'ingresso a una collezione
// off-market internazionale è attrito che costa richieste; una API di autocomplete
// (Google Places) costerebbe una chiave, uno script terzo sulla landing e una
// questione di consenso su un form che è già sotto privacy check. Il dato lo legge
// un umano nel CRM: la normalizzazione perfetta non serve, evitare "qui" e "-" sì.
//
// Le liste sono per lingua perché il visitatore tedesco deve leggere "Wien" e
// "München", non "Vienna" e "Monaco di Baviera". Sono nomi di città: si scrivono una
// volta e non richiedono manutenzione.
//
// Criterio di selezione: Trieste e provincia, FVG, Nordest, capoluoghi italiani, poi
// i bacini da cui arrivano davvero i clienti della collezione — Slovenia, Croazia,
// Austria, Germania, Svizzera — e infine le piazze internazionali ricorrenti.
// L'ordine è deliberato: il browser mostra la datalist nell'ordine dell'array quando
// il campo è vuoto, quindi Trieste e il suo intorno vengono per primi.

export type CityLocale = "it" | "en" | "de";

const IT: string[] = [
  "Trieste", "Muggia", "Duino-Aurisina", "Sistiana", "Monfalcone", "Grado", "Gorizia",
  "Udine", "Lignano Sabbiadoro", "Pordenone",
  "Venezia", "Padova", "Treviso", "Verona", "Vicenza", "Trento", "Bolzano", "Bologna",
  "Milano", "Roma", "Torino", "Genova", "Firenze", "Napoli", "Bari", "Palermo",
  "Bergamo", "Brescia", "Parma", "Rimini",
  "Lubiana", "Capodistria", "Portorose", "Nova Gorica", "Zagabria", "Fiume", "Pola",
  "Vienna", "Graz", "Klagenfurt", "Villaco", "Salisburgo", "Innsbruck",
  "Monaco di Baviera", "Berlino", "Amburgo", "Francoforte", "Stoccarda", "Colonia", "Düsseldorf",
  "Zurigo", "Ginevra", "Lugano", "Basilea",
  "Londra", "Parigi", "Madrid", "Barcellona", "Amsterdam", "Bruxelles", "Lussemburgo",
  "Praga", "Budapest", "Varsavia", "Dublino", "Lisbona", "Atene", "Principato di Monaco",
  "Istanbul", "Dubai", "Tel Aviv", "New York", "Miami", "Toronto", "Singapore", "Hong Kong",
];

const EN: string[] = [
  "Trieste", "Muggia", "Duino-Aurisina", "Sistiana", "Monfalcone", "Grado", "Gorizia",
  "Udine", "Lignano Sabbiadoro", "Pordenone",
  "Venice", "Padua", "Treviso", "Verona", "Vicenza", "Trento", "Bolzano", "Bologna",
  "Milan", "Rome", "Turin", "Genoa", "Florence", "Naples", "Bari", "Palermo",
  "Bergamo", "Brescia", "Parma", "Rimini",
  "Ljubljana", "Koper", "Portorož", "Nova Gorica", "Zagreb", "Rijeka", "Pula",
  "Vienna", "Graz", "Klagenfurt", "Villach", "Salzburg", "Innsbruck",
  "Munich", "Berlin", "Hamburg", "Frankfurt", "Stuttgart", "Cologne", "Düsseldorf",
  "Zurich", "Geneva", "Lugano", "Basel",
  "London", "Paris", "Madrid", "Barcelona", "Amsterdam", "Brussels", "Luxembourg",
  "Prague", "Budapest", "Warsaw", "Dublin", "Lisbon", "Athens", "Monaco",
  "Istanbul", "Dubai", "Tel Aviv", "New York", "Miami", "Toronto", "Singapore", "Hong Kong",
];

const DE: string[] = [
  "Triest", "Muggia", "Duino-Aurisina", "Sistiana", "Monfalcone", "Grado", "Görz",
  "Udine", "Lignano Sabbiadoro", "Pordenone",
  "Venedig", "Padua", "Treviso", "Verona", "Vicenza", "Trient", "Bozen", "Bologna",
  "Mailand", "Rom", "Turin", "Genua", "Florenz", "Neapel", "Bari", "Palermo",
  "Bergamo", "Brescia", "Parma", "Rimini",
  "Ljubljana", "Koper", "Portorož", "Nova Gorica", "Zagreb", "Rijeka", "Pula",
  "Wien", "Graz", "Klagenfurt", "Villach", "Salzburg", "Innsbruck",
  "München", "Berlin", "Hamburg", "Frankfurt", "Stuttgart", "Köln", "Düsseldorf",
  "Zürich", "Genf", "Lugano", "Basel",
  "London", "Paris", "Madrid", "Barcelona", "Amsterdam", "Brüssel", "Luxemburg",
  "Prag", "Budapest", "Warschau", "Dublin", "Lissabon", "Athen", "Monaco",
  "Istanbul", "Dubai", "Tel Aviv", "New York", "Miami", "Toronto", "Singapur", "Hongkong",
];

const BY_LOCALE: Record<CityLocale, string[]> = { it: IT, en: EN, de: DE };

/** Suggerimenti nella lingua del visitatore. Locale sconosciuto → italiano. */
export function citySuggestions(locale: string): string[] {
  return BY_LOCALE[(locale as CityLocale) in BY_LOCALE ? (locale as CityLocale) : "it"];
}

/** id dell'elemento <datalist>, condiviso fra input e lista. */
export const CITY_LIST_ID = "pc-city-suggestions";
