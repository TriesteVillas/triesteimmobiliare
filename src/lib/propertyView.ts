import { formatPrice } from "./format";
import { photoSrc, photoSrcSet } from "./photoSrc";
import type { Property } from "./properties";

export type BadgeVariant = "default" | "private" | "cantiere" | "recent" | "featured";
export type Badge = { label: string; variant: BadgeVariant };

// Larghezze utili a una copertina di card. Una card non supera mai ~400 px CSS
// (tre colonne in un max-w-6xl fanno ~352 px; il carosello della home 78vw su un
// telefono da 412 px fa ~321 px), quindi 800 è il tetto: serve solo ai display
// a DPR 2. Sopra non si sale — sarebbe scaricare pixel che nessuno vede.
const CARD_WIDTHS = [400, 600, 800] as const;

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
  recentBadge?: Badge | null;
  featuredBadge?: Badge | null;
  meta: string;
  // `srcSet` manca solo sui record PRIVATE, che restano sulla url firmata di
  // Airtable (il proxy /foto non li risolve): lì si serve una sola larghezza.
  cover: { url: string; srcSet?: string; alt: string } | null;
  // Cover + up to 8 top photos (9 total), for the in-card photo slider.
  gallery: { url: string; srcSet?: string; alt: string }[];
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
  const onlineDays = p.onlineDa
    ? Math.max(0, Math.floor((Date.now() - Date.parse(p.onlineDa)) / 86400000))
    : null;
  const meta = [
    p.tipologia,
    p.mq ? t("sqm", { value: p.mq }) : null,
    p.rooms ? `${p.rooms} ${t("rooms").toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Cover + top photos (deduped by filename), max 9 (cover + top 8), for the
  // card slider.
  const cardTitle = localizedTitle(p, locale);
  const gallerySeen = new Set<string>();
  // La Private Collection passa da qui (src/app/[locale]/private/page.tsx), e il
  // proxy /foto risolve SOLO gli immobili pubblici: un id privato là dentro dà
  // 404. Quindi i record PRIVATE restano sulla url firmata di Airtable — la
  // guardia non è teorica, senza si romperebbero le foto della collezione.
  const isPrivate = p.cluster?.toUpperCase().trim() === "PRIVATE";
  const gallery: { url: string; srcSet?: string; alt: string }[] = [];
  for (const ph of [p.coverPhoto, ...p.topPhotos]) {
    if (!ph) continue;
    const key = ph.filename ?? ph.url;
    if (gallerySeen.has(key)) continue;
    gallerySeen.add(key);
    gallery.push({
      url: isPrivate ? ph.thumb : photoSrc(ph, 800),
      srcSet: isPrivate ? undefined : photoSrcSet(ph, CARD_WIDTHS),
      alt: cardTitle,
    });
    if (gallery.length >= 9) break;
  }

  return {
    slug: p.slug,
    title: localizedTitle(p, locale),
    gallery,
    zona: p.zona,
    place: [zonaLabel, p.comune].filter(Boolean).join(" · "),
    priceLabel: priceLabel(p, locale, t),
    badge: contractBadge(p, t),
    clusterBadge: clusterBadge(p, t),
    recentBadge:
      onlineDays !== null && onlineDays <= 30
        ? { label: t("onlineDays", { count: onlineDays }), variant: "recent" }
        : null,
    featuredBadge: p.inEvidenza
      ? { label: t("badgeFeatured"), variant: "featured" }
      : null,
    meta,
    // Le card passano dal proxy /foto (WebP alla larghezza giusta, url stabile);
    // solo i record privati restano sulla rendition firmata di Airtable.
    // `url` resta l'800 come prima: è il fallback per chi ignora srcSet, e nel
    // ladder è la larghezza più grande, quindi non introduce un download nuovo.
    // L'alt segue il titolo localizzato: `coverPhoto.alt` nasce dal titolo italiano
    // in mapRecord (che non conosce il locale), e su /en o /de sarebbe fuori lingua.
    cover: p.coverPhoto
      ? {
          url: isPrivate ? p.coverPhoto.thumb : photoSrc(p.coverPhoto, 800),
          srcSet: isPrivate ? undefined : photoSrcSet(p.coverPhoto, CARD_WIDTHS),
          alt: cardTitle,
        }
      : null,
  };
}
