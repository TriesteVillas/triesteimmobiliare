import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Timeline from "@/components/Timeline";
import Tilt from "@/components/motion/Tilt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "group" });
  return { title: t("title"), description: t("intro") };
}

const BRANDS = ["tsv", "tsi", "affitti", "friuli", "lignano"] as const;
// This site IS TriesteImmobiliare, so the link list points to the siblings.
const BRAND_SITES: Partial<Record<(typeof BRANDS)[number], string>> = {
  tsv: "https://www.triestevillas.com",
  affitti: "https://www.triesteaffitti.com",
};
const BRAND_SOON = new Set(["friuli", "lignano"]);
const VALUES = ["local", "tailored", "journey", "promo"] as const;
const STORY = [
  { year: "2013", key: "start" },
  { year: "2020", key: "pivot" },
  { year: "2026", key: "group" },
] as const;
const TEAM = [
  {
    key: "carlin",
    photo: "/team/davide.webp",
    email: "davide@triestevillas.com",
    linkedin: "https://www.linkedin.com/in/davide-carlin-4bb42241/",
  },
  {
    key: "martino",
    photo: "/team/martino.webp",
    email: "martino@triestevillas.com",
    linkedin: "https://www.linkedin.com/in/martino-coppola-di-canzano-6592b583/",
  },
  {
    key: "giada",
    photo: "/team/giada.webp",
    email: "giada@triestevillas.com",
    linkedin: "https://www.linkedin.com/in/giada-comelli-820433b2/",
  },
  {
    key: "cecile",
    photo: "/team/cecile.webp",
    email: "cecile@triestevillas.com",
    linkedin: null,
  },
] as const;

export default async function GroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("group");

  return (
    <>
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-36">
          <p className="eyebrow text-sand">{t("eyebrow")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{t("intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <p className="eyebrow">{t("story.eyebrow")}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-dark">
          {t("story.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-neutral-600">
          {t("story.intro")}
        </p>
        <Timeline
          items={STORY.map((s) => ({
            year: s.year,
            title: t(`story.${s.key}.title`),
            text: t(`story.${s.key}.text`),
          }))}
        />
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          {t("groupTitle")}
        </h2>
        <p className="mt-2 text-lg text-brand">{t("groupSubtitle")}</p>
        <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {BRANDS.map((b) => (
            <li
              key={b}
              className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <span className="flex w-48 shrink-0 flex-col items-start gap-1.5 font-semibold text-brand-dark">
                {BRAND_SITES[b] ? (
                  <a
                    href={BRAND_SITES[b]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-underline text-brand transition-colors hover:text-brand-dark"
                  >
                    {t(`brands.${b}.name`)} ↗
                  </a>
                ) : (
                  t(`brands.${b}.name`)
                )}
                {BRAND_SOON.has(b) && (
                  <span className="whitespace-nowrap rounded-full border border-brand/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand/70">
                    Coming soon
                  </span>
                )}
              </span>
              <span className="text-neutral-600">{t(`brands.${b}.desc`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-neutral-200 bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
            {t("valuesTitle")}
          </h2>
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

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          {t("teamTitle")}
        </h2>
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
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {t(`team.${p.key}.role`)}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <a
                        href={`mailto:${p.email}`}
                        aria-label={`Email ${t(`team.${p.key}.name`)}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand hover:text-white"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          className="h-4 w-4"
                          aria-hidden
                        >
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
    </>
  );
}
