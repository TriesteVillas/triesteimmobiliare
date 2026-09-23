import { NextResponse } from "next/server";
import { listNewSince, digestRowFrom, requestsAirtableUrl } from "@/lib/private/store";
import { digestEmail, sendMail } from "@/lib/private/mail";
import { DIGEST_TO } from "@/lib/private/brand";
import { PC_RICHIESTA_DA_POSTGRES } from "@/lib/private/porta";

// Daily digest of new Private Collection requests (last 24h) to Martino.
// Triggered by Vercel Cron (Authorization: Bearer CRON_SECRET) or ?key=.
// Sends only when there is at least one new request.
//
// ── ⛔ «ZERO» QUI NON VUOL DIRE «NON È ARRIVATO NESSUNO» (24/09/2026) ───────
// `listNewSince()` legge **solo Airtable**. Dal giorno in cui su questo sito si
// accende `PC_RICHIESTA_SORGENTE=pg`, le richieste nascono in Postgres con
// `airtable_id` che comincia per `locale:` e su Airtable non ci arrivano mai —
// per decisione, non per guasto. Questa rotta risponderebbe allora
// `{ ok: true, sent: false, count: 0 }` tutti i giorni, che da fuori si legge
// «giornata tranquilla»: il modo esatto in cui un canale muore senza che
// nessuno se ne accorga.
//
// Da oggi la risposta lo DICHIARA (`sorgente` / `nascita_nel_crm`), e chi
// annuncia le nate in casa è il digest quotidiano del v4 — `lib/pc-arrivi.ts`
// dentro `lib/digest-v4.ts`, sul canale Chat del team. Le due sorgenti sono
// disgiunte per costruzione, quindi nessuna richiesta viene annunciata due
// volte e nessuna resta senza nessuno che la nomini: anche quando la porta
// firmata non risponde e questo sito RIPIEGA su Airtable, quella riga la
// annuncia questa mail, come sempre.
//
// ⛔ Per questo la rotta NON è stata insegnata a leggere Postgres: sarebbe
// codice nuovo sul ramo che stiamo spegnendo, e un secondo annuncio della
// stessa riga il giorno in cui le due strade si sovrappongono.

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
  // Dove questa rotta ha guardato: si dice sempre, non solo quando è a zero.
  const sorgente = {
    sorgente: "airtable" as const,
    nascita_nel_crm: PC_RICHIESTA_DA_POSTGRES,
    ...(PC_RICHIESTA_DA_POSTGRES
      ? { nota: "le richieste nuove nascono in Postgres: qui restano solo quelle del ripiego. Le nate nel CRM le annuncia il digest quotidiano del v4" }
      : {}),
  };
  const recs = await listNewSince(24);
  if (recs.length === 0) {
    return NextResponse.json({ ok: true, sent: false, count: 0, ...sorgente });
  }
  const mail = digestEmail(recs.map(digestRowFrom), requestsAirtableUrl());
  const to = DIGEST_TO;
  const sent = await sendMail(to, mail.subject, mail.html);
  return NextResponse.json({ ok: true, sent, count: recs.length, ...sorgente });
}
