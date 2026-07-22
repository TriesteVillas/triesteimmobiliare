import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ACCT_SESSION_DAYS } from "@/lib/account/brand";
import { ACCT_COOKIE, acctGateConfigured, hashPassword, signAcctSession } from "@/lib/account/session";
import { createAccount, findAccountByEmail, logEvent, upsertPref } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Registrazione self-service con email+password. I preferiti accumulati da
// anonimo (localStorage) arrivano in `favs` e vengono migrati sul record.
// Rate limit in-memory per IP, come /api/private/access.
const attempts = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGS = new Set(["it", "en", "de"]);

export async function POST(request: Request) {
  if (!acctGateConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.t < WINDOW_MS && a.n >= MAX_ATTEMPTS)
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  attempts.set(ip, a && now - a.t < WINDOW_MS ? { n: a.n + 1, t: a.t } : { n: 1, t: now });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const nome = String(body.nome ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const telefono = String(body.telefono ?? "").trim();
  const lingua = LANGS.has(String(body.lingua)) ? String(body.lingua) : "it";
  const criteri = String(body.criteri ?? "").trim().slice(0, 1000);
  const consMarketing = body.consMarketing === true;
  const consProfilazione = body.consProfilazione === true;
  const favs = Array.isArray(body.favs) ? (body.favs as unknown[]).map(String).slice(0, 30) : [];

  if (nome.length < 2) return NextResponse.json({ ok: false, error: "name" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ ok: false, error: "password" }, { status: 400 });

  const existing = await findAccountByEmail(email);
  if (existing) return NextResponse.json({ ok: false, error: "exists" }, { status: 409 });

  const hash = await hashPassword(password);
  const id = await createAccount({
    email,
    nome,
    ...(telefono ? { telefono } : {}),
    hash,
    lingua,
    consMarketing,
    consProfilazione,
    ...(criteri ? { criteri } : {}),
  });
  if (!id) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  await logEvent({ evento: "signup", accountId: id, email, ip, ua, dettaglio: "email+password" });

  // Migrazione dei cuori anonimi: best-effort, un errore non blocca la registrazione.
  for (const slug of favs) {
    try {
      const p = await resolveSiteProp(slug);
      await upsertPref({ id, email }, slug, p?.recId ?? null, { cuore: true });
      await logEvent({
        evento: "fav_add",
        accountId: id,
        email,
        slug,
        propRecId: p?.recId ?? null,
        dettaglio: `${p?.title ?? slug} (migrato da anonimo)`,
      });
    } catch (e) {
      console.error("[acct] fav migration failed:", e);
    }
  }

  const exp = Math.floor(Date.now() / 1000) + ACCT_SESSION_DAYS * 86400;
  const token = await signAcctSession({ uid: id, em: email, nm: nome.split(" ")[0], exp });
  const jar = await cookies();
  jar.set(ACCT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCT_SESSION_DAYS * 86400,
  });
  return NextResponse.json({ ok: true, nome: nome.split(" ")[0], migrated: favs.length });
}
