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

// Rate-limit per sessione, IDENTICO a quello di /api/private/vote (40 eventi/ora).
// Il de-dupe locale non basta come freno: copre lo stesso slug, quindi un ciclo con
// slug sempre DIVERSI passa dritto e costa a ogni colpo una findGrantById + una
// getPrivateProperty + una recentViewExists su Airtable. Il tetto di 5 req/s per base
// è condiviso con la ISR del sito pubblico e col CRM: un ospite che lo satura non
// rompe solo il tracking, rompe tutto ciò che legge quella base. In più il CRM
// aggrega le visite sulle ultime 1000 righe view/thumb_ senza finestra temporale,
// quindi allagare il log di "view" spinge fuori finestra le visite degli ALTRI
// clienti — cioè riproduce esattamente il guasto che questa feature deve chiudere.
const MAX_PER_HOUR = 40;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();
function limited(rid: string): boolean {
  const now = Date.now();
  if (hits.size > 500) for (const [k, arr] of hits) if (!arr.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  const arr = (hits.get(rid) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(rid, arr);
  return arr.length > MAX_PER_HOUR;
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

  // Ordine deliberato: prima i due freni che NON costano I/O (fast-path locale e
  // rate-limit), poi il grant. Prima il grant check stava sopra, quindi anche una
  // richiesta poi scartata come duplicato pagava comunque una lista Airtable.
  if (isRecentLocal(`${session.rid}:${slug}`)) return NextResponse.json({ ok: true, deduped: true });
  if (limited(session.rid)) return NextResponse.json({ ok: false, error: "rate" });

  // Re-check the grant is live (same guarantee as the pages).
  const g = await findGrantById(session.rid);
  if (!g || !isActive(g)) return NextResponse.json({ ok: false });

  // Ground truth: resolve the property server-side and use ITS title (ignore client input).
  const p = await getPrivateProperty(slug);
  if (!p) return NextResponse.json({ ok: false });
  const title = p.title;

  // De-dupe durevole sullo SLUG, non sul titolo: è la chiave stabile (e quella su
  // cui il CRM aggrega). Sul titolo due immobili omonimi si annullavano a vicenda e
  // una rinomina dentro la finestra faceva contare due volte la stessa view.
  const sinceIso = new Date(Date.now() - DEDUP_MS).toISOString();
  if (await recentViewExists(g.codice, slug, sinceIso)) return NextResponse.json({ ok: true, deduped: true });

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const ua = h.get("user-agent") ?? "";
  // `dettaglio` = titolo leggibile (com'è sempre stato), `slug` = chiave stabile
  // su cui il CRM aggrega le view per immobile.
  await logAccess({ evento: "view", codice: g.codice, email: g.email, ip, ua, dettaglio: title, slug, requestId: g.id });
  return NextResponse.json({ ok: true });
}
