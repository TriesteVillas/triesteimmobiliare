import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Timeline from "@/components/Timeline";
import Tilt from "@/components/motion/Tilt";
import SellerCta from "@/components/SellerCta";
import BuyerCta from "@/components/BuyerCta";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("group.title") },
    description: t("group.description"),
    alternates: pageAlternates(locale, "/gruppo"),
    openGraph: pageOpenGraph(locale, "/gruppo", t("group.ogTitle"), t("group.ogDescription")),
  };
}

const BRANDS = ["tsv", "tsi", "affitti", "friuli", "business", "lignano"] as const;
type BrandSiteLocale = "it" | "en" | "de";
type BrandSites = Partial<Record<(typeof BRANDS)[number], string>>;
// URLs verified live on 2026-07-23. TriesteBusiness stays unlinked because it has no website.
const BRAND_SITES: Record<BrandSiteLocale, BrandSites> = {
  it: {
    tsv: "https://www.triestevillas.com/",
    affitti: "https://www.triesteaffitti.com/",
    friuli: "https://friulivillas.com/",
    lignano: "https://www.lignanovillas.com/it/",
  },
  en: {
    tsv: "https://www.triestevillas.com/en",
    affitti: "https://www.triesteaffitti.com/",
    friuli: "https://friulivillas.com/en/",
    lignano: "https://www.lignanovillas.com/",
  },
  de: {
    tsv: "https://www.triestevillas.com/de",
    affitti: "https://www.triesteaffitti.com/",
    friuli: "https://friulivillas.com/de/",
    lignano: "https://www.lignanovillas.com/de/",
  },
};
const STORY = [
  { year: "2013", key: "start" },
  { year: "2020", key: "pivot" },
  { year: "2026", key: "today" },
] as const;
const VALUES = ["specialised", "local", "clarity", "journey"] as const;
const TEAM = [
  { key: "carlin", photo: "/team/davide.webp", email: "davide@triestevillas.com", linkedin: "https://www.linkedin.com/in/davide-carlin-4bb42241/" },
  { key: "martino", photo: "/team/martino.webp", email: "martino@triestevillas.com", linkedin: "https://www.linkedin.com/in/martino-coppola-di-canzano-6592b583/" },
  { key: "giada", photo: "/team/giada.webp", email: "giada@triestevillas.com", linkedin: "https://www.linkedin.com/in/giada-comelli-820433b2/" },
  { key: "cecile", photo: "/team/cecile.webp", email: "cecile@triestevillas.com", linkedin: null },
] as const;

export default async function GroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("group");
  const brandSites = BRAND_SITES[locale as BrandSiteLocale] ?? BRAND_SITES.it;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-40">
          <p className="eyebrow text-white/85">{t("eyebrow")}</p>
          <h1 className="display-hero mt-3" data-reveal>
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{t("intro")}</p>
        </div>
      </section>

      {/* Ecosystem rationale */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="eyebrow">{t("ecosystem.eyebrow")}</p>
        <h2 className="display-chapter mt-2 text-brand-dark">{t("ecosystem.title")}</h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">{t("ecosystem.body")}</p>
        <p className="mt-6 border-l-2 border-brand pl-4 text-lg font-medium italic text-brand-dark">
          {t("ecosystem.tagline")}
        </p>
      </section>

      {/* The 6 brands */}
      <section className="border-y border-neutral-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="display-chapter text-brand-dark">{t("brandsTitle")}</h2>
          <p className="mt-2 max-w-2xl text-lg text-brand">{t("brandsSubtitle")}</p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {BRANDS.map((b) => {
              const site = brandSites[b];
              const isSelf = b === "tsi";
              return (
                <div
                  key={b}
                  className={`card-cine flex flex-col p-6 ${isSelf ? "ring-2 ring-brand/40" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    {site ? (
                      <a
                        href={site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-underline text-lg font-bold text-brand-dark transition-colors hover:text-brand"
                      >
                        {t(`brands.${b}.name`)} ↗
                      </a>
                    ) : (
                      <span className="text-lg font-bold text-brand-dark">{t(`brands.${b}.name`)}</span>
                    )}
                  </div>
                  <span className="mt-2 self-start rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
                    {t(`brands.${b}.tag`)}
                  </span>
                  <p className="mt-3 text-sm text-neutral-600">{t(`brands.${b}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story timeline */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="eyebrow">{t("story.eyebrow")}</p>
        <h2 className="display-chapter mt-2 text-brand-dark">{t("story.title")}</h2>
        <p className="mt-3 max-w-2xl text-lg text-neutral-600">{t("story.intro")}</p>
        <Timeline
          items={STORY.map((s) => ({
            year: s.year,
            title: t(`story.${s.key}.title`),
            text: t(`story.${s.key}.text`),
          }))}
        />
      </section>

      {/* Values */}
      <section className="border-y border-neutral-200 bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="display-chapter text-brand-dark">{t("valuesTitle")}</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2" data-reveal-stagger>
            {VALUES.map((v) => (
              <div key={v}>
                <h3 className="font-semibold text-brand">{t(`values.${v}.title`)}</h3>
                <p className="mt-1 text-neutral-600">{t(`values.${v}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="display-chapter text-brand-dark">{t("teamTitle")}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {TEAM.map((p) => (
            <li key={p.key} className="h-full">
              <Tilt className="h-full rounded-2xl">
                <div className="card-cine group relative flex h-full flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden bg-paper">
                    <Image
                      src={p.photo}
                      alt={t(`team.${p.key}.name`)}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                      className="card-photo object-cover object-top"
                    />
                    <span className="card-sheen" aria-hidden />
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="font-semibold text-neutral-900 transition-colors duration-300 group-hover:text-brand">
                      {t(`team.${p.key}.name`)}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">{t(`team.${p.key}.role`)}</p>
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <a
                        href={`mailto:${p.email}`}
                        aria-label={`Email ${t(`team.${p.key}.name`)}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand hover:text-white"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4" aria-hidden>
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="m3 7 9 6 9-6" />
                        </svg>
                      </a>
                      {p.linkedin && (
                        <a
                          href={p.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`LinkedIn ${t(`team.${p.key}.name`)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand hover:text-white"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Tilt>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-brand-dark px-7 py-12 text-white sm:px-12">
          <div className="max-w-2xl">
            <h2 className="display-chapter text-white">{t("ctaTitle")}</h2>
            <p className="mt-4 text-white/80">{t("ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SellerCta
              label={t("ctaSell")}
              className="btn-hero rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark"
            />
            <BuyerCta
              label={t("ctaCall")}
              fonteCta="Gruppo · Call orientamento"
              className="btn-press rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
            />
          </div>
        </div>
      </section>
    </>
  );
}
