import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifySession, PC_COOKIE } from "@/lib/private/session";
import { findGrantById, isActive, logAccess, recentViewExists } from "@/lib/private/store";
import { getPrivateProperty } from "@/lib/airtable";

export const runtime = "nodejs";

// Best-effort per-property view logging for the Private Collection. Called once
// from the client when a gated property page mounts. Writes a "view" event to
// PC_ACCESS_LOG (codice + email + property title) so the CRM can show which
// properties each authenticated user actually opened. Never affects the page.
//
// Trust boundary: the property is resolved server-side from the slug (the client
// title is ignored) and must be a real private property; unknown slugs are dropped.
// De-dupe is two-layer: a per-instance fast-path map, then a durable Airtable check
// (so counts aren't inflated by a refresh / second tab hitting another lambda).

const DEDUP_MS = 30 * 60 * 1000;

// Per-instance fast-path: kills rapid double-mounts (StrictMode) without an Airtable hit.
const seen = new Map<string, number>();
function isRecentLocal(key: string): boolean {
  const now = Date.now();
  if (seen.size > 1000) for (const [k, t] of seen) if (now - t > DEDUP_MS) seen.delete(k);
  const last = seen.get(key);
  seen.set(key, now);
  return last !== undefined && now - last < DEDUP_MS;
}

export async function POST(request: Request) {
  const jar = await cookies();
  const session = await verifySession(jar.get(PC_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false });

  let body: { slug?: string };
  try {
    body = (await request.json()) as { slug?: string };
  } catch {
    body = {};
  }
  const slug = String(body.slug ?? "").slice(0, 200);
  if (!slug) return NextResponse.json({ ok: false });

  // Re-check the grant is live (same guarantee as the pages).
  const g = await findGrantById(session.rid);
  if (!g || !isActive(g)) return NextResponse.json({ ok: false });

  // Ground truth: resolve the property server-side and use ITS title (ignore client input).
  const p = await getPrivateProperty(slug);
  if (!p) return NextResponse.json({ ok: false });
  const title = p.title;

  if (isRecentLocal(`${session.rid}:${slug}`)) return NextResponse.json({ ok: true, deduped: true });
  const sinceIso = new Date(Date.now() - DEDUP_MS).toISOString();
  if (await recentViewExists(g.codice, title, sinceIso)) return NextResponse.json({ ok: true, deduped: true });

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const ua = h.get("user-agent") ?? "";
  // `dettaglio` = titolo leggibile (com'è sempre stato), `slug` = chiave stabile
  // su cui il CRM aggrega le view per immobile.
  await logAccess({ evento: "view", codice: g.codice, email: g.email, ip, ua, dettaglio: title, slug, requestId: g.id });
  return NextResponse.json({ ok: true });
}
