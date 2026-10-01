"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

export default function StickyNav({
  title,
  reference,
  items,
}: {
  title: string;
  reference: string;
  items: Item[];
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  // Sul telefono, con le voci lunghe (lo sloveno, la voce «AI nelle foto»), la
  // barra trabocca e la voce attiva finiva tagliata a metà parola. Quando
  // trabocca: la voce attiva si porta in vista e il bordo destro sfuma, così
  // si capisce che c'è dell'altro. Quando non trabocca non cambia niente (lo
  // stato parte da false: l'HTML del server è quello di prima).
  const navRef = useRef<HTMLElement>(null);
  const [trabocca, setTrabocca] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    // «Trabocca» = c'è ancora qualcosa a destra: arrivati in fondo la
    // sfumatura sparisce, o coprirebbe l'ultima voce.
    const misura = () => setTrabocca(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 1);
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(nav);
    nav.addEventListener("scroll", misura, { passive: true });
    return () => {
      ro.disconnect();
      nav.removeEventListener("scroll", misura);
    };
  }, [items]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth + 1) return;
    const el = nav.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
    if (el) nav.scrollTo({ left: Math.max(0, el.offsetLeft - nav.offsetLeft - 16), behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Active band sits just under the header + this bar (~120px from top).
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 rounded-b-2xl border-b border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="hidden min-w-0 flex-1 md:block">
          <p className="truncate text-sm font-semibold text-neutral-800">{title}</p>
          <p className="truncate text-xs text-neutral-400">{reference}</p>
        </div>
        <nav
          ref={navRef}
          className={`flex flex-1 gap-1 overflow-x-auto md:flex-none${
            trabocca ? " [mask-image:linear-gradient(to_right,black_88%,transparent)]" : ""
          }`}
        >
          {items.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              onClick={() => setActive(i.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active === i.id
                  ? "bg-brand text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {i.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
