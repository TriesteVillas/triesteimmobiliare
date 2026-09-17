import { NextResponse } from "next/server";
import {
  listApprovedNeedingCredential, ensureCredential, markCredentialSent,
  listExpiredNeedingCourtesy, markExpired, detectAbuse,
} from "@/lib/private/store";
import { credentialEmail, expiryEmail, mailConfigured, sendMail } from "@/lib/private/mail";
import { MAIL_REPLY_TO } from "@/lib/private/brand";

// Processor for the Private Collection lifecycle. Triggered by Vercel Cron
// (which sends `Authorization: Bearer ${CRON_SECRET}`) or manually with
// `?key=${CRON_SECRET}`. Idempotent: guarded by the credenziali_inviate /
// cortesia_inviata checkboxes, so re-runs are safe.
//   1) Approved + no credential yet → issue a code and email it (luxury@) —
//      MA NON SUBITO: dal 16/09/2026 una riga emessa da meno di PC_GRAZIA_MIN
//      minuti (default 120) si lascia all'operatore del CRM, che può scrivere
//      con parole sue e nella lingua giusta. Il perché, coi due casi che l'hanno
//      pagata, sta su `listApprovedNeedingCredential` in lib/private/store.ts.
//      The
//      duration is NOT fixed at 15 days: 15 is the floor this cron applies when it
//      has to mint the code itself (row flipped to Approved by hand on Airtable).
//      When the CRM approved it, code and expiry are already on the record and this
//      cron only delivers them — which is why the email must state the REAL span.
//   2) Past expiry → courtesy email + mark Expired.
//   3) Abuse heuristic → flag Under review.

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

// Giorni residui, arrotondati e mai sotto 1: è il numero che finisce nella mail,
// quindi deve descrivere il codice che il cliente ha in mano, non un default.
function daysUntil(ms: number): number {
  return Math.max(1, Math.round((ms - Date.now()) / 86_400_000));
}

function fmtDate(ms: number, lang: string): string {
  const loc = lang === "it" ? "it-IT" : lang === "de" ? "de-DE" : "en-GB";
  return new Date(ms).toLocaleDateString(loc, { day: "2-digit", month: "long", year: "numeric" });
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result: {
    issued: number; expired: number; flagged: number; mail: boolean;
    attesa: { id: string; email: string; fraMinuti: number }[];
  } = { issued: 0, expired: 0, flagged: 0, mail: mailConfigured(), attesa: [] };

  const coda = await listApprovedNeedingCredential();
  // Le righe trattenute si DICHIARANO nella risposta: un cron che tace non si
  // distingue da un cron che non ha trovato niente.
  result.attesa = coda.inAttesa;
  for (const g of coda.daServire) {
    try {
      const { code, expiresAtMs } = await ensureCredential(g);
      const mail = credentialEmail(g.lingua, g.nome, code, fmtDate(expiresAtMs, g.lingua), daysUntil(expiresAtMs));
      const sent = await sendMail(g.email, mail.subject, mail.html, MAIL_REPLY_TO);
      if (sent) {
        await markCredentialSent(g.id);
        result.issued++;
      }
    } catch (e) {
      console.error("[pc cron] credential issue failed:", g.id, e);
    }
  }

  for (const g of await listExpiredNeedingCourtesy()) {
    try {
      const mail = expiryEmail(g.lingua, g.nome);
      await sendMail(g.email, mail.subject, mail.html, MAIL_REPLY_TO);
      await markExpired(g.id);
      result.expired++;
    } catch (e) {
      console.error("[pc cron] expiry failed:", g.id, e);
    }
  }

  try {
    result.flagged = await detectAbuse();
  } catch (e) {
    console.error("[pc cron] abuse scan failed:", e);
  }

  return NextResponse.json({ ok: true, ...result });
}
