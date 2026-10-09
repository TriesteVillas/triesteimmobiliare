import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ACCT_SESSION_DAYS } from "@/lib/account/brand";
import { ACCT_COOKIE, acctGateConfigured, credFingerprint, hashPassword, signAcctSession } from "@/lib/account/session";
import { createAccount, findAccountByEmail, logEvent, upsertPref } from "@/lib/account/store";
import { resolveSiteProp } from "@/lib/account/props";
import { aggancioLead, gettoneBuono } from "@/lib/account/benvenuto";
import { pAccountInvito, pAccountInvitoUsato } from "@/lib/private/porta";

export const runtime = "nodejs";

// Lo spazio personale già pronto (09/10/2026): il modulo di
// /account/benvenuto. Il cliente ha in mano il link personale che il CRM gli
// ha mandato e sceglie una password; qui nasce l'account, con le stesse
// regole della registrazione (/api/account/register): password di almeno 8
// caratteri, informativa, i due consensi facoltativi, gli stessi limiti.
//
// ⚠️ DEL MODULO NON CI SI FIDA. Email e nome arrivano dal CRM, riletti adesso
// dalla porta col gettone: chi compila sceglie solo la password e i consensi.
// L'email è provata — il link l'ha ricevuto quella casella — quindi l'account
// nasce verificato e agganciato alla scheda che dice il CRM (store.ts,
// createAccount con leadId o senzaLead), senza cercarne né crearne altre.

const attempts = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;

const LANGS = new Set(["it", "en", "de", "sl"]);

export async function POST(request: Request) {
  if (!acctGateConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  // Solo dal sito stesso, come /api/account/verify: questa rotta apre una
  // sessione, e un modulo di un altro sito non deve poter far entrare il
  // browser di qualcuno in un account.
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
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.t < WINDOW_MS && a.n >= MAX_ATTEMPTS)
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  attempts.set(ip, a && now - a.t < WINDOW_MS ? { n: a.n + 1, t: a.t } : { n: 1, t: now });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const k = body.k;
  const password = String(body.password ?? "");
  const consMarketing = body.consMarketing === true;
  const consProfilazione = body.consProfilazione === true;
  const favs = Array.isArray(body.favs) ? (body.favs as unknown[]).map(String).slice(0, 30) : [];

  if (!gettoneBuono(k)) return NextResponse.json({ ok: false, error: "link", motivo: "sconosciuto" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ ok: false, error: "password" }, { status: 400 });
  // L'informativa: una casella da spuntare, non dedotta dal clic sul bottone.
  if (body.privacy !== true) return NextResponse.json({ ok: false, error: "privacy" }, { status: 400 });

  const invito = await pAccountInvito(k);
  if (invito.tipo === "guasto") return NextResponse.json({ ok: false, error: "porta" }, { status: 503 });
  if (invito.tipo === "no") return NextResponse.json({ ok: false, error: "link", motivo: invito.motivo }, { status: 410 });

  // Il nome è quello del CRM; solo se lì manca lo scrive chi compila (la
  // registrazione lo chiede sempre, almeno due lettere).
  const nome = invito.nome.length >= 2 ? invito.nome : String(body.nome ?? "").trim().slice(0, 120);
  if (nome.length < 2) return NextResponse.json({ ok: false, error: "name" }, { status: 400 });
  // La lingua della pagina in cui ha attivato lo spazio; se non è una delle
  // nostre, quella dell'invito.
  const lingua = LANGS.has(String(body.lingua)) ? String(body.lingua) : invito.lingua;
  const email = invito.email;

  // Ricontrollo a ridosso della scrittura: la pagina l'ha già guardato, ma fra
  // la pagina e il clic la persona può essersi registrata da sola.
  // Il gettone qui NON si chiude: «esisteva» vuol dire «è entrata dal link», e
  // non è ancora vero. Il modulo ricarica la pagina, che mostra l'accesso; a
  // login fatto la pagina la trova dentro e lo dice lei al CRM (vista «dentro»).
  let existing;
  try {
    existing = await findAccountByEmail(email);
  } catch (e) {
    console.error("[acct] benvenuto: lettura account fallita:", e);
    return NextResponse.json({ ok: false, error: "porta" }, { status: 503 });
  }
  if (existing) return NextResponse.json({ ok: false, error: "exists" }, { status: 409 });

  const hash = await hashPassword(password);
  let id: string | null;
  try {
    id = await createAccount({
      email,
      nome,
      hash,
      emailVerificata: true,
      lingua,
      consMarketing,
      consProfilazione,
      ...aggancioLead(invito.leadRec),
    });
  } catch (e) {
    // Airtable ha detto no: niente account, il gettone resta aperto e il
    // modulo dice «riprova tra qualche minuto».
    console.error("[acct] benvenuto: creazione account fallita:", e);
    return NextResponse.json({ ok: false, error: "store" }, { status: 503 });
  }
  if (!id) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  await logEvent({ evento: "signup", accountId: id, email, ip, ua, dettaglio: "invito dal CRM (spazio già pronto)" });
  await pAccountInvitoUsato(k, "creato");

  // I cuori messi da anonimo su questo dispositivo vengono con lui, come alla
  // registrazione. Best-effort: un errore non blocca l'attivazione.
  for (const slug of favs) {
    try {
      const p = await resolveSiteProp(slug);
      await upsertPref({ id, email }, slug, p?.recId ?? null, { cuore: true });
      await logEvent({
        evento: "fav_add",
        accountId: id,
        email,
        slug,
        propRecId: p?.recId ?? null,
        dettaglio: `${p?.title ?? slug} (migrato da anonimo)`,
      });
    } catch (e) {
      console.error("[acct] fav migration failed:", e);
    }
  }

  // La sessione, come al login: impronta della password compresa (auth.ts).
  const exp = Math.floor(Date.now() / 1000) + ACCT_SESSION_DAYS * 86400;
  const token = await signAcctSession({
    uid: id,
    em: email,
    nm: nome.split(" ")[0] || email,
    exp,
    pf: await credFingerprint(hash),
  });
  const jar = await cookies();
  jar.set(ACCT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCT_SESSION_DAYS * 86400,
  });
  return NextResponse.json({ ok: true, nome: nome.split(" ")[0] || nome, migrated: favs.length });
}
