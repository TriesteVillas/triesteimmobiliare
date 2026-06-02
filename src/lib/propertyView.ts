import { formatPrice } from "./format";
import type { Property } from "./properties";

// Plain, serializable display model for a property card. Built on the server
// (needs locale + translations) and handed to client components as-is.
export type PropertyView = {
  slug: string;
  title: string;
  zona: string | null;
  place: string;
  priceLabel: string;
  badge: string;
  meta: string;
  cover: { url: string; alt: string } | null;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function buildPropertyView(
  p: Property,
  locale: string,
  t: Translate,
  zonaLabel: string | null,
): PropertyView {
  const priceLabel =
    p.contratto === "AFFITTO"
      ? p.priceRent
        ? `${formatPrice(p.priceRent, locale)}${t("perMonth")}`
        : t("priceOnRequest")
      : p.priceSale
        ? formatPrice(p.priceSale, locale)
        : t("priceOnRequest");

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
    priceLabel,
    badge: p.contratto === "AFFITTO" ? t("forRent") : t("forSale"),
    meta,
    cover: p.photos[0] ? { url: p.photos[0].url, alt: p.photos[0].alt } : null,
  };
}
