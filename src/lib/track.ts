// Eventi GA4 — l'unico punto del sito che parla con gtag.
// Gemello di triestevillas-web/src/lib/track.ts. Passa dal Consent Mode:
// senza consenso resta un ping anonimo, con consenso diventa misurabile.
// gtag è lazyOnload: prima del load l'evento si perde, e va bene così.
export function track(event: string, params?: Record<string, unknown>) {
  try {
    window.gtag?.("event", event, params);
  } catch {
    /* gtag assente (area privata, blocker): l'evento si perde */
  }
}
