import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ACCT_SESSION_DAYS } from "@/lib/account/brand";
import { ACCT_COOKIE, acctGateConfigured, signAcctSession, verifyPassword } from "@/lib/account/session";
import { findAccountByEmail, logEvent, registerLogin, upsertPref, listPrefsByEmail } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Login email+password. Rate limit doppio (per IP e per email) come l'Owner
// Portal; risposte generiche per non rivelare quali email esistono.
const byIp = new Map<string, { n: number; t: number }>();
const byEmail = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;

function limited(map: Map<string, { n: number; t: number }>, key: string, max: number): boolean {
  const now = Date.now();
  const a = map.get(key);
  if (a && now - a.t < WINDOW_MS && a.n >= max) return true;
  map.set(key, a && now - a.t < WINDOW_MS ? { n: a.n + 1, t: a.t } : { n: 1, t: now });
  return false;
}

export async function POST(request: Request) {
  if (!acctGateConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const favs = Array.isArray(body.favs) ? (body.favs as unknown[]).map(String).slice(0, 30) : [];
  if (!email || !password) return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });

  if (limited(byIp, ip, 10) || limited(byEmail, email, 6))
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  const acc = await findAccountByEmail(email);
  if (!acc || !(await verifyPassword(password, acc.hash))) {
    if (acc) await logEvent({ evento: "login_fail", accountId: acc.id, email, ip, ua, dettaglio: "password errata" });
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }
  if (acc.stato !== "Attivo") {
    await logEvent({ evento: "login_fail", accountId: acc.id, email, ip, ua, dettaglio: `stato=${acc.stato}` });
    return NextResponse.json({ ok: false, error: acc.stato === "Sospeso" ? "blocked" : "invalid" }, { status: 403 });
  }

  const exp = Math.floor(Date.now() / 1000) + ACCT_SESSION_DAYS * 86400;
  const token = await signAcctSession({ uid: acc.id, em: acc.email, nm: acc.nome.split(" ")[0] || acc.email, exp });
  const jar = await cookies();
  jar.set(ACCT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCT_SESSION_DAYS * 86400,
  });
  await registerLogin(acc);
  await logEvent({ evento: "login_ok", accountId: acc.id, email, ip, ua, dettaglio: "password" });

  // Migrazione dei cuori anonimi accumulati prima del login: solo quelli che
  // non esistono già sul record (il login non deve mai TOGLIERE un cuore).
  if (favs.length) {
    try {
      const have = new Set((await listPrefsByEmail(acc.email)).filter((p) => p.cuore).map((p) => p.slug));
      for (const slug of favs) {
        if (have.has(slug)) continue;
        const p = await resolveSiteProp(slug);
        await upsertPref(acc, slug, p?.recId ?? null, { cuore: true });
        await logEvent({
          evento: "fav_add",
          accountId: acc.id,
          email: acc.email,
          slug,
          propRecId: p?.recId ?? null,
          dettaglio: `${p?.title ?? slug} (migrato da anonimo)`,
        });
      }
    } catch (e) {
      console.error("[acct] fav migration failed:", e);
    }
  }
  return NextResponse.json({ ok: true, nome: acc.nome.split(" ")[0] || acc.nome });
}
