import type { ImgHTMLAttributes } from "react";

// Una foto di un immobile, servita dal proxy /foto.
//
// Perché un <img> nudo e non next/image. Con `unoptimized: true` (obbligato:
// vedi next.config) next/image non ottimizza più nulla — resta solo il layout.
// In compenso accoda `?dpl=<id del deploy>` a ogni src locale, e il piano di
// cache di Vercel indicizza sulla url completa di query string: a ogni deploy
// TUTTE le foto diventano chiavi nuove e la cache si azzera. Misurato in
// produzione il 2026-07-30 sul gemello triestevillas.com, che il proxy ce
// l'aveva già: cache key nuova → MISS 1,01 s, stessa url subito dopo → HIT
// 0,085 s; e sulla pagina /immobili 39 copertine su 50 erano ancora MISS, da 1 a
// 2,75 s l'una. È esattamente il "devo ricaricare per vedere le foto": la
// seconda volta erano calde. Senza next/image l'URL non ha query, quindi resta
// valido attraverso i deploy e la cache dura sul serio (Cache-Control:
// immutable, un anno).
//
// `fill` di next/image è replicato dalle classi: il contenitore deve essere
// `relative`, e chi chiama decide object-cover / object-contain.

type Props = {
  src: string;
  alt: string;
  /** Ladder di larghezze (photoSrcSet). Da usare SOLO con `sizes`. */
  srcSet?: string;
  sizes?: string;
  /** object-cover / object-contain + eventuali transizioni. */
  className?: string;
  /**
   * Immagine LCP (hero, prime card della griglia): niente lazy, e la richiesta
   * scavalca la coda del browser. Su tutto il resto lasciare il default.
   */
  priority?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "className" | "alt">;

export default function PhotoImg({
  src,
  alt,
  srcSet,
  sizes,
  className = "object-cover",
  priority = false,
  ...rest
}: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- vedi il commento in testa: next/image aggiunge ?dpl e azzera la cache CDN a ogni deploy.
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      draggable={false}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={`absolute inset-0 h-full w-full [-webkit-user-drag:none] ${className}`}
      {...rest}
    />
  );
}
