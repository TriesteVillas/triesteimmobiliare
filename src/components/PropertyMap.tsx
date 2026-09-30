"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Brand tokens (mirrors globals.css --color-brand*). Leaflet vector options take
// plain color strings, so we keep the hexes here rather than reading CSS vars.
const BRAND = "#2c6b96";
const BRAND_LIGHT = "#6fa1c6";

type Props = {
  lat: number;
  lng: number;
  /** Privacy radius in metres — the circle hides the exact building. */
  radius?: number;
};

export default function PropertyMap({ lat, lng, radius = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    let ro: ResizeObserver | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      const el = containerRef.current;
      // Guard against StrictMode double-invoke / unmount during async import.
      if (cancelled || !el || (el as unknown as { _leaflet_id?: number })._leaflet_id) {
        return;
      }

      map = L.map(el, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      // CARTO dal 09/2026 vuole una API key e al posto delle tessere serve
      // «API KEY REQUIRED»: si usano le tessere di OpenStreetMap (niente chiave,
      // attribuzione obbligatoria), schiarite col filtro sul pane per restare
      // vicine allo stile «light» di prima.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const tilePane = map.getPane("tilePane");
      if (tilePane) tilePane.style.filter = "grayscale(0.85) brightness(1.04) contrast(0.92)";

      const circle = L.circle([lat, lng], {
        radius,
        color: BRAND,
        weight: 2,
        opacity: 0.7,
        fillColor: BRAND_LIGHT,
        fillOpacity: 0.18,
      }).addTo(map);

      // Small solid dot marking the exact centre of the area.
      L.circleMarker([lat, lng], {
        radius: 5,
        color: "#ffffff",
        weight: 2,
        fillColor: BRAND,
        fillOpacity: 1,
      }).addTo(map);

      map.fitBounds(circle.getBounds().pad(0.25));

      // Re-tile when the container is resized (responsive layout, orientation).
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(el);
    })();

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (map) map.remove();
    };
  }, [lat, lng, radius]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
    />
  );
}
