import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { acctGateConfigured, hashPassword, randomToken, sha256Hex } from "@/lib/account/session";
import {
  confermaEmail,
  findAccountByEmail,
  findAccountByResetHash,
  setPassword,
  setResetToken,
  logEvent,
} from "@/lib/account/store";
import { acctMailConfigured, resetEmail, sendAcctMail, type Lang } from "@/lib/account/mail";

export const runtime = "nodejs";

// Reset password in due mosse sullo stesso endpoint:
//  - {email}            → genera token (2h), salva l'HASH, spedisce il link.
//                         Risposta SEMPRE {ok:true}: mai rivelare quali email
//                         esistono. Se il mailer non è configurato risponde
//                         {ok:true, mail:false} e la UI spiega di scriverci.
//  - {token, password}  → verifica hash+scadenza e imposta la nuova password.
//                         Il token è arrivato alla casella: è anche la prova
//                         dell'email (09/10/2026), quindi un account non ancora
//                         verificato da qui si verifica e si aggancia al lead.
//                         La password nuova cambia l'impronta delle sessioni
//                         (auth.ts): quelle aperte prima, da chiunque, cadono.

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
    if (!acc.emailVerificata && acc.stato === "Attivo") {
      // La password è già cambiata: se l'aggancio al lead si inceppa, il reset
      // resta riuscito e l'email si conferma più tardi dall'avviso in /account.
      try {
        await confermaEmail(acc, "reset");
        await logEvent({ evento: "verify_email", accountId: acc.id, email: acc.email, dettaglio: "confermata dal reset", ip });
      } catch (e) {
        console.error("[acct] conferma email dal reset fallita:", e);
      }
    }
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
      const lang = (["it", "en", "de", "sl"].includes(acc.lingua) ? acc.lingua : "it") as Lang;
      const m = resetEmail(lang, acc.nome.split(" ")[0] ?? "", token);
      await sendAcctMail(acc.email, m.subject, m.html);
    }
  }
  return NextResponse.json({ ok: true, mail: acctMailConfigured() });
}
