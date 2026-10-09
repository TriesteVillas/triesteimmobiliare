import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import VerificaForm from "@/components/account/VerificaForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accountVerifica" });
  return { title: t("title"), robots: { index: false } };
}

// Pagina di atterraggio del link di verifica dell'email (token in querystring).
// La conferma la fa /api/account/verify, chiamata dal modulo: niente scritture
// in una GET, così un antivirus che apre i link della posta non verifica niente.
export default async function AccountVerificaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountVerifica");
  const { token } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 pb-24 pt-32 md:pt-36">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{t("title")}</h1>
      <div className="mt-8">
        <VerificaForm token={token ?? ""} />
      </div>
    </main>
  );
}
