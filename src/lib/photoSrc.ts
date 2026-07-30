// Da dove un componente prende l'URL di una foto.
//
// Sempre da qui, mai da `photo.url` / `photo.thumb` diretti: quelle sono url
// Airtable firmate — ruotano, scadono, e pesano quanto il file caricato (fino a
// 12 MB per un PNG). `photoSrc` le manda invece al proxy /foto, che ricodifica in
// WebP alla larghezza chiesta dietro un URL stabile e cacheabile per sempre.
// Vedi src/app/foto/[att]/[spec]/route.ts per il perché completo.
import type { Photo } from "@/lib/properties";

// Le stesse larghezze dell'allowlist della rotta: chiederne un'altra darebbe 400.
export const PHOTO_WIDTHS = [400, 600, 800, 1200, 1600, 2000] as const;
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number];

/**
 * URL servibile per una foto alla larghezza data.
 *
 * Se l'attachment non ha un id (Airtable non l'ha restituito) si ricade sulla url
 * firmata: meno efficiente, ma la foto si vede. Il fallback è deliberato — una
 * scheda senza immagini sarebbe un danno peggiore di una immagine pesante.
 */
export function photoSrc(photo: Photo, width: PhotoWidth): string {
  if (!photo.id) return width > 900 ? photo.url : photo.thumb;
  return `/foto/${photo.id}/${width}.webp`;
}

/**
 * srcSet per un'immagine che cambia dimensione col viewport. Da usare insieme a
 * `sizes`, altrimenti il browser assume 100vw e scarica più del necessario.
 */
export function photoSrcSet(photo: Photo, widths: readonly PhotoWidth[]): string | undefined {
  if (!photo.id) return undefined;
  return widths.map((w) => `${photoSrc(photo, w)} ${w}w`).join(", ");
}
