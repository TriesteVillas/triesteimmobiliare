// ─────────────────────────────────────────────────────────────────────────────
// DA DOVE ARRIVA UNA RICHIESTA — il modulo gemello dei siti del gruppo
// (09/10/2026 su SloveniaVillas, esteso agli altri siti il 10/10/2026).
//
// Con ogni richiesta il CRM riceve la pagina da cui la visita è cominciata, il
// sito che l'ha portata e le UTM del primo ingresso: così una richiesta dice
// «da Google sulla guida X», «dalla mail di conferma della visita» o «dal piede
// di TriesteImmobiliare», non solo «dal sito». Il CRM la legge da qualunque
// porta (tsv-pg web/lib/ingresso/provenienza.ts) e la mostra sulla scheda lead.
//
// Non si salva niente sul dispositivo: l'ingresso si legge dalla voce di
// navigazione del documento (performance.getEntriesByType("navigation"), che
// resta quella del primo caricamento finché non si ricarica) e il referrer da
// document.referrer, che le navigazioni interne non cambiano. Della query si
// tengono solo le UTM; di un clic da annuncio solo che c'era (gclid, gbraid,
// wbraid, fbclid: il valore no). Del referrer solo dominio e percorso.
//
// COME ARRIVA AL SERVER (10/10/2026): non modulo per modulo. `useProvenienzaModuli`
// (lib/provenienza-moduli.ts, montato una volta in Analytics) aggiunge
// l'intestazione `x-provenienza` a ogni POST verso questo stesso sito — fetch
// delle rotte /api e server action — e la funzione che bussa alla porta del CRM
// la legge e la mette in `dati.provenienza`. Un modulo nuovo è già coperto.
//
// ⚠️ FILE GEMELLO: uguale (salvo questa testata) in sloveniavillas,
// triestevillas-web, triesteimmobiliare, triesteaffitti, friulivillas,
// lignanovillas, sappadavillas, triestebusiness e ortavillas. Il formato è un
// contratto col CRM: si cambia in tutte le copie e nel CRM nello stesso giro.
// ─────────────────────────────────────────────────────────────────────────────

/** L'intestazione HTTP con cui la provenienza viaggia verso il server del sito. */
export const INTESTAZIONE_PROVENIENZA = "x-provenienza";

export interface Provenienza {
  /** Percorso della pagina d'ingresso, con le sole UTM. */
  ingresso?: string;
  /** Dominio e percorso del sito che ha portato qui (vuoto: diretto, o referrer tolto). */
  referrer?: string;
  utm?: Partial<Record<"source" | "medium" | "campaign" | "content" | "term", string>>;
  /** Un clic da annuncio c'era: google (gclid/gbraid/wbraid) o meta (fbclid). */
  annuncio?: "google" | "meta";
  /** La pagina in cui è stato compilato il modulo. */
  pagina?: string;
}

const UTM = ["source", "medium", "campaign", "content", "term"] as const;
const corto = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Nel browser, al momento dell'invio: la provenienza come stringa JSON per il FormData. */
export function leggiProvenienza(): string {
  try {
    const out: Provenienza = { pagina: location.pathname.slice(0, 160) };
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const ing = new URL(nav?.name || location.href);
    const utm: Provenienza["utm"] = {};
    for (const k of UTM) {
      const v = ing.searchParams.get(`utm_${k}`);
      if (v) utm[k] = v.slice(0, 80);
    }
    if (Object.keys(utm).length) out.utm = utm;
    if (ing.searchParams.has("gclid") || ing.searchParams.has("gbraid") || ing.searchParams.has("wbraid")) out.annuncio = "google";
    else if (ing.searchParams.has("fbclid")) out.annuncio = "meta";
    const q = new URLSearchParams();
    for (const k of UTM) { const v = ing.searchParams.get(`utm_${k}`); if (v) q.set(`utm_${k}`, v); }
    out.ingresso = (ing.pathname + (q.size ? `?${q}` : "")).slice(0, 300);
    if (document.referrer) {
      const r = new URL(document.referrer);
      if (r.host !== location.host) out.referrer = (r.host.replace(/^www\./, "") + r.pathname).slice(0, 160);
    }
    return JSON.stringify(out);
  } catch {
    return "";
  }
}

/** Sul server: dal FormData a un oggetto pulito (o null). Chiavi e lunghezze fisse, niente altro passa. */
export function pulisciProvenienza(raw: unknown): Provenienza | null {
  if (typeof raw !== "string" || !raw || raw.length > 2000) return null;
  try {
    const x = JSON.parse(raw) as Record<string, unknown>;
    const out: Provenienza = {};
    const ingresso = corto(x.ingresso, 300);
    if (ingresso.startsWith("/")) out.ingresso = ingresso;
    const referrer = corto(x.referrer, 160);
    if (referrer && /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(referrer)) out.referrer = referrer;
    const pagina = corto(x.pagina, 160);
    if (pagina.startsWith("/")) out.pagina = pagina;
    if (x.annuncio === "google" || x.annuncio === "meta") out.annuncio = x.annuncio;
    if (x.utm && typeof x.utm === "object") {
      const utm: Provenienza["utm"] = {};
      for (const k of UTM) { const v = corto((x.utm as Record<string, unknown>)[k], 80); if (v) utm[k] = v; }
      if (Object.keys(utm).length) out.utm = utm;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/** Una riga per il messaggio che il CRM mostra sulla scheda del lead (in italiano, come il CRM). */
export function rigaProvenienza(p: Provenienza | null): string {
  if (!p) return "";
  const da = p.utm?.source ? `${p.utm.source}${p.utm.medium ? ` / ${p.utm.medium}` : ""}${p.utm.campaign ? ` · campagna ${p.utm.campaign}` : ""}${p.utm.content ? ` · ${p.utm.content}` : ""}`
    : p.referrer ? `da ${p.referrer}` : "accesso diretto (o sito che non dice da dove)";
  return [`Provenienza: ${da}${p.annuncio ? ` · clic da annuncio ${p.annuncio}` : ""}`, p.ingresso ? `entrata da ${p.ingresso}` : "", p.pagina && p.pagina !== p.ingresso?.split("?")[0] ? `modulo in ${p.pagina}` : ""].filter(Boolean).join(" · ");
}

/** Sul server: la provenienza dall'intestazione della richiesta in corso (o null).
 *  Il valore arriva codificato con encodeURIComponent, perché un'intestazione
 *  HTTP non porta caratteri fuori da Latin-1 e un percorso può averne. */
export function provenienzaDaIntestazione(valore: string | null | undefined): Provenienza | null {
  if (!valore || valore.length > 6000) return null;
  try {
    return pulisciProvenienza(decodeURIComponent(valore));
  } catch {
    return null;
  }
}
