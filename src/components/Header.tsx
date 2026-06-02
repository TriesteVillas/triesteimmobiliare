import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import LocaleSwitcher from "./LocaleSwitcher";

export default async function Header() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/immobili", label: t("properties") },
    { href: "/vendi", label: t("sell") },
    { href: "/gruppo", label: t("group") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="TriesteImmobiliare" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-medium text-neutral-600 transition-colors hover:text-brand"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
