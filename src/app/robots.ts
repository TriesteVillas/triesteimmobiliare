import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { routing } from "@/i18n/routing";

// Stesso interruttore del layout: senza NEXT_PUBLIC_ALLOW_INDEX=true questo
// robots.txt dice `Disallow: /`. Serviva prima del cutover DNS, quando il
// rilancio viveva su un preview *.vercel.app; messo a `true` in produzione il
// 2026-07-30. Continua a valere per i deploy di preview, dove la variabile non
// esiste e il sito deve restare fuori dall'indice.
const ALLOW_INDEX = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEX) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    // /private resta fuori dall'indice ANCHE nel ramo indicizzato: al cutover DNS
    // l'area riservata diventerebbe altrimenti crawlabile insieme al resto. Le
    // pagine hanno gia' il loro noindex, ma un disallow esplicito evita perfino la
    // richiesta — e le ghost card in griglia non portano indizi ai crawler.
    // Con le lingue a prefisso l'area riservata vive anche sotto /en, /de e /sl
    // (dal 2026-10-01): il solo "/private" lasciava crawlabili quelle tre.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/private",
        "/private/",
        ...routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}/private`),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
