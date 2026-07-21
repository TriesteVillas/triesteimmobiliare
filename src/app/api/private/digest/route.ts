import { NextResponse } from "next/server";
import { listNewSince, digestRowFrom, requestsAirtableUrl } from "@/lib/private/store";
import { digestEmail, sendMail } from "@/lib/private/mail";
import { DIGEST_TO } from "@/lib/private/brand";

// Daily digest of new Private Collection requests (last 24h) to Martino.
// Triggered by Vercel Cron (Authorization: Bearer CRON_SECRET) or ?key=.
// Sends only when there is at least one new request.

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  return (
    request.headers.get("authorization") === `Bearer ${secret}` ||
    url.searchParams.get("key") === secret
  );
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const recs = await listNewSince(24);
  if (recs.length === 0) {
    return NextResponse.json({ ok: true, sent: false, count: 0 });
  }
  const mail = digestEmail(recs.map(digestRowFrom), requestsAirtableUrl());
  const to = DIGEST_TO;
  const sent = await sendMail(to, mail.subject, mail.html);
  return NextResponse.json({ ok: true, sent, count: recs.length });
}
