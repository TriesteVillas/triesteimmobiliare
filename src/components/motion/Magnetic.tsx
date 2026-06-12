"use client";

import { useRef, type ReactNode } from "react";

// Magnetic hover: the child drifts toward the cursor and springs back on
// leave. Wraps inline-flex so it can hug buttons/links. Mouse-only.
export default function Magnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = "transform 120ms ease-out";
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = "translate(0, 0)";
  };

  return (
    <div
      ref={ref}
      className={`inline-flex ${className ?? ""}`}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}
