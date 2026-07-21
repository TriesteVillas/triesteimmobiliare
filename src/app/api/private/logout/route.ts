import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PC_COOKIE } from "@/lib/private/session";

// Il logout riporta al gate NELLA LINGUA da cui si è usciti. Prima rimandava
// sempre a "/private": un utente DE o EN che si disconnetteva si ritrovava sulla
// versione italiana. La lingua arriva dal link (?l=), non dal referer, perché il
// referer può mancare.
const LOCALES = new Set(["it", "en", "de"]);

export async function GET(request: Request) {
  const jar = await cookies();
  jar.delete(PC_COOKIE);
  const l = new URL(request.url).searchParams.get("l") ?? "";
  const dest = LOCALES.has(l) ? `/${l}/private` : "/private";
  return NextResponse.redirect(new URL(dest, request.url));
}
