import "server-only";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ACCT_BRAND, ACCT_SITE_URL, ACCT_SESSION_DAYS } from "./brand";
import { ACCT_COOKIE, signAcctSession, randomToken } from "./session";
import {
  findAccountByGoogleSub,
  findAccountByEmail,
  linkGoogleSub,
  createAccount,
  registerLogin,
  logEvent,
} from "./store";

// Google SSO dell'area clienti — stesso code-flow dell'Owner Portal, con una
// differenza di rotta: su TriesteVillas il client OAuth ha in whitelist solo
// /api/owner/google/callback, quindi lo start punta lì e lo state prefissato
// "acct." dice al callback owner di delegare a handleAccountGoogleCallback.
// Il redirect_uri usato per lo scambio del code DEVE combaciare con quello
// dello start: viaggia dentro il cookie di stato, non si indovina.

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export function googleConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

export const ACCT_STATE_PREFIX = "acct.";

type OauthState = { s: string; r: string }; // state + redirect path usato allo start

export async function startAccountGoogleFlow(): Promise<NextResponse> {
  if (!CLIENT_ID) return NextResponse.json({ error: "sso_not_configured" }, { status: 503 });
  const state = ACCT_STATE_PREFIX + randomToken();
  const redirectPath = ACCT_BRAND.googleCallbackPath;
  const jar = await cookies();
  jar.set(ACCT_BRAND.oauthCookieName, JSON.stringify({ s: state, r: redirectPath } satisfies OauthState), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", `${ACCT_SITE_URL}${redirectPath}`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url.toString());
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const part = jwt.split(".")[1];
    const s = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
    return JSON.parse(Buffer.from(s + pad, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export async function handleAccountGoogleCallback(request: Request): Promise<NextResponse> {
  const fail = (reason: string) => NextResponse.redirect(`${ACCT_SITE_URL}/account?sso=${reason}`);
  if (!CLIENT_ID || !CLIENT_SECRET) return fail("error");
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get("code") ?? "";
  const state = reqUrl.searchParams.get("state") ?? "";
  const jar = await cookies();
  let saved: OauthState | null = null;
  try {
    saved = JSON.parse(jar.get(ACCT_BRAND.oauthCookieName)?.value ?? "");
  } catch {
    saved = null;
  }
  jar.set(ACCT_BRAND.oauthCookieName, "", { path: "/", maxAge: 0 });
  if (!code || !state || !saved || state !== saved.s) return fail("error");

  // Scambio del code (TLS + client secret → attendibile senza verifica JWKS,
  // stessa scelta documentata dell'Owner Portal).
  let idToken = "";
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: `${ACCT_SITE_URL}${saved.r}`,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) return fail("error");
    idToken = ((await res.json()) as { id_token?: string }).id_token ?? "";
  } catch {
    return fail("error");
  }
  const claims = decodeJwtPayload(idToken);
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : "";
  const sub = typeof claims?.sub === "string" ? claims.sub : "";
  const name = typeof claims?.name === "string" ? claims.name : email;
  // email_verified deve essere ESPLICITAMENTE true: un claim assente non è una verifica.
  if (!email || !sub || claims?.email_verified !== true) return fail("error");

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  let acc = await findAccountByGoogleSub(sub);
  let created = false;
  if (!acc) {
    const byEmail = await findAccountByEmail(email);
    if (byEmail) {
      await linkGoogleSub(byEmail.id, sub);
      acc = byEmail;
    }
  }
  if (!acc) {
    // A differenza dell'Owner Portal (dati sensibili dei proprietari, approvazione
    // manuale), l'area clienti è self-service: l'account Google nasce Attivo.
    // I consensi facoltativi NON si presumono: si impostano dopo, da /account.
    const id = await createAccount({
      email,
      nome: name,
      googleSub: sub,
      emailVerificata: true,
      lingua: "it",
      consMarketing: false,
      consProfilazione: false,
    });
    if (!id) return fail("error");
    const fresh = await findAccountByGoogleSub(sub);
    if (!fresh) return fail("error");
    acc = fresh;
    created = true;
    await logEvent({ evento: "signup", accountId: acc.id, email, ip, ua, dettaglio: "google" });
  }
  if (acc.stato !== "Attivo") {
    await logEvent({ evento: "login_fail", accountId: acc.id, email, ip, ua, dettaglio: `google stato=${acc.stato}` });
    return fail("blocked");
  }

  const exp = Math.floor(Date.now() / 1000) + ACCT_SESSION_DAYS * 86400;
  const token = await signAcctSession({ uid: acc.id, em: acc.email, nm: (acc.nome || name).split(" ")[0], exp });
  jar.set(ACCT_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCT_SESSION_DAYS * 86400,
  });
  await registerLogin(acc);
  if (!created) await logEvent({ evento: "login_ok", accountId: acc.id, email, ip, ua, dettaglio: "google" });
  return NextResponse.redirect(`${ACCT_SITE_URL}/account${created ? "?welcome=1" : ""}`);
}
