import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { findGrantByCode, isActive, registerLogin, logAccess } from "@/lib/private/store";
import { signSession, PC_COOKIE, gateConfigured } from "@/lib/private/session";

// Validate a Private Collection credential. On success, mint the signed,
// httpOnly session cookie (expiry mirrors the grant) and log the access.
// Failures are logged too (for the abuse audit).

const hits = new Map<string, number[]>();
function limited(ip: string, max = 10, windowMs = 600_000): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

export async function POST(request: Request) {
  if (!gateConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const ua = h.get("user-agent") ?? "";
  if (ip && limited(ip)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const code = (typeof body.code === "string" ? body.code : "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const g = await findGrantByCode(code);
  if (!g || !isActive(g)) {
    await logAccess({
      evento: "login_fail",
      codice: code,
      ip, ua,
      dettaglio: g ? `stato=${g.stato}` : "no match",
      ...(g ? { email: g.email, requestId: g.id } : {}),
    });
    const reason =
      g && g.stato === "Under review"
        ? "review"
        : g && g.expiresAtMs !== null && g.expiresAtMs <= Date.now()
          ? "expired"
          : "invalid";
    return NextResponse.json({ ok: false, error: reason }, { status: 401 });
  }

  const expMs = g.expiresAtMs!;
  const token = await signSession({
    rid: g.id,
    em: g.email,
    nm: g.nome,
    exp: Math.floor(expMs / 1000),
  });

  const jar = await cookies();
  jar.set(PC_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expMs),
  });

  await registerLogin(g);
  await logAccess({ evento: "login_ok", codice: code, email: g.email, ip, ua, requestId: g.id });

  return NextResponse.json({ ok: true, name: g.nome });
}
