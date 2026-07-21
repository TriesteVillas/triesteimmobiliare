import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { verifySession, PC_COOKIE } from "@/lib/private/session";
import { findGrantById, isActive } from "@/lib/private/store";
import { getPrivateProperty } from "@/lib/airtable";
import { priceLabel } from "@/lib/propertyView";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import ProtectedImage from "@/components/private/ProtectedImage";
import { MAIL_REPLY_TO } from "@/lib/private/brand";

export const metadata: Metadata = {
  title: "Private Collection",
  robots: { index: false, follow: false },
};

export default async function PrivateDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Gate: same cookie + live grant check as the collection page.
  const jar = await cookies();
  const session = await verifySession(jar.get(PC_COOKIE)?.value);
  let email = "";
  if (session) {
    const g = await findGrantById(session.rid);
    if (g && isActive(g)) email = g.email || session.em;
  }
  if (!email) {
    redirect(locale === routing.defaultLocale ? "/private" : `/${locale}/private`);
  }

  const t = await getTranslations("pc");
  const tProp = await getTranslations("property");
  const p = await getPrivateProperty(slug);
  if (!p) notFound();

  const wm = `${email} · ${new Date().toISOString().slice(0, 10)}`;
  const facts = [
    p.mq ? tProp("sqm", { value: p.mq }) : null,
    p.rooms ? `${p.rooms} ${tProp("rooms").toLowerCase()}` : null,
    p.floor ? `${tProp("floor")} ${p.floor}` : null,
    p.energyClass ? `APE ${p.energyClass}` : null,
  ].filter(Boolean) as string[];
  const photos = (p.topPhotos.length ? p.topPhotos : p.photos).slice(0, 6);

  return (
    <div className="pc-root min-h-screen px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Link href="/private" className="text-sm text-[#93a1ae] transition-colors hover:text-[#a9c8e0]">
          ← {t("backToCollection")}
        </Link>

        <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl bg-black">
          {p.coverPhoto && <ProtectedImage src={p.coverPhoto.url} alt={p.title} watermark={wm} />}
          <span className="absolute left-4 top-4 z-[2] rounded-full border border-[#a9c8e0]/40 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-wider text-[#a9c8e0] backdrop-blur">
            {t("badge")}
          </span>
        </div>

        <header className="mt-8">
          <h1 className="pc-title text-3xl sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-[#93a1ae]">{[p.zona, p.comune].filter(Boolean).join(" · ")}</p>
          <p className="mt-4 text-2xl font-semibold text-[#dfe9f3]">
            {priceLabel(p, locale, tProp)}
          </p>
        </header>

        {facts.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {facts.map((f, i) => (
              <span key={i} className="rounded-full border border-[#a9c8e0]/20 px-3 py-1 text-sm text-[#c3d0dd]">
                {f}
              </span>
            ))}
          </div>
        )}

        {p.description && (
          <p className="mt-8 max-w-3xl whitespace-pre-line leading-relaxed text-[#aebcc9]">
            {p.description}
          </p>
        )}

        {photos.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {photos.map((ph, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
                <ProtectedImage src={ph.url} alt={ph.alt} watermark={wm} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-[#a9c8e0]/20 p-6 text-center">
          <p className="text-[#c3d0dd]">{t("detailCtaText")}</p>
          <a
            href={process.env.PC_ZOOM_URL || `mailto:${MAIL_REPLY_TO}`}
            className="pc-btn mt-4 inline-block"
          >
            {t("specialistCta")}
          </a>
        </div>
      </div>
    </div>
  );
}
