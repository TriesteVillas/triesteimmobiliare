"use client";

import { useRef } from "react";

// Tour Matterport con pulsante "Schermo intero" nostro. Il fullscreen nativo
// dell'embed non è affidabile né facile da trovare, quindi diamo un controllo
// esplicito che usa la Fullscreen API sull'iframe (l'attributo allow="fullscreen"
// è già presente e nessun header Permissions-Policy lo blocca). Su iOS Safari,
// dove requestFullscreen sull'iframe non esiste, si ripiega sull'apertura del
// tour in una nuova scheda.
export default function TourFrame({
  src,
  title,
  fsLabel,
}: {
  src: string;
  title: string;
  fsLabel: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);

  const goFullscreen = () => {
    const el = ref.current as
      | (HTMLIFrameElement & {
          webkitRequestFullscreen?: () => Promise<void> | void;
        })
      | null;
    if (!el) return;
    const req =
      el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
    if (req) {
      try {
        void req();
        return;
      } catch {
        /* fall through to new-tab fallback */
      }
    }
    window.open(src, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-neutral-100">
      <iframe
        ref={ref}
        src={src}
        title={title}
        allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
      />
      <button
        type="button"
        onClick={goFullscreen}
        aria-label={fsLabel}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
    </div>
  );
}
