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
    title: p.title,
    zona: p.zona,
    place: [zonaLabel, p.comune].filter(Boolean).join(" · "),
    priceLabel: priceLabel(p, locale, t),
    badge: contractBadge(p, t),
    clusterBadge: clusterBadge(p, t),
    meta,
    // Cards use Airtable's lighter "large" rendition, not the full-res original.
    cover: p.coverPhoto ? { url: p.coverPhoto.thumb, alt: p.coverPhoto.alt } : null,
  };
}
