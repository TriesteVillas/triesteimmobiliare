import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-4 text-neutral-600">{t("intro")}</p>
      <dl className="mt-8 space-y-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">
            {t("emailLabel")}
          </dt>
          <dd className="mt-1">
            <a className="text-brand hover:underline" href={`mailto:${t("email")}`}>
              {t("email")}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">
            {t("phoneLabel")}
          </dt>
          <dd className="mt-1">
            <a
              className="text-brand hover:underline"
              href={`tel:${t("phone").replace(/\s+/g, "")}`}
            >
              {t("phone")}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">
            {t("officeLabel")}
          </dt>
          <dd className="mt-1 text-neutral-800">{t("office")}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-400">
            {t("hoursLabel")}
          </dt>
          <dd className="mt-1 text-neutral-800">{t("hours")}</dd>
        </div>
      </dl>
    </section>
  );
}
