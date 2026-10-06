import { getLocale, getTranslations } from "next-intl/server";
import { sloveniaVillasHref } from "@/lib/sloveniavillas";

// Il rimando a SloveniaVillas (06/10/2026), in due misure.
//
// · `home` — la sezione vera della home SLOVENA, subito dopo «Chi siamo»: chi
//   legge TriesteImmobiliare in sloveno ha spesso la casa di là dal confine, e
//   la prima cosa che deve sapere è che qui si vende Trieste e che per la costa
//   e il Carso c'è l'atlante del gruppo. Nelle altre lingue la home ha solo la
//   riga nel «Gruppo» (vedi page.tsx): lì non è il lettore tipico.
// · `vendi` — il riquadro del funnel venditori, in tutte e quattro le lingue:
//   un proprietario austriaco o italiano con una casa a Capodistria esiste.
//
// I tempi di guida sono quelli misurati da SloveniaVillas (OSRM, senza
// traffico, 05/10/2026, da Piazza Unità): non se ne aggiungono altri. E in
// entrambe le misure resta scritto il limite: in Slovenia oggi non facciamo
// mediazione, l'avvio è nel corso del 2027.

const TEMPI = [
  { luogo: "sezana", min: 18 },
  { luogo: "koper", min: 27 },
  { luogo: "izola", min: 32 },
  { luogo: "piran", min: 45 },
] as const;

const ESTERNO = { target: "_blank", rel: "noopener noreferrer" } as const;

export default async function SloveniaVillasRiquadro({ misura }: { misura: "home" | "vendi" }) {
  const locale = await getLocale();
  const t = await getTranslations("sloveniavillas");
  const href = (p: Parameters<typeof sloveniaVillasHref>[1]) => sloveniaVillasHref(locale, p, misura);

  if (misura === "vendi") {
    return (
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="rounded-3xl border border-brand/20 bg-paper p-7 sm:p-10">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-semibold leading-snug text-brand-dark sm:text-[1.7rem]">
            {t("vendi.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-neutral-600">{t("vendi.text")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={href("home")}
              {...ESTERNO}
              className="btn-press rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t("home.cta")} ↗
            </a>
            <a href={href("proprietari")} {...ESTERNO} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {t("home.owners.title")} ↗
            </a>
            <a href={href("strumenti")} {...ESTERNO} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {t("home.tools.title")} ↗
            </a>
          </div>
        </div>
      </section>
    );
  }

  const percorsi = [
    { k: "owners", p: "proprietari" },
    { k: "tools", p: "strumenti" },
    { k: "guide", p: "guidaVendita" },
  ] as const;

  return (
    <section className="mx-auto max-w-5xl px-6 pb-20" aria-labelledby="sv-titolo">
      <div className="overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-paper to-white">
        <div className="grid grid-cols-1 gap-10 p-7 sm:p-12 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="eyebrow" data-reveal>{t("home.eyebrow")}</p>
            <h2 id="sv-titolo" className="display-chapter mt-2 text-brand-dark" data-reveal>
              {t("home.title")}
            </h2>
            <p className="mt-4 text-neutral-600">{t("home.body")}</p>
            <a
              href={href("home")}
              {...ESTERNO}
              className="btn-hero mt-7 inline-block rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
            >
              {t("home.cta")} ↗
            </a>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t("home.driveLabel")}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 md:grid-cols-2">
                {TEMPI.map((x) => (
                  <div key={x.luogo} className="border-t border-brand/20 pt-2">
                    <dt className="text-sm text-neutral-600">{t(`home.places.${x.luogo}`)}</dt>
                    <dd className="text-2xl font-semibold tabular-nums text-brand-dark">{x.min} min</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {percorsi.map((x) => (
                <li key={x.k}>
                  <a href={href(x.p)} {...ESTERNO} className="group block py-3">
                    <span className="font-semibold text-brand-dark transition-colors group-hover:text-brand">
                      {t(`home.${x.k}.title`)} ↗
                    </span>
                    <span className="mt-0.5 block text-sm text-neutral-600">{t(`home.${x.k}.text`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="border-t border-brand/15 bg-white/60 px-7 py-4 text-sm text-neutral-600 sm:px-12">
          {t("home.limit")}
        </p>
      </div>
    </section>
  );
}
