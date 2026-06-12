"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/properties";

export default function Lightbox({
  photos,
  start,
  onClose,
  closeLabel,
}: {
  photos: Photo[];
  start: number;
  onClose: () => void;
  closeLabel: string;
}) {
  const [i, setI] = useState(start);
  const step = useCallback(
    (d: number) => setI((x) => (x + d + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  return (
    <div
      className="lightbox-enter fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
      >
        ×
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="‹"
            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="›"
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
          >
            ›
          </button>
        </>
      )}
      <div
        className="relative h-[85vh] w-[92vw] max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={photos[i].url}
          src={photos[i].url}
          alt={photos[i].alt}
          fill
          sizes="92vw"
          className="lightbox-photo object-contain"
        />
      </div>
      <p className="absolute bottom-4 text-sm text-white/70">
        {i + 1} / {photos.length}
      </p>
    </div>
  );
}
