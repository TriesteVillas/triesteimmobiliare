"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Featured listings carousel: the page scrolls normally; the cards move
// sideways by swipe (touch) or with the side arrows (desktop).
export default function FeaturedCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = () => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow =
    "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full pill-header text-2xl text-brand-dark transition-all duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="relative">
      <div
        ref={track}
        className="reel-scroll flex gap-[4vw] overflow-x-auto px-[6vw] py-6"
      >
        {children}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-2 right-2 hidden items-center justify-between sm:flex">
        <button type="button" onClick={() => step(-1)} disabled={!canPrev} aria-label="‹" className={arrow}>
          ‹
        </button>
        <button type="button" onClick={() => step(1)} disabled={!canNext} aria-label="›" className={arrow}>
          ›
        </button>
      </div>
    </div>
  );
}
