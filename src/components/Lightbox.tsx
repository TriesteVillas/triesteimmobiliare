"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Photo } from "@/lib/properties";
import { useFocusTrap } from "@/lib/useFocusTrap";

export default function Lightbox({
  photos,
  start,
  onClose,
  closeLabel,
  startInGrid = false,
  gridLabel,
}: {
  photos: Photo[];
  start: number;
  onClose: () => void;
  closeLabel: string;
  // "Vedi tutte le N foto" apre qui: una griglia di tutte le miniature, così
  // il visitatore SCEGLIE da dove partire invece di scrollare dalla foto 1.
  startInGrid?: boolean;
  gridLabel?: string;
}) {
  const t = useTranslations("ui");
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const [i, setI] = useState(start);
  const [grid, setGrid] = useState(startInGrid);
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

  if (grid) {
    return (
      <div
        ref={panelRef}
        tabIndex={-1}
        className="lightbox-enter fixed inset-0 z-50 overflow-y-auto bg-black/95 outline-none backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-black/80 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-sm text-white/70">
            {gridLabel ?? ""} {gridLabel ? "· " : ""}
            {photos.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
          >
            ×
          </button>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
          {photos.map((p, idx) => (
            <button
              key={p.url}
              type="button"
              onClick={() => {
                setI(idx);
                setGrid(false);
              }}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-900"
            >
              <Image
                src={p.thumb}
                alt={p.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading={idx < 12 ? undefined : "lazy"}
              />
              <span className="absolute bottom-1.5 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/85">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="lightbox-enter fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 outline-none backdrop-blur-sm"
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setGrid(true);
        }}
        aria-label={gridLabel ?? "Grid"}
        title={gridLabel}
        className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label={t("prev")}
            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label={t("next")}
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
          >
            <span aria-hidden>›</span>
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
