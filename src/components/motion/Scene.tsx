"use client";

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

// One shared scroll engine for every cinematic scene on the page.
// Each <Scene> exposes its scroll progress as the CSS custom property
// --p (0 → 1), which the stylesheet turns into transforms via calc().
// A single passive scroll listener + rAF drives all scenes; respects
// prefers-reduced-motion by pinning --p to 1 (resting state).

type SceneEntry = {
  el: HTMLElement;
  mode: "cover" | "pin";
  smooth: number;
  current: number;
};

const scenes = new Set<SceneEntry>();
let rafId = 0;
let listening = false;
let reduced = false;

function measure(entry: SceneEntry): number {
  const rect = entry.el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (entry.mode === "pin") {
    // Progress through a tall section with a sticky child: 0 when the
    // section top hits the viewport top, 1 when its bottom leaves.
    const scrollable = rect.height - vh;
    if (scrollable <= 0) return rect.top <= 0 ? 1 : 0;
    return Math.min(Math.max(-rect.top / scrollable, 0), 1);
  }
  // "cover": 0 when the element's top enters from the bottom edge,
  // 1 when its bottom reaches the top edge.
  const total = rect.height + vh;
  return Math.min(Math.max((vh - rect.top) / total, 0), 1);
}

function tick() {
  rafId = 0;
  let settled = true;
  for (const s of scenes) {
    const target = reduced ? 1 : measure(s);
    const next =
      s.smooth > 0 ? s.current + (target - s.current) * s.smooth : target;
    if (Math.abs(next - s.current) > 0.0005) settled = false;
    s.current = Math.abs(target - next) < 0.0005 ? target : next;
    s.el.style.setProperty("--p", s.current.toFixed(4));
  }
  if (!settled && !rafId) rafId = requestAnimationFrame(tick);
}

function onScroll() {
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function attach(entry: SceneEntry) {
  scenes.add(entry);
  if (!listening) {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    listening = true;
  }
  onScroll();
}

function detach(entry: SceneEntry) {
  scenes.delete(entry);
}

export default function Scene({
  children,
  className,
  style,
  mode = "cover",
  smooth = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  // "cover" tracks the element across the viewport; "pin" tracks a tall
  // section that contains a sticky child (scrollytelling).
  mode?: "cover" | "pin";
  // 0 = follow the scroll exactly; 0.1–0.2 = ease toward it (lerp).
  smooth?: number;
  as?: "div" | "section" | "header";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const entry: SceneEntry = { el, mode, smooth, current: 0 };
    attach(entry);
    return () => detach(entry);
  }, [mode, smooth]);

  return createElement(
    as,
    { ref, className, style: { "--p": 0, ...style } as CSSProperties },
    children,
  );
}
