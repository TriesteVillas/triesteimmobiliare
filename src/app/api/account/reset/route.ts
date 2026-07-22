import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { acctGateConfigured, hashPassword, randomToken, sha256Hex } from "@/lib/account/session";
import { findAccountByEmail, findAccountByResetHash, setPassword, setResetToken, logEvent } from "@/lib/account/store";
import { acctMailConfigured, resetEmail, sendAcctMail, type Lang } from "@/lib/account/mail";

export const runtime = "nodejs";

// Reset password in due mosse sullo stesso endpoint:
//  - {email}            → genera token (2h), salva l'HASH, spedisce il link.
//                         Risposta SEMPRE {ok:true}: mai rivelare quali email
//                         esistono. Se il mailer non è configurato risponde
//                         {ok:true, mail:false} e la UI spiega di scriverci.
//  - {token, password}  → verifica hash+scadenza e imposta la nuova password.

const attempts = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (!acctGateConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.t < WINDOW_MS && a.n >= 8) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  attempts.set(ip, a && now - a.t < WINDOW_MS ? { n: a.n + 1, t: a.t } : { n: 1, t: now });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Fase 2: conferma con token.
  if (typeof body.token === "string" && body.token) {
    const password = String(body.password ?? "");
    if (password.length < 8) return NextResponse.json({ ok: false, error: "password" }, { status: 400 });
    const acc = await findAccountByResetHash(await sha256Hex(body.token));
    if (!acc) return NextResponse.json({ ok: false, error: "token" }, { status: 400 });
    await setPassword(acc.id, await hashPassword(password));
    await logEvent({ evento: "prefs_update", accountId: acc.id, email: acc.email, dettaglio: "password reimpostata", ip });
    return NextResponse.json({ ok: true });
  }

  // Fase 1: richiesta.
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  const acc = await findAccountByEmail(email);
  if (acc && acc.stato === "Attivo") {
    const token = randomToken();
    await setResetToken(acc.id, await sha256Hex(token), new Date(now + 2 * 3600_000).toISOString());
    if (acctMailConfigured()) {
      const lang = (["it", "en", "de"].includes(acc.lingua) ? acc.lingua : "it") as Lang;
      const m = resetEmail(lang, acc.nome.split(" ")[0] ?? "", token);
      await sendAcctMail(acc.email, m.subject, m.html);
    }
  }
  return NextResponse.json({ ok: true, mail: acctMailConfigured() });
}
