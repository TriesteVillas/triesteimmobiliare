import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { verifySession, PC_COOKIE } from "@/lib/private/session";
import { findGrantById, isActive } from "@/lib/private/store";
import { getPrivateProperties } from "@/lib/airtable";
import { buildPropertyView } from "@/lib/propertyView";
import { ZONE_ORDER, ZONE_OTHER } from "@/lib/properties";
import AccessGate from "@/components/private/AccessGate";
import PrivatePropertyCard from "@/components/private/PrivatePropertyCard";
import { MAIL_REPLY_TO } from "@/lib/private/brand";

export const metadata: Metadata = {
  title: "Private Collection",
  robots: { index: false, follow: false },
};

const zoneCode = (zona: string | null): string => {
  const z = zona?.toUpperCase().trim();
  return z && (ZONE_ORDER as readonly string[]).includes(z) ? z : ZONE_OTHER;
};

export default async function PrivatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ c?: string; expired?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("pc");

  // Verify the signed cookie AND re-check the grant in Airtable, so a revoked
  // or expired credential stops working at the next navigation.
  const jar = await cookies();
  const session = await verifySession(jar.get(PC_COOKIE)?.value);
  let valid = false;
  let firstName = "";
  let email = "";
  if (session) {
    const g = await findGrantById(session.rid);
    if (g && isActive(g)) {
      valid = true;
      firstName = g.nome || session.nm;
      email = g.email || session.em;
    }
  }

  if (!valid) {
    return (
      <div className="pc-root flex min-h-screen items-center px-4 py-24">
        <AccessGate prefill={typeof sp.c === "string" ? sp.c : ""} expired={sp.expired === "1"} />
      </div>
    );
  }

  const tProp = await getTranslations("property");
  const tZones = await getTranslations("zones");
  const properties = await getPrivateProperties();
  const views = properties.map((p) =>
    buildPropertyView(p, locale, tProp, tZones(zoneCode(p.zona))),
  );
  const watermark = `${email} · ${new Date().toISOString().slice(0, 10)}`;
  const zoomUrl = process.env.PC_ZOOM_URL ?? "";

  return (
    <div className="pc-root min-h-screen px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-[#a9c8e0]/15 pb-10 text-center">
          <p className="pc-eyebrow">{t("badge")}</p>
          <h1 className="pc-title mt-3 text-3xl sm:text-[2.6rem]">
            {t("welcome", { name: firstName })}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#aebcc9] sm:text-base">
            {t("welcomeBody")}
          </p>
          <a
            href={zoomUrl || `mailto:${MAIL_REPLY_TO}`}
            target={zoomUrl ? "_blank" : undefined}
            rel={zoomUrl ? "noopener noreferrer" : undefined}
            className="pc-btn mt-7 inline-block"
          >
            {t("specialistCta")}
          </a>
          <div className="mt-6">
            <a href={`/api/private/logout?l=${locale}`} className="text-xs text-[#6d7c8a] transition-colors hover:text-[#93a1ae]">
              {t("logout")}
            </a>
          </div>
        </header>

        {views.length === 0 ? (
          <p className="mt-16 text-center text-sm text-[#93a1ae]">{t("emptyState")}</p>
        ) : (
          <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((v) => (
              <PrivatePropertyCard
                key={v.slug}
                view={v}
                watermark={watermark}
                photosComing={tProp("photosComing")}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
