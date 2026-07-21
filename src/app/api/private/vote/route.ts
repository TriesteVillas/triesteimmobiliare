import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifySession, PC_COOKIE } from "@/lib/private/session";
import { findGrantById, isActive, logAccess, type AccessEvent } from "@/lib/private/store";
import { getPrivateProperty } from "@/lib/airtable";

export const runtime = "nodejs";

// Pollice su/giù (+ nota opzionale) per gli immobili della Private Collection.
// Stesso trust boundary di /api/private/track: sessione firmata → grant ancora
// vivo su Airtable → immobile risolto SERVER-SIDE dallo slug (titolo del client
// ignorato). Il feedback finisce in PC_ACCESS_LOG come evento thumb_up /
// thumb_down / thumb_removed, così il CRM lo legge accanto alle view senza
// bisogno di una tabella nuova. Nessun GET: lo stato "corrente" del voto vive
// nel localStorage del client — qui logghiamo solo la timeline degli eventi.

// Rate-limit leggero per sessione (per-instance, come il rate-limit di
// /api/private/request): 40 eventi/ora bastano a chi sfoglia tutto il catalogo
// e fermano un client impazzito che martella il log.
const MAX_PER_HOUR = 40;
const WINDOW_MS = 60 * 60 * 1000;
const votes = new Map<string, number[]>();
function limited(rid: string): boolean {
  const now = Date.now();
  if (votes.size > 500) for (const [k, arr] of votes) if (!arr.some((t) => now - t < WINDOW_MS)) votes.delete(k);
  const arr = (votes.get(rid) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  votes.set(rid, arr);
  return arr.length > MAX_PER_HOUR;
}

export async function POST(request: Request) {
  const jar = await cookies();
  const session = await verifySession(jar.get(PC_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false });

  let body: { slug?: string; vote?: unknown; note?: unknown };
  try {
    body = (await request.json()) as { slug?: string; vote?: unknown; note?: unknown };
  } catch {
    body = {};
  }
  const slug = String(body.slug ?? "").slice(0, 200);
  // vote: "up" | "down" | null (null = ritiro del voto). Tutto il resto è drop.
  const vote = body.vote === "up" || body.vote === "down" || body.vote === null ? body.vote : undefined;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
  if (!slug || vote === undefined) return NextResponse.json({ ok: false });

  if (limited(session.rid)) return NextResponse.json({ ok: false, error: "rate" });

  // Re-check the grant is live (same guarantee as the pages).
  const g = await findGrantById(session.rid);
  if (!g || !isActive(g)) return NextResponse.json({ ok: false });

  // Ground truth: resolve the property server-side and use ITS title.
  const p = await getPrivateProperty(slug);
  if (!p) return NextResponse.json({ ok: false });

  const evento: AccessEvent =
    vote === "up" ? "thumb_up" : vote === "down" ? "thumb_down" : "thumb_removed";
  const dettaglio = `${p.title}${note ? " · nota: " + note : ""}`;

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  const ua = h.get("user-agent") ?? "";
  // Come per /api/private/track: `dettaglio` è la prosa (titolo + nota),
  // `slug` la chiave stabile su cui il CRM aggrega il feedback per immobile.
  await logAccess({ evento, codice: g.codice, email: g.email, ip, ua, dettaglio, slug, requestId: g.id });
  return NextResponse.json({ ok: true });
}
