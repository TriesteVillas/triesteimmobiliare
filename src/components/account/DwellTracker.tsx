"use client";

import { useEffect } from "react";
import { getSnapshot, subscribe } from "./favstore";

// Tracciamento della scheda immobile per utenti LOGGATI: una "view" al mount e
// il tempo VISIBILE (Page Visibility API) spedito via sendBeacon quando la
// pagina passa in background o si chiude — mai su unload/beforeunload, che sul
// mobile non arrivano. Gli anonimi non generano nemmeno la richiesta.
export default function DwellTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let visibleSince: number | null = document.visibilityState === "visible" ? performance.now() : null;
    let accumulated = 0;
    let viewSent = false;
    let disposed = false;

    const isAuthed = () => getSnapshot().ready && getSnapshot().authed;

    const sendView = () => {
      if (viewSent || !isAuthed()) return;
      viewSent = true;
      fetch("/api/account/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => {});
    };

    // Lo stato auth arriva async dal favstore: la view parte appena lo sappiamo.
    const unsub = subscribe(() => {
      if (getSnapshot().ready && getSnapshot().authed) sendView();
    });
    if (isAuthed()) sendView();

    const pause = () => {
      if (visibleSince !== null) {
        accumulated += (performance.now() - visibleSince) / 1000;
        visibleSince = null;
      }
    };
    const resume = () => {
      if (visibleSince === null) visibleSince = performance.now();
    };

    const flush = () => {
      pause();
      const sec = Math.round(accumulated);
      if (sec < 5 || !isAuthed()) return;
      accumulated = 0;
      try {
        navigator.sendBeacon(
          "/api/account/track",
          new Blob([JSON.stringify({ slug, dwell: sec })], { type: "text/plain" }),
        );
      } catch {
        /* best-effort */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      disposed = true;
      void disposed;
      unsub();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush(); // navigazione SPA: il tempo accumulato parte comunque
    };
  }, [slug]);
  return null;
}
