"use client";

import { useState, ViewTransition } from "react";
import { photoSrc, photoSrcSet } from "@/lib/photoSrc";
import PhotoImg from "./PhotoImg";
import type { Photo } from "@/lib/properties";
import Lightbox from "./Lightbox";

// Ladder delle miniature. Serve soprattutto al telefono: il riquadro è 50vw,
// cioè ~195 px CSS su un 390, che a DPR 2 fa 390 px reali — chiedere 600 fissi
// voleva dire scaricare metà in più su otto miniature.
const THUMB_WIDTHS = [400, 600, 800] as const;
// L'immagine grande della galleria è larga quanto lo schermo fino a 1024 px:
// senza ladder un telefono si portava a casa la versione più larga.
const HERO_WIDTHS = [600, 800, 1200, 1600] as const;

export default function PhotoGallery({
  cover,
  topPhotos,
  allPhotos,
  labels,
  morphName,
  compact = false,
}: {
  cover: Photo | null;
  topPhotos: Photo[];
  allPhotos: Photo[];
  labels: { viewAll: string; close: string; photosComing: string; grid?: string };
  // Shared-element identity with the listing card cover (PropertyCard).
  morphName?: string;
  // The 4.0 listing page shows the cover in its cinematic hero, so the
  // gallery skips the big lead image and renders thumbnails only.
  compact?: boolean;
}) {
  // idx = foto di partenza; grid = apri sulla griglia di tutte le miniature
  // ("vedi tutte le N foto" deve far SCEGLIERE da dove partire, non imporre
  // lo scroll dalla foto 1).
  const [open, setOpen] = useState<{ idx: number; grid: boolean } | null>(null);
  const hero = cover ?? allPhotos[0] ?? null;
  const thumbs = topPhotos.length ? topPhotos : allPhotos;
  const fullSet = allPhotos.length ? allPhotos : hero ? [hero] : [];

  const openAt = (photo: Photo) => {
    const i = fullSet.findIndex((x) => x.url === photo.url);
    setOpen({ idx: i >= 0 ? i : 0, grid: false });
  };

  if (compact) {
    return (
      <section id="foto" className="scroll-mt-32">
        {thumbs.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {thumbs.slice(0, 8).map((p) => (
              <button
                key={p.url}
                type="button"
                onClick={() => openAt(p)}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
              >
                <PhotoImg
                  src={photoSrc(p, 600)}
                  srcSet={photoSrcSet(p, THUMB_WIDTHS)}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  alt={p.alt}
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
        {fullSet.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen({ idx: 0, grid: true })}
            className="btn-press mt-3 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-brand hover:text-brand"
          >
            {labels.viewAll}
          </button>
        )}
        {open !== null && fullSet.length > 0 && (
          <Lightbox
            photos={fullSet}
            start={open.idx}
            startInGrid={open.grid}
            gridLabel={labels.grid}
            onClose={() => setOpen(null)}
            closeLabel={labels.close}
          />
        )}
      </section>
    );
  }

  return (
    <section id="foto" className="scroll-mt-32">
      {hero ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen({ idx: 0, grid: false })}
            className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-neutral-100"
          >
            <ViewTransition name={morphName} share="morph">
              <PhotoImg
                src={photoSrc(hero, 1600)}
                srcSet={photoSrcSet(hero, HERO_WIDTHS)}
                sizes="(max-width: 1024px) 100vw, 1024px"
                alt={hero.alt}
                className="object-cover transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.03]"
                priority
              />
            </ViewTransition>
          </button>
          {thumbs.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {thumbs.slice(0, 8).map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => openAt(p)}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
                >
                  <PhotoImg
                    src={photoSrc(p, 600)}
                    srcSet={photoSrcSet(p, THUMB_WIDTHS)}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    alt={p.alt}
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
          {fullSet.length > 1 && (
            <button
              type="button"
              onClick={() => setOpen({ idx: 0, grid: true })}
              className="mt-3 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-brand hover:text-brand"
            >
              {labels.viewAll}
            </button>
          )}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-400">
          {labels.photosComing}
        </div>
      )}

      {open !== null && fullSet.length > 0 && (
        <Lightbox
          photos={fullSet}
          start={open.idx}
          startInGrid={open.grid}
          gridLabel={labels.grid}
          onClose={() => setOpen(null)}
          closeLabel={labels.close}
        />
      )}
    </section>
  );
}
