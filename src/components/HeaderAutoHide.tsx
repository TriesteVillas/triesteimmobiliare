"use client";

import { useEffect } from "react";

// Hides the floating pill while scrolling down, reveals it on the first
// scroll-up (CSS on html[data-header-hidden], see globals.css). A small
// hysteresis avoids flapping on tiny scroll jitters.
export default function HeaderAutoHide() {
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - last;
        if (y < 120 || delta < -8) {
          document.documentElement.removeAttribute("data-header-hidden");
        } else if (delta > 8) {
          document.documentElement.setAttribute("data-header-hidden", "");
        }
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeAttribute("data-header-hidden");
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
