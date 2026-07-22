import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { currentWebAccount } from "@/lib/account/auth";
import { logEvent, recentViewExists } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Tracciamento della navigazione di un utente LOGGATO (gli anonimi non si
// tracciano: niente visitor-id, niente cookie extra — è ciò che ci tiene fuori
// dal perimetro del cookie banner).
//
//  - {slug}                → evento "view", de-dup 30' in-memory + durevole
//  - {slug, dwell: sec}    → evento "dwell" (tempo VISIBILE sulla scheda),
//                            arriva via sendBeacon a fine visita, min 5s cap 30'.
//
// Il body di sendBeacon viaggia come text/plain: si parsa a mano, mai dare per
// scontato il Content-Type.

const seen = new Map<string, number>(); // email|slug → ts ultima view loggata
const DEDUP_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  const acc = await currentWebAccount();
  if (!acc) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  let body: { slug?: unknown; dwell?: unknown };
  try {
    body = JSON.parse(await request.text()) as { slug?: unknown; dwell?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim().slice(0, 200);
  if (!slug) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  if (typeof body.dwell === "number" && Number.isFinite(body.dwell)) {
    const sec = Math.round(body.dwell);
    if (sec < 5) return NextResponse.json({ ok: true, skipped: "short" });
    const p = await resolveSiteProp(slug);
    await logEvent({
      evento: "dwell",
      accountId: acc.id,
      email: acc.email,
      slug,
      propRecId: p?.recId ?? null,
      dettaglio: p?.title ?? slug,
      dwellSec: Math.min(sec, 1800),
      ip,
      ua,
    });
    return NextResponse.json({ ok: true });
  }

  // View, con doppio de-dup (stessa architettura del tracker PC: l'in-memory
  // para i refresh sulla stessa istanza, Airtable para le istanze parallele).
  const key = `${acc.email}|${slug}`;
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < DEDUP_MS) return NextResponse.json({ ok: true, deduped: true });
  const sinceIso = new Date(now - DEDUP_MS).toISOString();
  if (await recentViewExists(acc.email, slug, sinceIso)) {
    seen.set(key, now);
    return NextResponse.json({ ok: true, deduped: true });
  }
  const p = await resolveSiteProp(slug);
  seen.set(key, now);
  await logEvent({
    evento: "view",
    accountId: acc.id,
    email: acc.email,
    slug,
    propRecId: p?.recId ?? null,
    dettaglio: p?.title ?? slug,
    ip,
    ua,
  });
  return NextResponse.json({ ok: true });
}
