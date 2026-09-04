import { Link } from "@/i18n/navigation";
import type { PropertyView } from "@/lib/propertyView";
import PropertyBadge from "./PropertyBadge";
import CardGallery from "./CardGallery";
import Tilt from "./motion/Tilt";
import FavHeart from "./account/FavHeart";

// Quanto è larga una card, per il browser che deve scegliere dal srcSet.
//
// Il default vale per la griglia — `sm:grid-cols-2 lg:grid-cols-3` dentro un
// contenitore max-w-6xl: da 1024 px in su la colonna si ferma a ~355 px, quindi
// oltre quella soglia si dichiara una misura FISSA e non una `vw`. È la
// differenza fra chiedere 400 e chiedere 800 su un desktop: quattro volte i
// pixel per la stessa identica card.
//
// Chi ha un'impaginazione diversa (il carosello della home) passa la sua.
const GRID_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px";

export default function PropertyCard({
  view,
  photosComing,
  priority = false,
  sizes = GRID_SIZES,
}: {
  view: PropertyView;
  photosComing: string;
  // Prime card visibili senza scorrere: la copertina è il candidato LCP della
  // pagina, quindi non va rimandata al primo scroll.
  priority?: boolean;
  /** Larghezza resa della card, se l'impaginazione non è la griglia standard. */
  sizes?: string;
}) {
  const leftBadge = view.recentBadge ?? view.badge;
  const rightBadge = view.clusterBadge ?? view.featuredBadge;
  // `gallery` è copertina + top 8; `cover` da solo è la rete di sicurezza per
  // un record che avesse la copertina e nient'altro (stessa guardia della card
  // della Private Collection).
  const photos = view.gallery.length ? view.gallery : view.cover ? [view.cover] : [];

  return (
    <Tilt className="rounded-2xl">
      <Link
        href={`/annuncio/${view.slug}`}
        transitionTypes={["nav-forward"]}
        className="card-cine group block"
        data-slug={view.slug}
      >
        {/* Le foto si sfogliano nella card, senza aprire la scheda: la
            galleria era già costruita in propertyView e la rendeva solo la
            Private Collection. Vedi CardGallery. */}
        <CardGallery
          photos={photos}
          slug={view.slug}
          alt={view.title}
          sizes={sizes}
          priority={priority}
          photosComing={photosComing}
        >
          <span className="card-sheen" aria-hidden />
          <PropertyBadge {...leftBadge} className="absolute left-3 top-3 z-[2] shadow-sm" />
          {rightBadge && (
            <PropertyBadge
              {...rightBadge}
              className="absolute right-3 top-3 z-[2] shadow-sm"
            />
          )}
          {/* Cuore preferiti: la card è tutta un <Link>, il componente fa
              preventDefault/stopPropagation su ogni click al suo interno. */}
          <FavHeart slug={view.slug} variant="card" />
        </CardGallery>
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
