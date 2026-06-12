import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/airtable";
import { routing } from "@/i18n/routing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com";

// it is the default locale (no prefix); en/de are prefixed.
const loc = (locale: string, path: string) =>
  `${SITE}${locale === "it" ? "" : `/${locale}`}${path}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  const now = new Date();

  const staticPaths = ["", "/immobili", "/vendi", "/gruppo", "/contatti", "/privacy"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: loc(locale, path),
        lastModified: now,
        changeFrequency: path === "" || path === "/immobili" ? "daily" : "monthly",
        priority: path === "" ? 1 : path === "/immobili" ? 0.9 : 0.5,
      });
    }
    for (const p of properties) {
      entries.push({
        url: loc(locale, `/annuncio/${p.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  return entries;
}
