import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import LocaleSwitcher from "./LocaleSwitcher";
import HeaderAutoHide from "./HeaderAutoHide";
import MobileNav from "./MobileNav";
import SellerCta from "./SellerCta";

// Floating light-glass pill — fixed above every page, anchored during view
// transitions (site-header). Carries the always-visible "Richiedi valutazione"
// CTA: acquisition is job #1.
export default async function Header() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/immobili", label: t("properties") },
    { href: "/investimenti", label: t("invest") },
    { href: "/vendi", label: t("sell") },
    { href: "/gruppo", label: t("group") },
    { href: "/contatti", label: t("contact") },
  ] as const;

  return (
    <header
      data-pill
      className="fixed inset-x-0 top-4 z-50 px-4"
      style={{ viewTransitionName: "site-header" }}
    >
      <HeaderAutoHide />
      <div className="pill-header mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full pl-5 pr-3">
        <Link href="/" aria-label="TriesteImmobiliare" className="flex items-center">
          <Logo markClassName="h-6 w-auto" wordClassName="text-base" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-underline font-medium text-neutral-600 transition-colors hover:text-brand-dark"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SellerCta
            label={t("ctaValuation")}
            className="btn-press hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark sm:inline-block"
          />
          <LocaleSwitcher />
          <MobileNav
            links={links}
            ctaLabel={t("ctaValuation")}
            menuLabel={t("menuLabel")}
            closeLabel={t("closeLabel")}
          />
        </div>
      </div>
    </header>
  );
}
