import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ImmobiliBrowser from "@/components/ImmobiliBrowser";
import BuyerCta from "@/components/BuyerCta";
import { getProperties } from "@/lib/airtable";
import { groupByZone } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("properties.title") },
    description: t("properties.description"),
    alternates: pageAlternates(locale, "/immobili"),
    openGraph: pageOpenGraph(locale, "/immobili", t("properties.ogTitle"), t("properties.ogDescription")),
  };
}

export default async function ImmobiliPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("immobili");
  const tProp = await getTranslations("property");
  const tZones = await getTranslations("zones");
  const tHelp = await getTranslations("immobili.buyerHelp");

  const properties = await getProperties();
  const groups = groupByZone(properties).map((g) => {
    const label = tZones(g.code);
    return {
      code: g.code,
      label,
      items: g.items.map((p) => buildPropertyView(p, locale, tProp, label)),
    };
  });

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-32">
        <header className="mb-12" data-reveal>
          <p className="eyebrow">{t("filterAll")}</p>
          <h1 className="display-chapter mt-3 text-brand-dark">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-neutral-600">{t("intro")}</p>
        </header>
        <ImmobiliBrowser groups={groups} photosComing={tProp("photosComing")} />
      </section>

      {/* Buyer nudge — "Ricerca libera" */}
      <section className="border-t border-neutral-200 bg-paper">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl" data-reveal="left">
            <p className="eyebrow">{tHelp("eyebrow")}</p>
            <h2 className="display-chapter mt-2 text-brand-dark">{tHelp("title")}</h2>
            <p className="mt-3 text-neutral-600">{tHelp("text")}</p>
          </div>
          <BuyerCta
            label={tHelp("cta")}
            fonteCta="Immobili · Ricerca libera"
            className="btn-hero shrink-0 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
          />
        </div>
      </section>
    </>
  );
}
