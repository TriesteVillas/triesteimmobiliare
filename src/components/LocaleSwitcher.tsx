"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { it: "IT", en: "EN", de: "DE" };

export default function LocaleSwitcher({
  // "light" per il pannello scuro del menu mobile, dove le tinte da pillola
  // chiara sarebbero illeggibili.
  tone = "brand",
  className = "",
  onPick,
}: {
  tone?: "brand" | "light";
  className?: string;
  onPick?: () => void;
} = {}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    onPick?.();
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const attivo = tone === "light" ? "font-semibold text-white" : "font-semibold text-brand-dark";
  const inattivo =
    tone === "light"
      ? "text-white/60 transition-colors hover:text-white"
      : "text-neutral-500 transition-colors hover:text-brand";

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`} aria-busy={isPending}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => onChange(loc)}
          aria-current={loc === locale}
          className={`px-1.5 ${loc === locale ? attivo : inattivo}`}
        >
          {LABELS[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
