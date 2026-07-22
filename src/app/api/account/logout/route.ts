import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCT_SITE_URL } from "@/lib/account/brand";
import { ACCT_COOKIE, verifyAcctSession } from "@/lib/account/session";
import { logEvent } from "@/lib/account/store";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const s = await verifyAcctSession(jar.get(ACCT_COOKIE)?.value);
  jar.set(ACCT_COOKIE, "", { path: "/", maxAge: 0 });
  if (s) await logEvent({ evento: "logout", accountId: s.uid, email: s.em });
  return NextResponse.redirect(`${ACCT_SITE_URL}/`);
}
