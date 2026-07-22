import { ViewTransition } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PropertyView } from "@/lib/propertyView";
import PropertyBadge from "./PropertyBadge";
import Tilt from "./motion/Tilt";
import FavHeart from "./account/FavHeart";

export default function PropertyCard({
  view,
  photosComing,
}: {
  view: PropertyView;
  photosComing: string;
}) {
  return (
    <Tilt className="rounded-2xl">
      <Link
        href={`/annuncio/${view.slug}`}
        transitionTypes={["nav-forward"]}
        className="card-cine group block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
          {view.cover ? (
            <ViewTransition name={`prop-${view.slug}`} share="morph">
              <Image
                src={view.cover.url}
                alt={view.cover.alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="card-photo object-cover"
              />
            </ViewTransition>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-paper to-neutral-200 text-sm text-neutral-400">
              {photosComing}
            </div>
          )}
          <span className="card-sheen" aria-hidden />
          <PropertyBadge {...view.badge} className="absolute left-3 top-3 z-[2] shadow-sm" />
          {view.clusterBadge && (
            <PropertyBadge
              {...view.clusterBadge}
              className="absolute right-3 top-3 z-[2] shadow-sm"
            />
          )}
          {/* Cuore preferiti: la card è tutta un <Link>, il componente fa
              preventDefault/stopPropagation su ogni click al suo interno. */}
          <FavHeart slug={view.slug} variant="card" />
        </div>
        <div className="space-y-1 p-5">
          <p className="text-xl font-semibold tracking-tight text-brand-dark">
            {view.priceLabel}
          </p>
          <h3 className="line-clamp-1 text-sm font-medium text-neutral-800 transition-colors duration-300 group-hover:text-brand">
            {view.title}
          </h3>
          {view.place && <p className="text-sm text-neutral-500">{view.place}</p>}
          {view.meta && <p className="pt-1 text-xs text-neutral-400">{view.meta}</p>}
        </div>
      </Link>
    </Tilt>
  );
}
