"use client";

import { useEffect } from "react";

// Fires once when a gated Private Collection property page mounts, so the CRM
// can record which properties each authenticated user opened. Best-effort:
// failures are swallowed and never affect the page.
export default function TrackView({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    try {
      fetch("/api/private/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title }),
        keepalive: true, // survive a fast navigation away
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [slug, title]);
  return null;
}
