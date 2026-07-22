import "server-only";
import { SITE_URL } from "../private/brand";

// L'identità di brand dell'AREA CLIENTI (account utenti) di QUESTO sito.
//
// Stesso modello di lib/private/brand.ts: le tabelle WEB_ACCOUNTS / WEB_EVENTS /
// WEB_PREFERITI / WEB_MATCHES sono condivise con TriesteVillas, quindi ogni
// riga porta `brand` e ogni query filtra su `acctBrandClause()`. La copia in
// `triestevillas-web/src/lib/account/brand.ts` ha la stessa struttura con
// valori diversi: è l'unico file di lib/account che diverge di proposito.
//
// La sessione è firmata con PRIVATE_GATE_SECRET (diverso per progetto Vercel),
// quindi un cookie account di un brand non verifica sull'altro; il claim `k`
// ("acct") impedisce inoltre che un token PC — firmato con lo stesso segreto su
// questo sito — venga accettato dalle route account.

export const ACCT_BRAND = {
  /** Valore scritto e filtrato su WEB_*.brand. */
  code: "TSI",
  /** Cookie di sessione dell'area clienti. */
  cookieName: "tsi_acct",
  /** Cookie temporaneo dello state OAuth (10 minuti). */
  oauthCookieName: "tsi_acct_oauth",
  /** Nome commerciale nei testi. */
  displayName: "TriesteImmobiliare",
  /** Identità del lead creato/arricchito alla registrazione. */
  leadCanale: "Sito TriesteImmobiliare",
  leadAzienda: "TriesteImmobiliare",
  leadFonte: "ACCOUNT SITO",
  leadTipoRichiesta: "Account sito",
  /**
   * Redirect URI del flusso Google. Su TriesteImmobiliare non esiste un Owner
   * Portal: il callback è quello dedicato. Il client OAuth per questo dominio
   * NON esiste ancora (gate manuale): finché GOOGLE_CLIENT_ID/SECRET non sono
   * su Vercel il bottone Google resta nascosto (fail-closed). Quando si crea
   * il client, whitelistare: https://www.triesteimmobiliare.com/api/account/google/callback
   */
  googleCallbackPath: "/api/account/google/callback",
} as const;

export const ACCT_SITE_URL = SITE_URL;

/** Durata della sessione cliente in giorni. */
export const ACCT_SESSION_DAYS = 30;

/** Versione dell'informativa mostrata al consenso — va bumpata se cambia il testo. */
export const PRIVACY_VERSION = "2026-07-22";

/**
 * Clausola Airtable da AND-are in OGNI query su WEB_ACCOUNTS / WEB_EVENTS /
 * WEB_PREFERITI / WEB_MATCHES. Stessa filosofia di brandClause() della PC:
 * un solo nome grep-abile, così l'omissione si vede.
 */
export function acctBrandClause(): string {
  return `{brand}='${ACCT_BRAND.code}'`;
}
