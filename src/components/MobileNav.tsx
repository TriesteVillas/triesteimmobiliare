"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/navigation";
import SellerCta from "./SellerCta";

// Mobile navigation: the pill hides the desktop links below lg, so a
// hamburger opens a full-screen sheet with the same entries + the valuation CTA.
export default function MobileNav({
  links,
  ctaLabel,
  menuLabel = "Menu",
  closeLabel = "Close",
}: {
  links: ReadonlyArray<{ href: string; label: string }>;
  ctaLabel?: string;
  menuLabel?: string;
  closeLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-brand/10 lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="lightbox-enter fixed inset-0 z-[80] flex flex-col bg-brand-dark/95 backdrop-blur-xl"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={menuLabel}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={closeLabel}
              className="absolute right-5 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white"
            >
              ×
            </button>
            <nav
              className="flex flex-1 flex-col items-start justify-center gap-2 px-8"
              onClick={(e) => e.stopPropagation()}
            >
              {links.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="kinetic-line"
                >
                  <span
                    className="kinetic-word display-chapter text-white transition-colors active:text-sand"
                    style={{ ["--word-delay" as string]: `${80 + i * 90}ms` }}
                  >
                    {l.label}
                  </span>
                </Link>
              ))}
              {ctaLabel && (
                <SellerCta
                  label={ctaLabel}
                  className="btn-hero mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark"
                />
              )}
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
