"use client";

import { useRef, useSyncExternalStore } from "react";
import EtichettaVideo from "./EtichettaVideo";
import type { VideoAi } from "@/lib/trasparenza-video";

// Un video YouTube di una scheda CON l'etichetta del registro (SPEC v1.2
// §10.1). L'etichetta sta sopra l'iframe in alto a destra, dalla miniatura
// alla fine, e non blocca i controlli (`passante`).
//
// Il punto delicato è lo schermo intero: quello di YouTube porta a tutto
// schermo il solo iframe, e l'etichetta — che è fuori dall'iframe — sparisce
// proprio mentre il video si guarda meglio. Per questo, SOLO sui video
// etichettati, l'iframe non ha il permesso di andare a schermo intero né in
// picture-in-picture (dove l'etichetta sparirebbe uguale), e lo schermo
// intero lo dà un nostro bottone sul RIQUADRO, iframe ed etichetta insieme.
// Dove la Fullscreen API non c'è (Safari su iPhone) il bottone non compare,
// e `playsinline=1` tiene il video nella pagina invece di aprirlo nel lettore
// di sistema, senza etichetta. I video senza etichetta restano come prima
// (pagina della scheda).
type ElementoFs = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type DocumentoFs = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

const nessunaIscrizione = () => () => {};
const fsDisponibile = () => {
  const d = document as DocumentoFs;
  return Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled);
};

export default function VideoYoutube({
  id,
  title,
  ai,
  fsLabel,
}: {
  id: string;
  title: string;
  ai: VideoAi;
  fsLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const puoFs = useSyncExternalStore(nessunaIscrizione, fsDisponibile, () => false);

  const schermoIntero = () => {
    const d = document as DocumentoFs;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      void (d.exitFullscreen?.() ?? d.webkitExitFullscreen?.());
      return;
    }
    const el = ref.current as ElementoFs | null;
    const req = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    if (req) void Promise.resolve(req()).catch(() => undefined);
  };

  return (
    <figure>
      <div
        ref={ref}
        className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900 [&:fullscreen]:rounded-none"
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
        />
        <EtichettaVideo ai={ai} passante />
      </div>
      {(ai.didascalia || puoFs) && (
        <figcaption className="mt-2 flex items-start justify-between gap-4 text-xs leading-snug text-neutral-500">
          <span>{ai.didascalia}</span>
          {puoFs && (
            <button
              type="button"
              onClick={schermoIntero}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 transition hover:border-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              {fsLabel}
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}
