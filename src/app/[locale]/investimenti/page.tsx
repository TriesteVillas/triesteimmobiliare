import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import InvestorCta from "@/components/InvestorCta";
import BuyerCta from "@/components/BuyerCta";
import GhostCard from "@/components/private/GhostCard";
import { Link } from "@/i18n/navigation";
import { getPrivateTeasers } from "@/lib/airtable";
import { ZONE_ORDER, ZONE_OTHER } from "@/lib/properties";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("invest.title") },
    description: t("invest.description"),
    alternates: pageAlternates(locale, "/investimenti"),
    openGraph: pageOpenGraph(locale, "/investimenti", t("invest.ogTitle"), t("invest.ogDescription")),
  };
}

const STEPS = ["brief", "shortlist", "call", "close"] as const;
// Abstract, anonymised teasers of a real inventory category — typology + zone
// only, no price and no yield (those are shared privately, per the brief).
// Typology labels are localized (invest.teaser.ghosts); zones are proper nouns.
const GHOST_ZONES = ["Centro", "Semicentro", "Barcola"] as const;

// I teaser reali arrivano con il codice zona di Airtable; qui serve la label
// tradotta, con lo stesso fallback ALTRE usato dalla griglia /immobili.
const ZONE_CODES: readonly string[] = ZONE_ORDER;
function zoneLabelCode(zona: string | null): string {
  const code = (zona ?? "").toUpperCase().trim();
  return ZONE_CODES.includes(code) ? code : ZONE_OTHER;
}

export default async function InvestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("invest");
  const tZones = await getTranslations("zones");
  const tPc = await getTranslations("pc");
  const teasers = await getPrivateTeasers();

  return (
    <>
      {/* Hero */}
      <section className="grad-paper-sea">
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-40">
          <p className="eyebrow" data-reveal>
            {t("hero.eyebrow")}
          </p>
          <h1 className="display-hero mt-3 text-brand-dark" data-reveal>
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-neutral-600" data-reveal>
            {t("hero.intro")}
          </p>
          <div className="mt-8">
            <InvestorCta
              label={t("hero.cta")}
              className="btn-hero rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
            />
          </div>
        </div>
      </section>

      {/* Narrative — why Trieste + income, not a bet */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="eyebrow">{t("narrative.eyebrow")}</p>
        <h2 className="display-chapter mt-2 max-w-2xl text-brand-dark">{t("narrative.title")}</h2>
        <p className="mt-5 max-w-2xl text-lg text-neutral-600">{t("narrative.body")}</p>
        <div className="mt-8 rounded-2xl border border-brand/20 bg-paper p-6">
          <h3 className="text-lg font-semibold text-brand-dark">{t("narrative.incomeTitle")}</h3>
          <p className="mt-2 text-neutral-600">{t("narrative.incomeBody")}</p>
        </div>
      </section>

      {/* Two ways to search */}
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2" data-reveal-stagger>
            <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <h3 className="text-xl font-semibold text-white">{t("ricercaLibera.title")}</h3>
              <p className="mt-3 flex-1 text-white/70">{t("ricercaLibera.text")}</p>
              <InvestorCta
                label={t("ricercaLibera.cta")}
                className="btn-press mt-5 self-start rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
              />
            </div>
            <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <h3 className="text-xl font-semibold text-sand">{t("ricercaROI.title")}</h3>
              <p className="mt-3 flex-1 text-white/70">{t("ricercaROI.text")}</p>
              <InvestorCta
                label={t("ricercaROI.cta")}
                className="btn-press mt-5 self-start rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Off-market teaser */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="eyebrow">{t("teaser.eyebrow")}</p>
        <h2 className="display-chapter mt-2 max-w-2xl text-brand-dark">{t("teaser.title")}</h2>
        <p className="mt-4 max-w-2xl text-neutral-600">{t("teaser.body")}</p>

        {/* Da quando esiste la Private Collection, questa sezione mostra i teaser
            VERI quando ce ne sono. Il mockup a tre card resta come fallback: e' la
            promessa narrativa della pagina, e sparire del tutto nei periodi in cui
            il portafoglio riservato e' vuoto la renderebbe incomprensibile. */}
        {teasers.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teasers.slice(0, 6).map((tz) => (
              <GhostCard key={tz.id} id={tz.id} band={tz.band} zonaLabel={tZones(zoneLabelCode(tz.zona))} />
            ))}
          </div>
        ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {GHOST_ZONES.map((zone, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-paper to-white p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/10 blur-2xl"
              />
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand/60" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <p className="mt-4 font-semibold text-brand-dark">{t(`teaser.ghosts.${i}`)}</p>
              <p className="text-sm text-neutral-500">{zone} · {t("teaser.alreadyLet")}</p>
              <div className="mt-3 h-2 w-2/3 rounded-full bg-neutral-200" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-neutral-200" />
            </div>
          ))}
        </div>
        )}
        <p className="mt-4 text-xs text-neutral-500">{t("teaser.disclaimer")}</p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <InvestorCta
            label={t("cta.ctaPrimary")}
            className="btn-hero rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
          />
          {/* La sezione parla di immobili off-market da anni: adesso dietro c'e'
              davvero un'area riservata, e questo e' l'unico ingresso dalla pagina. */}
          <Link
            href="/private/richiedi"
            className="btn-press rounded-full border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
          >
            {tPc("requestCta")}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-neutral-200 bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="eyebrow">{t("howItWorks.eyebrow")}</p>
          <h2 className="display-chapter mt-2 text-brand-dark">{t("howItWorks.title")}</h2>
          <p className="mt-3 max-w-2xl text-neutral-600">{t("howItWorks.subtitle")}</p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-reveal-stagger>
            {STEPS.map((s) => (
              <div key={s} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <p className="chapter-num">{t(`howItWorks.steps.${s}.n`)}</p>
                <h3 className="mt-3 font-semibold text-brand-dark">
                  {t(`howItWorks.steps.${s}.title`)}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {t(`howItWorks.steps.${s}.text`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-brand px-7 py-12 text-white sm:px-12">
          <div className="max-w-2xl">
            <h2 className="display-chapter text-white">{t("cta.title")}</h2>
            <p className="mt-4 text-white/80">{t("cta.text")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <InvestorCta
              label={t("cta.ctaPrimary")}
              className="btn-hero rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark"
            />
            <BuyerCta
              label={t("cta.ctaSecondary")}
              fonteCta="Investimenti · Call"
              className="btn-press rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
            />
          </div>
        </div>
      </section>
    </>
  );
}
