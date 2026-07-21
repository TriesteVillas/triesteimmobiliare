import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ImmobiliBrowser from "@/components/ImmobiliBrowser";
import BuyerCta from "@/components/BuyerCta";
import { getProperties, getPrivateTeasers } from "@/lib/airtable";
import { groupByZone, ZONE_ORDER, ZONE_OTHER } from "@/lib/properties";
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

  // Immobili pubblici (i cluster PRIVATE sono esclusi alla fonte) + i teaser
  // senza dettaglio della Private Collection, raggruppati per zona insieme.
  const [properties, teasers] = await Promise.all([getProperties(), getPrivateTeasers()]);
  // ZONE_ORDER è `as const`, quindi il suo `includes` accetta solo i codici noti:
  // il confronto va fatto su una copia widened, non su una zona già ristretta.
  const ZONE_CODES: readonly string[] = ZONE_ORDER;
  const zoneOfTeaser = (zona: string | null): string => {
    const code = (zona ?? "").toUpperCase().trim();
    return ZONE_CODES.includes(code) ? code : ZONE_OTHER;
  };
  const groups = groupByZone(properties).map((g) => {
    const label = tZones(g.code);
    return {
      code: g.code,
      label,
      items: g.items.map((p) => buildPropertyView(p, locale, tProp, label)),
      ghosts: teasers.filter((t2) => zoneOfTeaser(t2.zona) === g.code).map((t2) => ({ id: t2.id, band: t2.band })),
    };
  });
  // Una zona che ha SOLO immobili riservati non esiste in groupByZone (che parte
  // dai pubblici): va aggiunta a mano, altrimenti quei teaser non comparirebbero
  // da nessuna parte e la curazione sembrerebbe non aver fatto effetto.
  const zoneGiaPresenti = new Set(groups.map((g) => g.code));
  for (const code of [...ZONE_ORDER, ZONE_OTHER]) {
    if (zoneGiaPresenti.has(code)) continue;
    const soli = teasers.filter((t2) => zoneOfTeaser(t2.zona) === code);
    if (!soli.length) continue;
    groups.push({ code, label: tZones(code), items: [], ghosts: soli.map((t2) => ({ id: t2.id, band: t2.band })) });
  }

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
