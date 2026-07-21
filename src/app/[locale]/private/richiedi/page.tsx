import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import RequestForm from "@/components/private/RequestForm";
import AccessGate from "@/components/private/AccessGate";

// Never index the gate; the request page is reachable only from a ghost card
// or an expiry email.
export const metadata: Metadata = {
  title: "Private Collection",
  robots: { index: false, follow: false },
};

export default async function RichiediPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string; renew?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("pc");

  const triggerId = typeof sp.p === "string" ? sp.p : "";
  const renew = sp.renew === "1";

  return (
    <div className="pc-root min-h-screen px-4 py-24">
      <div className="mx-auto max-w-xl">
        <header className="text-center">
          <p className="pc-eyebrow">{t("badge")}</p>
          <h1 className="pc-title mt-3 text-3xl sm:text-4xl">
            {renew ? t("renewTitle") : t("requestTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#aebcc9]">
            {renew ? t("renewIntro") : t("requestIntro")}
          </p>
        </header>
        <div className="mt-10">
          <RequestForm triggerId={triggerId} />
        </div>

        <div className="my-12 flex items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-[#a9c8e0]/15" />
          <span className="text-[#6d7c8a]">·</span>
          <span className="h-px flex-1 bg-[#a9c8e0]/15" />
        </div>

        <AccessGate
          prefill=""
          expired={false}
          compact
          successHref={`${locale === "it" ? "" : `/${locale}`}/private`}
        />
      </div>
    </div>
  );
}
