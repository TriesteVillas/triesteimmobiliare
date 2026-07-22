import type { Metadata } from "next";
import { ViewTransition } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProperties, getProperty } from "@/lib/airtable";
import { similarProperties, zoneKey } from "@/lib/properties";
import PropertyCharacteristics, {
  type Characteristic,
} from "@/components/PropertyCharacteristics";
import PropertyMap from "@/components/PropertyMap";
import PhotoGallery from "@/components/PhotoGallery";
import Planimetrie from "@/components/Planimetrie";
import PropertyBadge from "@/components/PropertyBadge";
import PropertyCard from "@/components/PropertyCard";
import StickyNav from "@/components/StickyNav";
import Scene from "@/components/motion/Scene";
import LeadForm from "@/components/LeadForm";
import VisitForm from "@/components/VisitForm";
import {
  buildPropertyView,
  contractBadge,
  clusterBadge,
  localizedDescription,
  localizedTitle,
  metaClamp,
  priceLabel,
  translatedDescription,
} from "@/lib/propertyView";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";
import FavHeart from "@/components/account/FavHeart";
import AccountVote from "@/components/account/AccountVote";
import DwellTracker from "@/components/account/DwellTracker";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const properties = await getProperties();
  return routing.locales.flatMap((locale) =>
    properties.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};
  // Titolo e meta description nella lingua della pagina.
  //
  // ORDINE, e conta: su /en e /de viene prima la descrizione TRADOTTA (così la
  // SERP non mostra italiano a chi cerca in inglese o tedesco), ma solo se
  // esiste DAVVERO — `translatedDescription`, non `localizedDescription`, che
  // ripiegherebbe sull'italiano e ce lo farebbe preferire all'one-liner.
  // Quando la traduzione manca il gradino giusto è l'one-liner: è italiano come
  // il ripiego, ma è corto, scritto a mano e pensato per lo snippet, invece del
  // primo pezzo di una descrizione da 1000 caratteri tagliata a metà frase.
  //   en/de → descrizione tradotta → one-liner → descrizione italiana
  //   it    →                        one-liner → descrizione italiana
  const title = localizedTitle(property, locale);
  const description =
    metaClamp(translatedDescription(property, locale)) ??
    property.oneliner ??
    metaClamp(property.description) ??
    "TriesteImmobiliare";
  return {
    title: { absolute: `${title} · TriesteImmobiliare` },
    description,
    alternates: pageAlternates(locale, `/annuncio/${slug}`),
    openGraph: pageOpenGraph(
      locale,
      `/annuncio/${slug}`,
      title,
      description,
      property.coverPhoto?.url,
    ),
  };
}

// Split a description into readable paragraphs. Honours author-made line breaks
// (blank lines or single newlines); for a single wall of text, groups sentences
// into chunks of ~3. Sentence split only on punctuation + space + capital, so
// "10.200,00" / "ecc." don't cause false breaks.
function toParagraphs(text: string): string[] {
  const byBreak = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (byBreak.length > 1) return byBreak;
  const sentences = text
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý"«])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join(" "));
  }
  return chunks.length ? chunks : [text];
}

// Extract 11-char YouTube ids from the common URL shapes.
function youtubeIds(urls: string[]): string[] {
  return urls
    .map(
      (u) =>
        u.match(
          /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
        )?.[1],
    )
    .filter((x): x is string => Boolean(x));
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const all = await getProperties();
  const property = all.find((p) => p.slug === slug);
  // Old-site /annuncio/<slug> links still indexed by Google land here:
  // send them to the listing index instead of a dead end.
  if (!property) {
    redirect({ href: "/immobili", locale });
    notFound(); // unreachable — narrows the type (redirect isn't typed never)
  }

  const t = await getTranslations("property");
  const tZones = await getTranslations("zones");
  const similar = similarProperties(property, all);
  const place = [property.via, property.zona, property.comune]
    .filter(Boolean)
    .join(", ");
  const hasLocation = property.lat != null && property.lng != null;
  const ytIds = youtubeIds(property.videos);

  // Titolo e descrizione nella lingua del visitatore, con ritorno all'italiano
  // quando la traduzione non è ancora stata scritta (vedi localizedDescription).
  const title = localizedTitle(property, locale);
  const description = localizedDescription(property, locale);

  const characteristics = [
    // Order matters: PropertyCharacteristics keeps the first 8 (the headline
    // specs) always visible and collapses the rest behind a "show all" toggle.
    // — Primary: always visible —
    property.tipologia && { icon: "home", label: t("type"), value: property.tipologia },
    {
      icon: "contract",
      label: t("contract"),
      value: property.contratto === "AFFITTO" ? t("forRent") : t("forSale"),
    },
    property.mq && { icon: "surface", label: t("surface"), value: t("sqm", { value: property.mq }) },
    property.rooms && { icon: "rooms", label: t("rooms"), value: property.rooms },
    property.camere && { icon: "bedroom", label: t("bedrooms"), value: String(property.camere) },
    property.baths && { icon: "baths", label: t("baths"), value: String(property.baths) },
    property.floor && { icon: "floor", label: t("floor"), value: property.floor },
    property.stato && { icon: "condition", label: t("condition"), value: property.stato },
    // — Secondary: revealed on click —
    property.tipoProprieta && { icon: "ownership", label: t("propertyType"), value: property.tipoProprieta },
    property.disponibilita && { icon: "availability", label: t("availability"), value: property.disponibilita },
    property.cucina && { icon: "kitchen", label: t("kitchen"), value: property.cucina },
    property.terrazzo && { icon: "terrace", label: t("terrace"), value: t("yes") },
    property.balcone && { icon: "balcony", label: t("balcony"), value: t("yes") },
    property.giardino && { icon: "garden", label: t("garden"), value: property.giardino },
    property.pianiEdificio && { icon: "building", label: t("floorsBuilding"), value: String(property.pianiEdificio) },
    property.annoCostruzione && { icon: "year", label: t("yearBuilt"), value: String(property.annoCostruzione) },
    property.ascensore && { icon: "elevator", label: t("elevator"), value: property.ascensore },
    property.accessoDisabili && { icon: "accessible", label: t("accessibility"), value: t("yes") },
    property.arredato && { icon: "furnished", label: t("furnished"), value: property.arredato },
    property.parcheggio && { icon: "parking", label: t("parking"), value: property.parcheggio },
    property.piscina && { icon: "pool", label: t("pool"), value: property.piscina },
    property.riscaldamento && { icon: "heating", label: t("heating"), value: property.riscaldamento },
    property.classeImmobile && { icon: "grade", label: t("propertyClass"), value: property.classeImmobile },
    property.energyClass && { icon: "energy", label: t("energyClass"), value: property.energyClass },
  ].filter((c): c is Characteristic => Boolean(c));

  // Sticky anchor nav (immobiliare.it style) — only sections that exist.
  const nav = [
    (property.coverPhoto || property.photos.length) && { id: "foto", label: t("galPhotos") },
    description && { id: "descrizione", label: t("descriptionTitle") },
    property.planimetrie.length && { id: "planimetrie", label: t("galPlans") },
    ytIds.length && { id: "video", label: t("galVideo") },
    property.matterportUrl && { id: "tour", label: t("galTour") },
    hasLocation && { id: "posizione", label: t("locationTitle") },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  return (
    <article>
      {/* Cinematic hero — parallax cover, shared-element morph target */}
      <Scene as="header" mode="cover" smooth={0.14} className="relative h-[82vh] min-h-[520px] overflow-hidden bg-ink-2">
        {/* L'alt delle foto nasce dal titolo italiano in mapRecord (che non conosce
            il locale): sull'immagine principale usiamo il titolo localizzato. Le foto
            della galleria restano con l'alt costruito in mapRecord. */}
        {(property.coverPhoto ?? property.photos[0]) ? (
          <ViewTransition name={`prop-${property.slug}`} share="morph">
            <Image
              src={(property.coverPhoto ?? property.photos[0])!.url}
              alt={title}
              fill
              sizes="100vw"
              priority
              className="par-zoom object-cover"
            />
          </ViewTransition>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/10 to-ink/90" />

        <div className="absolute left-0 right-0 top-24 mx-auto max-w-5xl px-6">
          <Link
            href="/immobili"
            transitionTypes={["nav-back"]}
            className="group/back text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <span className="inline-block transition-transform duration-300 ease-[var(--ease-lux)] group-hover/back:-translate-x-1">
              ←
            </span>{" "}
            {t("backToList")}
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-12">
          <div className="flex flex-wrap items-center gap-2" data-reveal>
            <PropertyBadge {...contractBadge(property, t)} />
            {clusterBadge(property, t) && (
              <PropertyBadge {...clusterBadge(property, t)!} />
            )}
          </div>
          <h1 className="display-chapter mt-4 max-w-3xl text-white [text-shadow:0_4px_30px_rgba(0,0,0,0.5)]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/65">
            {t("reference")} {property.id}
            {place && (
              <>
                {" · "}
                {hasLocation ? (
                  <a href="#posizione" className="underline-offset-2 hover:text-white hover:underline">
                    {place}
                  </a>
                ) : (
                  place
                )}
              </>
            )}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="text-3xl font-semibold tracking-tight text-white">
              {priceLabel(property, locale, t)}
            </p>
            <FavHeart slug={property.slug} variant="detail" />
          </div>
        </div>
      </Scene>
      {/* Tracker view+dwell: attivo solo per utenti loggati, renderizza nulla. */}
      <DwellTracker slug={property.slug} />

      {/* Paper sheet — the dossier */}
      <div className="relative z-10 -mt-5 rounded-t-[2.25rem] bg-paper text-neutral-900 shadow-[0_-24px_60px_rgba(15,39,55,0.16)]">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-8">
          {nav.length > 1 && (
            <StickyNav
              title={title}
              reference={`${t("reference")} ${property.id}`}
              items={nav}
            />
          )}

          <div className="mt-6">
            <PhotoGallery
              cover={property.coverPhoto}
              topPhotos={property.topPhotos}
              allPhotos={property.photos}
              compact
              labels={{
                viewAll: t("galViewAll", { count: property.photos.length }),
                close: t("galClose"),
                photosComing: t("photosComing"),
              }}
            />
          </div>

          <PropertyCharacteristics
            title={t("characteristicsTitle")}
            items={characteristics}
            primaryCount={8}
            moreLabel={t("showAllFeatures")}
            lessLabel={t("showLess")}
          />

          {description && (
            <section id="descrizione" className="mt-8 scroll-mt-32" data-reveal>
              <h2 className="text-lg font-semibold">{t("descriptionTitle")}</h2>
              <div className="mt-3 space-y-4 leading-relaxed text-neutral-700">
                {toParagraphs(description).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          <Planimetrie
            items={property.planimetrie}
            title={t("galPlans")}
            closeLabel={t("galClose")}
          />

          {ytIds.length > 0 && (
            <section id="video" className="mt-8 scroll-mt-32">
              <h2 className="text-lg font-semibold">{t("galVideo")}</h2>
              <div className="mt-3 space-y-4">
                {ytIds.map((id) => (
                  <div
                    key={id}
                    className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900"
                  >
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${id}`}
                      title={title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {property.matterportUrl && (
            <section id="tour" className="mt-8 scroll-mt-32">
              <h2 className="text-lg font-semibold">{t("galTour")}</h2>
              <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-neutral-100">
                <iframe
                  src={property.matterportUrl}
                  title={t("galTour")}
                  allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </section>
          )}

          {property.tags.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t("featuresTitle")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {property.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {tag.replace(/_/g, " ").toLowerCase()}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasLocation && (
            <section id="posizione" className="mt-8 scroll-mt-32">
              <h2 className="text-lg font-semibold">{t("locationTitle")}</h2>
              <div className="mt-3">
                <PropertyMap lat={property.lat!} lng={property.lng!} />
              </div>
              <p className="mt-2 text-sm text-neutral-500">{t("locationApprox")}</p>
            </section>
          )}

          <AccountVote slug={property.slug} />

          {/* immobileNome resta il titolo ITALIANO in tutti e tre i locali: finisce
              nel CRM come identità del record, e un immobile deve avere un nome solo
              qualunque sia la lingua del visitatore (la lingua viaggia già in `lingua`).
              Stessa regola del log visite della Private Collection. */}
          <LeadForm
            rif={property.id}
            immobileNome={property.title}
            url={`${SITE_URL}${locale === "it" ? "" : `/${locale}`}/annuncio/${property.slug}`}
            sito="triesteimmobiliare.com"
            lingua={locale}
          />

          {/* Anche qui il nome italiano: vedi la nota su LeadForm. */}
          <VisitForm
            rif={property.id}
            immobileNome={property.title}
            url={`${SITE_URL}${locale === "it" ? "" : `/${locale}`}/annuncio/${property.slug}`}
            sito="triesteimmobiliare.com"
            lingua={locale}
          />

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-500">
            <a className="hover:text-brand" href="mailto:info@triesteimmobiliare.com">
              info@triesteimmobiliare.com
            </a>
            <a className="hover:text-brand" href="tel:0402473628">
              040 2473628
            </a>
          </div>

          {similar.length > 0 && (
            <section className="mt-12 border-t border-neutral-200 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("similarTitle")}
              </h2>
              <div
                className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                data-reveal-stagger
              >
                {similar.map((p) => (
                  <PropertyCard
                    key={p.slug}
                    view={buildPropertyView(p, locale, t, tZones(zoneKey(p)))}
                    photosComing={t("photosComing")}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
