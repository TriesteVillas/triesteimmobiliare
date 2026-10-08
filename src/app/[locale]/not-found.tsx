"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/* La 404 nella lingua della pagina (08/10/2026), dentro il layout [locale]:
   testata, piè di pagina e <html lang> giusti. Ci si arriva da `notFound()`
   in una pagina sotto [locale] — la scheda con uno slug che non porta a
   nessuna casa (lib/properties.ts → risolviSlug). Fino all'08/10 quella
   scheda rimandava con un 307 a /immobili, che Google legge come soft-404.
   Next risponde 404 e aggiunge da sé <meta name="robots" content="noindex">.

   Componente CLIENT, come sul gemello triesteaffitti: not-found non riceve
   `params`, e la lingua letta dal contesto di NextIntlClientProvider (messo
   dal layout) è certa anche quando la scheda si genera a richiesta. */
export default function NotFound() {
  const t = useTranslations("audit0810.notFound");
  return (
    <section className="grad-paper-sea">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-40">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="display-hero mt-3 max-w-3xl text-balance text-brand-dark">{t("title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-neutral-600">{t("lead")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/immobili"
            className="btn-press rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t("immobili")}
          </Link>
          <Link
            href="/"
            className="btn-press rounded-full border border-brand/40 px-7 py-3 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
