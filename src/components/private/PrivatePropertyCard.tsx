"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import ProtectedImage from "./ProtectedImage";
import VoteWidget from "./VoteWidget";
import type { PropertyView } from "@/lib/propertyView";

// Card for the logged-in Private Collection: in-card slider over cover + top 8
// (every frame watermarked via ProtectedImage), price, title, place. The
// freshness bubble ("Nuovo"/"N mesi") is computed server-side by the collection
// page — null renders nothing.
export default function PrivatePropertyCard({
  view,
  watermark,
  photosComing,
  freshLabel,
}: {
  view: PropertyView;
  watermark: string;
  photosComing: string;
  freshLabel?: string | null;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const photos = view.gallery.length
    ? view.gallery
    : view.cover
      ? [view.cover]
      : [];
  const n = photos.length;

  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setI((x) => (x + d + n) % n);
  };

  return (
    <div
      onClick={() => router.push(`/private/${view.slug}`)}
      role="link"
      aria-label={view.title}
      className="pc-card group block cursor-pointer overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {n > 0 ? (
          <ProtectedImage src={photos[i].url} alt={photos[i].alt} watermark={watermark} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#6d7c8a]">
            {photosComing}
          </div>
        )}

        {/* Bubble anzianità in collezione — top-left, sopra le foto. */}
        {freshLabel && (
          <span className="absolute left-3 top-3 z-[3] rounded-full border border-[#a9c8e0]/40 bg-black/55 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#a9c8e0] backdrop-blur-sm">
            {freshLabel}
          </span>
        )}

        {n > 1 && (
          <>
            <button
              type="button"
              aria-label="‹"
              onClick={(e) => go(e, -1)}
              className="absolute left-2 top-1/2 z-[3] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg leading-none text-[#dfe9f3] backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="›"
              onClick={(e) => go(e, 1)}
              className="absolute right-2 top-1/2 z-[3] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg leading-none text-[#dfe9f3] backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 z-[3] flex -translate-x-1/2 gap-1">
              {photos.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === i ? "bg-[#a9c8e0]" : "bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Feedback in overlay: il widget blocca la propagazione dei click,
            quindi votare NON naviga verso la pagina di dettaglio. */}
        <div className="absolute bottom-3 right-3 z-[3]">
          <VoteWidget slug={view.slug} variant="card" />
        </div>
      </div>
      <div className="p-5">
        <p className="text-lg font-semibold tracking-tight text-[#dfe9f3]">{view.priceLabel}</p>
        <h3 className="mt-1 line-clamp-1 text-sm text-[#c3d0dd]">{view.title}</h3>
        {view.place && <p className="mt-0.5 text-sm text-[#93a1ae]">{view.place}</p>}
      </div>
    </div>
  );
}
