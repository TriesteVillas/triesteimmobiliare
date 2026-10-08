import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import CookiePrefsButton from "./CookiePrefsButton";
import { sloveniaVillasUrl } from "@/lib/sloveniavillas";
import { sappadaVillasUrl } from "@/lib/sappadavillas";
import { sitiGruppo } from "@/lib/siti-gruppo";

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
  { href: "/risorse", key: "resources" },
  { href: "/gruppo", key: "group" },
  { href: "/contatti", key: "contact" },
] as const;

// Gli indirizzi per lingua dei siti del gruppo: lib/siti-gruppo.ts, una
// tabella sola con /gruppo (fino all'08/10 erano due copie con rimandi 308).

// Sibling brands (the group ecosystem). TriesteBusiness routes to /gruppo because it has no website.
const GROUP = [
  { label: "TriesteVillas", site: "tsv", external: true },
  { label: "TriesteAffitti", site: "affitti", external: true },
  { label: "FriuliVillas", site: "friuli", external: true },
  { label: "LignanoVillas", site: "lignano", external: true },
  // SappadaVillas (07/10/2026): dopo il mare di Lignano, la montagna. Come per
  // SloveniaVillas l'indirizzo per lingua viene dalla sua tabella,
  // lib/sappadavillas.ts.
  { label: "SappadaVillas", site: "sappada", external: true },
  // SloveniaVillas (06/10/2026): l'indirizzo per lingua viene da
  // lib/sloveniavillas.ts, l'unica tabella dei suoi percorsi.
  { label: "SloveniaVillas", site: "slovenia", external: true },
  { label: "TriesteBusiness", href: "/gruppo", external: false },
] as const;

export default async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tContact = await getTranslations("contact");
  const tLegal = await getTranslations("group.legal");
  const year = new Date().getFullYear();
  const phone = tContact("phone");
  // Il numero arriva dai testi, con o senza +39 secondo la lingua: il link
  // prende solo le cifre e il prefisso una volta sola.
  const cifre = phone.replace(/\D+/g, "").replace(/^(?:00)?39(?=3)/, "");
  const telHref = `tel:+39${cifre}`;
  const tA = await getTranslations("audit0810.footer");
  const groupSites = {
    ...sitiGruppo(locale),
    slovenia: sloveniaVillasUrl(locale),
    sappada: sappadaVillasUrl(locale),
  };

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
          {/* Bersagli tattili da 28 px (py-1) invece di 20: lo spazio fra le
              righe scende di conseguenza, il ritmo resta quello di prima. */}
          <ul className="space-y-0 text-white/70">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="inline-block py-1 transition-colors hover:text-white">
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
          <ul className="space-y-0 text-white/70">
            {GROUP.map((b) => {
              if (b.external) {
                return (
                  <li key={b.label}>
                    <a
                      href={groupSites[b.site]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-1 transition-colors hover:text-white"
                    >
                      {b.label} ↗
                    </a>
                  </li>
                );
              }

              return (
                <li key={b.label}>
                  <Link href={b.href} className="inline-block py-1 transition-colors hover:text-white">
                    {b.label}
                  </Link>
                </li>
              );
            })}
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
                <a href={`mailto:${tContact("email")}`} className="inline-block py-1 transition-colors hover:text-white">
                  {tContact("email")}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">{tContact("phoneLabel")}</dt>
              <dd>
                <a href={telHref} className="inline-block py-1 transition-colors hover:text-white">
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
            {/* La PEC come testo, non mailto: (08/10/2026): una mail normale
                verso una casella PEC rischia il rifiuto o di non essere letta,
                e chi scrive va mandato all'indirizzo di sopra. */}
            <p>PEC {tLegal("pec")}</p>
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
            {/* La porta per cambiare idea sul consenso: senza, un sì dato una
                volta resterebbe dato per sempre. */}
            <CookiePrefsButton className="underline underline-offset-2 transition-colors hover:text-white/70" />
            {/* «Come usiamo l'AI»: la pagina del gruppo su triestevillas.com,
                come prevede l'AI pledge (08/10/2026: TSI non ne ha una sua).
                Sempre a vista: le pagine /ai rispondono 200 nelle quattro
                lingue (verificato l'08/10). */}
            <a
              href={locale === "it" ? "https://triestevillas.com/ai" : `https://triestevillas.com/${locale}/ai`}
              target="_blank"
              rel="noopener"
              className="underline underline-offset-2 transition-colors hover:text-white/70"
            >
              {tA("ai")}
            </a>
            <span className="text-white/75">{t("appointmentNote")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
