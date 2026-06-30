// SEO helpers — canonical + hreflang for next-intl `localePrefix: "as-needed"`
// (it at the root, en/de prefixed) and JSON-LD builders. The site is read by
// many German-speaking buyers, so hreflang is not cosmetic.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com";

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
