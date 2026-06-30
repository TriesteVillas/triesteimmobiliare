import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";

// TriesteImmobiliare's own channel (the flagship's socials stay on TSV).
const SOCIALS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61576375390569",
    path: "M22 12.06C22 6.48 17.52 2 11.94 2 6.36 2 1.88 6.48 1.88 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.78v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94Z",
  },
];

const NAV = [
  { href: "/", key: "home" },
  { href: "/immobili", key: "properties" },
  { href: "/investimenti", key: "invest" },
  { href: "/vendi", key: "sell" },
  { href: "/gruppo", key: "group" },
  { href: "/contatti", key: "contact" },
] as const;

// Sibling brands (the group ecosystem). Live sites linked; the rest route to /gruppo.
const GROUP = [
  { label: "TriesteVillas", href: "https://www.triestevillas.com", external: true },
  { label: "TriesteAffitti", href: "https://www.triesteaffitti.com", external: true },
  { label: "FriuliVillas", href: "/gruppo", external: false },
  { label: "LignanoVillas", href: "/gruppo", external: false },
  { label: "TriesteBusiness", href: "/gruppo", external: false },
] as const;

export default async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tContact = await getTranslations("contact");
  const tLegal = await getTranslations("group.legal");
  const year = new Date().getFullYear();
  const phone = tContact("phone");
  const telHref = `tel:+39${phone.replace(/\s+/g, "")}`;

  return (
    <footer className="mt-16 bg-brand-dark text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo tone="light" />
          <p className="max-w-xs text-white/70">{t("tagline")}</p>
          <div className="flex items-center gap-3 pt-1">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <nav className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("sitemapTitle")}
          </h2>
          <ul className="space-y-2 text-white/70">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("groupTitle")}
          </h2>
          <ul className="space-y-2 text-white/70">
            {GROUP.map((b) =>
              b.external ? (
                <li key={b.label}>
                  <a
                    href={b.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    {b.label} ↗
                  </a>
                </li>
              ) : (
                <li key={b.label}>
                  <Link href={b.href} className="transition-colors hover:text-white">
                    {b.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("contactTitle")}
          </h2>
          <dl className="space-y-2 text-white/70">
            <div>
              <dt className="sr-only">{tContact("emailLabel")}</dt>
              <dd>
                <a href={`mailto:${tContact("email")}`} className="transition-colors hover:text-white">
                  {tContact("email")}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">{tContact("phoneLabel")}</dt>
              <dd>
                <a href={telHref} className="transition-colors hover:text-white">
                  {phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">{tContact("officeLabel")}</dt>
              <dd>{tContact("office")}</dd>
            </div>
            <div>
              <dt className="sr-only">{tContact("hoursLabel")}</dt>
              <dd>{tContact("hours")}</dd>
            </div>
          </dl>
          <div className="space-y-0.5 pt-2 text-xs text-white/70">
            <p className="font-medium text-white/70">{tLegal("company")}</p>
            <p>{tLegal("address")}</p>
            <p>{tLegal("vat")}</p>
            <p>{tLegal("rea")}</p>
            <p>{tLegal("capital")}</p>
            <p>
              PEC{" "}
              <a href={`mailto:${tLegal("pec")}`} className="transition-colors hover:text-white/80">
                {tLegal("pec")}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} TriesteImmobiliare · {t("poweredBy")}. {t("rights")}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-white/70">
              {t("privacy")}
            </Link>
            <span className="text-white/75">{t("appointmentNote")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
