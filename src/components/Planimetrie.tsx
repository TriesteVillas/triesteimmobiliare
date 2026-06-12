"use client";

import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/properties";
import Lightbox from "./Lightbox";

export default function Planimetrie({
  items,
  title,
  closeLabel,
}: {
  items: Photo[];
  title: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <section id="planimetrie" className="mt-8 scroll-mt-32">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((p, i) => (
          <button
            key={p.url}
            type="button"
            onClick={() => setOpen(i)}
            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <Image
              src={p.url}
              alt={p.alt}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-contain p-2"
            />
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox
          photos={items}
          start={open}
          onClose={() => setOpen(null)}
          closeLabel={closeLabel}
        />
      )}
    </section>
  );
}
