import { formatPrice } from "./format";
import { photoSrc, photoSrcSet } from "./photoSrc";
import type { Property } from "./properties";

export type BadgeVariant = "default" | "private" | "cantiere" | "recent" | "featured" | "sold";
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
  soldBadge?: Badge | null;
  meta: string;
  // `srcSet` manca solo sui record PRIVATE, che restano sulla url firmata di
  // Airtable (il proxy /foto non li risolve): lì si serve una sola larghezza.
  cover: { url: string; srcSet?: string; alt: string } | null;
  // Cover + up to 8 top photos (9 total), for the in-card photo slider.
  gallery: { url: string; srcSet?: string; alt: string }[];
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

// Titolo pubblico nella lingua del visitatore: il nome EN/DE/SL quando c'è,
// altrimenti quello italiano. Mai una stringa vuota: `title` è sempre
// valorizzato (mapRecord). Per lo sloveno la catena è titleSl → titleEn →
// title: a chi legge in sloveno serve l'inglese, la lingua internazionale,
// prima dell'italiano (come sul gemello triestevillas-web).
export function localizedTitle(p: Property, locale: string): string {
  if (locale === "de") return p.titleDe ?? p.title;
  if (locale === "en") return p.titleEn ?? p.title;
  if (locale === "sl") return p.titleSl ?? p.titleEn ?? p.title;
  return p.title;
}

// Descrizione nella lingua del visitatore. La catena di fallback è esplicita e
// finisce SEMPRE sull'italiano — meglio una scheda in italiano che una vuota:
//   EN → descrizione_TSI_EN_# → descrizione_TSI_# → descrizione
//   DE → descrizione_TSI_DE_# → descrizione_TSI_# → descrizione
//   SL → descrizione_tsi_sl (vetrina) → descrizione_TSI_EN_# → descrizione_TSI_# → descrizione
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
//
// Lo sloveno (2026-10-01) ripiega sull'INGLESE: è una traduzione vera, solo in
// un'altra lingua, e per un lettore sloveno vale più dell'italiano. Per la meta
// description è comunque meglio di un one-liner italiano.
export function translatedDescription(p: Property, locale: string): string | null {
  if (locale === "de") return p.descriptionDe;
  if (locale === "en") return p.descriptionEn;
  if (locale === "sl") return p.descriptionSl ?? p.descriptionEn;
  return null;
}

// Esonimi sloveni dei comuni (2026-10-01), applicati SOLO in resa sl e SOLO
// alla riga località (card) e al luogo della scheda. Tabella copiata dal
// gemello triestevillas-web (src/lib/listingI18n.ts, forme verificate nella
// guida di stile dello sloveno): dove l'esonimo è ambiguo o poco noto in
// Slovenia l'italiano resta tra parentesi, perché il compratore lo cerca su
// Maps e lo ritrova nell'atto. Le vie NON si toccano mai.
const SL_EXONYMS: Record<string, string> = {
  Trieste: "Trst",
  Muggia: "Milje",
  Duino: "Devin",
  Aurisina: "Nabrežina",
  "Duino-Aurisina": "Devin-Nabrežina",
  "Duino Aurisina": "Devin-Nabrežina",
  Sistiana: "Sesljan",
  Opicina: "Opčine",
  "Villa Opicina": "Opčine",
  Sgonico: "Zgonik",
  Monrupino: "Repentabor",
  "San Dorligo della Valle": "Dolina (San Dorligo della Valle)",
  Gorizia: "Gorica",
  Monfalcone: "Tržič (Monfalcone)",
  Udine: "Videm (Udine)",
  Grado: "Gradež",
  Venezia: "Benetke",
};
export function localizePlaceName(name: string | null, locale: string): string | null {
  if (!name || locale !== "sl") return name;
  return SL_EXONYMS[name.trim()] ?? name;
}

// «N locali» nella lingua del visitatore. In sloveno il sostantivo si accorda
// col numero — 1 soba, 2 sobi, 3–4 sobe, 5 sob — e «3 sobe» scritto per tutti
// darebbe «2 sobe» e «5 sobe», sbagliati (2026-10-01). Le altre lingue restano
// com'erano: numero + etichetta in minuscolo.
const SOBE: Record<string, string> = { one: "soba", two: "sobi", few: "sobe", other: "sob" };
export function roomsLabel(rooms: string, locale: string, label: string): string {
  if (locale !== "sl") return `${rooms} ${label.toLowerCase()}`;
  const intero = rooms.trim().match(/^(\d+)$/);
  if (intero) return `${intero[1]} ${SOBE[new Intl.PluralRules("sl").select(Number(intero[1]))]}`;
  const almeno = rooms.trim().match(/^(?:>\s*(\d+)|(\d+)\s*\+)$/);
  if (almeno) return `${almeno[1] ?? almeno[2]}+ sob`;
  return `${label}: ${rooms}`;
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

// «Venduto»: l'immobile resta in vetrina, col suo prezzo, ma lo si dice. Solo
// lo stato commerciale SOLD; UNDER_OFFER e RESERVED non si annunciano.
export function soldBadge(p: Property, t: Translate): Badge | null {
  return p.statusCommerciale?.toUpperCase().trim() === "SOLD"
    ? { label: t("badgeSold"), variant: "sold" }
    : null;
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
    p.rooms ? roomsLabel(p.rooms, locale, t("rooms")) : null,
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
    place: [zonaLabel, localizePlaceName(p.comune, locale)].filter(Boolean).join(" · "),
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
    soldBadge: soldBadge(p, t),
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
