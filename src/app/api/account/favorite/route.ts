import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { currentWebAccount } from "@/lib/account/auth";
import { logEvent, upsertPref } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Toggle del cuore per un utente loggato. Il titolo che finisce a log lo
// risolve il SERVER dallo slug (mai fidarsi del testo del client).
export async function POST(request: Request) {
  const acc = await currentWebAccount();
  if (!acc) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  let body: { slug?: unknown; on?: unknown };
  try {
    body = (await request.json()) as { slug?: unknown; on?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim().slice(0, 200);
  const on = body.on === true;
  if (!slug) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const p = await resolveSiteProp(slug);
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  await upsertPref(acc, slug, p?.recId ?? null, { cuore: on });
  await logEvent({
    evento: on ? "fav_add" : "fav_remove",
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
