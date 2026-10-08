// Eventi GA4 — l'unico punto del sito che parla con gtag.
// Gemello di triestevillas-web/src/lib/track.ts. Passa dal Consent Mode:
// senza consenso resta un ping anonimo, con consenso diventa misurabile.
// gtag è lazyOnload: prima del load l'evento si perde, e va bene così.
export function track(event: string, params?: Record<string, unknown>) {
  // `generate_lead` porta anche `modulo` (08/10/2026, come sul gemello TSV):
  // è la dimensione personalizzata che il CRM registra su GA4, e fino a oggi
  // la scriveva l'ascoltatore generico sui submit di Analytics.tsx, ora tolto.
  const p =
    event === "generate_lead" && params && params.modulo == null && params.form != null
      ? { ...params, modulo: params.form }
      : params;
  try {
    window.gtag?.("event", event, p);
  } catch {
    /* gtag assente (area privata, blocker): l'evento si perde */
  }
}
