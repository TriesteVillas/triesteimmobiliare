import "server-only";
import { createHash, createHmac } from "node:crypto";

// IL GETTONE DEI TEASER RISERVATI (08/10/2026).
//
// Ogni teaser della Private Collection su /immobili e /investimenti porta a
// /private/richiedi?p=<…>, e fino all'08/10 quel <…> era il tsv_prop_id del
// CRM in chiaro: dei codici, alcuni sono parole leggibili, e uno portava via e
// civico di una casa riservata — nell'HTML pubblico di una pagina che promette
// «solo zona e forbice di prezzo, niente titolo, niente foto, niente indirizzo»
// (audit dei siti del 07/10). Ora il link porta un gettone opaco, l'HMAC del
// codice con il segreto del sito; la rotta /api/private/request lo traduce di
// nuovo nel codice lato server (risolviGettone), dove il CRM se lo aspetta.
//
// Un link vecchio col codice in chiaro (email già spedite, pagine in cache)
// continua a funzionare: ciò che non è un gettone passa com'è.

const SEGRETO = process.env.PRIVATE_GATE_SECRET ?? "";
const PREFISSO = "pc-";

export function gettoneTeaser(id: string): string {
  const firma = SEGRETO
    ? createHmac("sha256", SEGRETO).update(`teaser:${id}`).digest("base64url")
    : createHash("sha256").update(`teaser:${id}`).digest("base64url");
  return `${PREFISSO}${firma.slice(0, 16)}`;
}

export function eGettone(v: string): boolean {
  return v.startsWith(PREFISSO) && v.length === PREFISSO.length + 16;
}

/** Il codice di catalogo dietro un gettone, fra quelli dati; null se nessuno. */
export function risolviGettone(gettone: string, codici: readonly string[]): string | null {
  return codici.find((id) => gettoneTeaser(id) === gettone) ?? null;
}
