"use client";

import { useEffect, useRef } from "react";
import Logo from "./Logo";

export default function HeroVideo() {
  const logoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.style.opacity = "1";
      return;
    }
    // Left-to-right wipe + fade + blur-to-sharp lift (Web Animations API —
    // self-contained, avoids the build stripping custom @keyframes).
    let anim: Animation | undefined;
    try {
      anim = el.animate(
        [
          {
            opacity: 0,
            transform: "translateY(26px) scale(0.94)",
            clipPath: "inset(0 100% 0 0)",
            filter: "blur(8px)",
          },
          { filter: "blur(0)", offset: 0.55 },
          {
            opacity: 1,
            transform: "translateY(0) scale(1)",
            clipPath: "inset(0 0 0 0)",
            filter: "blur(0)",
          },
        ],
        { duration: 1500, easing: "cubic-bezier(0.16, 0.8, 0.24, 1)", fill: "both" },
      );
    } catch {
      // No Web Animations support — show the logo rather than leaving it hidden.
      el.style.opacity = "1";
    }
    return () => anim?.cancel();
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-brand-dark">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-brand-dark/40 to-brand-dark/80" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <h1
          ref={logoRef}
          className="[filter:drop-shadow(0_6px_28px_rgba(0,0,0,0.5))]"
          style={{ opacity: 0 }}
        >
          <Logo
            tone="light"
            markClassName="h-14 w-auto sm:h-20"
            wordClassName="text-3xl sm:text-5xl"
          />
        </h1>
      </div>
      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <span className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/60 p-1.5">
          <span className="h-2 w-1 animate-bounce rounded-full bg-white/80" />
        </span>
      </div>
    </section>
  );
}
