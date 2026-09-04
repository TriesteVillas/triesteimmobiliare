"use client";

import { useState, ViewTransition } from "react";
import { useTranslations } from "next-intl";
import PhotoImg from "./PhotoImg";

// Sfogliare le foto SENZA aprire la scheda: copertina + fino a 8 foto, frecce
// e pallini, dentro la card.
//
// Il dato c'era già da sempre — `propertyView.ts` costruisce `gallery` col
// commento «for the card slider» — ma sul sito pubblico veniva resa solo la
// copertina: il travaso da triestevillas.com (che ha lo stesso componente) si
// era fermato a metà, e nello stesso repo la Private Collection lo slider ce
// l'aveva già (`private/PrivatePropertyCard.tsx`). Qui il pezzo mancante torna
// al suo posto (Martino, 04/09/2026).
//
// La card è tutta un <Link>: le frecce sono bottoni al suo interno e fermano il
// click (preventDefault + stopPropagation), come fa da sempre il cuoricino dei
// preferiti. Le etichette arrivano da next-intl e non per props: il componente
// è già client, e così la firma di PropertyCard non cambia in cinque punti di
// chiamata.
export default function CardGallery({
  photos,
  slug,
  alt,
  sizes,
  priority = false,
  photosComing,
  children,
}: {
  photos: { url: string; srcSet?: string; alt: string }[];
  /** Serve solo alla transizione morbida verso la scheda. */
  slug: string;
  /** Nome accessibile di riserva: il titolo dell'immobile, già localizzato. */
  alt: string;
  /** Larghezza resa della card, per la scelta dal srcSet. */
  sizes?: string;
  priority?: boolean;
  photosComing: string;
  /** Sovrapposizioni: velo, badge, cuoricino. */
  children?: React.ReactNode;
}) {
  const t = useTranslations("property");
  const [i, setI] = useState(0);
  const n = photos.length;

  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setI((x) => (x + d + n) % n);
  };

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-paper">
      {n > 0 ? (
        <ViewTransition name={`prop-${slug}`} share="morph">
          <PhotoImg
            src={photos[i].url}
            // `sizes` senza `srcSet` non serve a niente, e sui record PRIVATE
            // il srcSet non c'è (url firmata, una sola larghezza).
            srcSet={photos[i].srcSet}
            sizes={photos[i].srcSet ? sizes : undefined}
            alt={photos[i].alt || alt}
            // Solo la copertina può essere l'LCP della pagina: le foto che si
            // aprono dopo un click non hanno nessuna fretta.
            priority={priority && i === 0}
            className="card-photo object-cover"
          />
        </ViewTransition>
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-paper to-neutral-200 text-sm text-neutral-400">
          {photosComing}
        </div>
      )}

      {children}

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label={t("photoPrev")}
            onClick={(e) => go(e, -1)}
            className="absolute left-2 top-1/2 z-[3] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg leading-none text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={t("photoNext")}
            onClick={(e) => go(e, 1)}
            className="absolute right-2 top-1/2 z-[3] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg leading-none text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            ›
          </button>
          <div
            className="absolute bottom-2 left-1/2 z-[3] flex -translate-x-1/2 gap-1"
            aria-hidden
          >
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  idx === i ? "bg-white" : "bg-white/45"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
