import "server-only";
import { ACCT_BRAND } from "./brand";

// Cookie di sessione firmato dell'area clienti. Stesso schema HMAC-SHA256 della
// Private Collection e dell'Owner Portal (chiave PRIVATE_GATE_SECRET, Web Crypto
// così gira in Node ed Edge). Il file è autonomo e NON importa da lib/owner:
// lib/account viene copiato pari-pari su triesteimmobiliare, che lib/owner non
// ce l'ha. Prezzo già accettato per la PC: un bug qui va corretto due volte.
//
// Il claim `k:"acct"` non è decorativo: PC (rid), Owner (aid) e account (uid)
// condividono lo stesso segreto su questo sito, quindi senza un discriminante
// un token firmato per un contesto verificherebbe anche negli altri due.

export const ACCT_COOKIE = ACCT_BRAND.cookieName;

export type AcctSession = {
  k: "acct"; // discriminante di contesto — vedi sopra
  uid: string; // WEB_ACCOUNTS record id
  em: string; // email
  nm: string; // nome (saluto)
  exp: number; // unix seconds
  b?: string; // claim di brand, come la PC: ridondante coi segreti diversi, regge all'errore umano
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

export function acctGateConfigured(): boolean {
  return SECRET.length >= 16;
}

export async function signAcctSession(s: Omit<AcctSession, "k" | "b">): Promise<string> {
  // k e b si stampano QUI, non nei chiamanti: nessuna nuova via di login può dimenticarli.
  const full: AcctSession = { ...s, k: "acct", b: ACCT_BRAND.code };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const sig = b64urlEncode(await hmac(body));
  return `${body}.${sig}`;
}

export async function verifyAcctSession(token: string | undefined): Promise<AcctSession | null> {
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
    const s = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as AcctSession;
    if (s.k !== "acct") return null; // token PC/Owner: firmati ok, contesto sbagliato
    if (typeof s.exp !== "number" || s.exp * 1000 < Date.now()) return null;
    if (s.b && s.b !== ACCT_BRAND.code) return null;
    if (!s.uid) return null;
    return s;
  } catch {
    return null;
  }
}

// ---- Password hashing (PBKDF2-SHA256, Web Crypto) ---------------------------
// Identico all'Owner Portal: formato versionato `pbkdf2$iter$salt$hash`, così
// un futuro cambio di algoritmo può migrare al login senza invalidare nessuno.

const PBKDF2_ITER = 120_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITER}$${b64urlEncode(salt)}$${b64urlEncode(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iter = Number(parts[1]);
  const salt = b64urlDecode(parts[2]);
  const expected = b64urlDecode(parts[3]);
  const bits = new Uint8Array(await pbkdf2(password, salt, iter));
  return timingSafeEqual(bits, expected);
}

async function pbkdf2(password: string, salt: Uint8Array, iter = PBKDF2_ITER): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iter, hash: "SHA-256" },
    key,
    256,
  );
}

export function randomToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Hash deterministico per i token di reset/verifica: a DB va l'hash, il token in
// chiaro vive solo nel link della mail.
export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
