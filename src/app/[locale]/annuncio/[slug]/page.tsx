import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProperties, getProperty } from "@/lib/airtable";
import { formatPrice } from "@/lib/format";
import type { Property } from "@/lib/properties";
import PropertyCharacteristics, {
  type Characteristic,
} from "@/components/PropertyCharacteristics";
import PropertyMap from "@/components/PropertyMap";

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
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};
  return {
    title: property.title,
    description: property.oneliner ?? property.description?.slice(0, 160),
  };
}

function priceLine(p: Property, locale: string, t: (k: string) => string) {
  if (p.contratto === "AFFITTO") {
    return p.priceRent
      ? `${formatPrice(p.priceRent, locale)}${t("perMonth")}`
      : t("priceOnRequest");
  }
  return p.priceSale ? formatPrice(p.priceSale, locale) : t("priceOnRequest");
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const property = await getProperty(slug);
  if (!property) notFound();

  const t = await getTranslations("property");
  const place = [property.via, property.zona, property.comune]
    .filter(Boolean)
    .join(", ");

  const characteristics = [
    property.tipologia && { icon: "home", label: t("type"), value: property.tipologia },
    {
      icon: "contract",
      label: t("contract"),
      value: property.contratto === "AFFITTO" ? t("forRent") : t("forSale"),
    },
    property.mq && { icon: "surface", label: t("surface"), value: t("sqm", { value: property.mq }) },
    property.rooms && { icon: "rooms", label: t("rooms"), value: property.rooms },
    property.baths && { icon: "baths", label: t("baths"), value: String(property.baths) },
    property.floor && { icon: "floor", label: t("floor"), value: property.floor },
    property.ascensore && { icon: "elevator", label: t("elevator"), value: property.ascensore },
    property.arredato && { icon: "furnished", label: t("furnished"), value: property.arredato },
    property.parcheggio && { icon: "parking", label: t("parking"), value: property.parcheggio },
    property.piscina && { icon: "pool", label: t("pool"), value: property.piscina },
    property.energyClass && { icon: "energy", label: t("energyClass"), value: property.energyClass },
  ].filter((c): c is Characteristic => Boolean(c));

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/immobili"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← {t("backToList")}
      </Link>

      {property.photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {property.photos.slice(0, 5).map((photo, i) => (
            <div
              key={photo.url}
              className={`relative overflow-hidden rounded-xl bg-neutral-100 ${
                i === 0 ? "aspect-video sm:col-span-2" : "aspect-[4/3]"
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-400">
          {t("photosComing")}
        </div>
      )}

      {property.matterportUrl && (
        <section className="mt-3">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-light">
            {t("virtualTour")}
          </p>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
            <iframe
              src={property.matterportUrl}
              title={t("virtualTour")}
              allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </section>
      )}

      <header className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-brand-light">
            {property.contratto === "AFFITTO" ? t("forRent") : t("forSale")}
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {property.title}
          </h1>
          {place && <p className="mt-1 text-neutral-500">{place}</p>}
          <p className="mt-1 text-xs text-neutral-400">
            {t("reference")} {property.id}
          </p>
        </div>
        <p className="text-2xl font-semibold text-neutral-900">
          {priceLine(property, locale, t)}
        </p>
      </header>

      <PropertyCharacteristics
        title={t("characteristicsTitle")}
        items={characteristics}
      />

      {property.description && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("descriptionTitle")}</h2>
          <div className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">
            {property.description}
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

      {property.lat != null && property.lng != null && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("locationTitle")}</h2>
          <div className="mt-3">
            <PropertyMap lat={property.lat} lng={property.lng} />
          </div>
          <p className="mt-2 text-sm text-neutral-500">{t("locationApprox")}</p>
        </section>
      )}

      <section className="mt-10 rounded-xl bg-brand-dark p-6 text-white">
        <h2 className="text-lg font-semibold">{t("contactCta")}</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <a className="underline decoration-white/40 hover:decoration-white" href="mailto:info@triesteimmobiliare.com">
            info@triesteimmobiliare.com
          </a>
          <a className="underline decoration-white/40 hover:decoration-white" href="tel:0402473628">
            040 2473628
          </a>
        </div>
      </section>
    </article>
  );
}
