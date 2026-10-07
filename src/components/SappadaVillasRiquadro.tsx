import { getLocale, getTranslations } from "next-intl/server";
import { sappadaVillasHref } from "@/lib/sappadavillas";

// Il rimando a SappadaVillas su /vendi (07/10/2026), in tutte e quattro le
// lingue: sta subito sotto il riquadro di SloveniaVillas e ne riprende la
// forma, perché la domanda è la stessa — «la casa non è a Trieste?» — e la
// risposta è un altro sito del gruppo.
//
// La differenza conta, e il testo la dice: in Slovenia oggi non facciamo
// mediazione, a Sappada sì. Per questo il pulsante non apre la home ma la
// pagina per chi vende, nella lingua di chi legge.
//
// Cosa NON si scrive (vedi lib/sappadavillas.ts): una sede a Sappada, numeri
// di case, superlativi, rendimenti. In tedesco e in sloveno resta scritto che
// si risponde in italiano o in inglese, come fa SappadaVillas stessa.

const ESTERNO = { target: "_blank", rel: "noopener noreferrer" } as const;

export default async function SappadaVillasRiquadro() {
  const locale = await getLocale();
  const t = await getTranslations("sappadavillas.vendi");
  const href = (p: Parameters<typeof sappadaVillasHref>[1]) => sappadaVillasHref(locale, p, "vendi");

  return (
    <section className="mx-auto max-w-6xl px-6 pt-6">
      <div className="rounded-3xl border border-brand/20 bg-paper p-7 sm:p-10">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold leading-snug text-brand-dark sm:text-[1.7rem]">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-3xl text-neutral-600">{t("text")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={href("vendere")}
            {...ESTERNO}
            className="btn-press rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t("cta")} ↗
          </a>
          <a href={href("borgate")} {...ESTERNO} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
            {t("hamlets")} ↗
          </a>
          <a href={href("mercato")} {...ESTERNO} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
            {t("market")} ↗
          </a>
        </div>
      </div>
    </section>
  );
}
