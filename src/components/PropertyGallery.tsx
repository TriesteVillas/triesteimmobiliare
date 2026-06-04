"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/properties";
import type { Badge } from "@/lib/propertyView";
import PropertyBadge from "./PropertyBadge";

type Labels = {
  photos: string;
  plans: string;
  video: string;
  tour: string;
  viewAll: string; // already interpolated with the count
  close: string;
  photosComing: string;
};

type Props = {
  title: string;
  reference: string;
  place: string;
  badge: Badge;
  clusterBadge: Badge | null;
  cover: Photo | null;
  topPhotos: Photo[];
  allPhotos: Photo[];
  planimetrie: Photo[];
  videos: string[];
  matterportUrl: string | null;
  labels: Labels;
};

type TabKey = "foto" | "planimetrie" | "video" | "tour";

// Extract an 11-char YouTube id from the common URL shapes.
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export default function PropertyGallery({
  title,
  reference,
  place,
  badge,
  clusterBadge,
  cover,
  topPhotos,
  allPhotos,
  planimetrie,
  videos,
  matterportUrl,
  labels,
}: Props) {
  const hero = cover ?? allPhotos[0] ?? null;
  const thumbs = topPhotos.length ? topPhotos : allPhotos;
  // Full set the lightbox pages through (fall back to the cover alone).
  const fullSet = allPhotos.length ? allPhotos : hero ? [hero] : [];
  const ytIds = videos.map(youtubeId).filter((x): x is string => Boolean(x));

  const tabs: { key: TabKey; label: string }[] = [];
  if (hero || fullSet.length) tabs.push({ key: "foto", label: labels.photos });
  if (planimetrie.length) tabs.push({ key: "planimetrie", label: labels.plans });
  if (ytIds.length) tabs.push({ key: "video", label: labels.video });
  if (matterportUrl) tabs.push({ key: "tour", label: labels.tour });

  const [active, setActive] = useState<TabKey>(tabs[0]?.key ?? "foto");
  // Lightbox state: which photo set + current index, or null when closed.
  const [box, setBox] = useState<{ photos: Photo[]; i: number } | null>(null);

  const close = useCallback(() => setBox(null), []);
  const step = useCallback(
    (d: number) =>
      setBox((b) =>
        b ? { ...b, i: (b.i + d + b.photos.length) % b.photos.length } : b,
      ),
    [],
  );

  useEffect(() => {
    if (!box) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [box, close, step]);

  return (
    <section>
      {/* Title + reference always at the top of the gallery. */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <PropertyBadge {...badge} />
          {clusterBadge && <PropertyBadge {...clusterBadge} />}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {reference}
          {place ? ` · ${place}` : ""}
        </p>
      </div>

      {tabs.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active === tab.key
                  ? "bg-brand text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {active === "foto" &&
        (hero ? (
          <div>
            <button
              type="button"
              onClick={() => setBox({ photos: fullSet, i: 0 })}
              className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-neutral-100"
            >
              <Image
                src={hero.url}
                alt={hero.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority
              />
            </button>
            {thumbs.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {thumbs.slice(0, 8).map((p, idx) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => {
                      const i = fullSet.findIndex((x) => x.url === p.url);
                      setBox({ photos: fullSet, i: i >= 0 ? i : 0 });
                    }}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
                  >
                    <Image
                      src={p.url}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            )}
            {fullSet.length > 1 && (
              <button
                type="button"
                onClick={() => setBox({ photos: fullSet, i: 0 })}
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
        ))}

      {active === "planimetrie" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {planimetrie.map((p, idx) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setBox({ photos: planimetrie, i: idx })}
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
      )}

      {active === "video" && (
        <div className="space-y-4">
          {ytIds.map((id) => (
            <div
              key={id}
              className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900"
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          ))}
        </div>
      )}

      {active === "tour" && matterportUrl && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
          <iframe
            src={matterportUrl}
            title={labels.tour}
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      )}

      {box && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ×
          </button>
          {box.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="‹"
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
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
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
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
              src={box.photos[box.i].url}
              alt={box.photos[box.i].alt}
              fill
              sizes="92vw"
              className="object-contain"
            />
          </div>
          <p className="absolute bottom-4 text-sm text-white/70">
            {box.i + 1} / {box.photos.length}
          </p>
        </div>
      )}
    </section>
  );
}
