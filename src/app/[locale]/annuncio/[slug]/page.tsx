import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProperties, getProperty } from "@/lib/airtable";
import PropertyCharacteristics, {
  type Characteristic,
} from "@/components/PropertyCharacteristics";
import PropertyMap from "@/components/PropertyMap";
import PropertyGallery from "@/components/PropertyGallery";
import { contractBadge, clusterBadge, priceLabel } from "@/lib/propertyView";

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
    property.pianiEdificio && { icon: "building", label: t("floorsBuilding"), value: String(property.pianiEdificio) },
    property.annoCostruzione && { icon: "year", label: t("yearBuilt"), value: String(property.annoCostruzione) },
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

      <div className="mt-6">
        <PropertyGallery
          title={property.title}
          reference={`${t("reference")} ${property.id}`}
          place={place}
          badge={contractBadge(property, t)}
          clusterBadge={clusterBadge(property, t)}
          cover={property.coverPhoto}
          topPhotos={property.topPhotos}
          allPhotos={property.photos}
          planimetrie={property.planimetrie}
          videos={[...property.videos, ...property.walkthroughs]}
          matterportUrl={property.matterportUrl}
          labels={{
            photos: t("galPhotos"),
            plans: t("galPlans"),
            video: t("galVideo"),
            tour: t("galTour"),
            viewAll: t("galViewAll", { count: property.photos.length }),
            close: t("galClose"),
            photosComing: t("photosComing"),
          }}
        />
      </div>

      <p className="mt-6 text-2xl font-semibold text-neutral-900">
        {priceLabel(property, locale, t)}
      </p>

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
          <a className="underline decoration-white/40 hover:decoration-white" href="mailto:luxury@triestevillas.com">
            luxury@triestevillas.com
          </a>
          <a className="underline decoration-white/40 hover:decoration-white" href="https://wa.me/393400700699">
            WhatsApp
          </a>
        </div>
      </section>
    </article>
  );
}
