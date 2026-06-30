import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SellerCta from "@/components/SellerCta";
import BuyerCta from "@/components/BuyerCta";
import Timeline from "@/components/Timeline";
import JsonLd from "@/components/JsonLd";
import { pageAlternates, pageOpenGraph, faqJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("sell.title") },
    description: t("sell.description"),
    alternates: pageAlternates(locale, "/vendi"),
    openGraph: pageOpenGraph(locale, "/vendi", t("sell.ogTitle"), t("sell.ogDescription")),
  };
}

const STEPS = ["call", "docs", "online", "visits", "deal"] as const;
// Recovered seller blocks, in funnel order.
const BLOCKS = [
  "velocita", "zeroProvvigione", "mandatoSemplice", "checkup", "materiale",
  "liftingPreVendita", "ownerJourney", "primaVendiPoiCerca", "affittaMentreVendi",
  "acquirentiEsteri", "houseTour", "venditaRiservata", "forzaDelGruppo",
] as const;

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sell");
  const tHome = await getTranslations("home");

  // FAQ rich-results — questions localized, answers reuse the recovered blocks.
  const faqBlocks = ["zeroProvvigione", "mandatoSemplice", "velocita", "materiale", "venditaRiservata"];
  const faqItems = faqBlocks.map((b, i) => ({
    q: t(`faqQ.${i}`),
    a: t(`blocks.${b}.text`),
  }));

  return (
    <>
      <JsonLd data={faqJsonLd(faqItems)} />
      {/* Hero — the promise, on brand gradient */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-40">
          <p className="eyebrow text-white/85">{t("hero.eyebrow")}</p>
          <h1 className="display-hero mt-3" data-reveal>
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85" data-reveal>
            {t("hero.intro")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SellerCta
              label={t("hero.ctaPrimary")}
              className="btn-hero rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark"
            />
            <BuyerCta
              label={t("hero.ctaSecondary")}
              fonteCta="Vendi · Videocall"
              className="btn-press rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            />
          </div>
        </div>
      </section>

      {/* Promise strip */}
      <section className="mx-auto -mt-8 max-w-4xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand/15 bg-brand/15 shadow-lg sm:grid-cols-4">
          {(["valuation", "online", "mandate", "fee"] as const).map((k) => (
            <div key={k} className="bg-white px-3 py-5 text-center sm:px-5 sm:py-6">
              <p className="stat-num">{tHome(`promiseStrip.${k}`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-neutral-500">
          {tHome("promiseStrip.promoNote")}
        </p>
      </section>

      {/* Process timeline */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="eyebrow">{t("process.eyebrow")}</p>
        <h2 className="display-chapter mt-2 text-brand-dark">{t("process.title")}</h2>
        <p className="mt-3 text-neutral-600">{t("process.subtitle")}</p>
        <Timeline
          items={STEPS.map((s) => ({
            year: t(`process.steps.${s}.n`),
            title: t(`process.steps.${s}.title`),
            text: t(`process.steps.${s}.text`),
          }))}
        />
      </section>

      {/* Recovered seller value blocks */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="display-chapter text-brand-dark">{t("blocksTitle")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {BLOCKS.map((b) => (
              <article
                key={b}
                className="card-cine flex flex-col p-6"
              >
                <h3 className="text-lg font-semibold text-brand-dark">{t(`blocks.${b}.title`)}</h3>

                {b === "zeroProvvigione" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                      {t("blocks.zeroProvvigione.promoBadge")}
                    </span>
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                      {t("blocks.zeroProvvigione.buybackBadge")}
                    </span>
                  </div>
                )}

                <p className="mt-3 flex-1 text-sm text-neutral-600">{t(`blocks.${b}.text`)}</p>

                {b === "acquirentiEsteri" && (
                  <p className="mt-4 border-l-2 border-brand pl-3 text-sm font-medium italic text-brand-dark">
                    “{t("blocks.acquirentiEsteri.quote")}”
                  </p>
                )}

                {/* Block-level CTAs (only where there's a real destination) */}
                {b === "checkup" && (
                  <SellerCta
                    label={t("blocks.checkup.cta")}
                    className="btn-press mt-4 self-start rounded-full border border-brand/40 px-4 py-1.5 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
                  />
                )}
                {b === "materiale" && (
                  <Link
                    href="/immobili"
                    className="mt-4 self-start text-sm font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    {t("blocks.materiale.cta")} →
                  </Link>
                )}
                {b === "affittaMentreVendi" && (
                  <a
                    href="https://www.triesteaffitti.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 self-start text-sm font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    {t("blocks.affittaMentreVendi.cta")} ↗
                  </a>
                )}
                {b === "acquirentiEsteri" && (
                  <BuyerCta
                    label={t("blocks.acquirentiEsteri.cta")}
                    fonteCta="Vendi · House tour"
                    className="btn-press mt-4 self-start rounded-full border border-brand/40 px-4 py-1.5 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
                  />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-brand-dark px-7 py-12 text-white sm:px-12">
          <div className="max-w-2xl">
            <h2 className="display-chapter text-white">{t("closing.title")}</h2>
            <p className="mt-4 text-white/80">{t("closing.text")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SellerCta
              label={t("closing.ctaPrimary")}
              className="btn-hero rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark"
            />
            <BuyerCta
              label={t("closing.ctaSecondary")}
              fonteCta="Vendi · Videocall"
              className="btn-press rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
            />
          </div>
        </div>
      </section>
    </>
  );
}
