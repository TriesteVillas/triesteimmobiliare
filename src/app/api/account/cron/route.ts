import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { runEngine } from "@/lib/account/engine";

export const runtime = "nodejs";
export const maxDuration = 300;

// Cron notturno del motore di intelligenza account: engagement score,
// profilo_ai, matching → WEB_MATCHES. Autorizzazione identica agli altri cron
// del sito: Bearer CRON_SECRET (Vercel) o ?key= per il run manuale.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runEngine();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[acct-cron] engine failed:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
