import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentWebAccount } from "@/lib/account/auth";
import { googleConfigured } from "@/lib/account/google";
import { listPrefsByEmail, listMatchesByEmail } from "@/lib/account/store";
import { getProperties, getPrivateProperties } from "@/lib/airtable";
import { ZONE_ORDER, ZONE_OTHER, type Property } from "@/lib/properties";
import { buildPropertyView } from "@/lib/propertyView";
import PropertyCard from "@/components/PropertyCard";
import AuthPanel from "@/components/account/AuthPanel";
import PrefsForm from "@/components/account/PrefsForm";

// L'area clienti: da anonimi è la pagina-valore con accesso/registrazione, da
// loggati il salotto personale (preferiti, proposte del motore, preferenze,
// trasparenza su cosa registriamo). Legge i cookie → sempre dinamica; il resto
// del sito resta statico apposta (vedi AccountLink).
export const dynamic = "force-dynamic";

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

  // ---- Loggato: preferiti + proposte + preferenze --------------------------
  const tProp = await getTranslations("property");
  const tZones = await getTranslations("zones");
  const [prefs, matches, pubProps, pcProps] = await Promise.all([
    listPrefsByEmail(acc.email),
    listMatchesByEmail(acc.email),
    getProperties(),
    getPrivateProperties().catch(() => [] as Property[]),
  ]);
  const bySlug = new Map<string, Property>();
  for (const p of [...pubProps, ...pcProps]) bySlug.set(p.slug, p);

  const hearted = prefs.filter((p) => p.cuore);
  // Le schede si mostrano solo per immobili ancora online; un cuore su un
  // immobile riservato o uscito dal sito resta a DB ma qui non renderizza.
  const heartedViews = hearted
    .map((pr) => bySlug.get(pr.slug))
    .filter((p): p is Property => !!p)
    .map((p) => buildPropertyView(p, locale, tProp, tZones(zoneCode(p.zona))));

  const matchViews = matches
    .map((m) => ({ m, p: bySlug.get(m.slug) }))
    .filter((x): x is { m: (typeof matches)[number]; p: Property } => !!x.p)
    .map((x) => ({
      motivi: x.m.motivi,
      view: buildPropertyView(x.p, locale, tProp, tZones(zoneCode(x.p.zona))),
    }));

  const photosComing = tProp("photosComing");

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

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-neutral-900">{t("favTitle")}</h2>
        {heartedViews.length === 0 ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
            {t("favEmpty")}{" "}
            <Link href="/immobili" className="font-medium text-brand-dark underline underline-offset-2">
              {t("favEmptyCta")}
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {heartedViews.map((v) => (
              <PropertyCard key={v.slug} view={v} photosComing={photosComing} />
            ))}
          </div>
        )}
      </section>

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
          criteri={acc.criteri}
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
