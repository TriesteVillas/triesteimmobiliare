import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Poppins } from "next/font/google";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import PcLocaleSwitcher from "@/components/private/PcLocaleSwitcher";
import Footer from "@/components/Footer";
import RevealObserver from "@/components/RevealObserver";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, orgJsonLd, webSiteJsonLd } from "@/lib/seo";
import "../globals.css";

// The relaunch lives on a *.vercel.app preview while the brand domain still
// serves the old WordPress (DNS not cut over). Keep it out of the index until
// cutover by setting NEXT_PUBLIC_ALLOW_INDEX=true in production env.
const ALLOW_INDEX = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";

// Arms scroll reveals before first paint (CSS hides [data-reveal] only under
// html[data-reveal-armed]) so content stays visible when JS never runs.
const REVEAL_ARM_SCRIPT = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-reveal-armed","");`;

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

// Match the mobile browser chrome to the favicon's exact ink background.
export const viewport: Viewport = {
  themeColor: "#0f2737",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: "%s · TriesteImmobiliare" },
    description: t("description"),
    robots: ALLOW_INDEX
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "TriesteImmobiliare",
      images: [{ url: "/brand/og-default.jpg", width: 1200, height: 630, alt: "TriesteImmobiliare" }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full scroll-smooth antialiased`}
      // The head script below adds data-reveal-armed pre-hydration (by design).
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_ARM_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <JsonLd data={[orgJsonLd(), webSiteJsonLd()]} />
          <Header />
          {/* Visibile SOLO nell'area riservata: la stessa regola CSS che nasconde
              header e footer sulle pagine .pc-root accende questo. */}
          <PcLocaleSwitcher />
          <main className="flex-1">{children}</main>
          <Footer />
          <RevealObserver />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
