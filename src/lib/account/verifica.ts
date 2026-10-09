// La verifica dell'email dell'area clienti (09/10/2026): la parte PURA — il
// token del link, l'impronta della password che lega le sessioni, e la regola
// che decide quando un clic sul link conferma davvero l'account.
//
// MODULO GEMELLO: identico byte per byte in triestevillas-web e
// triesteimmobiliare. Niente import, così si testa con `tsc` e node
// (verifica.test.ts); segreto e marchio li passa session.ts.
//
// IL CASO. Fino al 09/10/2026 la registrazione con password agganciava subito
// l'account al lead con la stessa email (store.ts, linkOrCreateLead) e nessuno
// verificava la casella: chi si registrava con l'email di un cliente vedeva in
// /account le sue visite in programma — data, immobile anche riservato,
// operatore — e scriveva il proprio telefono sulla sua scheda. Ora il legame
// col lead nasce solo a casella provata: da Google (email_verified), dal link
// di questa verifica, o da un reset della password andato a buon fine.
//
// PERCHÉ IL CLIC DA SOLO NON BASTA. Il link arriva al padrone della casella,
// che non è per forza chi ha creato l'account. Se un impostore si registra con
// l'email di un nostro cliente, la mail di conferma la riceve il cliente — che
// ci conosce e la aprirebbe: se bastasse il clic, verificherebbe lui l'account
// dell'impostore e gli aprirebbe le proprie visite. Quindi il clic conferma
// solo insieme alla credenziale dell'account: la sessione aperta in quel
// browser, oppure la password. Il cliente ignaro non ha né l'una né l'altra; a
// lui resta «password dimenticata», che prova la casella, mette una password
// sua e — con l'impronta qui sotto — chiude le sessioni aperte dall'impostore.

/** Quanto vale il link di verifica: come TriesteAffitti (tsv-pg lib/ta-sito-puro.ts). */
export const DURATA_VERIFICA_S = 48 * 3600;

export type DatiVerifica = { uid: string; em: string };

const codifica = new TextEncoder();

function b64url(byte: Uint8Array): string {
  let s = "";
  for (const b of byte) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function daB64url(s: string): Uint8Array {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(segreto: string, dato: string): Promise<Uint8Array> {
  const chiave = await crypto.subtle.importKey(
    "raw",
    codifica.encode(segreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", chiave, codifica.encode(dato)));
}

function uguali(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// Stesso segreto delle sessioni (PRIVATE_GATE_SECRET), contesto diverso: il
// claim `k:"verifica"` impedisce che un token di sessione (`k:"acct"`) valga da
// link di verifica, e viceversa — verifyAcctSession scarta tutto ciò che non è
// `acct`. Il marchio `b` regge all'errore umano di due progetti con un segreto solo.
function segretoBuono(segreto: string): boolean {
  return typeof segreto === "string" && segreto.length >= 16;
}

export async function firmaVerifica(segreto: string, marchio: string, d: DatiVerifica, oraS: number): Promise<string> {
  if (!segretoBuono(segreto)) throw new Error("verifica: segreto assente o troppo corto");
  const corpo = b64url(
    codifica.encode(JSON.stringify({ k: "verifica", uid: d.uid, em: d.em, b: marchio, exp: oraS + DURATA_VERIFICA_S })),
  );
  return `${corpo}.${b64url(await hmac(segreto, corpo))}`;
}

/** Il token del link, se è nostro, intero e non scaduto; altrimenti null. */
export async function leggiVerifica(
  segreto: string,
  marchio: string,
  token: string,
  oraS: number,
): Promise<DatiVerifica | null> {
  if (!segretoBuono(segreto) || typeof token !== "string" || token.length > 600) return null;
  const punto = token.indexOf(".");
  if (punto <= 0) return null;
  const corpo = token.slice(0, punto);
  try {
    if (!uguali(daB64url(token.slice(punto + 1)), await hmac(segreto, corpo))) return null;
    const p = JSON.parse(new TextDecoder().decode(daB64url(corpo))) as Record<string, unknown>;
    if (p.k !== "verifica" || p.b !== marchio) return null;
    if (typeof p.exp !== "number" || p.exp < oraS) return null;
    if (typeof p.uid !== "string" || !p.uid || typeof p.em !== "string" || !p.em) return null;
    return { uid: p.uid, em: p.em };
  } catch {
    return null;
  }
}

/**
 * L'impronta della credenziale, dentro il cookie di sessione (claim `pf`).
 * Cambia quando cambia la password — un reset, o la password tolta quando
 * Google prova la casella di un account mai verificato — e da quel momento le
 * sessioni aperte prima non valgono più: auth.ts la confronta a ogni richiesta.
 * HMAC e non un hash semplice: nel cookie, che il browser può leggere, non
 * deve finire niente che derivi dall'hash della password senza il segreto.
 */
export async function improntaCredenziale(segreto: string, hashPassword: string): Promise<string> {
  if (!segretoBuono(segreto)) throw new Error("verifica: segreto assente o troppo corto");
  return b64url(await hmac(segreto, `pf|${hashPassword}`)).slice(0, 22);
}

export type EsitoVerifica = "token" | "gia" | "credenziale" | "ok";

/**
 * Cosa fa un clic sul link. `token`: link falso, scaduto, o di un account che
 * non è più quello (email cambiata, sospeso, sparito) — non si dice quale.
 * `gia`: già verificato, niente da fare. `credenziale`: il link è buono ma chi
 * clicca non ha dimostrato di essere il titolare dell'account. `ok`: si
 * verifica.
 */
export function esitoVerifica(x: {
  dati: DatiVerifica | null;
  account: { id: string; email: string; stato: string; verificata: boolean } | null;
  /** L'account della sessione valida in questo browser, se c'è. */
  sessioneDi: string | null;
  passwordGiusta: boolean;
}): EsitoVerifica {
  const { dati, account } = x;
  if (!dati || !account || account.id !== dati.uid) return "token";
  if (account.email !== dati.em || account.stato !== "Attivo") return "token";
  if (account.verificata) return "gia";
  if (x.sessioneDi === account.id || x.passwordGiusta) return "ok";
  return "credenziale";
}
