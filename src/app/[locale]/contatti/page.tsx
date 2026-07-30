import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoatMark } from "@/components/Logo";
import SellerCta from "@/components/SellerCta";
import BuyerCta from "@/components/BuyerCta";
import AutoVideo from "@/components/AutoVideo";
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
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-40">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <div data-reveal>
              <BoatMark className="h-12 w-auto" />
            </div>
            <p className="eyebrow mt-6">{t("eyebrow")}</p>
            <h1 className="display-hero mt-2 text-brand-dark">{t("title")}</h1>
            <p className="mt-4 max-w-xl text-lg text-neutral-600">{t("intro")}</p>

            <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200">
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
          <div
            className="aspect-[5/4] overflow-hidden rounded-3xl border border-brand/15 shadow-[0_24px_70px_-30px_rgba(28,74,107,0.45)] lg:self-center"
            data-reveal
          >
            <AutoVideo
              src="/video/angolo-studio.mp4"
              poster="/video/angolo-studio.jpg"
              ariaLabel={t("videoAlt")}
              className="h-full w-full object-cover"
              lazy={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
