import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // EN is the authoring master, but IT stays the URL root to preserve existing SEO/links.
  // `sl` (sloveno, dal 2026-10-01: «le lingue del gruppo sono quattro») va IN
  // CODA, come sul gemello triestevillas-web: i due selettori di lingua
  // mostrano le voci nell'ordine di questo array.
  locales: ["it", "en", "de", "sl"],
  defaultLocale: "it",
  localePrefix: "as-needed",
  // Header HTTP `Link` hreflang SPENTO (2026-10-01, come sul gemello TSV dall'11/08):
  // il middleware dichiara tutte le lingue per ogni URL, e su un articolo non
  // tradotto in sloveno diceva «/sl esiste» mentre l'HTML ne dichiara canonica
  // la versione inglese. La fonte unica degli hreflang è l'HTML
  // (pageAlternates / partialAlternates in lib/seo.ts); le pagine che non lo
  // emettono (/account, /private) sono noindex.
  // `localeDetection` SPENTO dall'08/10/2026 (audit dei siti del 07/10), come
  // sul gemello TSV dall'11/08: la negoziazione cookie/Accept-Language
  // rispondeva 307 su / verso /en, /de o /sl secondo il browser, e su TSV, con
  // lo stesso stack, aveva riscritto risposte CACHABILI cross-lingua (una URL
  // /en rimasta ~1,7 h in CDN col corpo TEDESCO). Ogni URL = una lingua; il
  // cambio lingua sono i link veri del selettore. Spento anche il cookie
  // NEXT_LOCALE: con la detection spenta non serve, e un Set-Cookie dentro una
  // risposta cachata era il residuo esatto di quel guasto.
  alternateLinks: false,
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
