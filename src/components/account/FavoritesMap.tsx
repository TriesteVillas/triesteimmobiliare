"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// La mappa personale dell'area riservata: SOLO i preferiti dell'utente, con
// pin a forma di cuore. Stesso stack della mappa pubblica (/immobili/mappa):
// Leaflet import dinamico, tile CARTO light. La vista si adatta ai cuori.
export type FavPoint = {
  slug: string;
  title: string;
  priceLabel: string;
  cover: string | null;
  url: string;
  lat: number;
  lng: number;
};

const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))"><path fill="#e11d48" stroke="#ffffff" stroke-width="1.6" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

export default function FavoritesMap({ points, discoverLabel }: { points: FavPoint[]; discoverLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      const el = containerRef.current;
      if (cancelled || !el || (el as unknown as { _leaflet_id?: number })._leaflet_id) return;

      const map = L.map(el, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      const icon = L.divIcon({
        html: HEART_SVG,
        className: "fav-heart-pin",
        iconSize: [30, 30],
        iconAnchor: [15, 27],
        popupAnchor: [0, -22],
      });

      const latlngs: [number, number][] = [];
      for (const p of points) {
        latlngs.push([p.lat, p.lng]);
        const img = p.cover
          ? `<img src="${p.cover}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px" loading="lazy" />`
          : "";
        const html = `<a href="${p.url}" style="display:block;text-decoration:none;color:#1a1a1a;width:180px">
          ${img}
          <div style="font-weight:600;font-size:14px">${p.priceLabel}</div>
          <div style="font-size:12px;color:#444;line-height:1.3;margin-top:2px">${p.title}</div>
          <div style="font-size:11px;font-weight:600;color:#2c6b96;margin-top:6px">${discoverLabel} →</div>
        </a>`;
        L.marker([p.lat, p.lng], { icon }).bindPopup(html).addTo(map);
      }
      if (latlngs.length) {
        map.fitBounds(L.latLngBounds(latlngs).pad(0.25), { maxZoom: 15 });
      } else {
        map.setView([45.65, 13.78], 12);
      }
      mapRef.current = map;
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(el);
    })();
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // I punti arrivano dal server-render: la mappa si monta una volta sola.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[52vh] min-h-[320px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
    />
  );
}
