import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProperties } from "@/lib/airtable";
import { zoneKey } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";
import PropertyCard from "@/components/PropertyCard";
import HeroVideo from "@/components/HeroVideo";
import ScrollVideo from "@/components/ScrollVideo";

// Curated homepage sections: zona code → translation key under home.featured.
// Each renders up to 3 cards with a "view more" deep-link to /immobili#CODE.
const FEATURED_SECTIONS = [
  { code: "CENTRO", key: "centro" },
  { code: "BARCOLA", key: "barcola" },
  { code: "COSTIERA", key: "costiera" },
  { code: "ALTE", key: "carso" },
  { code: "FVG", key: "fvg" },
] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tProp = await getTranslations("property");
  const tZones = await getTranslations("zones");
  const tFeatured = await getTranslations("home.featured");
  const tBeyond = await getTranslations("home.beyond");
  const tTour = await getTranslations("home.tour");

  const properties = await getProperties();
  const sections = FEATURED_SECTIONS.map(({ code, key }) => {
    const label = tZones(code);
    const items = properties
      .filter((p) => zoneKey(p) === code)
      .slice(0, 3)
      .map((p) => buildPropertyView(p, locale, tProp, label));
    return { code, title: tFeatured(key), items };
  }).filter((s) => s.items.length > 0);

  return (
    <>
      <HeroVideo />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-lg text-white/90">{t("heroSubtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/immobili"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-white/90"
            >
              {t("ctaProperties")}
            </Link>
            <Link
              href="/contatti"
              className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {t("ctaContact")}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        {sections.map((s) => (
          <section key={s.code} className="mb-16 last:mb-0">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">{s.title}</h2>
              <Link
                href={`/immobili#${s.code}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                {tFeatured("viewMore")} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((v) => (
                <PropertyCard
                  key={v.slug}
                  view={v}
                  photosComing={tProp("photosComing")}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ScrollVideo src="/video/finestra.mp4" poster="/video/finestra-poster.jpg">
        <div className="mx-auto max-w-5xl px-4 text-white">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light drop-shadow">
            {tBeyond("eyebrow")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold drop-shadow">
                {tBeyond("publicLabel")}
              </h3>
              <p className="mt-2 text-white/85 drop-shadow">{tBeyond("publicText")}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold drop-shadow">
                {tBeyond("privateLabel")}
              </h3>
              <p className="mt-2 text-white/85 drop-shadow">{tBeyond("privateText")}</p>
            </div>
          </div>
          <Link
            href="/contatti"
            className="mt-10 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-white/90"
          >
            {tBeyond("cta")}
          </Link>
        </div>
      </ScrollVideo>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-light">
              {tTour("eyebrow")}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {tTour("title")}
            </h2>
            <p className="mt-2 text-neutral-600">{tTour("text")}</p>
          </div>
          <Link
            href="/contatti"
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            {tTour("cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
