import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/airtable";
import { getArticles } from "@/lib/articles";
import { routing } from "@/i18n/routing";
import { absUrl, localizedPath, SITE_URL } from "@/lib/seo";

const HREFLANG: Record<string, string> = { it: "it-IT", en: "en-GB", de: "de-DE" };

// hreflang alternates for a path across all locales (+ x-default → it).
function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[HREFLANG[l]] = absUrl(l, path);
  languages["x-default"] = absUrl("it", path);
  return languages;
}

// La sitemap si rigenera ogni 10 minuti, come le pagine (2026-08-04).
// Senza questa riga Next la considera statica e la costruisce UNA volta, al
// deploy: verificato sul campo il 04/08, un articolo pubblicato dal CRM
// compariva in /risorse entro dieci minuti ma restava fuori dalla sitemap fino
// al deploy successivo. La finestra di Data Cache dentro getArticles() non
// basta a rendere ISR una route di metadati: il tempo va dichiarato qui.
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  // Una lettura sola (Data Cache 600s, come le pagine): senza gli articoli, la
  // sezione più indicizzabile del sito resterebbe fuori dalla mappa.
  const articles = await getArticles().catch(() => []);

  const staticPaths = ["/", "/immobili", "/vendi", "/risorse", "/investimenti", "/gruppo", "/contatti", "/privacy"];
  const entries: MetadataRoute.Sitemap = [];

  // lastModified solo dove esiste una data vera: Google lo usa se è
  // «consistently and verifiably accurate», altrimenti impara a ignorarlo.
  // Le pagine fisse non ne hanno una → meglio nessun lastmod del timestamp
  // di build.
  for (const path of staticPaths) {
    const languages = languagesFor(path);
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}${localizedPath(locale, path) === "/" ? "" : localizedPath(locale, path)}`,
        changeFrequency: path === "/" || path === "/immobili" ? "daily" : "monthly",
        priority: path === "/" ? 1 : path === "/vendi" ? 0.9 : path === "/immobili" ? 0.9 : path === "/risorse" ? 0.8 : 0.6,
        alternates: { languages },
      });
    }
  }

  // Le guide: `lastModified` è la data VERA dell'articolo — un sitemap che
  // dichiara tutto modificato oggi non dice niente a nessuno.
  for (const a of articles) {
    const path = `/risorse/${a.slug}`;
    const languages = languagesFor(path);
    const touched = a.updatedAt || a.publishedAt;
    for (const locale of routing.locales) {
      entries.push({
        url: absUrl(locale, path),
        ...(touched ? { lastModified: new Date(touched) } : {}),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  for (const p of properties) {
    const path = `/annuncio/${p.slug}`;
    const languages = languagesFor(path);
    for (const locale of routing.locales) {
      entries.push({
        url: absUrl(locale, path),
        // onlineDa (la messa online) è l'unica data vera che il record porta.
        ...(p.onlineDa ? { lastModified: new Date(p.onlineDa) } : {}),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
