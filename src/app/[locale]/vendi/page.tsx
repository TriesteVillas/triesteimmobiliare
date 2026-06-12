import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SellerCta from "@/components/SellerCta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sell" });
  return { title: t("title"), description: t("intro") };
}

const BLOCKS = ["strategy", "channel", "craft"] as const;

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sell");

  return (
    <>
      {/* Plain hero on brand gradient — no film, just the promise. */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-40">
          <p className="eyebrow text-sand">{t("eyebrow")}</p>
          <h1 className="display-hero mt-3" data-reveal>
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85" data-reveal>
            {t("intro")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SellerCta
              label={t("ctaPrimary")}
              className="btn-hero rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3" data-reveal-stagger>
          {BLOCKS.map((b) => (
            <div key={b}>
              <h2 className="font-semibold text-brand">{t(`${b}.title`)}</h2>
              <p className="mt-2 text-neutral-600">{t(`${b}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-paper">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
              {t("closing.title")}
            </h2>
            <p className="mt-2 text-neutral-600">{t("closing.text")}</p>
          </div>
          <SellerCta
            label={t("ctaPrimary")}
            className="btn-hero shrink-0 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white"
          />
        </div>
      </section>
    </>
  );
}
