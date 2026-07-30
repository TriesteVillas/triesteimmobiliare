// SEO helpers — canonical + hreflang for next-intl `localePrefix: "as-needed"`
// (it at the root, en/de prefixed) and JSON-LD builders. The site is read by
// many German-speaking buyers, so hreflang is not cosmetic.

// `?? ` da solo non basta: una variabile d'ambiente definita ma VUOTA (è ciò che
// restituisce `vercel env pull` per le variabili marcate Sensitive) non è null,
// quindi passerebbe indenne e `new URL("")` in layout.tsx farebbe schiantare OGNI
// pagina del sito con "Invalid URL". Serve il fallback anche sulla stringa vuota.
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "").trim() || "https://www.triesteimmobiliare.com";

export const LOCALES = ["it", "en", "de"] as const;
// hreflang region codes (en-GB: British-leaning copy; de-DE: the key market).
const HREFLANG: Record<string, string> = { it: "it-IT", en: "en-GB", de: "de-DE" };

// Path on the wire for a given locale. `path` uses "/" for home.
export function localizedPath(locale: string, path: string): string {
  const base = path === "/" ? "" : path;
  return locale === "it" ? base || "/" : `/${locale}${base}`;
}

export function absUrl(locale: string, path: string): string {
  const p = localizedPath(locale, path);
  return `${SITE_URL}${p === "/" ? "" : p}` || SITE_URL;
}

// Per-page metadata.alternates: self-canonical + every language + x-default→it.
export function pageAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = absUrl(l, path);
  languages["x-default"] = absUrl("it", path);
  return { canonical: absUrl(locale, path), languages };
}

// Default OpenGraph for a page (merged into per-page metadata).
export function pageOpenGraph(
  locale: string,
  path: string,
  title: string,
  description: string,
  image?: string,
) {
  return {
    type: "website" as const,
    siteName: "TriesteImmobiliare",
    locale: HREFLANG[locale]?.replace("-", "_") ?? "it_IT",
    localeAlternate: LOCALES.filter((l) => l !== locale).map((l) =>
      (HREFLANG[l] ?? "it-IT").replace("-", "_"),
    ),
    url: absUrl(locale, path),
    title,
    description,
    images: [
      image
        ? { url: image }
        : { url: "/brand/og-default.jpg", width: 1200, height: 630, alt: "TriesteImmobiliare" },
    ],
  };
}

// Site-wide RealEstateAgent + Organization (group) — emitted once in the layout.
export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#agency`,
    name: "TriesteImmobiliare",
    description:
      "Lo spin-off non-luxury del gruppo TriesteVillas: residenziale a Trieste e Provincia fino a circa 500.000 €.",
    url: SITE_URL,
    image: `${SITE_URL}/brand/og-default.jpg`,
    logo: `${SITE_URL}/brand/logo-full.png`,
    email: "info@triesteimmobiliare.com",
    telephone: "+390402473628",
    areaServed: { "@type": "AdministrativeArea", name: "Trieste e Provincia, Friuli-Venezia Giulia" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Via Torino 34",
      addressLocality: "Trieste",
      addressCountry: "IT",
    },
    parentOrganization: {
      "@type": "Organization",
      name: "TriesteVillas srl",
      vatID: "IT01235580329",
      url: "https://www.triestevillas.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Via Milano 5",
        addressLocality: "Trieste",
        postalCode: "34132",
        addressCountry: "IT",
      },
    },
    sameAs: ["https://www.facebook.com/profile.php?id=61576375390569"],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "TriesteImmobiliare",
    inLanguage: ["it-IT", "en-GB", "de-DE"],
    publisher: { "@id": `${SITE_URL}/#agency` },
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

// Sotto-tipo di Accommodation dal vocabolario tipologia di Airtable (Villa,
// Appartamento, Attico, Mansarda, …). Si scende sotto "Residence" solo quando la
// tipologia lo dice davvero: un tipo specifico e sbagliato è peggio di uno
// generico e vero.
function accommodationType(tipologia: string | null): string {
  const t = (tipologia ?? "").toLowerCase();
  if (t.includes("villa") || t.includes("casa")) return "SingleFamilyResidence";
  if (t.includes("appartamento") || t.includes("attico") || t.includes("mansarda"))
    return "Apartment";
  return "Residence";
}

type ListingSchemaInput = {
  locale: string;
  path: string;
  title: string;
  description: string | null;
  tipologia: string | null;
  contratto: "VENDITA" | "AFFITTO" | null;
  via: string | null;
  comune: string | null;
  mq: number | null;
  camere: number | null;
  baths: number | null;
  floor: string | null;
  annoCostruzione: number | null;
  priceSale: number | null;
  priceRent: number | null;
  trattativaRiservata: boolean;
  onlineDa: string | null;
  amenities: string[];
};

// Scheda immobile: RealEstateListing (che è una WebPage) + l'immobile stesso in
// mainEntity. Non esiste un rich result Google per gli annunci immobiliari — il
// ritorno è la comprensione dell'entità (e la citabilità nelle risposte AI), non
// una stellina in SERP.
//
// `image` è omesso di proposito: le URL Airtable sono firmate e scadono in ~2h,
// in JSON-LD diventerebbero riferimenti rotti al momento del crawl. Torna appena
// le foto hanno un URL stabile.
export function listingJsonLd(p: ListingSchemaInput) {
  const url = absUrl(p.locale, p.path);
  const isRent = p.contratto === "AFFITTO";
  const price = isRent ? p.priceRent : p.priceSale;
  const hasPrice = !p.trattativaRiservata && price != null && price > 0;
  // Qui la descrizione NON è uno snippet SERP: il testo intero vale più di 155
  // caratteri tagliati. Si normalizzano solo gli spazi — i newline della
  // descrizione Airtable in un attributo JSON sono solo sporcizia.
  const description = p.description?.replace(/\s+/g, " ").trim() || null;

  const accommodation: Record<string, unknown> = {
    "@type": accommodationType(p.tipologia),
    name: p.title,
    ...(description ? { description } : {}),
    address: {
      "@type": "PostalAddress",
      ...(p.via ? { streetAddress: p.via } : {}),
      addressLocality: p.comune ?? "Trieste",
      addressRegion: "Friuli-Venezia Giulia",
      addressCountry: "IT",
    },
    ...(p.mq
      ? { floorSize: { "@type": "QuantitativeValue", value: p.mq, unitCode: "MTK" } }
      : {}),
    ...(p.camere ? { numberOfRooms: p.camere } : {}),
    ...(p.baths ? { numberOfBathroomsTotal: p.baths } : {}),
    ...(p.floor ? { floorLevel: p.floor } : {}),
    ...(p.annoCostruzione ? { yearBuilt: p.annoCostruzione } : {}),
    ...(p.amenities.length
      ? {
          amenityFeature: p.amenities.map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
          })),
        }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    url,
    name: p.title,
    ...(description ? { description } : {}),
    inLanguage: p.locale,
    ...(p.onlineDa ? { datePosted: p.onlineDa } : {}),
    provider: { "@id": `${SITE_URL}/#agency` },
    mainEntity: accommodation,
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            businessFunction: isRent
              ? "http://purl.org/goodrelations/v1#LeaseOut"
              : "http://purl.org/goodrelations/v1#Sell",
            url,
            seller: { "@id": `${SITE_URL}/#agency` },
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(locale: string, trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absUrl(locale, t.path),
    })),
  };
}
