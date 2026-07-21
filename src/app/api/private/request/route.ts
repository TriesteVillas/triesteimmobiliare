import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createLeadAndRequest } from "@/lib/private/store";
import { ackEmail, sendMail, type Lang } from "@/lib/private/mail";
import { MAIL_REPLY_TO } from "@/lib/private/brand";
import { BUDGET_BANDS } from "@/lib/private/bands";

// Private Collection credential request from the public ghost-card form.
// Creates a tagged LEAD_ (fonte = PRIVATE COLLECTION) + a PC_RICHIESTE row
// (status New) and sends a localized acknowledgement. NO credential is issued
// here — that happens only after Martino approves (see /api/private/cron).

const ZONES = new Set([
  "CENTRO", "SEMICENTRO", "COSTIERA", "BARCOLA", "BARCOLA-MIRAMARE",
  "ALTE", "MUGGIA", "SISTIANA-DUINO", "FVG",
]);
const BANDS = new Set<string>(BUDGET_BANDS);

const isEmail = (v: unknown): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v: unknown, max = 300): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Best-effort per-instance rate limit (serverless instances are short-lived;
// this just blunts bursts — real abuse control is the manual approval gate).
const hits = new Map<string, number[]>();
function limited(ip: string, max = 6, windowMs = 600_000): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

export async function POST(request: Request) {
  if (!process.env.AIRTABLE_TOKEN && !process.env.LEADS_AIRTABLE_TOKEN) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  if (ip && limited(ip)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const nome = clean(body.nome, 120);
  const cognome = clean(body.cognome, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const nazionalita = clean(body.nazionalita, 80);
  const intro = clean(body.intro, 500);
  const zone = (Array.isArray(body.zone) ? body.zone : [])
    .map((z) => clean(z, 40))
    .filter((z) => ZONES.has(z));
  const bands = (Array.isArray(body.bands) ? body.bands : [])
    .map((b) => clean(b, 10))
    .filter((b) => BANDS.has(b));
  const immobileTrigger = clean(body.immobileTrigger, 40);
  const lingua = (["it", "en", "de"].includes(clean(body.lingua)) ? clean(body.lingua) : "it") as Lang;

  if (body.privacyOk !== true) {
    return NextResponse.json({ ok: false, error: "privacy_required" }, { status: 400 });
  }
  if (!isEmail(email) || nome.length < 2 || cognome.length < 2) {
    return NextResponse.json({ ok: false, error: "contact_info" }, { status: 400 });
  }
  if (telefono.length < 6) {
    return NextResponse.json({ ok: false, error: "phone_required" }, { status: 400 });
  }

  try {
    await createLeadAndRequest({
      nome, cognome, email, telefono, nazionalita, intro, zone, bands, immobileTrigger, lingua,
    });
  } catch (e) {
    console.error("[pc] request save failed:", e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }

  // Acknowledgement (best-effort): the saved request is the source of truth.
  const ack = ackEmail(lingua, nome);
  await sendMail(email, ack.subject, ack.html, MAIL_REPLY_TO);

  return NextResponse.json({ ok: true });
}
