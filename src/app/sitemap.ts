import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/airtable";
import { getArticles, articleLocales } from "@/lib/articles";
import { routing } from "@/i18n/routing";
import { absUrl, HREFLANG, localizedPath, SITE_URL } from "@/lib/seo";

// Solo-lingua dal 2026-08-11 (de-DE escludeva de-AT). La mappa è quella di
// lib/seo.ts, importata e non ricopiata: con lo sloveno (2026-10-01) le copie
// a mano erano diventate una trappola — una lingua aggiunta in un posto solo
// avrebbe dato alla sitemap un hreflang `undefined`.

// hreflang alternates for a path across all locales (+ x-default → it).
function languagesFor(path: string, vere: readonly string[] = routing.locales): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) if (vere.includes(l)) languages[HREFLANG[l]] = absUrl(l, path);
  languages["x-default"] = absUrl(vere.includes("it") ? "it" : vere[0] ?? "it", path);
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
  // Solo le lingue in cui l'articolo esiste davvero (2026-10-01): una pagina di
  // ripiego dichiara canonica la lingua che mostra, e in sitemap ci vanno solo
  // le canoniche — vale per /sl, che sugli articoli TSI è oggi tutto inglese.
  for (const a of articles) {
    const path = `/risorse/${a.slug}`;
    const vere = articleLocales(a, routing.locales);
    const languages = languagesFor(path, vere);
    const touched = a.updatedAt || a.publishedAt;
    for (const locale of vere) {
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
