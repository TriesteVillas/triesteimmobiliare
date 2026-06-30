# TriesteImmobiliare.com — SEO Specification (trilingual IT/EN/DE)

> Authored 2026-06-30. Companion to `docs/RELAUNCH_BRIEF.md`. This is the SEO
> source of truth for the `feat/tsi-relaunch` rebuild. Grounded in the **actual
> current code** (next-intl v4, `localePrefix: as-needed`, `defaultLocale: "it"`),
> not generic boilerplate. Every recommendation below references a real file.
>
> **Current state (audited):** metadata is thin. `generateMetadata` exists per
> page but only returns `title` (+ sometimes `description`). **No `metadataBase`,
> no `alternates`/`canonical`, no `hreflang`, no `openGraph`, no `twitter`, no
> JSON-LD anywhere.** `/investimenti` route does not exist yet and is **absent
> from `sitemap.ts`**. `robots.ts` is minimal. This spec closes all of that.

---

## 0. Conventions, scope, hard rules

- **Locales:** `it` (default, URL root, **no prefix**), `en`, `de`. `localePrefix:
  "as-needed"` ⇒ IT lives at `/`, `/vendi`, … ; EN/DE at `/en/...`, `/de/...`.
  This is already set in `src/i18n/routing.ts` — **do not change it.**
- **Canonical host:** `https://www.triesteimmobiliare.com` (the `www` host, matching
  `NEXT_PUBLIC_SITE_URL` defaults already in `sitemap.ts`/`robots.ts`/`annuncio`).
  Pick ONE host and 301 the apex→www (or www→apex) at the edge. The code already
  standardises on `www`; keep it. **Until DNS cutover** (still WordPress per brief §9),
  these tags point at the future production host — that is correct and intended;
  the Vercel preview (`triesteimmobiliare.vercel.app`) should carry
  `noindex` (see §6.6) so the draft never competes in the index.
- **Char budgets (hard):** `<title>` **≤ 60 chars** (Google truncates ~580–600px;
  60 is the safe ceiling). `meta description` **≤ 155 chars** (mobile snippet).
  Every string below has been counted and fits. Where a brand suffix is added by
  the layout `template: "%s · TriesteImmobiliare"`, the **page titles in §1 are the
  FINAL rendered title** — i.e. they are authored as standalone full titles and the
  template must be **disabled/overridden** per page (see §1.0), because `"%s ·
  TriesteImmobiliare"` would blow the 60-char budget and duplicate the brand.
- **Martino's accuracy rule applies to SEO too.** No invented stats in metadata or
  structured data. The "2M YouTube / 5.6M Facebook" figures from the live site are
  **NOT verified** and **MUST NOT** appear in any `<title>`, description, or JSON-LD
  (no fake `aggregateRating`, no fabricated follower counts). Marketing-muscle claims
  stay in on-page body copy only, softened to "milioni di visualizzazioni" until a
  source is confirmed. Structured data must describe only what is concretely true:
  the agency, its address, contacts, area served, languages, and real listings.
- **No keyword stuffing.** Titles/descriptions read as natural human sentences in the
  brand voice (practical, confident, lightly British-witty in IT). Intent is targeted
  by *meaning*, not by repeating the keyword. Search Console will confirm rankings;
  copy quality is non-negotiable.

### Target search intent (the queries we actually want to win)

| Cluster | Primary IT queries | EN / DE equivalents (foreign buyers, esp. DE-speaking) |
|---|---|---|
| **Seller (priority #1)** | `vendere casa Trieste`, `vendere casa Trieste 0 provvigione`, `agenzia immobiliare Trieste vendita`, `valutazione casa Trieste gratis` | `sell house Trieste agency`, `Haus verkaufen Triest Makler`, `Immobilienbewertung Triest` |
| **Agency / brand** | `agenzia immobiliare Trieste`, `immobiliare Trieste` | `real estate agency Trieste`, `Immobilienmakler Triest`, `Immobilienagentur Triest` |
| **Investor** | `investire immobili Trieste rendita`, `immobili a reddito Trieste`, `investimento immobiliare Trieste ROI` | `property investment Trieste yield`, `Immobilien Kapitalanlage Triest Rendite` |
| **Buyer / listings** | `case in vendita Trieste`, `appartamenti in vendita Trieste`, `case Trieste provincia` | `houses for sale Trieste`, `apartments for sale Trieste`, `Wohnung kaufen Triest`, `Haus kaufen Triest` |
| **Group / trust** | `gruppo TriesteVillas`, `TriesteImmobiliare` | brand nav queries |
| **Local long-tail** | per-zone: `case in vendita Barcola / Centro Trieste / Carso / Costiera`, `appartamenti Muggia` | DE buyers often search `Triest Wohnung Meerblick`, `Haus kaufen Karst Triest` |

DE is strategically weighted: the group's history is German-speaking hospitality
clientele (brief, `group.story`), and Trieste/Carso is a known DE-buyer micro-market.
DE titles lead with `Triest` (the German exonym), never "Trieste", in the DE locale.

---

## 1. Per-page, per-locale metadata table

**6 routes × 3 locales = 18 entries.** Each `title` ≤ 60, each `description` ≤ 155.
Routes: `/` · `/vendi` · `/investimenti` (new) · `/immobili` · `/gruppo` · `/contatti`.

### 1.0 How to wire it (next-intl v4 + App Router)

The current pages pull `title`/`description` from generic namespaces (`sell`,
`group`, `immobili`, `contact`, `meta`). **Replace that** with a dedicated `seo`
namespace per page so SEO copy is separate from on-page copy (a `<title>` is not an
`<h1>`). Add a new top-level `seo` block to `messages/{it,en,de}.json`:

```jsonc
// messages/it.json (mirror in en.json, de.json with the strings from §1.1–§1.6)
"seo": {
  "home":         { "title": "...", "description": "..." },
  "vendi":        { "title": "...", "description": "..." },
  "investimenti": { "title": "...", "description": "..." },
  "immobili":     { "title": "...", "description": "..." },
  "gruppo":       { "title": "...", "description": "..." },
  "contatti":     { "title": "...", "description": "..." }
}
```

Every page's `generateMetadata` then becomes (example: `/vendi`):

```ts
import { getTranslations } from "next-intl/server";
import { buildAlternates, absoluteUrl } from "@/lib/seo"; // §3

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.vendi" });
  return {
    title: { absolute: t("title") },        // absolute ⇒ bypass the "%s · …" template
    description: t("description"),
    alternates: buildAlternates(locale, "/vendi"),  // canonical + hreflang (§3)
    openGraph: {
      type: "website",
      url: absoluteUrl(locale, "/vendi"),
      title: t("title"),
      description: t("description"),
      siteName: "TriesteImmobiliare",
      locale: { it: "it_IT", en: "en_GB", de: "de_DE" }[locale],
      images: ["/og/vendi.jpg"],            // §6.5
    },
  };
}
```

> `title: { absolute: … }` is the App-Router way to opt a page out of the parent
> `template`. Keep the layout `template: "%s · TriesteImmobiliare"` for *child*
> pages we don't hand-author (e.g. `/annuncio/[slug]` already returns a bare
> `property.title` and SHOULD keep the suffix). The 6 hub pages below use `absolute`.

Also set **`metadataBase`** once in the locale layout so OG/canonical resolve to
absolute URLs (currently missing — relative OG images will break):

```ts
// src/app/[locale]/layout.tsx → inside generateMetadata
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com"),
```

---

### 1.1 `/` — Home

| Locale | Title (≤60) | Description (≤155) |
|---|---|---|
| **IT** | `Agenzia immobiliare a Trieste — TriesteImmobiliare` (50) | `Compra, vendi e investi a Trieste e provincia. Vendi con 0% al venditore, valutazione in 24h e marketing vero. Casa di ogni fascia, fino a ~500k.` (151) |
| **EN** | `Trieste Real Estate Agency — TriesteImmobiliare` (47) | `Buy, sell and invest in Trieste and its province. Sellers pay 0% commission, 24h valuation and real marketing. Homes of every budget, up to ~€500k.` (146) |
| **DE** | `Immobilienmakler in Triest — TriesteImmobiliare` (47) | `Kaufen, verkaufen und investieren in Triest und Umgebung: 0 % Provision für Verkäufer, Bewertung in 24 h, echtes Marketing. Wohnen bis ca. 500.000 €.` (151) |

H1 stays the kinetic hero claim (on-page, §5), NOT the SEO title.

### 1.2 `/vendi` — Seller flagship (priority #1)

| Locale | Title (≤60) | Description (≤155) |
|---|---|---|
| **IT** | `Vendere casa a Trieste con 0% al venditore` (43) | `Vendi casa a Trieste senza provvigione a tuo carico: valutazione in 24h, online in 7 giorni, mandato 3 mesi senza tacito rinnovo. 0% entro settembre 2026.` (153) |
| **EN** | `Sell Your Home in Trieste — 0% Seller Commission` (48) | `Sell your Trieste home with zero seller commission: 24h valuation, online in 7 days, a simple 3-month mandate with no auto-renewal. 0% until September 2026.` (155) |
| **DE** | `Haus verkaufen in Triest — 0 % Verkäuferprovision` (49) | `Verkaufen Sie Ihr Haus in Triest ohne Verkäuferprovision: Bewertung in 24 h, online in 7 Tagen, 3-Monats-Auftrag ohne Verlängerung. 0 % bis September 2026.` (154) |

### 1.3 `/investimenti` — Off-market investment funnel (NEW route)

| Locale | Title (≤60) | Description (≤155) |
|---|---|---|
| **IT** | `Investire in immobili a Trieste a reddito` (41) | `Unità già affittate in centro a Trieste, 200–400k, non pubblicizzabili ma raccontabili. Dicci budget e rendita attesa: ricevi opzioni ordinate per ROI.` (152) |
| **EN** | `Property Investment in Trieste — Rental Yield` (45) | `Already-rented units in central Trieste, €200–400k, off-market by design. Tell us your budget and target yield; get options ranked by ROI, all-in.` (147) |
| **DE** | `Immobilien-Kapitalanlage in Triest — Rendite` (45) | `Bereits vermietete Wohnungen im Zentrum von Triest, 200–400k, off-market. Nennen Sie Budget und Zielrendite — Optionen nach ROI sortiert, all-inclusive.` (153) |

> Intent is curiosity→profiling→lead (brief §0.2). Description deliberately says
> "off-market / non pubblicizzabili" — this is the hook AND it's true, so we never
> list these units (no `Offer` JSON-LD for them; §2.5).

### 1.4 `/immobili` — Listed portfolio (browse)

| Locale | Title (≤60) | Description (≤155) |
|---|---|---|
| **IT** | `Case e appartamenti in vendita a Trieste` (41) | `Tutti gli immobili in vendita a Trieste e provincia, per zona: centro, Barcola, Carso, Costiera, Muggia. Foto, planimetrie e tour 3D per ogni annuncio.` (151) |
| **EN** | `Houses & Apartments for Sale in Trieste` (39) | `Every home for sale in Trieste and its province, by area: centre, Barcola, Karst, Costiera, Muggia. Photos, floor plans and 3D tours on every listing.` (149) |
| **DE** | `Häuser & Wohnungen kaufen in Triest` (35) | `Alle Immobilien zum Verkauf in Triest und Umgebung, nach Lage: Zentrum, Barcola, Karst, Costiera, Muggia. Fotos, Grundrisse und 3D-Touren je Inserat.` (148) |

### 1.5 `/gruppo` — The 6-brand ecosystem

| Locale | Title (≤60) | Description (≤155) |
|---|---|---|
| **IT** | `Il Gruppo TriesteVillas — brand, una regia sola` (47) | `TriesteImmobiliare fa parte del gruppo TriesteVillas: luxury, residenziale, affitti, FVG e business. Brand diversi, una sola regia, un metodo condiviso.` (151) |
| **EN** | `The TriesteVillas Group — One Direction, Many Brands` (52) | `TriesteImmobiliare is part of the TriesteVillas group: luxury, residential, rentals, wider FVG and business. Specialised brands, one shared method.` (146) |
| **DE** | `Die TriesteVillas-Gruppe — viele Marken, eine Regie` (51) | `TriesteImmobiliare gehört zur TriesteVillas-Gruppe: Luxus, Wohnen, Vermietung, FVG und Gewerbe. Spezialisierte Marken, eine gemeinsame Methode.` (143) |

### 1.6 `/contatti` — Contact

| Locale | Title (≤60) | Description (≤155) |
|---|---|---|
| **IT** | `Contatti — TriesteImmobiliare, Trieste` (38) | `Scrivici cosa cerchi o cosa vuoi vendere. Via Torino 34, Trieste (su appuntamento) · info@triesteimmobiliare.com · 040 2473628. Ti rispondiamo in fretta.` (155) |
| **EN** | `Contact TriesteImmobiliare — Trieste` (36) | `Tell us what you're looking for or want to sell. Via Torino 34, Trieste (by appointment) · info@triesteimmobiliare.com · 040 2473628. Quick reply.` (145) |
| **DE** | `Kontakt — TriesteImmobiliare, Triest` (36) | `Sagen Sie uns, was Sie suchen oder verkaufen möchten. Via Torino 34, Triest (nach Vereinbarung) · info@triesteimmobiliare.com · 040 2473628.` (139) |

### 1.7 `/annuncio/[slug]` — listing detail (already dynamic; refine only)

Keep the existing dynamic `generateMetadata`, but improve it for intent + add
alternates/OG. Pattern (replace the current `title: property.title`):

- **title:** `{property.title} — {zona} | TriesteImmobiliare` truncated to 60.
  Better: build it as `{tipologia} {mq} m² {zona}, Trieste` when the raw title is
  weak, e.g. IT `Trilocale 78 m² Barcola, Trieste — TriesteImmobiliare`.
- **description:** `property.oneliner` (already used) → fallback to first 150 chars of
  description, **stripped of newlines**, with price + mq + zona prepended when present.
- **alternates:** `buildAlternates(locale, /annuncio/${slug})` (§3) — slugs are shared
  across locales, so hreflang maps cleanly.
- **openGraph.images:** `[property.coverPhoto.url]` (absolute via `metadataBase`).
- **robots:** if a listing has `pubblicato_su` NOT containing `triesteimmobiliare.com`
  OR `tsv_com_online`=FALSE, the route should already 404 (publish gate, brief §5).
  Confirm `/annuncio/[slug]` `notFound()`s ungated slugs so we never index them.

---

## 2. JSON-LD blocks (ready to paste — `<script type="application/ld+json">`)

Embed via a small server component `src/components/JsonLd.tsx`:

```tsx
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // single source; arrays are fine (graph or list)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

Rule: **one `RealEstateAgent`+`Organization` node site-wide** (emit in the locale
layout so it appears on every page), `WebSite` once, `BreadcrumbList` per page,
`FAQPage` only on `/vendi` (and optionally `/investimenti`), `Residence`+`Offer`
only on `/annuncio/[slug]`. Use `@id` references so nodes don't duplicate.

### 2.1 RealEstateAgent + Organization (site-wide, in `[locale]/layout.tsx`)

`name` should localise (`Triest` host name stays "TriesteImmobiliare" everywhere;
`areaServed`/`description` localise). Legal data from brief §8 (TriesteVillas srl is
the legal entity behind the TSI brand).

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://www.triesteimmobiliare.com/#agency",
  "name": "TriesteImmobiliare",
  "legalName": "TriesteVillas srl",
  "url": "https://www.triesteimmobiliare.com/",
  "logo": "https://www.triesteimmobiliare.com/logo-triesteimmobiliare.png",
  "image": "https://www.triesteimmobiliare.com/og/home.jpg",
  "description": "Agenzia immobiliare per il residenziale di Trieste e provincia fino a circa 500.000 €. Parte del gruppo TriesteVillas.",
  "email": "info@triesteimmobiliare.com",
  "telephone": "+390402473628",
  "vatID": "IT01235580329",
  "taxID": "01235580329",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Torino 34, 2° piano",
    "addressLocality": "Trieste",
    "addressRegion": "Friuli-Venezia Giulia",
    "postalCode": "34132",
    "addressCountry": "IT"
  },
  "areaServed": [
    { "@type": "City", "name": "Trieste" },
    { "@type": "AdministrativeArea", "name": "Provincia di Trieste" },
    { "@type": "AdministrativeArea", "name": "Friuli-Venezia Giulia" }
  ],
  "knowsLanguage": ["it", "en", "de"],
  "currenciesAccepted": "EUR",
  "priceRange": "€€",
  "sameAs": [
    "{{FACEBOOK_URL}}",
    "{{YOUTUBE_URL}}",
    "https://www.triestevillas.com/"
  ],
  "parentOrganization": {
    "@type": "Organization",
    "@id": "https://www.triestevillas.com/#org",
    "name": "TriesteVillas",
    "url": "https://www.triestevillas.com/"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "description": "Su appuntamento / By appointment / Nach Vereinbarung"
    }
  ]
}
```

> Placeholders: `{{FACEBOOK_URL}}` (live FB page — confirm exact URL), `{{YOUTUBE_URL}}`
> (the group channel). Leave `sameAs` entries OUT if a URL can't be confirmed — an
> unverifiable `sameAs` is worse than none. **Note the registered office** for the
> legal entity is Via Milano 5 (brief §8); the **public-facing TSI office** is Via
> Torino 34. Use Via Torino 34 in `address` (that's where clients go, by appointment)
> and keep Via Milano 5 only in the `/gruppo` legal block + footer fine print.
> `vatID`/`taxID` 01235580329 are the same number (IT VAT == CF for the srl).

### 2.2 WebSite (site-wide; enables sitelinks searchbox if a search route exists)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.triesteimmobiliare.com/#website",
  "url": "https://www.triesteimmobiliare.com/",
  "name": "TriesteImmobiliare",
  "publisher": { "@id": "https://www.triesteimmobiliare.com/#agency" },
  "inLanguage": ["it-IT", "en-GB", "de-DE"]
}
```

> Add a `potentialAction` SearchAction **only if** `/immobili` supports a real
> `?q=`/zone query param — otherwise omit it (don't claim a searchbox that 404s).

### 2.3 BreadcrumbList (per page; localise `name`, keep `item` as the locale URL)

Example for `/vendi` (EN locale shown; build dynamically from the route):

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",
      "item": "https://www.triesteimmobiliare.com/en" },
    { "@type": "ListItem", "position": 2, "name": "Sell",
      "item": "https://www.triesteimmobiliare.com/en/vendi" }
  ]
}
```

> IT root has no prefix → `item` is `https://www.triesteimmobiliare.com/` and
> `.../vendi`. Localise `name` per locale (Vendi / Sell / Verkaufen, etc.). On
> `/annuncio/[slug]` add a 3rd crumb: Home → Immobili → {property.title}.

### 2.4 FAQPage (on `/vendi`; seller FAQ — recovers the live "FAQ Proprietari")

These answers are drawn verbatim-in-substance from the recovered seller copy
(brief §3, `home.txt`/`vendi.txt`) — every claim is true. Mirror per locale.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quanto paga il venditore di provvigione?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Per i mandati firmati entro settembre 2026 il venditore non paga provvigione: 0% a tuo carico. Se vendi e ricompri con noi, hai anche il 25% di sconto sulla provvigione d'acquisto."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto dura il mandato di vendita?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Il mandato è in esclusiva per 3 mesi, senza tacito rinnovo e senza costi nascosti. Se a scadenza decidi di non proseguire, il materiale prodotto per la tua casa (foto, video, tour 3D) resta tuo."
      }
    },
    {
      "@type": "Question",
      "name": "In quanto tempo la casa va online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Primo contatto in call con il titolare, invio della documentazione e sopralluogo entro 24 ore. Se i documenti e la situazione dell'immobile lo consentono, andiamo online entro 7 giorni."
      }
    },
    {
      "@type": "Question",
      "name": "Cosa è incluso nel marketing della casa?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Foto, video, riprese con drone e tour 3D sono inclusi. Servono a far capire meglio la casa e a filtrare le visite inutili, così si vende meglio e si perde meno tempo."
      }
    },
    {
      "@type": "Question",
      "name": "E se la casa non è ancora pronta per la vendita?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Facciamo un check-up pre-vendita con tecnici esterni. Se serve, anticipiamo il 50% del costo del controllo documentale e, se manca, anche il costo dell'APE. Quando ha senso, valutiamo insieme un piccolo lifting pre-vendita."
      }
    },
    {
      "@type": "Question",
      "name": "Le visite disturbano molto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Quando possibile concentriamo le visite in un solo giorno alla settimana, in una fascia concordata. Una vendita ben fatta ti toglie peso, non te ne aggiunge."
      }
    }
  ]
}
```

> Keep the JSON-LD FAQ **in sync with a visible on-page FAQ accordion** on `/vendi`
> — Google requires the marked-up Q&A to be present in the rendered page, or it
> drops the rich result (and can flag it as spam). Don't mark up Q&A that isn't shown.

### 2.5 Residence + Offer (on `/annuncio/[slug]` only — listed units)

Per listing. `Residence` describes the property; `Offer` the sale. **Only emit for
publicly listed units** (those that pass the publish gate). **Never** emit `Offer`
for off-market investment units (`/investimenti`) — they're not advertised by design.

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Residence",
    "@id": "https://www.triesteimmobiliare.com/annuncio/{{SLUG}}#residence",
    "name": "{{PROPERTY_TITLE}}",
    "description": "{{ONELINER_OR_DESC}}",
    "url": "https://www.triesteimmobiliare.com/annuncio/{{SLUG}}",
    "image": ["{{COVER_PHOTO_URL}}", "{{PHOTO_2_URL}}"],
    "numberOfRooms": {{ROOMS}},
    "numberOfBathroomsTotal": {{BATHS}},
    "floorSize": { "@type": "QuantitativeValue", "value": {{MQ}}, "unitCode": "MTK" },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "{{COMUNE}}",
      "addressRegion": "Friuli-Venezia Giulia",
      "addressCountry": "IT"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Offer",
    "itemOffered": { "@id": "https://www.triesteimmobiliare.com/annuncio/{{SLUG}}#residence" },
    "price": "{{PRICE_SALE}}",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://www.triesteimmobiliare.com/#agency" },
    "url": "https://www.triesteimmobiliare.com/annuncio/{{SLUG}}"
  }
]
```

> Placeholders map to the existing `property` view-model fields (`title`, `oneliner`,
> `description`, `coverPhoto`, `rooms`, `baths`, `mq`, `priceSale`, `zona`/comune,
> `slug`). **Omit `price`/`Offer` entirely when price is "su richiesta" / reserved**
> (`priceOnRequest`/`priceReserved` in `messages`) — never fake a number. `unitCode`
> `MTK` = square metres (UN/CEFACT). For rentals, use `Offer` with
> `businessFunction: "http://purl.org/goodrelations/v1#LeaseOut"` and a
> `priceSpecification` with `unitCode: "MON"`.

---

## 3. hreflang + canonical strategy (next-intl `as-needed`)

The hard part with `localePrefix: "as-needed"`: the **default locale (it) has no
prefix**, so hreflang URLs must NOT add `/it`. Build a single helper and reuse it in
every `generateMetadata` so the logic lives in one place.

### 3.1 `src/lib/seo.ts` (new)

```ts
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com").replace(/\/$/, "");

// it = root (no prefix); en/de = prefixed. Mirrors localePrefix: "as-needed".
export function absoluteUrl(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? `${SITE}${clean}` : `${SITE}/${locale}${clean}`;
}

// canonical = the current locale's own URL; languages = every locale + x-default→it.
export function buildAlternates(locale: string, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    // Use full region codes for hreflang (it-IT, en-GB, de-DE) — better than bare "en".
    const tag = { it: "it-IT", en: "en-GB", de: "de-DE" }[l] ?? l;
    languages[tag] = absoluteUrl(l, path);
  }
  languages["x-default"] = absoluteUrl(routing.defaultLocale, path); // IT root is x-default
  return {
    canonical: absoluteUrl(locale, path),
    languages,
  };
}
```

Next.js renders these as `<link rel="canonical">` + `<link rel="alternate"
hreflang="…">` automatically from the `alternates` Metadata field.

### 3.2 Rules

- **Self-canonical per locale.** EN page canonicals to the EN URL, not to IT. (A
  common mistake is canonicalising all locales to the default — that de-indexes
  EN/DE. Don't.)
- **`x-default` → IT root** (`https://www.triesteimmobiliare.com/...`). IT is the
  market's primary language and the URL root.
- **hreflang must be reciprocal & self-referential**: each page lists *all three*
  locales incl. itself. The helper above does this.
- **Region codes:** use `it-IT`, `en-GB`, `de-DE`. `en-GB` matches the British-witty
  brand voice and the EN-first authoring note; DE buyers are AT/DE/CH but `de-DE` is
  the safe umbrella (don't fragment into `de-AT`/`de-CH` — same copy serves all).
- **Trailing slashes:** Next.js default is no trailing slash. Keep it consistent
  everywhere (canonical, sitemap, hreflang) — mismatched slashes split signals.
- **Query params** (`/immobili` zone filters, `#anchors`): canonical drops the query
  → `/immobili` canonicalises to clean `/immobili`. Filtered views are not separate
  canonical URLs. Anchors (`/immobili#BARCOLA`) are same-page, no canonical concern.
- **Listing pages** (`/annuncio/[slug]`): slug is shared across locales, so the same
  helper works — `buildAlternates(locale, /annuncio/${slug})`.

---

## 4. `sitemap.ts` / `robots.ts` changes

### 4.1 `src/app/sitemap.ts` — add `/investimenti`, keep loop

Current `staticPaths` (line 15) is missing `/investimenti`. Change:

```ts
// BEFORE
const staticPaths = ["", "/immobili", "/vendi", "/gruppo", "/contatti", "/privacy"];
// AFTER
const staticPaths = ["", "/immobili", "/vendi", "/investimenti", "/gruppo", "/contatti", "/privacy"];
```

Refine priorities/changefreq to match the commercial hierarchy (seller = #1):

```ts
const meta = (path: string) => {
  if (path === "")              return { changeFrequency: "daily"   as const, priority: 1.0 };
  if (path === "/immobili")     return { changeFrequency: "daily"   as const, priority: 0.9 };
  if (path === "/vendi")        return { changeFrequency: "weekly"  as const, priority: 0.9 }; // priority #1 commercial goal
  if (path === "/investimenti") return { changeFrequency: "weekly"  as const, priority: 0.8 };
  if (path === "/gruppo")       return { changeFrequency: "monthly" as const, priority: 0.5 };
  if (path === "/contatti")     return { changeFrequency: "monthly" as const, priority: 0.5 };
  if (path === "/privacy")      return { changeFrequency: "yearly"  as const, priority: 0.2 };
  return { changeFrequency: "monthly" as const, priority: 0.5 };
};
```

**Add `alternates.languages` to each sitemap entry** (Google reads hreflang from the
sitemap too — belt and braces). next.js `MetadataRoute.Sitemap` supports it:

```ts
entries.push({
  url: loc(locale, path),
  lastModified: now,
  ...meta(path),
  alternates: {
    languages: {
      it: loc("it", path),
      en: loc("en", path),
      de: loc("de", path),
    },
  },
});
```

> Because the loop already iterates all 3 locales × all paths, you get 3 URL entries
> each carrying the full alternates map — that's the correct, redundant-by-design
> hreflang sitemap shape. `loc()` already handles the it-no-prefix rule (line 8). The
> per-property loop (lines 27–34) should also gain the same `alternates` block, and
> should **only include gated/published units** — confirm `getProperties()` already
> returns only `tsv_com_online && pubblicato_su⊇triesteimmobiliare.com` (brief §5);
> if it returns the union, filter here so unpublished slugs never enter the sitemap.

### 4.2 `src/app/robots.ts` — host + preview guard

```ts
import type { MetadataRoute } from "next";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com";

export default function robots(): MetadataRoute.Robots {
  // On the Vercel preview (DNS not cut over), block everything so the draft
  // never gets indexed and never competes with the live WordPress site.
  const isPreview = process.env.VERCEL_ENV !== "production";
  if (isPreview) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/private/", "/*?*sort=", "/*?*page="], // block thin/duplicate param URLs
    },
    host: SITE,
    sitemap: `${SITE}/sitemap.xml`,
  };
}
```

> The `isPreview` branch is the single most important pre-launch SEO safeguard: the
> brief explicitly says DNS is NOT cut over and production is still WordPress.
> Without it, `triesteimmobiliare.vercel.app` could get crawled and create duplicate
> content against the real domain. Pair with a `X-Robots-Tag: noindex` header on the
> preview deployment (set in `next.config` headers or Vercel project env) for defence
> in depth — a `robots.txt` disallow alone doesn't deindex already-crawled URLs.

---

## 5. On-page keyword guidance (H1/H2 intent — no stuffing)

One `<h1>` per page. H1 ≠ SEO title (title is for the SERP; H1 is for the human +
topical signal). H2s map to the recovered content blocks and carry secondary intent.
Keywords below are **targets to satisfy by meaning**, woven into natural sentences —
never repeated mechanically.

### `/` Home
- **H1** (kinetic hero): the brand claim, e.g. IT *"Comprare, vendere e investire a
  Trieste. Senza giri di parole."* — must contain *Trieste* + the three verbs once.
- **H2s** (chapter heads): *"Vendi con 0% al venditore"* · *"Immobili in evidenza a
  Trieste"* · *"Investire a reddito a Trieste"* · *"Il Gruppo TriesteVillas"*.
- Primary signal: `agenzia immobiliare Trieste`. Don't repeat "Trieste" more than
  ~once per heading; let body copy carry zones (Barcola, Carso, Costiera, Muggia).

### `/vendi` (priority #1)
- **H1:** *"Vendere casa a Trieste, con 0% al venditore"* — exact-intent, mirrors the
  top query. (Live H1 was "Vendi casa a Trieste con più strategia…" — keep the
  strategy idea in the subhead, lead the H1 with the query.)
- **H2s** (recovered blocks → each is an intent magnet): *"Valutazione in 24h, online
  in 7 giorni"* · *"Mandato semplice di 3 mesi, senza tacito rinnovo"* · *"Check-up
  pre-vendita"* · *"Specialisti in acquirenti esteri"* (DE/EN intent) · *"Affitta
  mentre vendi"* · *"Prima vendi bene, poi cerca la prossima casa"*.
- Secondary intent: `valutazione casa Trieste gratis`, `mandato vendita 3 mesi`,
  `provvigione 0 venditore`. The promo time-box ("entro settembre 2026") appears in
  body + FAQ, NOT only in metadata — keeps it honest and crawlable.

### `/investimenti`
- **H1:** *"Investire in immobili a Trieste, a reddito"*.
- **H2s:** *"Unità già affittate, in centro, 200–400k"* · *"Ricerca per utile netto /
  ROI"* · *"Un canale riservato, non pubblicizzato"* · *"Mezz'ora per orientare la
  ricerca"*.
- Intent: `investire immobili Trieste rendita`, `immobili a reddito Trieste`,
  `ROI immobiliare Trieste`. Crucially: copy stays curiosity/profiling — no unit
  details, no prices (they can't be advertised), which also keeps the page from
  competing with `/immobili` for listing queries.

### `/immobili`
- **H1:** *"Case e appartamenti in vendita a Trieste e provincia"*.
- **H2s = zone section heads** (already in the live zone index): *"Centro"*,
  *"Barcola"*, *"Carso e Altopiano"*, *"Costiera"*, *"Muggia"*, *"FVG"* — each H2 is a
  local long-tail anchor (`case in vendita Barcola`, etc.). These double as the
  `#anchor` targets the home zone index links to.
- Intent: `case in vendita Trieste`, `appartamenti in vendita Trieste`, per-zone.

### `/gruppo`
- **H1:** *"Il Gruppo TriesteVillas. Brand diversi, una regia sola."* (recovered line).
- **H2s:** one per brand (TriesteVillas, TriesteImmobiliare, TriesteAffitti,
  FriuliVillas, TriesteBusiness, LignanoVillas) — each H2 = the brand name +
  one-line specialisation. Internal links out to each brand site (passes trust,
  satisfies the cross-brand routing in brief §2/§5).
- Intent: brand/navigational; also `gruppo immobiliare Trieste`.

### `/contatti`
- **H1:** *"Parla con TriesteImmobiliare"*.
- **H2s:** *"Dove siamo"* (Via Torino 34) · *"Scrivici"* · *"Vendi o cerchi casa?"*.
- Intent: local/NAP. Ensure NAP (Name-Address-Phone) here is **byte-identical** to the
  footer, the JSON-LD `address`, and the Google Business Profile — NAP consistency is
  the dominant local-SEO ranking factor. Phone shown without +39 in UI (KB rule),
  `tel:+390402473628` in the link, `+390402473628` in JSON-LD `telephone`.

### Listing detail `/annuncio/[slug]`
- **H1:** `property.title` (already rendered, line 188) — ensure it's an `<h1>` and
  unique per listing. Add zona + tipologia + mq into the title when the raw title is
  generic, so each detail page targets a distinct long-tail.
- One H1 only; the existing section headings (Descrizione, Caratteristiche, Posizione)
  stay as H2 (`descriptionTitle`, etc. — already H2-level in the page).

---

## 6. Implementation checklist (ordered, file-by-file)

1. **`src/lib/seo.ts`** (new) — `absoluteUrl`, `buildAlternates` (§3.1).
2. **`src/components/JsonLd.tsx`** (new) — the script injector (§2).
3. **`messages/{it,en,de}.json`** — add the `seo` namespace with all 18 strings
   from §1.1–§1.6 (IT/EN/DE). Keep existing `meta` block as the home/layout default.
4. **`src/app/[locale]/layout.tsx`** — add `metadataBase` (§1.0); emit site-wide
   `RealEstateAgent` + `WebSite` JSON-LD (§2.1/§2.2) once here.
5. **Each hub page** (`/`, `/vendi`, `/investimenti`, `/immobili`, `/gruppo`,
   `/contatti`) — rewrite `generateMetadata` to pull `seo.<page>`, use
   `title: { absolute }`, add `alternates: buildAlternates(...)` + `openGraph`.
   Add per-page `BreadcrumbList` (§2.3). `/vendi` adds `FAQPage` (§2.4) **with a
   matching visible accordion**.
6. **`/investimenti/page.tsx`** (new route) — create it (brief §4); wire its metadata
   + breadcrumb. No `Offer` JSON-LD (off-market).
7. **`/annuncio/[slug]/page.tsx`** — upgrade `generateMetadata` (title/desc/alternates/
   OG per §1.7); add `Residence`+`Offer` JSON-LD (§2.5), omitting price when reserved.
8. **`src/app/sitemap.ts`** — add `/investimenti`, per-path priorities, `alternates`
   per entry, gate the property loop (§4.1).
9. **`src/app/robots.ts`** — preview `noindex` guard, `host`, param disallows (§4.2).
10. **OG images** (§6.5) — produce `/og/{home,vendi,investimenti,immobili,gruppo,
    contatti}.jpg`, 1200×630, light nautical skin + paper-boat logo.

### 6.5 OpenGraph / social

- 1200×630 JPG per hub page under `/public/og/`. Light paper background, paper-boat
  logo, one-line claim per page (localise text into the image, or keep image
  language-neutral and let `og:title`/`og:description` localise — neutral image is
  simpler and reused across locales).
- `openGraph.locale` per locale: `it_IT` / `en_GB` / `de_DE`. Add
  `openGraph.alternateLocale` with the other two so social platforms know variants.
- `twitter: { card: "summary_large_image" }` in the layout default.
- Listing OG image = the property `coverPhoto.url` (absolute via `metadataBase`).

### 6.6 Pre-launch / post-DNS gotchas (the things that silently kill ranking)

- **Preview = noindex** until DNS cutover (§4.2). Non-negotiable.
- **At cutover**: remove the noindex guard (it keys off `VERCEL_ENV==="production"`
  + the real domain), submit the new `sitemap.xml` in Search Console for the
  `www.triesteimmobiliare.com` property, and **301-map old WordPress URLs** to the
  new routes (e.g. live `/valutazione`, `/compra`, `/check-up-pre-vendita`,
  `/faq-proprietari` → `/vendi` or `/immobili`; preserve any earned authority).
  Provide that redirect map in `next.config` `redirects()` before the switch.
- **Pick ONE host** (www vs apex) and 301 the other; the code uses `www`.
- **Validate**: Rich Results Test for FAQ/RealEstateAgent/Offer, and the hreflang
  with a crawler (Screaming Frog / Search Console "International Targeting") to catch
  non-reciprocal tags after the first deploy.

---

## 7. Open items / placeholders to confirm before launch

- `{{FACEBOOK_URL}}`, `{{YOUTUBE_URL}}` for `sameAs` (omit if unconfirmed).
- Postal code for Via Torino 34 — used `34132` (the legal-office CAP); **verify the
  actual CAP of Via Torino 34** before shipping the address JSON-LD.
- Marketing stats (2M/5.6M) — **kept out of all metadata & JSON-LD** until verified
  (per Martino's accuracy rule); body copy uses "milioni di visualizzazioni".
- Whether `/immobili` exposes a real `?q=` search → decides the `WebSite`
  `potentialAction` SearchAction (§2.2).
- Old WordPress URL inventory for the 301 map (§6.6) — pull from the live sitemap
  before DNS cutover.
