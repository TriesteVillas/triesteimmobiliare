"use client";

import { useRef, type ReactNode } from "react";

// 3D tilt-on-hover with a tracking glare. Sets CSS vars consumed by
// .tilt-card / .tilt-glare in globals.css. Pointer-only (no effect on
// touch) and inert under prefers-reduced-motion.
export default function Tilt({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  // Max rotation in degrees.
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "50%");
    el.style.setProperty("--go", "0");
  };

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * max).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--go", "1");
  };

  return (
    <div
      ref={ref}
      className={`tilt-card ${className ?? ""}`}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      {children}
      <span className="tilt-glare" aria-hidden />
    </div>
  );
}
