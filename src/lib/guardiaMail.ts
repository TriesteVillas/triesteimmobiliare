// La guardia delle mail che un modulo del sito manda a un indirizzo scelto da
// chi lo compila (09/10/2026).
//
// MODULO GEMELLO: identico byte per byte in triestevillas-web,
// triesteimmobiliare, triesteaffitti e friulivillas — si corregge in tutte e
// quattro le copie nello stesso giro. Puro: niente import, si testa con `tsc`
// e node (guardiaMail.test.ts, nei repo che hanno i test nel prebuild).
//
// IL CASO. «Invia a un amico» (`/api/lead`, `tipo:"amico"`) mandava, senza
// autenticazione, senza limiti e senza honeypot nel modulo della scheda, una
// mail firmata DKIM dal nostro dominio a QUALSIASI indirizzo, con il nome
// dell'immobile e il messaggio presi dal corpo della richiesta e un bottone
// verso QUALSIASI `url` del corpo — e l'href non era escapato: una virgoletta
// nell'url apriva nuovi attributi nel tag. Phishing col nostro marchio, e i
// reclami sarebbero finiti sull'account Resend da cui partono le notifiche di
// TUTTI i moduli. Trovato nel controllo dei moduli dell'08-09/10/2026.
//
// Qui stanno i tre pezzi che non dipendono dal sito: quale url può finire in
// un bottone, come si scrive un valore dentro un attributo HTML, e un limite
// d'invio. Il resto (la scheda ricostruita dal codice, il testo della mail)
// sta nella rotta di ciascun sito.

/** I domini del gruppo su cui può puntare un link in una mail che il sito
 *  manda per conto di un visitatore. Solo il dominio nudo e il suo `www.`:
 *  nessun altro sottodominio. */
export const DOMINI_GRUPPO = [
  "triestevillas.com",
  "triesteimmobiliare.com",
  "triesteaffitti.com",
  "friulivillas.com",
  "lignanovillas.com",
  "sappadavillas.com",
  "sloveniavillas.com",
  "triestebusiness.it",
  "elegieduino.it",
] as const;

const nudo = (h: string) => h.toLowerCase().replace(/^www\./, "");

/**
 * L'url, normalizzato, se punta al sito stesso (`sitoUrl`, l'origine pubblica
 * del sito: `NEXT_PUBLIC_SITE_URL`) o a un dominio del gruppo; altrimenti
 * `null`, e il chiamante ripiega sull'indirizzo della scheda ricostruito dal
 * codice dell'immobile.
 *
 * Solo http(s), niente credenziali nell'url, niente porte sui domini del
 * gruppo (che rispondono in https: un `http://` si riscrive). Il risultato
 * esce da `URL`, quindi virgolette e spazi sono già percent-encoded — ma chi
 * lo mette in un attributo lo escapa comunque (`escHtml`).
 */
export function urlDelGruppo(raw: string, sitoUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase();

  let proprio: URL | null = null;
  try {
    proprio = new URL(sitoUrl);
  } catch {
    proprio = null;
  }
  // Il sito stesso, com'è configurato (in sviluppo anche http://localhost:3000).
  if (proprio && nudo(host) === nudo(proprio.hostname) && u.port === proprio.port) {
    if (proprio.protocol === "https:") u.protocol = "https:";
    return u.toString();
  }
  if (!(DOMINI_GRUPPO as readonly string[]).includes(nudo(host)) || u.port) return null;
  u.protocol = "https:";
  return u.toString();
}

/** Un valore dentro un attributo HTML (o nel testo): le cinque entità. Il
 *  vecchio `esc` dei moduli lasciava passare le virgolette. */
export function escHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/**
 * Un limite d'invio: al più `max` passaggi per chiave in `finestraMs`.
 *
 * ⚠️ Vive nella memoria della funzione: su Vercel le istanze sono più d'una e
 * ognuna conta per sé, e un'istanza nuova riparte da zero. Non è una difesa
 * contro chi ruota indirizzi IP; ferma il caso semplice — lo stesso
 * destinatario o lo stesso IP che martellano — senza dipendenze nuove. La
 * mappa si sfoltisce da sola e non supera `tetto` chiavi.
 */
export function limitatore(max: number, finestraMs: number, tetto = 5000) {
  const visti = new Map<string, number[]>();
  return function passa(chiave: string, ora: number = Date.now()): boolean {
    const da = ora - finestraMs;
    const recenti = (visti.get(chiave) ?? []).filter((t) => t > da);
    if (recenti.length >= max) {
      visti.set(chiave, recenti);
      return false;
    }
    recenti.push(ora);
    visti.delete(chiave); // in coda: la mappa resta in ordine di ultimo uso
    visti.set(chiave, recenti);
    if (visti.size > tetto) {
      for (const [k, ts] of visti) {
        if (visti.size <= tetto) break;
        if (k !== chiave && (ts[ts.length - 1] ?? 0) <= da) visti.delete(k);
      }
      // Ancora troppe chiavi tutte vive: via le più vecchie.
      for (const k of visti.keys()) {
        if (visti.size <= tetto) break;
        if (k !== chiave) visti.delete(k);
      }
    }
    return true;
  };
}

/** L'IP del visitatore come lo passa Vercel (`x-real-ip`, o il primo di
 *  `x-forwarded-for`, che Vercel riscrive: il client non lo sceglie). */
export function ipDi(h: { get(nome: string): string | null }): string {
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "").trim() || "?";
}

/** Un indirizzo email come chiave di conteggio: minuscolo e senza spazi. */
export const chiaveEmail = (e: string) => e.trim().toLowerCase();
