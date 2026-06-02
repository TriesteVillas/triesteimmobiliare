import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // EN is the authoring master, but IT stays the URL root to preserve existing SEO/links.
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
