"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

// Teaser "ghost" pubblico di un immobile della Private Collection: una superficie
// scura senza foto, senza prezzo e senza dettagli, con la sola dicitura PRIVATE
// COLLECTION. Al browser arrivano soltanto la zona e una forbice grossolana.
// Il fondo è il blu-inchiostro del brand e non nero pieno: qui la griglia pubblica
// è su carta bianca, e il nero assoluto leggerebbe come un errore di caricamento
// invece che come una scelta. Il click porta al form di richiesta accesso, mai a
// una scheda immobile.
export default function GhostCard({
  id,
  band,
  zonaLabel,
}: {
  id: string;
  band: string | null;
  zonaLabel: string;
}) {
  const t = useTranslations("pc");
  const priceLine = band ?? t("onRequest");

  return (
    <Link
      href={`/private/richiedi?p=${encodeURIComponent(id)}`}
      className="card-cine group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        {/* Textless premium black surface (no baked-in wordmark) with a subtle
            vignette and a thin gold frame. The label lives in the overlay below
            so it never doubles up with the background. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-3 rounded-[2px] border border-sand/25 transition-colors duration-700 group-hover:border-sand/40" />
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center text-center">
          <LockIcon />
          <span className="mt-2.5 text-[12px] font-medium uppercase tracking-[0.3em] text-sand">
            {t("badge")}
          </span>
          <span className="mt-3 h-px w-10 bg-sand/50" />
          <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.25em] text-sand/70">
            {t("accessOnRequest")}
          </span>
        </div>
      </div>
      <div className="space-y-1 p-5">
        <p className="text-xl font-semibold tracking-tight text-sand">{priceLine}</p>
        <p className="text-sm text-white/55">{zonaLabel}</p>
        <p className="pt-1 text-xs font-medium text-sand/80 transition-colors group-hover:text-sand">
          {t("ghostCta")} →
        </p>
      </div>
    </Link>
  );
}

function LockIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      className="text-sand"
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
