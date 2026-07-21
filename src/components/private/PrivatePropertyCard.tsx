"use client";

import { Link } from "@/i18n/navigation";
import ProtectedImage from "./ProtectedImage";
import VoteWidget from "./VoteWidget";
import type { PropertyView } from "@/lib/propertyView";

// Minimal card for the logged-in Private Collection: protected cover, price,
// title, place. Links to the gated detail page.
export default function PrivatePropertyCard({
  view,
  watermark,
  photosComing,
}: {
  view: PropertyView;
  watermark: string;
  photosComing: string;
}) {
  return (
    <Link href={`/private/${view.slug}`} className="pc-card group block overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {view.cover ? (
          <ProtectedImage src={view.cover.url} alt={view.cover.alt} watermark={watermark} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#6d7c8a]">
            {photosComing}
          </div>
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
    </Link>
  );
}
