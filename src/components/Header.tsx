import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import LocaleSwitcher from "./LocaleSwitcher";
import HeaderAutoHide from "./HeaderAutoHide";
import MobileNav from "./MobileNav";

// Floating light-glass pill — fixed above every page, anchored during view
// transitions (site-header).
export default async function Header() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/immobili", label: t("properties") },
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
      <div className="pill-header mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full pl-5 pr-4">
        <Link href="/" aria-label="TriesteImmobiliare" className="flex items-center">
          <Logo markClassName="h-6 w-auto" wordClassName="text-base" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
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
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
