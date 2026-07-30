import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import LocaleSwitcher from "./LocaleSwitcher";
import HeaderAutoHide from "./HeaderAutoHide";
import MobileNav from "./MobileNav";
import SellerCta from "./SellerCta";
import AccountLink from "./account/AccountLink";

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
  ] as const;

  return (
    <header
      data-pill
      className="fixed inset-x-0 top-4 z-50 px-4"
      style={{ viewTransitionName: "site-header" }}
    >
      <HeaderAutoHide />
      {/* Larghezze contate, non a occhio: a 375 px la pillola offre 311 px
          interni e il contenuto ne chiedeva 385 — da lì il logo che finiva sopra
          l'icona account. Il recupero sta in tre punti: il selettore lingua
          scende nel menu (−98 px), il lockup rimpicciolisce sotto sm (−26 px) e
          i margini interni si stringono (+8 px di spazio). */}
      <div className="pill-header mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full pl-4 pr-2 sm:pl-5 sm:pr-3">
        <Link href="/" aria-label="TriesteImmobiliare" className="flex min-w-0 items-center">
          <Logo
            markClassName="h-5 w-auto sm:h-6"
            wordClassName="text-sm sm:text-base"
            className="gap-2 sm:gap-2.5"
          />
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
          {/* Client-only: lo stato di login NON si legge server-side qui — l'header
              vive su pagine statiche e i cookie le renderebbero tutte dinamiche. */}
          <AccountLink />
          {/* Sul telefono vive dentro MobileNav: vedi il commento sulla pillola. */}
          <LocaleSwitcher className="hidden sm:flex" />
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
