import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ResetForm from "@/components/account/ResetForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("resetTitle"), robots: { index: false } };
}

// Pagina di atterraggio del link di reset password (token in querystring).
export default async function AccountResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const { token } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 pb-24 pt-32 md:pt-36">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{t("resetTitle")}</h1>
      <div className="mt-8">
        <ResetForm token={token ?? ""} />
      </div>
    </main>
  );
}
