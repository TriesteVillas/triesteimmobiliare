import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ScrollVideo from "@/components/ScrollVideo";

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
      <ScrollVideo src="/video/terrazzo.mp4" poster="/video/terrazzo-poster.jpg">
        <div className="mx-auto max-w-4xl px-4 text-white">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light drop-shadow">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight drop-shadow-lg sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85 drop-shadow">{t("intro")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contatti"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-white/90"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/contatti"
              className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </ScrollVideo>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {BLOCKS.map((b) => (
            <div key={b}>
              <h2 className="font-semibold text-brand">{t(`${b}.title`)}</h2>
              <p className="mt-2 text-neutral-600">{t(`${b}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("closing.title")}
            </h2>
            <p className="mt-2 text-neutral-600">{t("closing.text")}</p>
          </div>
          <Link
            href="/contatti"
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            {t("ctaPrimary")}
          </Link>
        </div>
      </section>
    </>
  );
}
