import "server-only";
import { BRAND } from "./brand";

// Signed, self-expiring access token for the Private Collection cookie.
// HMAC-SHA256 over a compact JSON payload, keyed by PRIVATE_GATE_SECRET.
// Uses Web Crypto so it runs in both the Node and Edge runtimes.
//
// The cookie is the "session": once the password (credential) is validated by
// /api/private/access we mint this token and store it httpOnly. The private
// pages verify the signature AND re-check the grant in Airtable on each load,
// so a revoked/expired grant stops working at the next navigation even though
// the cookie is still cryptographically valid.

export const PC_COOKIE = BRAND.cookieName;

export type PcSession = {
  rid: string; // PC_RICHIESTE record id
  em: string; // email — for the per-user watermark + access log
  nm: string; // first name — for the greeting
  exp: number; // unix seconds; mirrors the grant's expires_at
  b?: string; // brand claim — see verifySession
};

const SECRET = process.env.PRIVATE_GATE_SECRET ?? "";

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function gateConfigured(): boolean {
  return SECRET.length >= 16;
}

export async function signSession(s: PcSession): Promise<string> {
  // Il claim di brand si stampa QUI, non nei chiamanti: così nessuna nuova via
  // di login può dimenticarlo.
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify({ ...s, b: BRAND.code })));
  const sig = b64urlEncode(await hmac(body));
  return `${body}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<PcSession | null> {
  if (!token || !SECRET) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: Uint8Array;
  let given: Uint8Array;
  try {
    expected = await hmac(body);
    given = b64urlDecode(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqual(given, expected)) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as PcSession;
    if (typeof s.exp !== "number" || s.exp * 1000 < Date.now()) return null;
    // Terzo lucchetto (vedi brand.ts). Normalmente ridondante: i due siti usano
    // PRIVATE_GATE_SECRET diversi, quindi un token dell'altro brand non supera
    // già la firma. Serve nel caso in cui i due segreti coincidano per errore
    // umano — l'unico modo in cui i due portali potrebbero comunicare.
    //
    // Un `b` ASSENTE è accettato di proposito: sono i cookie emessi prima del
    // 2026-07-21, tutti necessariamente di questo brand (l'altro non esisteva).
    // Rifiutarli scollegherebbe i clienti attivi senza chiudere nulla, perché
    // un token forgiato richiede comunque il segreto.
    if (s.b && s.b !== BRAND.code) return null;
    return s;
  } catch {
    return null;
  }
}
