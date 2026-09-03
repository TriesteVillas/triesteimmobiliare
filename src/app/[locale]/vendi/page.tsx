import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SellerCta from "@/components/SellerCta";
import BuyerCta from "@/components/BuyerCta";
import Timeline from "@/components/Timeline";
import JsonLd from "@/components/JsonLd";
import AutoVideo from "@/components/AutoVideo";
import ResourceCard from "@/components/resources/ResourceCard";
import { getArticle, readingMinutes } from "@/lib/articles";
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
const PROMISES = ["valuation", "online", "mandate", "reach"] as const;
// I tre motivi per cui ci prendono i mandati stanno in cima, in una fascia
// loro, fuori dalla griglia: siamo TriesteVillas, il materiale che produciamo,
// i compratori esteri. Il 03/09/2026 dall'elenco è uscito `zeroProvvigione`:
// la promo «0% al venditore» è ritirata, e non era lei a portare i mandati.
const REASONS = ["forzaDelGruppo", "materiale", "acquirentiEsteri"] as const;
// Recovered seller blocks, in funnel order. Nove: tre righe piene da tre.
const BLOCKS = [
  "velocita", "mandatoSemplice", "checkup", "liftingPreVendita", "ownerJourney",
  "primaVendiPoiCerca", "affittaMentreVendi", "houseTour", "venditaRiservata",
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
  const tRis = await getTranslations("risorse");

  // Le tre guide che rispondono alle domande di chi sta valutando se vendere.
  // Scelte per slug e non "le più recenti": questa pagina merita le sue.
  const guide = (
    await Promise.all(
      ["quanto-costa-vendere-casa", "documenti-per-vendere-casa", "valutare-casa-trieste"].map((s) =>
        getArticle(s).catch(() => null),
      ),
    )
  ).filter((a): a is NonNullable<typeof a> => a !== null);

  // FAQ rich-results — questions localized, answers reuse the recovered blocks.
  // La prima domanda era «quanto costa vendere con noi», e la risposta era la
  // promo 0%. Ritirata quella, la provvigione del venditore si concorda in
  // sede di incarico e il sito non la dichiara: la domanda diventa «perché
  // voi», che sappiamo rispondere senza promettere cifre.
  const faqBlocks = ["forzaDelGruppo", "mandatoSemplice", "velocita", "materiale", "venditaRiservata"];
  const faqItems = faqBlocks.map((b, i) => ({
    q: t(`faqQ.${i}`),
    a: t(`blocks.${b}.text`),
  }));

  return (
    <>
      <JsonLd data={faqJsonLd(faqItems)} />
      {/* Hero — the promise, on brand gradient */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-40">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-14">
            <div>
              <p className="eyebrow text-white/85">{t("hero.eyebrow")}</p>
              <h1 className="display-hero mt-3" data-reveal="now">
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-white/85" data-reveal="now">
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
            <div
              className="aspect-[5/4] overflow-hidden rounded-3xl border border-white/15 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.45)] lg:self-center"
              data-reveal="now"
            >
              <AutoVideo
                src="/video/soggiorno-terrazza.mp4"
                poster="/video/soggiorno-terrazza.jpg"
                ariaLabel={t("hero.videoAlt")}
                className="h-full w-full object-cover"
                // Era `lazy={false}`: montava 1,1 MB di mp4 nella finestra
                // dell'LCP. Il poster copre il riquadro, il video parte subito
                // dopo. Vedi la stessa scelta sull'hero della home.
                lazy
              />
            </div>
          </div>
        </div>
      </section>

      {/* Promise strip — numero grande, etichetta sotto (vedi la home). */}
      <section className="mx-auto -mt-8 max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand/15 bg-brand/15 shadow-lg sm:grid-cols-4">
          {PROMISES.map((k) => (
            <div key={k} className="bg-white px-3 py-5 text-center sm:px-5 sm:py-6">
              <p className="stat-num">{tHome(`promiseStrip.${k}.value`)}</p>
              <p className="stat-label mt-1.5">{tHome(`promiseStrip.${k}.label`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-neutral-500">
          {tHome("promiseStrip.reachNote")}
        </p>
      </section>

      {/* ── Perché noi — i tre motivi ─────────────────────────────────
          Prende il posto che nel funnel teneva il blocco «0% al venditore»:
          subito dopo la strip, dove chi legge si chiede «perché voi». Non
          sono card come quelle sotto — tre colonne aperte, un filetto sopra,
          più aria e più corpo di tipo: la gerarchia dice quali argomenti
          contano davvero, invece di annegarli in una griglia di tredici. */}
      <section className="mx-auto max-w-6xl px-6 pt-20">
        <p className="eyebrow">{t("reasons.eyebrow")}</p>
        <h2 className="display-chapter mt-2 max-w-3xl text-brand-dark">{t("reasons.title")}</h2>
        <div
          className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8"
          data-reveal-stagger
        >
          {REASONS.map((b) => (
            <div key={b} className="flex flex-col border-t-2 border-brand/40 pt-6">
              <h3 className="text-[1.35rem] font-semibold leading-snug text-brand-dark">
                {t(`blocks.${b}.title`)}
              </h3>
              <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-neutral-600">
                {t(`blocks.${b}.text`)}
              </p>
              {b === "acquirentiEsteri" && (
                <>
                  <p className="mt-5 border-l-2 border-brand pl-3 text-sm font-medium italic text-brand-dark">
                    “{t("blocks.acquirentiEsteri.quote")}”
                  </p>
                  <BuyerCta
                    label={t("blocks.acquirentiEsteri.cta")}
                    fonteCta="Vendi · House tour"
                    className="btn-press mt-5 self-start rounded-full border border-brand/40 px-4 py-1.5 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
                  />
                </>
              )}
              {b === "materiale" && (
                <Link
                  href="/immobili"
                  className="mt-5 self-start text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {t("blocks.materiale.cta")} →
                </Link>
              )}
            </div>
          ))}
        </div>
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

                <p className="mt-3 flex-1 text-sm text-neutral-600">{t(`blocks.${b}.text`)}</p>

                {/* Block-level CTAs (only where there's a real destination) */}
                {b === "checkup" && (
                  <SellerCta
                    label={t("blocks.checkup.cta")}
                    className="btn-press mt-4 self-start rounded-full border border-brand/40 px-4 py-1.5 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
                  />
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
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Le guide sulla vendita — link interni con ancora vera, e la risposta a
          chi non è ancora pronto a chiamare: se la pagina commerciale è l'unica
          cosa che offriamo a chi sta ancora studiando, quella persona va a
          cercare le risposte altrove. */}
      {guide.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-4 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow" data-reveal>{tRis("guidesEyebrow")}</p>
              <h2 className="display-chapter mt-2 max-w-2xl text-brand-dark" data-reveal>
                {tRis("guidesTitle")}
              </h2>
            </div>
            <Link href="/risorse" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {tRis("guidesCta")} →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3" data-reveal-stagger>
            {guide.map((a) => (
              <ResourceCard
                key={a.slug}
                article={a}
                locale={locale}
                minutesLabel={tRis("minutes", { n: readingMinutes(a, locale) })}
              />
            ))}
          </div>
        </section>
      )}

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
