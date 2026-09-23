import { NextResponse } from "next/server";
import {
  listApprovedNeedingCredential, ensureCredential, markCredentialSent,
  listExpiredNeedingCourtesy, markExpired, detectAbuse,
} from "@/lib/private/store";
import { credentialEmail, expiryEmail, mailConfigured, sendMail, inviaMail, MITTENTE_EFFETTIVO } from "@/lib/private/mail";
import { segnalaConsegnaCredenziali, PC_TRACCIA_CRON } from "@/lib/private/porta";
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
//      ⚠️ Dal 23/09/2026 ogni tentativo — riuscito o no — viene DICHIARATO al
//      CRM v4 (azione `credenziali-spedite` della porta firmata), e i
//      fallimenti si contano nella risposta invece di sparire. L'interruttore è
//      `PC_TRACCIA_CRON=pg`, e senza di lui non cambia niente.
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
    /* ⛔ `flagged: 0` NON vuol dire «nessun abuso» se il registro letto è
       fermo. Dal 23/09/2026 la differenza si legge qui invece che nel codice:
       `attendibile:false` = non ho potuto guardare. Misurato quel giorno:
       PC_ACCESS_LOG su Airtable è fermo al 26/08, e per 28 giorni questo
       campo ha risposto «0» a ogni giro. */
    antiAbuso: { attendibile: boolean; ultimoAccessoNoto: string | null;
                 perche?: string; guardiaVera?: string };
    attesa: { id: string; email: string; fraMinuti: number }[];
    /* ⚠️ I FALLIMENTI SI CONTANO E SI DICONO (23/09/2026).
       Prima questo giro contava solo i successi: `sendMail` torna `false` e non
       dice perché, e la riga non servita restava nella coda a ripresentarsi
       a ogni giro — per sempre, senza che niente lo dicesse. E qui un giro è
       UN GIORNO (`0 6 * * *`): una riga non servita stamattina si ripresenta
       domani mattina, non fra quindici minuti. Il caso
       misurato: `recKPr7u9PQ2GD8He` (codice emesso il 01/09/2026) soddisfa
       questo filtro da 22 giorni, ~2.100 passaggi, zero righe di log.
       Un cron che dichiara solo i successi è un cron che dice «tutto bene»
       mentre una persona aspetta da tre settimane. */
    falliti: { id: string; email: string; perche: string }[];
    /* Cosa ha detto la porta del CRM, quando l'interruttore è acceso: una
       traccia che non si scrive deve vedersi qui, non sparire. */
    traccia: { acceso: boolean; scritte: number; guasti: number };
  } = {
    issued: 0, expired: 0, flagged: 0, mail: mailConfigured(), attesa: [],
    antiAbuso: { attendibile: false, ultimoAccessoNoto: null,
                 perche: "non ancora eseguito" },
    falliti: [], traccia: { acceso: PC_TRACCIA_CRON, scritte: 0, guasti: 0 },
  };

  const coda = await listApprovedNeedingCredential();
  // Le righe trattenute si DICHIARANO nella risposta: un cron che tace non si
  // distingue da un cron che non ha trovato niente.
  result.attesa = coda.inAttesa;
  for (const g of coda.daServire) {
    // Fuori dal `try` perché servono al `finally`: una mail partita deve essere
    // dichiarata al CRM anche se a saltare è il PATCH del flag SUBITO DOPO. È
    // il caso peggiore di tutti — la password è in viaggio, il flag è spento,
    // e al giro successivo il cliente riceve la stessa lettera — e finora non
    // lasciava nemmeno una riga a dire che era successo.
    let code = "";
    let oggetto = "";
    let esito: { inviata: true } | { inviata: false; perche: string } | null = null;
    try {
      const creata = await ensureCredential(g);
      code = creata.code;
      const mail = credentialEmail(g.lingua, g.nome, code,
        fmtDate(creata.expiresAtMs, g.lingua), daysUntil(creata.expiresAtMs));
      oggetto = mail.subject;
      esito = await inviaMail(g.email, mail.subject, mail.html, MAIL_REPLY_TO);
      if (esito.inviata) {
        // ⚠️ L'ORDINE RESTA QUESTO: prima il flag, poi la traccia. Il flag è
        // ciò che impedisce il secondo invio della stessa password; la traccia
        // è un dato. Se si invertisse, un guasto della porta del CRM potrebbe
        // lasciare il flag spento su una mail già partita — e al giro dopo il
        // cliente riceverebbe la stessa lettera.
        await markCredentialSent(g.id);
        result.issued++;
      } else {
        result.falliti.push({ id: g.id, email: g.email, perche: esito.perche });
        console.error("[pc cron] credenziali non consegnate:", g.id, g.email, esito.perche);
      }
    } catch (e) {
      // Qui ci arriva solo un'eccezione VERA (i PATCH di Airtable): `inviaMail`
      // non alza mai. Si conta fra i falliti perché dal di fuori è la stessa
      // cosa — quella riga non è stata servita come doveva.
      result.falliti.push({ id: g.id, email: g.email, perche: `eccezione: ${String(e).slice(0, 200)}` });
      console.error("[pc cron] credential issue failed:", g.id, e);
    } finally {
      // La dichiarazione al CRM, riuscita o no. Non alza mai e non può far
      // fallire il giro: v. `segnalaConsegnaCredenziali`. Si tace solo se non
      // si è nemmeno arrivati a provare (nessun codice: `ensureCredential` è
      // saltato) — lì non c'è niente da raccontare.
      if (code && esito) {
        const t = await segnalaConsegnaCredenziali({
          richiesta: g.id, codice: code, email: g.email,
          inviata: esito.inviata,
          errore: esito.inviata ? undefined : esito.perche,
          lingua: g.lingua, oggetto, mittente: MITTENTE_EFFETTIVO,
        });
        if (t.esito === "scritta") result.traccia.scritte++;
        else if (t.esito === "guasto") result.traccia.guasti++;
      }
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
    const a = await detectAbuse();
    result.flagged = a.flagged;
    result.antiAbuso = {
      attendibile: a.attendibile, ultimoAccessoNoto: a.ultimoAccessoNoto,
      ...(a.perche ? { perche: a.perche } : {}),
      ...(a.guardiaVera ? { guardiaVera: a.guardiaVera } : {}),
    };
  } catch (e) {
    // Un'eccezione qui non è «zero abusi»: è «non ho guardato», e da oggi la
    // risposta lo dice invece di lasciare il campo a 0 come se fosse un esito.
    console.error("[pc cron] abuse scan failed:", e);
    result.antiAbuso = {
      attendibile: false, ultimoAccessoNoto: null,
      perche: `la scansione è fallita: ${String(e).slice(0, 200)}`,
    };
  }

  return NextResponse.json({ ok: true, ...result });
}
