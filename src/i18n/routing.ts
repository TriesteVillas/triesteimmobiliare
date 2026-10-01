import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // EN is the authoring master, but IT stays the URL root to preserve existing SEO/links.
  // `sl` (sloveno, dal 2026-10-01: «le lingue del gruppo sono quattro») va IN
  // CODA, come sul gemello triestevillas-web: i due selettori di lingua
  // mostrano le voci nell'ordine di questo array.
  locales: ["it", "en", "de", "sl"],
  defaultLocale: "it",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
