import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArticles, articleText, readingMinutes } from "@/lib/articles";
import LibraryBrowser, { type LibraryItem } from "@/components/resources/LibraryBrowser";
import BuyerConcierge from "@/components/compra/BuyerConcierge";
import JsonLd from "@/components/JsonLd";
import { partialAlternates, pageOpenGraph, absUrl, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import type { Article } from "@/lib/articles";

// /sl/risorse (08/10/2026): fino a oggi ripiegava sull'inglese — titoli e
// sommari «The six stages of a sale…», il 9% di parole slovene sulla pagina —
// perché gli articoli TSI in sloveno non li scrive ancora nessuno. Ora mostra
// SOLO gli articoli che hanno un testo sloveno; senza, la pagina lo dice, rimanda
// alla biblioteca inglese ed esce dall'indice (noindex, e niente hreflang `sl`
// dalle altre lingue). Quando arriva il primo articolo sloveno torna da sola.
function soloNellaLingua(articles: Article[], locale: string): Article[] {
  return locale === "sl" ? articles.filter((a) => !!a.body.sl) : articles;
}
function lingueIndice(articles: Article[]): string[] {
  return routing.locales.filter((l) => l !== "sl" || articles.some((a) => !!a.body.sl));
}

// LE RISORSE — le guide di TriesteImmobiliare su vendere e comprare casa a
// Trieste. Non un blog di novità: pezzi di riferimento, pochi, tenuti veri (ogni
// articolo porta la data in cui i fatti sono stati verificati). Il contenuto vive
// su Airtable WEB_ARTICLES e si pubblica dal CRM; qui si legge soltanto.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "risorse" });
  const articles = await getArticles().catch(() => []);
  const vere = lingueIndice(articles);
  return {
    title: { absolute: t("meta.title") },
    description: t("meta.description"),
    alternates: partialAlternates(locale, "/risorse", vere, vere.includes(locale) ? locale : "en"),
    ...(vere.includes(locale) ? {} : { robots: { index: false, follow: true } }),
    openGraph: pageOpenGraph(locale, "/risorse", t("meta.title"), t("meta.description")),
  };
}

export default async function RisorsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("risorse");

  const tutti = await getArticles();
  const articles = soloNellaLingua(tutti, locale);
  const tA = await getTranslations("audit0810.risorse");
  const items: LibraryItem[] = articles.map((a) => ({
    slug: a.slug,
    title: articleText(a.title, locale),
    abstract: articleText(a.abstract, locale),
    categoria: a.categoria,
    stages: a.journeyStage,
    minutes: t("minutes", { n: readingMinutes(a, locale) }),
    featured: a.inEvidenza,
  }));

  // CollectionPage + elenco: dice ai motori che questa è una raccolta editoriale,
  // non una pagina commerciale, e quali pezzi la compongono.
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absUrl(locale, "/risorse")}#collection`,
    url: absUrl(locale, "/risorse"),
    name: t("meta.title"),
    description: t("meta.description"),
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#agency` },
    hasPart: articles.slice(0, 30).map((a) => ({
      "@type": "Article",
      headline: articleText(a.title, locale),
      url: absUrl(locale, `/risorse/${a.slug}`),
      datePublished: a.publishedAt ?? undefined,
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          collection,
          breadcrumbJsonLd(locale, [
            { name: "TriesteImmobiliare", path: "/" },
            { name: t("hero.title"), path: "/risorse" },
          ]),
        ]}
      />

      {/* Testata */}
      <section className="grad-paper-sea">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-40">
          <p className="eyebrow" data-reveal="now">
            {t("hero.eyebrow")}
          </p>
          <h1 className="display-hero mt-3 max-w-3xl text-balance text-brand-dark" data-reveal="now">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-neutral-600" data-reveal="now">
            {t("hero.intro")}
          </p>
          <p className="mt-4 max-w-2xl text-sm text-neutral-500" data-reveal="now">
            {t("hero.promise")}
          </p>
        </div>
      </section>

      {/* Il concierge anche qui: chi arriva su una pagina di risposte ha una domanda */}
      <section className="mx-auto max-w-5xl px-6 pb-4 pt-6">
        <BuyerConcierge />
      </section>

      {/* Catalogo */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {items.length > 0 ? (
          <LibraryBrowser items={items} allLabel={t("all")} />
        ) : locale === "sl" && tutti.length > 0 ? (
          <p className="max-w-2xl text-neutral-600">
            {tA("slVuoto")}{" "}
            <Link href="/risorse" locale="en" className="font-semibold text-brand underline-offset-4 hover:underline">
              {tA("slVuotoLink")} →
            </Link>
          </p>
        ) : (
          <p className="text-neutral-500">{t("empty")}</p>
        )}
      </section>

      {/* Ponte al mestiere: chi legge di vendere, prima o poi vuole sapere quanto vale */}
      <section className="bg-brand-dark text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div data-reveal>
            <p className="eyebrow text-sand">{t("chapter.eyebrow")}</p>
            <h2 className="display-chapter mt-2 text-white">{t("chapter.title")}</h2>
          </div>
          <Link
            href="/vendi"
            className="btn-hero shrink-0 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-dark hover:bg-white/90"
          >
            {t("chapter.cta")} →
          </Link>
        </div>
      </section>
    </>
  );
}
