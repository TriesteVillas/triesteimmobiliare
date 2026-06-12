"use client";

import { useEffect, useRef, useState } from "react";

type Item = { year: string; title: string; text: string };

export default function Timeline({ items }: { items: Item[] }) {
  const containerRef = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState<boolean[]>(() => items.map(() => false));
  const [lineProgress, setLineProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const liEls = Array.from(container.querySelectorAll("li"));

    const io = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = [...prev];
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const i = liEls.indexOf(e.target as HTMLLIElement);
            if (i >= 0) next[i] = true;
          }
          return next;
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.25 },
    );
    liEls.forEach((el) => io.observe(el));

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const start = window.innerHeight * 0.85;
      const end = window.innerHeight * 0.2;
      const total = rect.height + (start - end);
      const passed = start - rect.top;
      setLineProgress(total > 0 ? Math.min(Math.max(passed / total, 0), 1) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items.length]);

  return (
    <ol ref={containerRef} className="relative mt-10 space-y-10 pl-6">
      <span
        className="absolute bottom-1 left-0 top-1 w-px bg-neutral-200"
        aria-hidden
      />
      <span
        className="absolute left-0 top-1 w-px origin-top bg-brand-light transition-[height] duration-150 ease-out"
        style={{ height: `calc((100% - 0.5rem) * ${lineProgress})` }}
        aria-hidden
      />
      {items.map((s, i) => (
        <li
          key={s.year}
          className="relative transition-all duration-700 ease-out"
          style={{
            opacity: visible[i] ? 1 : 0,
            transform: visible[i] ? "none" : "translateY(20px)",
          }}
        >
          <span
            className="absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white transition-colors duration-500"
            style={{ backgroundColor: visible[i] ? "var(--color-brand-light)" : "#d4d4d4" }}
          />
          <p className="text-sm font-semibold text-brand">{s.year}</p>
          <h3 className="mt-1 font-semibold text-neutral-900">{s.title}</h3>
          <p className="mt-1 text-neutral-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
