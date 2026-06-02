import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PropertyView } from "@/lib/propertyView";

export default function PropertyCard({
  view,
  photosComing,
}: {
  view: PropertyView;
  photosComing: string;
}) {
  return (
    <Link
      href={`/annuncio/${view.slug}`}
      className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {view.cover ? (
          <Image
            src={view.cover.url}
            alt={view.cover.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-sm text-neutral-400">
            {photosComing}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700">
          {view.badge}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <p className="text-lg font-semibold text-neutral-900">{view.priceLabel}</p>
        <h3 className="line-clamp-1 text-sm font-medium text-neutral-800">
          {view.title}
        </h3>
        {view.place && <p className="text-sm text-neutral-500">{view.place}</p>}
        {view.meta && <p className="pt-1 text-xs text-neutral-500">{view.meta}</p>}
      </div>
    </Link>
  );
}
