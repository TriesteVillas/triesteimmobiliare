import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ACCT_SESSION_DAYS } from "@/lib/account/brand";
import { currentWebAccount } from "@/lib/account/auth";
import {
  ACCT_COOKIE,
  acctGateConfigured,
  credFingerprint,
  readVerifyToken,
  signAcctSession,
  verifyPassword,
} from "@/lib/account/session";
import { confermaEmail, getAccount, logEvent, registerLogin } from "@/lib/account/store";
import { sendVerifyMail } from "@/lib/account/mail";
import { esitoVerifica } from "@/lib/account/verifica";

export const runtime = "nodejs";

// Verifica dell'email (09/10/2026), due mosse sullo stesso endpoint come /reset:
//  - {token, password?} → il clic sul link della mail. Conferma solo se chi
//                         clicca prova anche la credenziale dell'account: la
//                         sessione aperta in questo browser, oppure la password
//                         (il perché in lib/account/verifica.ts). Con la
//                         password si entra anche nell'account.
//  - {resend: true}     → un link nuovo all'account loggato e non verificato.
// Confermata la casella, l'account si aggancia al lead (confermaEmail): è da
// lì in poi che /account mostra le visite in programma.

const byIp = new Map<string, { n: number; t: number }>();
const byKey = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;

function limited(map: Map<string, { n: number; t: number }>, key: string, max: number): boolean {
  const now = Date.now();
  const a = map.get(key);
  if (a && now - a.t < WINDOW_MS && a.n >= max) return true;
  map.set(key, a && now - a.t < WINDOW_MS ? { n: a.n + 1, t: a.t } : { n: 1, t: now });
  return false;
}

export async function POST(request: Request) {
  if (!acctGateConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  // Solo dal sito stesso, come /api/concierge/lettera: con la password questa
  // rotta apre una sessione, e un modulo di un altro sito (JSON spedito come
  // text/plain) non deve poter far entrare il browser di qualcuno in un account
  // scelto da lui. ⚠️ /login e /register non hanno ancora questo controllo.
  const origine = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (origine) {
    try {
      if (new URL(origine).host !== host) return NextResponse.json({ ok: false, error: "origin" }, { status: 403 });
    } catch {
      return NextResponse.json({ ok: false, error: "origin" }, { status: 403 });
    }
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const ua = h.get("user-agent") ?? "";
  if (limited(byIp, ip, 12)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // ---- Un link nuovo -----------------------------------------------------------
  if (body.resend === true) {
    const cur = await currentWebAccount();
    if (!cur) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
    if (cur.emailVerificata) return NextResponse.json({ ok: true, gia: true });
    if (limited(byKey, `invio:${cur.id}`, 3)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
    const inviata = await sendVerifyMail(cur);
    if (inviata) {
      await logEvent({ evento: "verify_email", accountId: cur.id, email: cur.email, ip, ua, dettaglio: "link inviato di nuovo" });
    }
    return NextResponse.json({ ok: true, mail: inviata });
  }

  // ---- Il clic sul link --------------------------------------------------------
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const dati = await readVerifyToken(token);
  const acc = dati ? await getAccount(dati.uid) : null;
  const cur = acc ? await currentWebAccount() : null;
  const stessaSessione = !!acc && cur?.id === acc.id;
  if (acc && password && !stessaSessione && limited(byKey, `pw:${acc.id}`, 6)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }
  const passwordGiusta = !!acc && !!password && !stessaSessione && (await verifyPassword(password, acc.hash));
  const esito = esitoVerifica({
    dati,
    account: acc && { id: acc.id, email: acc.email, stato: acc.stato, verificata: acc.emailVerificata },
    sessioneDi: cur?.id ?? null,
    passwordGiusta,
  });

  if (esito === "token" || !acc) return NextResponse.json({ ok: false, error: "token" }, { status: 400 });
  if (esito === "gia") return NextResponse.json({ ok: true, gia: true });
  if (esito === "credenziale") {
    if (password) {
      await logEvent({ evento: "login_fail", accountId: acc.id, email: acc.email, ip, ua, dettaglio: "password errata (verifica email)" });
    }
    return NextResponse.json({ ok: false, error: password ? "invalid" : "password_needed" }, { status: 401 });
  }

  await confermaEmail(acc, "link");
  await logEvent({ evento: "verify_email", accountId: acc.id, email: acc.email, ip, ua, dettaglio: "confermata dal link" });

  // Provata con la password da un browser senza sessione: si entra. Stessa
  // sessione di /login, impronta della password compresa.
  if (!stessaSessione) {
    const exp = Math.floor(Date.now() / 1000) + ACCT_SESSION_DAYS * 86400;
    const sess = await signAcctSession({
      uid: acc.id,
      em: acc.email,
      nm: acc.nome.split(" ")[0] || acc.email,
      exp,
      pf: await credFingerprint(acc.hash),
    });
    const jar = await cookies();
    jar.set(ACCT_COOKIE, sess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCT_SESSION_DAYS * 86400,
    });
    await registerLogin(acc);
    await logEvent({ evento: "login_ok", accountId: acc.id, email: acc.email, ip, ua, dettaglio: "password (verifica email)" });
  }
  return NextResponse.json({ ok: true });
}
