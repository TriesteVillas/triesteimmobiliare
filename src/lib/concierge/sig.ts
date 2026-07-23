import "server-only";

// Firma HMAC dei turni "assistant" del Concierge pubblico — stesso rimedio del
// Concierge Private Collection (lib/private/session.ts): la history vive nel
// sessionStorage del browser ed è input del client, turni del bot compresi.
// Qui la sessione non ha un grant: la chiave del MAC è legata al session id
// generato dal client (sid), con un prefisso proprio ("web-chat") così una
// firma del Concierge PC non vale qui e viceversa.
//
// Un sid contraffatto non compra nulla: cambia solo il bucket del rate limit
// e invalida le firme dei turni precedenti (il bot perde contesto, non noi).

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
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function mac(sid: string, text: string): Promise<string> {
  return b64urlEncode(await hmac(`web-chat|${sid}|${text}`));
}

export async function signWebTurn(sid: string, text: string): Promise<string> {
  if (!SECRET || !sid || !text) return "";
  return mac(sid, text);
}

export async function verifyWebTurn(sid: string, text: string, sig: unknown): Promise<boolean> {
  if (!SECRET || !sid || typeof sig !== "string" || !sig) return false;
  try {
    return timingSafeEqual(b64urlDecode(sig), b64urlDecode(await mac(sid, text)));
  } catch {
    return false;
  }
}
