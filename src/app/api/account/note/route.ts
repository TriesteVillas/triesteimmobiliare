import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { currentWebAccount } from "@/lib/account/auth";
import { logEvent, upsertPref } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Appunti personali e budget lavori/arredo su un immobile salvato (area
// riservata). Dati PRIVATI dell'utente: vivono su WEB_PREFERITI, mai mostrati
// ad altri; il budget entra nell'aritmetica della tabella costi.
export async function POST(request: Request) {
  const acc = await currentWebAccount();
  if (!acc) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  let body: { slug?: unknown; nota?: unknown; budgetLavori?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim().slice(0, 200);
  if (!slug) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const patch: { nota?: string; budgetLavori?: number | null } = {};
  if (typeof body.nota === "string") patch.nota = body.nota.trim().slice(0, 2000);
  if (body.budgetLavori === null) patch.budgetLavori = null;
  if (typeof body.budgetLavori === "number" && Number.isFinite(body.budgetLavori)) {
    patch.budgetLavori = Math.max(0, Math.min(10_000_000, Math.round(body.budgetLavori)));
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true, noop: true });

  const p = await resolveSiteProp(slug);
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  await upsertPref(acc, slug, p?.recId ?? null, patch);
  if (patch.nota !== undefined) {
    await logEvent({
      evento: "note_update",
      accountId: acc.id,
      email: acc.email,
      slug,
      propRecId: p?.recId ?? null,
      dettaglio: p?.title ?? slug,
      ip,
      ua,
    });
  }
  return NextResponse.json({ ok: true });
}
