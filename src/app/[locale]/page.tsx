import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";
import { getProperties } from "@/lib/airtable";
import { getArticles, readingMinutes } from "@/lib/articles";
import ResourceCard from "@/components/resources/ResourceCard";
import { zoneKey } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";
import PropertyCard from "@/components/PropertyCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import Marquee from "@/components/Marquee";
import ClosureBanner from "@/components/ClosureBanner";
import AutoVideo from "@/components/AutoVideo";
import SegnoAi from "@/components/SegnoAi";
import VideoSito from "@/components/VideoSito";
import { testiTrasparenza } from "@/lib/trasparenza";
import { videoDelSito } from "@/lib/video-sito";
import { BoatMark } from "@/components/Logo";
import BuyerCta from "@/components/BuyerCta";
import SellerCta from "@/components/SellerCta";
import SloveniaVillasRiquadro from "@/components/SloveniaVillasRiquadro";
import { sloveniaVillasHref } from "@/lib/sloveniavillas";
import { sappadaVillasHref } from "@/lib/sappadavillas";

// L'ordine racconta perché ci scelgono, e l'ordine è cambiato il 03/09/2026:
// prima c'era `zeroFee` in seconda posizione, la promo «0% al venditore».
// I mandati non li ha portati lo sconto — li ha portati il nome del gruppo,
// il marketing e i compratori che arrivano da fuori. Quelli vanno per primi.
const SELLER_CARDS = ["marketing", "estero", "fast", "simpleMandate"] as const;
const PROMISES = ["valuation", "online", "mandate", "reach"] as const;
// Le due righe coi siti nuovi, che hanno il link: `sappada` (07/10/2026) prima
// di `slovenia` (06/10/2026), l'Italia prima del confine.
const ROUTING = ["luxury", "fvg", "rent", "business", "sappada", "slovenia"] as const;
const ROUTING_HREF = {
  sappada: (locale: string) => sappadaVillasHref(locale, "home", "routing"),
  slovenia: (locale: string) => sloveniaVillasHref(locale, "home", "routing"),
} as const;

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
  const tRis = await getTranslations("risorse");

  const properties = await getProperties();
  // Le tre guide in vetrina (in evidenza, poi le più recenti: l'ordine lo
  // decide getArticles). Se la Biblioteca è vuota la fascia sparisce.
  const articoli = (await getArticles().catch(() => [])).slice(0, 3);

  // La strip conserva l'ordine di vetrina deciso nel CRM. `home: true`: in
  // home le card non portano pillole AI, solo il segno discreto sulle
  // simulazioni (SPEC v1.3 §11.1) — la dichiarazione intera è nella scheda.
  const reelItems = properties
    .filter((p) => p.coverPhoto)
    .slice(0, 8)
    .map((p) => buildPropertyView(p, locale, tProp, tZones(zoneKey(p)), { home: true }));

  const heroWords = t("hero.titleKinetic").split(" ");

  // Il video dell'arredo virtuale: dal registro dei video del CRM. In home
  // (SPEC v1.3 §11.1) non porta più la pillola né la didascalia sotto: solo il
  // segno discreto «video AI» (il registro lo dà `ai_generato`) con la
  // didascalia intera nell'aria-label e nel `title`. Prima del registro
  // l'etichetta era scritta qui a mano: resta come ripiego quando la riga non
  // c'è, o il registro non si legge.
  const txStaging = testiTrasparenza(locale);
  const staging = await videoDelSito("/video/staging-mansarda.mp4", locale, {
    etichetta: txStaging.etichetta.ai_aggiunte,
    aria: `${txStaging.etichetta.ai_aggiunte} — ${t("videoBreak.alt")}`,
    didascalia: null,
    segno: txStaging.segno.video,
  });

  // Il marquee ricompone le celle della strip in frasi brevi — «Valutazione
  // 48h» — perché lì il valore da solo ("48h") non direbbe di cosa parla.
  const promessa = (k: (typeof PROMISES)[number]) =>
    `${t(`promiseStrip.${k}.label`)} ${t(`promiseStrip.${k}.value`)}`;

  return (
    <>
      {/* ── Hero — calm harbour light ─────────────────────────────── */}
      <section className="grad-paper-sea relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-6 pb-12 pt-36 sm:pb-16 sm:pt-44">
          {/* Hero: tutto quanto è sopra la piega usa `data-reveal="now"`, che si
              anima in CSS senza aspettare l'hydration. Con `data-reveal` normale
              questo blocco restava invisibile fino al JS — vedi globals.css. */}
          <div data-reveal="now">
            <BoatMark className="h-12 w-auto sm:h-14" />
          </div>
          <p className="eyebrow mt-7" data-reveal="now">
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
          {/* Questo <p> è l'elemento LCP misurato della home. */}
          <p className="mt-6 max-w-2xl text-base text-neutral-600 sm:text-lg" data-reveal="now">
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
          {/* `lazy` anche se il video è nell'hero: senza, il tag monta subito
              la src e si porta via ~0,9 MB proprio mentre la pagina sta
              dipingendo. Con lazy si vede il poster all'istante e il filmato
              parte appena dopo l'hydration — l'occhio non se ne accorge, la
              rete sì. Il video è animato con l'AI: in home niente pillola né
              didascalia, solo il segno discreto «video AI» dal registro dei
              video del CRM (VideoSito `discreto`, SPEC v1.3 §11.1). */}
          <VideoSito
            discreto
            percorso="/video/trieste-aerea.mp4"
            poster="/video/trieste-aerea.jpg"
            ariaLabel={t("hero.videoAlt")}
            locale={locale}
            className="mt-14 sm:mt-16"
            riquadro="aspect-[16/9] rounded-3xl border border-brand/15 shadow-[0_24px_70px_-30px_rgba(28,74,107,0.45)]"
            reveal="now"
          />
        </div>

        {/* Promise strip — the four numbers.
            Ogni cella ora è numero + etichetta: «48h» grande, «Valutazione»
            sotto. Prima era una frase sola per cella («Valutazione in 48h») e
            il numero non si leggeva da lontano — CREATIVE_SPEC la descriveva
            già così, l'implementazione l'aveva appiattita. */}
        <div className="relative mx-auto max-w-5xl px-6 pb-16">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand/15 bg-brand/15 sm:grid-cols-4">
            {PROMISES.map((k) => (
              <div key={k} className="bg-white/85 px-3 py-5 text-center backdrop-blur sm:px-5 sm:py-6">
                <p className="stat-num">{t(`promiseStrip.${k}.value`)}</p>
                <p className="stat-label mt-1.5">{t(`promiseStrip.${k}.label`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-neutral-500">
            {t("promiseStrip.reachNote")}
          </p>
        </div>
      </section>

      <ClosureBanner />

      <div className="bg-brand-dark py-6 text-white/85">
        <Marquee
          items={[
            promessa("reach"),
            t("hero.eyebrow"),
            promessa("valuation"),
            promessa("mandate"),
            promessa("online"),
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
                {/* Le card del carosello NON sono larghe come quelle della
                    griglia: `sizes` deve ricalcare le classi qui sopra, altrimenti
                    il browser sceglie dal srcSet la larghezza sbagliata. */}
                <PropertyCard
                  view={v}
                  photosComing={tProp("photosComing")}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 38vw, 28vw"
                />
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

      {/* ── SloveniaVillas — solo in sloveno ──────────────────────────
          Chi legge la home in sloveno ha spesso la casa sulla costa o sul
          Carso: qui gli si dice, subito dopo «chi siamo», che noi vendiamo
          Trieste e che per l'altra parte c'è l'atlante del gruppo. */}
      {locale === "sl" && <SloveniaVillasRiquadro misura="home" />}

      {/* ── Marketing video break ─────────────────────────────────── */}
      <section className="relative h-[62vh] min-h-[420px] max-h-[680px] overflow-hidden bg-brand-dark">
        <AutoVideo
          src="/video/staging-mansarda.mp4"
          poster="/video/staging-mansarda.jpg"
          ariaLabel={t("videoBreak.alt")}
          className="h-full w-full object-cover object-[center_58%]"
          lazy
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark from-8% via-brand-dark/85 via-25% to-transparent to-46% sm:from-10% sm:via-20% sm:to-36%" />
        {/* L'arredo di questo video è generato con l'AI: il segno resta
            VISIBILE per tutta la durata (e sul poster), in alto a destra — ma
            dalla v1.3 (§11.1) è quello DISCRETO della home, «video AI», non
            la pillola. La didascalia intera è nel suo aria-label e `title`. */}
        {staging?.segno && (
          <div className="pointer-events-none absolute right-4 top-4 z-[1] sm:right-6 sm:top-6">
            <SegnoAi
              testo={staging.segno}
              aria={`${staging.segno} — ${staging.didascalia ?? staging.etichetta}`}
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-6 pb-10 sm:pb-14" data-reveal>
            <p className="eyebrow text-sand">{t("videoBreak.eyebrow")}</p>
            <p className="mt-2 max-w-4xl text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {t("videoBreak.title")}
            </p>
          </div>
        </div>
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

      {/* ── Risorse — le guide ────────────────────────────────────
          Sta in home per due ragioni: chi valuta se affidarci una casa vuole
          vedere che sappiamo di cosa parliamo, e un link dalla home è il modo
          più diretto per far scoprire la sezione a chi indicizza. */}
      {articoli.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow" data-reveal>{t("resources.eyebrow")}</p>
              <h2 className="display-chapter mt-2 max-w-2xl text-brand-dark" data-reveal>
                {t("resources.title")}
              </h2>
              <p className="mt-3 max-w-2xl text-neutral-600">{t("resources.body")}</p>
            </div>
            <Link
              href="/risorse"
              className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              {t("resources.cta")} →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3" data-reveal-stagger>
            {articoli.map((a) => (
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
                {r === "sappada" || r === "slovenia" ? (
                  <a
                    href={ROUTING_HREF[r](locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 transition-colors hover:text-brand hover:underline"
                  >
                    {t(`groupRouting.${r}`)} ↗
                  </a>
                ) : (
                  t(`groupRouting.${r}`)
                )}
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
