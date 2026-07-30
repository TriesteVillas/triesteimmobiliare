import { getTranslations } from "next-intl/server";

// Summer-2026 closure notice. It shows in advance and through the last closed
// day (24 Aug, Rome time), then removes itself — no manual take-down needed.
// During the holidays every enquiry funnels to two monitored channels: the
// site's own mailbox and the group's WhatsApp. La mail è info@ come ovunque
// sul sito — mandare i clienti di TriesteImmobiliare su richieste@triestevillas.com
// proprio nelle tre settimane in cui nessuno è in ufficio era l'unico momento
// in cui il salto di brand poteva costare una richiesta (Martino, 2026-07-30).
const EMAIL = "info@triesteimmobiliare.com";
const WA_NUMBER = "393318940822";
const HIDE_AFTER = Date.parse("2026-08-25T00:00:00+02:00");

export default async function ClosureBanner() {
  if (Date.now() >= HIDE_AFTER) return null;
  const t = await getTranslations("closure");
  const mail = `mailto:${EMAIL}?subject=${encodeURIComponent(t("mailSubject"))}`;
  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t("waText"))}`;

  return (
    <section
      role="note"
      aria-label={t("eyebrow")}
      className="border-y border-brand/15 bg-brand/[0.04] px-6 py-10"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-2 text-brand">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
            </svg>
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-dark sm:text-2xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("body")}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:min-w-[16rem]">
          <a
            href={mail}
            className="btn-hero inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white"
          >
            <span aria-hidden>✉</span> {EMAIL}
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press inline-flex items-center justify-center gap-2 rounded-full border border-brand/40 px-6 py-3 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
          >
            <span aria-hidden>WhatsApp</span> · {t("phone")}
          </a>
        </div>
      </div>
    </section>
  );
}
