import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentWebAccount } from "@/lib/account/auth";
import { googleConfigured } from "@/lib/account/google";
import {
  listPrefsByEmail,
  listMatchesByEmail,
  listUpcomingVisits,
  type Pref,
  type UpcomingVisit,
} from "@/lib/account/store";
import { parseCriteriJson, emptyCriteri } from "@/lib/account/prefopts";
import { operatorEmail, AGENCY_PHONE, AGENCY_PHONE_HREF } from "@/lib/account/team";
import { getProperties, getPrivateProperties } from "@/lib/airtable";
import { ZONE_ORDER, ZONE_OTHER, type Property } from "@/lib/properties";
import { buildPropertyView, priceLabel } from "@/lib/propertyView";
import PropertyCard from "@/components/PropertyCard";
import AuthPanel from "@/components/account/AuthPanel";
import PrefsForm from "@/components/account/PrefsForm";
import FavExtras from "@/components/account/FavExtras";
import CostPlanner, { type CostRow } from "@/components/account/CostPlanner";
import FavoritesMap, { type FavPoint } from "@/components/account/FavoritesMap";
import BuyerConcierge from "@/components/compra/BuyerConcierge";

// L'area clienti: da anonimi è la pagina-valore con accesso/registrazione, da
// loggati il salotto personale — Concierge in testa, poi i preferiti col loro
// corredo (appunti, avvisi, condivisione), la tabella costi, la mappa dei
// cuori, le visite programmate, le proposte del motore e le preferenze
// strutturate. Tema chiaro (divergenza deliberata dal gemello TriesteVillas).
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const zoneCode = (zona: string | null): string => {
  const z = zona?.toUpperCase().trim();
  return z && (ZONE_ORDER as readonly string[]).includes(z) ? z : ZONE_OTHER;
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const acc = await currentWebAccount();

  if (!acc) {
    const benefits = ["b1", "b2", "b3", "b4", "b5"] as const;
    return (
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-32 md:pt-36">
        <div className="grid items-start gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("eyebrow")}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">{t("heroTitle")}</h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">{t("heroSub")}</p>
            <ul className="mt-8 space-y-4">
              {benefits.map((k) => (
                <li key={k} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {t(`benefits.${k}`)}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs leading-relaxed text-neutral-400">
              {t("transparencyShort")}{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-neutral-600">
                {t("privacyLink")}
              </Link>
            </p>
          </div>
          <div className="md:justify-self-end">
            <AuthPanel ssoEnabled={googleConfigured()} />
          </div>
        </div>
      </main>
    );
  }

  // ---- Loggato -------------------------------------------------------------
  const tProp = await getTranslations("property");
  const tZones = await getTranslations("zones");
  const [prefs, matches, pubProps, pcProps, visits] = await Promise.all([
    listPrefsByEmail(acc.email),
    listMatchesByEmail(acc.email),
    getProperties(),
    getPrivateProperties().catch(() => [] as Property[]),
    listUpcomingVisits(acc.leadIds).catch(() => [] as UpcomingVisit[]),
  ]);
  const bySlug = new Map<string, Property>();
  const byRecId = new Map<string, Property>();
  for (const p of [...pubProps, ...pcProps]) {
    bySlug.set(p.slug, p);
    byRecId.set(p.recId, p);
  }

  const propUrl = (slug: string) =>
    `${SITE_URL}${locale === "it" ? "" : `/${locale}`}/annuncio/${slug}`;

  const hearted = prefs.filter((p) => p.cuore);
  // Le schede si mostrano solo per immobili ancora online; un cuore su un
  // immobile riservato o uscito dal sito resta a DB ma qui non renderizza.
  const heartedPairs = hearted
    .map((pr) => ({ pr, p: bySlug.get(pr.slug) }))
    .filter((x): x is { pr: Pref; p: Property } => !!x.p);

  const costRows: CostRow[] = heartedPairs
    .filter(({ p }) => p.contratto !== "AFFITTO")
    .map(({ pr, p }) => ({
      slug: p.slug,
      title: p.title,
      url: propUrl(p.slug),
      price: p.priceSale,
      impostePrima: p.impostePrima,
      imposteSeconda: p.imposteSeconda,
      condoAnnuo: p.condoMensile != null ? p.condoMensile * 12 : null,
      iliaAnnua: p.iliaAnnua,
      lavori: pr.budgetLavori,
    }));

  const mapPoints: FavPoint[] = heartedPairs
    .filter(({ p }) => p.lat != null && p.lng != null)
    .map(({ p }) => ({
      slug: p.slug,
      title: p.title,
      priceLabel: priceLabel(p, locale, tProp),
      cover: (p.coverPhoto ?? p.photos[0])?.thumb ?? null,
      url: propUrl(p.slug),
      lat: p.lat!,
      lng: p.lng!,
    }));

  const matchViews = matches
    .map((m) => ({ m, p: bySlug.get(m.slug) }))
    .filter((x): x is { m: (typeof matches)[number]; p: Property } => !!x.p)
    .map((x) => ({
      motivi: x.m.motivi,
      view: buildPropertyView(x.p, locale, tProp, tZones(zoneCode(x.p.zona))),
    }));

  const photosComing = tProp("photosComing");
  const criteri = acc.criteriJsonRaw ? parseCriteriJson(acc.criteriJsonRaw) : emptyCriteri();
  // Il vecchio testo libero non si butta: se non ci sono ancora chips salvate,
  // riappare come nota, pronto da raffinare.
  if (!acc.criteriJsonRaw && acc.criteri) criteri.note = acc.criteri.slice(0, 600);

  const dateFmt = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
            {t("hello", { name: acc.nome.split(" ")[0] || acc.email })}
          </h1>
        </div>
        <a href="/api/account/logout" className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700">
          {t("logout")}
        </a>
      </div>

      {/* Concierge AI in testa, non in fondo: è la porta d'ingresso di tutta
          l'area. Widget dark-themed → card scura sul tema chiaro. */}
      <section className="mt-10 rounded-2xl bg-ink px-4 pb-4 pt-5">
        <BuyerConcierge />
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold text-neutral-900">{t("favTitle")}</h2>
        {heartedPairs.length === 0 ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
            {t("favEmpty")}{" "}
            <Link href="/immobili" className="font-medium text-brand-dark underline underline-offset-2">
              {t("favEmptyCta")}
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {heartedPairs.map(({ pr, p }) => (
              <FavExtras key={p.slug} slug={p.slug} title={p.title} url={propUrl(p.slug)} initialNota={pr.nota}>
                <PropertyCard
                  view={buildPropertyView(p, locale, tProp, tZones(zoneCode(p.zona)))}
                  photosComing={photosComing}
                />
              </FavExtras>
            ))}
          </div>
        )}
      </section>

      {costRows.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-neutral-900">{t("costTitle")}</h2>
          <p className="mt-1 mb-5 text-sm text-neutral-500">{t("costSub")}</p>
          <CostPlanner rows={costRows} initialMode={criteri.acquisto || undefined} />
        </section>
      )}

      {mapPoints.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-neutral-900">{t("mapTitle")}</h2>
          <p className="mt-1 mb-5 text-sm text-neutral-500">{t("mapSub")}</p>
          <FavoritesMap points={mapPoints} discoverLabel={t("mapDiscover")} />
        </section>
      )}

      {visits.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-neutral-900">{t("visitsTitle")}</h2>
          <p className="mt-1 mb-5 text-sm text-neutral-500">{t("visitsSub")}</p>
          <ul className="space-y-3">
            {visits.map((v) => {
              const prop = v.propRecIds.map((id) => byRecId.get(id)).find(Boolean);
              const when = v.dataIso ? dateFmt.format(new Date(v.dataIso)) : "";
              const opMail = v.operatore ? operatorEmail(v.operatore) : null;
              const subject = encodeURIComponent(
                `${t("visitsMailSubject")} — ${prop?.title ?? ""} (${when})`.trim(),
              );
              return (
                <li
                  key={v.id}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {when}
                      <span
                        className={`ml-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          v.confermata
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {v.confermata ? t("visitConfirmed") : t("visitPending")}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {prop ? (
                        <Link href={`/annuncio/${prop.slug}`} className="underline-offset-2 hover:text-brand hover:underline">
                          {prop.title}
                        </Link>
                      ) : (
                        t("visitGeneric")
                      )}
                      {v.operatore && (
                        <span className="text-neutral-400"> · {t("visitWith", { name: v.operatore })}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {opMail && (
                      <a
                        href={`mailto:${opMail}?subject=${subject}`}
                        className="btn-press rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-brand hover:text-brand"
                      >
                        {t("visitEmailOp")}
                      </a>
                    )}
                    <a
                      href={AGENCY_PHONE_HREF}
                      className="btn-press rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-brand hover:text-brand"
                    >
                      {t("visitCall", { phone: AGENCY_PHONE })}
                    </a>
                    <a
                      href={`mailto:${opMail ?? "info@triesteimmobiliare.com"}?subject=${subject}&body=${encodeURIComponent(t("visitChangeBody"))}`}
                      className="btn-press rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {t("visitChange")}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {matchViews.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-neutral-900">{t("matchTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("matchSub")}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchViews.map(({ view, motivi }) => (
              <div key={view.slug}>
                <PropertyCard view={view} photosComing={photosComing} />
                {motivi && <p className="mt-2 px-1 text-xs leading-relaxed text-neutral-400">{motivi}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 max-w-2xl">
        <h2 className="text-lg font-semibold text-neutral-900">{t("prefsTitle")}</h2>
        <p className="mt-1 mb-6 text-sm text-neutral-500">{t("prefsSub")}</p>
        <PrefsForm
          nome={acc.nome}
          telefono={acc.telefono}
          criteri={criteri}
          digest={acc.digest || "Mai"}
          consMarketing={acc.consMarketing}
          consProfilazione={acc.consProfilazione}
        />
      </section>

      <section className="mt-14 max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">{t("transparencyTitle")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">{t("transparencyBody")}</p>
        <Link href="/privacy" className="mt-3 inline-block text-xs text-brand-dark underline underline-offset-2">
          {t("privacyLink")}
        </Link>
      </section>
    </main>
  );
}
