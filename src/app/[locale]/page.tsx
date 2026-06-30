import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";
import { getProperties } from "@/lib/airtable";
import { zoneKey } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";
import PropertyCard from "@/components/PropertyCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import Marquee from "@/components/Marquee";
import { BoatMark } from "@/components/Logo";
import BuyerCta from "@/components/BuyerCta";
import SellerCta from "@/components/SellerCta";

const SELLER_CARDS = ["fast", "zeroFee", "simpleMandate", "marketing"] as const;
const ROUTING = ["luxury", "fvg", "rent", "business"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("home.title") },
    description: t("home.description"),
    alternates: pageAlternates(locale, "/"),
    openGraph: pageOpenGraph(locale, "/", t("home.ogTitle"), t("home.ogDescription")),
  };
}

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

  const properties = await getProperties();

  // Featured strip: every published listing with a cover, priciest first.
  const reelItems = properties
    .filter((p) => p.coverPhoto)
    .sort((a, b) => (b.priceSale ?? b.priceRent ?? 0) - (a.priceSale ?? a.priceRent ?? 0))
    .slice(0, 8)
    .map((p) => buildPropertyView(p, locale, tProp, tZones(zoneKey(p))));

  const heroWords = t("hero.titleKinetic").split(" ");

  return (
    <>
      {/* ── Hero — calm harbour light ─────────────────────────────── */}
      <section className="grad-paper-sea relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-36 sm:pb-24 sm:pt-44">
          <div data-reveal>
            <BoatMark className="h-12 w-auto sm:h-14" />
          </div>
          <p className="eyebrow mt-7" data-reveal>
            {t("hero.eyebrow")}
          </p>
          <h1 className="display-hero mt-3 max-w-3xl text-brand-dark">
            <span className="block">{t("hero.titleLine1")}</span>
            <span className="block text-brand">
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
            </span>
            <span className="block text-neutral-500">{t("hero.titleLine2")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-neutral-600 sm:text-lg" data-reveal>
            {t("hero.subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <SellerCta
              label={t("hero.ctaPrimary")}
              className="btn-hero rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
            />
            <Link
              href="/immobili"
              transitionTypes={["nav-forward"]}
              className="btn-press rounded-full border border-brand/40 px-7 py-3 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>

        {/* Promise strip — the four numbers */}
        <div className="relative mx-auto max-w-5xl px-6 pb-16">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand/15 bg-brand/15 sm:grid-cols-4">
            {(["valuation", "online", "mandate", "fee"] as const).map((k) => (
              <div key={k} className="bg-white/85 px-3 py-5 text-center backdrop-blur sm:px-5 sm:py-6">
                <p className="stat-num">{t(`promiseStrip.${k}`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-neutral-500">
            {t("promiseStrip.promoNote")}
          </p>
        </div>
      </section>

      <div className="bg-brand-dark py-6 text-white/85">
        <Marquee
          items={[
            t("promiseStrip.fee"),
            t("hero.eyebrow"),
            t("promiseStrip.valuation"),
            t("promiseStrip.mandate"),
            t("promiseStrip.online"),
          ]}
        />
      </div>

      {/* ── Featured listings ─────────────────────────────────────── */}
      {reelItems.length > 0 ? (
        <section className="pt-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="eyebrow">{t("featured.eyebrow")}</p>
            <h2 className="display-chapter mt-2 text-brand-dark">{t("featured.title")}</h2>
            <p className="mt-3 max-w-2xl text-neutral-600">{t("featured.subtitle")}</p>
          </div>
          <FeaturedCarousel>
            {reelItems.map((v) => (
              <div key={v.slug} className="w-[78vw] shrink-0 snap-start sm:w-[38vw] lg:w-[28vw]">
                <PropertyCard view={v} photosComing={tProp("photosComing")} />
              </div>
            ))}
            <div className="flex w-[40vw] shrink-0 snap-start items-center justify-center sm:w-[24vw]">
              <Link
                href="/immobili"
                transitionTypes={["nav-forward"]}
                className="btn-press rounded-full border border-brand/40 px-8 py-4 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
              >
                {t("featured.viewAll")} →
              </Link>
            </div>
          </FeaturedCarousel>
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-6 pt-16">
          <p className="eyebrow">{t("featured.eyebrow")}</p>
          <h2 className="display-chapter mt-2 text-brand-dark">{t("featured.title")}</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">{t("featured.empty")}</p>
        </section>
      )}

      {/* ── Positioning ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div data-reveal>
          <p className="eyebrow">{t("positioning.eyebrow")}</p>
          <h2 className="display-chapter mt-2 max-w-3xl text-brand-dark">
            {t("positioning.title")}
          </h2>
        </div>
        <p className="mt-5 max-w-2xl text-lg text-neutral-600" data-reveal>
          {t("positioning.body")}
        </p>
        <p className="mt-4 max-w-2xl rounded-2xl border border-neutral-200 bg-paper px-5 py-4 text-sm text-neutral-600">
          {t("positioning.routingNote")}
        </p>
        <Link
          href="/gruppo"
          className="mt-6 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          {t("positioning.cta")} →
        </Link>
      </section>

      {/* ── Seller value (job #1) ─────────────────────────────────── */}
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow text-sand">{t("sellerValue.eyebrow")}</p>
          <h2 className="display-chapter mt-2 max-w-3xl text-white">
            {t("sellerValue.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-white/70">{t("sellerValue.subtitle")}</p>
          <div
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2"
            data-reveal-stagger
          >
            {SELLER_CARDS.map((c) => (
              <div
                key={c}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-white/25"
              >
                <h3 className="text-lg font-semibold text-white">
                  {t(`sellerValue.${c}.title`)}
                </h3>
                <p className="mt-2 text-white/70">{t(`sellerValue.${c}.text`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/vendi"
              transitionTypes={["nav-forward"]}
              className="btn-hero inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark"
            >
              {t("sellerValue.cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Investor teaser ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-paper to-white p-8 sm:p-12">
          <p className="eyebrow" data-reveal>
            {t("investorTeaser.eyebrow")}
          </p>
          <h2 className="display-chapter mt-2 max-w-2xl text-brand-dark" data-reveal>
            {t("investorTeaser.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-neutral-600">{t("investorTeaser.body")}</p>
          <Link
            href="/investimenti"
            transitionTypes={["nav-forward"]}
            className="btn-hero mt-7 inline-block rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
          >
            {t("investorTeaser.cta")} →
          </Link>
        </div>
      </section>

      {/* ── Group routing ─────────────────────────────────────────── */}
      <section className="border-y border-neutral-200 bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="eyebrow">{t("groupRouting.eyebrow")}</p>
          <h2 className="display-chapter mt-2 text-brand-dark">{t("groupRouting.title")}</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">{t("groupRouting.body")}</p>
          <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200" data-reveal-stagger>
            {ROUTING.map((r) => (
              <li
                key={r}
                className="flex items-center gap-3 py-4 text-lg font-medium text-brand-dark"
              >
                <span className="text-brand">→</span>
                {t(`groupRouting.${r}`)}
              </li>
            ))}
          </ul>
          <Link
            href="/gruppo"
            className="mt-6 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            {t("groupRouting.cta")} →
          </Link>
        </div>
      </section>

      {/* ── Valuation CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-brand px-7 py-12 text-white sm:px-12">
          <div className="max-w-2xl" data-reveal="left">
            <p className="eyebrow text-white/80">{t("valuationCta.eyebrow")}</p>
            <h2 className="display-chapter mt-2 text-white">{t("valuationCta.title")}</h2>
            <p className="mt-4 text-white/80">{t("valuationCta.body")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SellerCta
              label={t("valuationCta.cta")}
              className="btn-hero rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark"
            />
            <BuyerCta
              label={t("valuationCta.secondary")}
              fonteCta="Home · Parla con noi"
              className="btn-press rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
            />
          </div>
        </div>
      </section>
    </>
  );
}
