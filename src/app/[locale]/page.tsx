import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProperties } from "@/lib/airtable";
import { zoneKey } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";
import PropertyCard from "@/components/PropertyCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import Logo from "@/components/Logo";
import BuyerCta from "@/components/BuyerCta";
import SellerCta from "@/components/SellerCta";

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
  const tBeyond = await getTranslations("home.beyond");
  const tTour = await getTranslations("home.tour");
  const tListing = await getTranslations("listing");
  const tImmobili = await getTranslations("immobili");
  const tSell = await getTranslations("sell");

  const properties = await getProperties();

  // Featured strip: every published listing with a cover, priciest first.
  const reelItems = properties
    .filter((p) => p.coverPhoto)
    .sort(
      (a, b) =>
        (b.priceSale ?? b.priceRent ?? 0) - (a.priceSale ?? a.priceRent ?? 0),
    )
    .slice(0, 8)
    .map((p) => buildPropertyView(p, locale, tProp, tZones(zoneKey(p))));

  // Zone index with live counts.
  const zoneCounts = new Map<string, number>();
  for (const p of properties) {
    const code = zoneKey(p);
    zoneCounts.set(code, (zoneCounts.get(code) ?? 0) + 1);
  }
  const zoneRows = [...zoneCounts.entries()].map(([code, count]) => ({
    code,
    title: tZones(code),
    count,
  }));

  const heroWords = t("heroTitle").split(" ");

  return (
    <>
      {/* Hero — plain and direct: gradient, claim, two CTAs. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-paper via-white to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-light/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-36 sm:pb-24 sm:pt-44">
          <Logo markClassName="h-10 w-auto" wordClassName="text-xl" />
          <h1 className="display-hero mt-7 max-w-3xl text-brand-dark">
            {heroWords.map((w, i) => (
              <span key={i} className="kinetic-line mr-[0.24em] last:mr-0">
                <span
                  className="kinetic-word"
                  style={{ ["--word-delay" as string]: `${150 + i * 70}ms` }}
                >
                  {w}
                </span>
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-neutral-600 sm:text-lg" data-reveal>
            {t("heroSubtitle")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/immobili"
              className="btn-hero rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
            >
              {t("ctaProperties")}
            </Link>
            <BuyerCta
              label={t("ctaContact")}
              fonteCta="Parla con noi"
              className="btn-press rounded-full border border-brand/40 px-7 py-3 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
            />
          </div>
        </div>
      </section>

      {/* Featured listings */}
      {reelItems.length > 0 && (
        <section className="pt-6">
          <div className="mx-auto max-w-6xl px-6">
            <p className="eyebrow">{t("featured.viewMore")}</p>
            <h2 className="display-chapter mt-2 text-brand-dark">
              {t("featuredTitle")}
            </h2>
          </div>
          <FeaturedCarousel>
            {reelItems.map((v) => (
              <div
                key={v.slug}
                className="w-[78vw] shrink-0 snap-start sm:w-[38vw] lg:w-[28vw]"
              >
                <PropertyCard view={v} photosComing={tProp("photosComing")} />
              </div>
            ))}
            <div className="flex w-[40vw] shrink-0 snap-start items-center justify-center sm:w-[24vw]">
              <Link
                href="/immobili"
                transitionTypes={["nav-forward"]}
                className="btn-press rounded-full border border-brand/40 px-8 py-4 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
              >
                {t("viewAll")} →
              </Link>
            </div>
          </FeaturedCarousel>
        </section>
      )}

      {/* How we work — the two promises, side by side. */}
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="eyebrow text-sand">{tBeyond("eyebrow")}</p>
          <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div data-reveal>
              <h3 className="display-chapter text-white">{tBeyond("publicLabel")}</h3>
              <p className="mt-4 text-white/75">{tBeyond("publicText")}</p>
            </div>
            <div data-reveal>
              <h3 className="display-chapter text-sand">{tBeyond("privateLabel")}</h3>
              <p className="mt-4 text-white/75">{tBeyond("privateText")}</p>
            </div>
          </div>
          <div className="mt-10">
            <BuyerCta
              label={tBeyond("cta")}
              fonteCta="Come lavoriamo"
              className="btn-hero inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark"
            />
          </div>
        </div>
      </section>

      {/* Zone index */}
      {zoneRows.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-8 pt-20">
          <p className="eyebrow">{tImmobili("filterAll")}</p>
          <h2 className="display-chapter mt-2 text-brand-dark">
            {tImmobili("title")}
          </h2>
          <ul
            className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200"
            data-reveal-stagger
          >
            {zoneRows.map((z) => (
              <li key={z.code}>
                <Link
                  href={`/immobili#${z.code}`}
                  className="group flex items-baseline justify-between gap-6 py-6 transition-colors hover:bg-paper sm:py-7"
                >
                  <span className="text-xl font-semibold tracking-tight text-brand-dark transition-colors duration-300 group-hover:text-brand sm:text-2xl">
                    {z.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-5">
                    <span className="text-sm text-neutral-400">
                      {tListing("count", { count: z.count })}
                    </span>
                    <span className="inline-block text-2xl text-brand transition-transform duration-300 ease-[var(--ease-lux)] group-hover:translate-x-2">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Free valuation band */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-neutral-200 bg-paper px-7 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl" data-reveal="left">
            <p className="eyebrow">{tTour("eyebrow")}</p>
            <h2 className="display-chapter mt-2 text-brand-dark">{tTour("title")}</h2>
            <p className="mt-3 text-neutral-600">{tTour("text")}</p>
          </div>
          <SellerCta
            label={tSell("ctaPrimary")}
            className="btn-hero shrink-0 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
          />
        </div>
      </section>
    </>
  );
}
