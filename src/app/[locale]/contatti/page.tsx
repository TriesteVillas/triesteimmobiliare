import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoatMark } from "@/components/Logo";
import SellerCta from "@/components/SellerCta";
import BuyerCta from "@/components/BuyerCta";
import { pageAlternates, pageOpenGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("contact.title") },
    description: t("contact.description"),
    alternates: pageAlternates(locale, "/contatti"),
    openGraph: pageOpenGraph(locale, "/contatti", t("contact.ogTitle"), t("contact.ogDescription")),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const phone = t("phone");
  const telHref = `tel:+39${phone.replace(/\s+/g, "")}`;

  const rows = [
    { label: t("emailLabel"), value: t("email"), href: `mailto:${t("email")}` },
    { label: t("phoneLabel"), value: phone, href: telHref },
    { label: t("officeLabel"), value: t("office"), href: null },
    { label: t("hoursLabel"), value: t("hours"), href: null },
    { label: t("socialLabel"), value: t("social"), href: "https://www.facebook.com/profile.php?id=61576375390569" },
  ] as const;

  return (
    <section className="grad-paper-sea min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-40">
        <div data-reveal>
          <BoatMark className="h-12 w-auto" />
        </div>
        <p className="eyebrow mt-6">{t("eyebrow")}</p>
        <h1 className="display-hero mt-2 text-brand-dark">{t("title")}</h1>
        <p className="mt-4 max-w-xl text-lg text-neutral-600">{t("intro")}</p>

        <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="bg-white px-6 py-5">
              <dt className="text-xs uppercase tracking-wide text-neutral-400">{r.label}</dt>
              <dd className="mt-1 text-neutral-800">
                {r.href ? (
                  <a
                    href={r.href}
                    {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-brand transition-colors hover:text-brand-dark"
                  >
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <SellerCta
            label={t("ctaSell")}
            className="btn-hero rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white"
          />
          <BuyerCta
            label={t("ctaBuy")}
            fonteCta="Contatti · Parla con noi"
            className="btn-press rounded-full border border-brand/40 px-7 py-3 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5"
          />
        </div>

        <p className="mt-8 text-sm text-neutral-400">{t("poweredBy")} · P.IVA 01235580329</p>
      </div>
    </section>
  );
}
