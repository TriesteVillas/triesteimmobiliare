import { formatPrice } from "./format";
import type { Property } from "./properties";

export type BadgeVariant = "default" | "private" | "cantiere";
export type Badge = { label: string; variant: BadgeVariant };

// Plain, serializable display model for a property card. Built on the server
// (needs locale + translations) and handed to client components as-is.
export type PropertyView = {
  slug: string;
  title: string;
  zona: string | null;
  place: string;
  priceLabel: string;
  badge: Badge;
  clusterBadge: Badge | null;
  meta: string;
  cover: { url: string; alt: string } | null;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

// Titolo pubblico nella lingua del visitatore: il nome EN/DE quando c'è, altrimenti
// quello italiano. Mai una stringa vuota: `title` è sempre valorizzato (mapRecord).
export function localizedTitle(p: Property, locale: string): string {
  if (locale === "de") return p.titleDe ?? p.title;
  if (locale === "en") return p.titleEn ?? p.title;
  return p.title;
}

// Descrizione nella lingua del visitatore. La catena di fallback è esplicita e
// finisce SEMPRE sull'italiano — meglio una scheda in italiano che una vuota:
//   EN → descrizione_TSI_EN_# → descrizione_TSI_# → descrizione
//   DE → descrizione_TSI_DE_# → descrizione_TSI_# → descrizione
//   IT →                        descrizione_TSI_# → descrizione
// (gli ultimi due gradini sono già risolti in `p.description` da mapRecord).
export function localizedDescription(p: Property, locale: string): string | null {
  return translatedDescription(p, locale) ?? p.description;
}

// SOLO la traduzione vera, senza ripiego sull'italiano: null quando in questa
// lingua non abbiamo ancora scritto niente. Serve a chi deve DISTINGUERE i due
// casi — la meta description, che con una traduzione assente preferisce
// l'one-liner curato (italiano ma corto e scritto per la SERP) al primo pezzo
// della descrizione italiana tagliato a metà. Vedi generateMetadata.
export function translatedDescription(p: Property, locale: string): string | null {
  if (locale === "de") return p.descriptionDe;
  if (locale === "en") return p.descriptionEn;
  return null;
}

// Taglio per la meta description: mai a metà parola e con l'ellissi, perché
// quel testo finisce nello snippet Google e nell'OpenGraph. Le descrizioni sono
// lunghe 800-1500 caratteri: senza questo, `slice(0, 150)` tronca dove capita.
export function metaClamp(s: string | null | undefined, max = 160): string | null {
  const t = s?.replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[ ,;:.\-–—]+$/, "") + "…";
}

// Contract badge (always shown): In vendita / In affitto.
export function contractBadge(p: Property, t: Translate): Badge {
  return {
    label: p.contratto === "AFFITTO" ? t("forRent") : t("forSale"),
    variant: "default",
  };
}

// Cluster banner, shown IN ADDITION to the contract badge, only for the two
// special clusters. Null otherwise.
export function clusterBadge(p: Property, t: Translate): Badge | null {
  const cluster = p.cluster?.toUpperCase().trim();
  if (cluster === "PRIVATE") return { label: t("badgePrivate"), variant: "private" };
  if (cluster === "CANTIERI") return { label: t("badgeNewBuild"), variant: "cantiere" };
  return null;
}

// Price label: a reserved-negotiation listing hides the figure.
export function priceLabel(p: Property, locale: string, t: Translate): string {
  if (p.trattativaRiservata) return t("priceReserved");
  if (p.contratto === "AFFITTO") {
    return p.priceRent
      ? `${formatPrice(p.priceRent, locale)}${t("perMonth")}`
      : t("priceOnRequest");
  }
  return p.priceSale ? formatPrice(p.priceSale, locale) : t("priceOnRequest");
}

export function buildPropertyView(
  p: Property,
  locale: string,
  t: Translate,
  zonaLabel: string | null,
): PropertyView {
  const meta = [
    p.tipologia,
    p.mq ? t("sqm", { value: p.mq }) : null,
    p.rooms ? `${p.rooms} ${t("rooms").toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    slug: p.slug,
    title: localizedTitle(p, locale),
    zona: p.zona,
    place: [zonaLabel, p.comune].filter(Boolean).join(" · "),
    priceLabel: priceLabel(p, locale, t),
    badge: contractBadge(p, t),
    clusterBadge: clusterBadge(p, t),
    meta,
    // Cards use Airtable's lighter "large" rendition, not the full-res original.
    // L'alt segue il titolo localizzato: `coverPhoto.alt` nasce dal titolo italiano
    // in mapRecord (che non conosce il locale), e su /en o /de sarebbe fuori lingua.
    cover: p.coverPhoto
      ? { url: p.coverPhoto.thumb, alt: localizedTitle(p, locale) }
      : null,
  };
}
