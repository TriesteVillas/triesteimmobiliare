import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";

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
  { href: "/vendi", key: "sell" },
  { href: "/gruppo", key: "group" },
  { href: "/contatti", key: "contact" },
] as const;

export default async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tContact = await getTranslations("contact");
  const tLegal = await getTranslations("group.legal");
  const year = new Date().getFullYear();
  const phone = tContact("phone");
  const telHref = `tel:${phone.replace(/\s+/g, "")}`;

  return (
    <footer className="mt-16 bg-brand-dark text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <Logo tone="light" />
          <div className="space-y-0.5 text-white/60">
            <p className="font-medium text-white/80">{tLegal("company")}</p>
            <p>{tLegal("address")}</p>
            <p>{tLegal("vat")}</p>
            <p>{tLegal("rea")}</p>
            <p>{tLegal("capital")}</p>
            <p>
              PEC{" "}
              <a
                href={`mailto:${tLegal("pec")}`}
                className="transition-colors hover:text-white/90"
              >
                {tLegal("pec")}
              </a>
            </p>
          </div>
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

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("contactTitle")}
          </h2>
          <dl className="space-y-2 text-white/70">
            <div>
              <dt className="sr-only">{tContact("emailLabel")}</dt>
              <dd>
                <a
                  href={`mailto:${tContact("email")}`}
                  className="transition-colors hover:text-white"
                >
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
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/40">
          © {year} TriesteImmobiliare. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
