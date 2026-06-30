import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/airtable";
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  const now = new Date();

  const staticPaths = ["/", "/immobili", "/vendi", "/investimenti", "/gruppo", "/contatti", "/privacy"];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    const languages = languagesFor(path);
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}${localizedPath(locale, path) === "/" ? "" : localizedPath(locale, path)}`,
        lastModified: now,
        changeFrequency: path === "/" || path === "/immobili" ? "daily" : "monthly",
        priority: path === "/" ? 1 : path === "/vendi" ? 0.9 : path === "/immobili" ? 0.9 : 0.6,
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
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
