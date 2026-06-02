import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ImmobiliBrowser from "@/components/ImmobiliBrowser";
import { getProperties } from "@/lib/airtable";
import { groupByZone } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "immobili" });
  return { title: t("title") };
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
    <section className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">{t("intro")}</p>
      </header>
      <ImmobiliBrowser groups={groups} photosComing={tProp("photosComing")} />
    </section>
  );
}
