"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { subscribe, getSnapshot, getServerSnapshot, toggleFav } from "./favstore";

// Il cuoricino. Due varianti:
//  - "card":   overlay in basso a destra sulla foto della card (che è dentro
//              un <Link>/galleria: ogni click fa preventDefault+stopPropagation);
//  - "detail": bottone pieno sulla scheda immobile, con etichetta.
// Funziona anche da anonimi (localStorage); al primo cuore anonimo mostra una
// volta il prompt "crea un account per conservarli" — il momento di massima
// conversione secondo i portali (Zillow/Rightmove).

let anonPromptShown = false;

export default function FavHeart({
  slug,
  variant = "card",
}: {
  slug: string;
  variant?: "card" | "detail";
}) {
  const t = useTranslations("account");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [prompt, setPrompt] = useState(false);
  const on = s.favs.has(slug);

  const guard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const click = (e: React.MouseEvent) => {
    guard(e);
    const now = toggleFav(slug);
    if (now && !s.authed && !anonPromptShown) {
      anonPromptShown = true;
      setPrompt(true);
      setTimeout(() => setPrompt(false), 8000);
    }
  };

  const heart = (
    <svg
      viewBox="0 0 24 24"
      fill={on ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={variant === "card" ? "h-4.5 w-4.5" : "h-5 w-5"}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const promptBox = prompt && (
    <div
      onClick={guard}
      className={`absolute z-[5] w-60 rounded-xl border border-white/15 bg-ink/95 p-3 text-left shadow-xl backdrop-blur ${
        variant === "card" ? "bottom-full right-0 mb-2" : "top-full left-0 mt-2"
      }`}
    >
      <p className="text-xs leading-relaxed text-white/80">{t("anonSavedHint")}</p>
      <Link
        href="/account"
        className="mt-2 inline-block text-xs font-semibold text-sand underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {t("anonSavedCta")}
      </Link>
    </div>
  );

  if (variant === "detail") {
    return (
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={click}
          aria-pressed={on}
          className={`btn-press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            on
              ? "border-red-400/60 bg-red-500/15 text-red-300"
              : "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
          }`}
        >
          <span className={on ? "text-red-400" : ""}>{heart}</span>
          {on ? t("saved") : t("save")}
        </button>
        {promptBox}
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-3 right-3 z-[3]" onClick={guard}>
      <div className="relative">
        <button
          type="button"
          onClick={click}
          aria-pressed={on}
          aria-label={on ? t("saved") : t("save")}
          title={on ? t("saved") : t("save")}
          className={`btn-press flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-colors ${
            on
              ? "bg-red-500/90 text-white"
              : "bg-black/45 text-white/85 ring-1 ring-white/20 hover:bg-black/65 hover:text-white"
          }`}
        >
          {heart}
        </button>
        {promptBox}
      </div>
    </div>
  );
}
