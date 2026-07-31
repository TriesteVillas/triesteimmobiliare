import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getArticle,
  getArticles,
  getRelatedArticles,
  articleText,
  readingMinutes,
} from "@/lib/articles";
import ArticleBody from "@/components/resources/ArticleBody";
import SourceList from "@/components/resources/SourceList";
import ResourceCard from "@/components/resources/ResourceCard";
import BuyerConcierge from "@/components/compra/BuyerConcierge";
import JsonLd from "@/components/JsonLd";
import { pageAlternates, pageOpenGraph, absUrl, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";

// Pagina articolo delle Risorse. SSG per locale × slug, rivalidata dalla Data
// Cache (600s) come il resto del sito. La riga "verificato il" non è
// decorazione: è il patto col lettore — i fatti hanno una data, e quando
// invecchiano si ri-verificano (pipeline editoriale nel CRM).

export async function generateStaticParams() {
  const articles = await getArticles();
  return routing.locales.flatMap((locale) => articles.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = await getArticle(slug);
  if (!a) return {};
  const title = articleText(a.title, locale);
  const description = articleText(a.abstract, locale).slice(0, 160);
  return {
    title: { absolute: title },
    description,
    alternates: pageAlternates(locale, `/risorse/${slug}`),
    openGraph: pageOpenGraph(locale, `/risorse/${slug}`, title, description),
  };
}

const fmtDate = (locale: string, iso: string | null): string => {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : "it-IT", {
      dateStyle: "long",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("risorse");

  const article = await getArticle(slug);
  if (!article) notFound();

  const title = articleText(article.title, locale);
  const abstract = articleText(article.abstract, locale);
  const body = articleText(article.body, locale);
  const related = await getRelatedArticles(article);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: abstract,
    inLanguage: locale,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
    author: { "@type": "Organization", name: "TriesteImmobiliare", "@id": `${SITE_URL}/#agency` },
    publisher: { "@id": `${SITE_URL}/#agency` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntityOfPage: absUrl(locale, `/risorse/${article.slug}`),
  };

  return (
    <>
      <JsonLd
        data={[
          jsonLd,
          breadcrumbJsonLd(locale, [
            { name: "TriesteImmobiliare", path: "/" },
            { name: t("hero.title"), path: "/risorse" },
            { name: title, path: `/risorse/${article.slug}` },
          ]),
        ]}
      />

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-40">
        {/* Testata */}
        <nav className="text-xs text-neutral-500" data-reveal>
          <Link href="/risorse" className="transition-colors hover:text-brand">
            {t("hero.title")}
          </Link>
          {article.categoria ? <span> · {article.categoria}</span> : null}
        </nav>
        <h1
          className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-brand-dark sm:text-5xl"
          data-reveal
        >
          {title}
        </h1>
        {abstract ? (
          <p className="mt-5 text-lg leading-relaxed text-neutral-600" data-reveal>
            {abstract}
          </p>
        ) : null}

        {/* Meta: lettura, pubblicazione, verifica dei fatti */}
        <div
          className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-brand/15 py-4 text-xs text-neutral-500"
          data-reveal
        >
          <span>{t("minutes", { n: readingMinutes(article, locale) })}</span>
          {article.publishedAt ? <span>{t("published", { date: fmtDate(locale, article.publishedAt) })}</span> : null}
          {article.verifiedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/[0.06] px-3 py-1 text-brand-dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {t("verified", { date: fmtDate(locale, article.verifiedAt) })}
            </span>
          ) : null}
        </div>

        {/* Corpo */}
        <div className="mt-10">
          <ArticleBody markdown={body} />
        </div>

        {/* Aggiornamenti pubblici — l'articolo è vivo, e lo dice: quando una
            regola (o un nostro errore) cambia qualcosa, qui resta la traccia
            visibile al lettore. Righe "YYYY-MM-DD | testo" dal CRM. */}
        {article.aggiornamenti ? (
          <div className="mt-10 rounded-2xl border border-brand/20 bg-paper px-5 py-4" data-reveal>
            <p className="text-sm font-semibold text-brand-dark">{t("updatesTitle")}</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
              {article.aggiornamenti
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .map((line, i) => {
                  const [d, ...rest] = line.split("|");
                  const dateTxt = /^\d{4}-\d{2}-\d{2}$/.test(d.trim()) ? fmtDate(locale, d.trim()) : d.trim();
                  return (
                    <li key={i}>
                      <span className="font-medium text-brand-dark">{dateTxt}</span>
                      {rest.length ? <span> — {rest.join("|").trim()}</span> : null}
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}

        {/* Fonti — lista cliccabile, mai URL in chiaro */}
        {article.fonti ? (
          <details className="mt-12 rounded-2xl border border-brand/15 bg-paper px-5 py-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-600 transition-colors hover:text-brand-dark">
              {t("sources")}
            </summary>
            <SourceList fonti={article.fonti} />
          </details>
        ) : null}

        {/* Disclaimer editoriale standard */}
        <p className="mt-8 rounded-2xl border border-brand/15 bg-paper px-5 py-4 text-xs leading-relaxed text-neutral-500">
          {t("disclaimer")}
        </p>
      </article>

      {/* La domanda che l'articolo non ha chiuso */}
      <section className="bg-paper py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow" data-reveal>
            {t("askEyebrow")}
          </p>
          <h2 className="display-chapter mt-3 text-brand-dark" data-reveal>
            {t("askTitle")}
          </h2>
        </div>
        <div className="mx-auto mt-8 max-w-3xl px-6">
          <BuyerConcierge />
        </div>
      </section>

      {/* Continua a leggere */}
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow" data-reveal>
            {t("relatedEyebrow")}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3" data-reveal-stagger>
            {related.map((a) => (
              <ResourceCard
                key={a.slug}
                article={a}
                locale={locale}
                minutesLabel={t("minutes", { n: readingMinutes(a, locale) })}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
