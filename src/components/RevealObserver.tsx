"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

// Watches every [data-reveal] / [data-reveal-stagger] element and adds
// .is-revealed when it scrolls into view (once per element). Elements are
// hidden only under html[data-reveal-armed] — see layout.tsx and globals.css.
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-reveal-armed")) return;

    const els = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
    if (!els.length) return;

    // Once the entrance finishes, drop the reveal attributes so their
    // transitions (and stagger delays) stop overriding hover transitions
    // like .card-lift / .btn-press.
    const reveal = (el: Element) => {
      el.classList.add("is-revealed");
      setTimeout(() => {
        el.removeAttribute("data-reveal");
        el.removeAttribute("data-reveal-stagger");
        el.classList.remove("is-revealed");
      }, 1100);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    els.forEach((el) => {
      // Anything already in the initial viewport reveals immediately —
      // entrance animation on load, no pop-in while scrolling starts.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        reveal(el);
      } else {
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
