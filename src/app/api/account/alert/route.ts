import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { currentWebAccount } from "@/lib/account/auth";
import { logEvent, upsertPref } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";

export const runtime = "nodejs";

// Avviso di prezzo (solo loggati): "scrivimi se questa casa cala di prezzo".
// Il prezzo di riferimento lo fissa il SERVER dal listino corrente — mai dal
// client: è la soglia sotto cui il loop CRM (web_price_alerts) notifica.
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
  // Un avviso su un immobile inesistente o senza prezzo pubblico non ha senso:
  // niente riga fantasma a DB.
  if (on && (!p || p.priceSale == null)) {
    return NextResponse.json({ ok: false, error: "no_price" }, { status: 422 });
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";

  await upsertPref(acc, slug, p?.recId ?? null, {
    avvisoPrezzo: on,
    ...(on ? { prezzoRiferimento: p!.priceSale } : {}),
  });
  await logEvent({
    evento: on ? "alert_on" : "alert_off",
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
