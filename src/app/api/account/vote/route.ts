import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { currentWebAccount } from "@/lib/account/auth";
import { logEvent, upsertPref } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Mi piace / non mi piace con motivazione, stile Private Collection: il voto
// aggiorna lo stato corrente (WEB_PREFERITI) e ogni click resta in timeline
// (WEB_EVENTS) — è il segnale da cui il motore impara che cosa NON proporre.
export async function POST(request: Request) {
  const acc = await currentWebAccount();
  if (!acc) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  let body: { slug?: unknown; vote?: unknown; note?: unknown };
  try {
    body = (await request.json()) as { slug?: unknown; vote?: unknown; note?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim().slice(0, 200);
  const vote = body.vote === "up" ? "up" : body.vote === "down" ? "down" : null;
  const note = String(body.note ?? "").trim().slice(0, 300);
  if (!slug) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const p = await resolveSiteProp(slug);
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  await upsertPref(acc, slug, p?.recId ?? null, {
    voto: vote === "up" ? "Like" : vote === "down" ? "Dislike" : "",
    ...(note ? { votoMotivo: note } : vote === null ? { votoMotivo: "" } : {}),
  });
  await logEvent({
    evento: vote === "up" ? "like" : vote === "down" ? "dislike" : "vote_removed",
    accountId: acc.id,
    email: acc.email,
    slug,
    propRecId: p?.recId ?? null,
    dettaglio: note ? `${p?.title ?? slug} — ${note}` : (p?.title ?? slug),
    ip,
    ua,
  });
  return NextResponse.json({ ok: true });
}
