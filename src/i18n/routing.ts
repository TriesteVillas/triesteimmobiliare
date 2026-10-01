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
  // ⚠️ `localeDetection` resta ACCESO, com'era: su TSV è stato spento per un
  // avvelenamento della cache CDN, e qui è una decisione ancora da prendere.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
