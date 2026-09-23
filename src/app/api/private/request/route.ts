import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { bussaIngresso } from "@/lib/ingressoPorta";
import { createLeadAndRequest } from "@/lib/private/store";
import {
  PC_RICHIESTA_DA_POSTGRES, PC_RICHIESTA_NON_ARMATA, pcRichiestaPerche, pgCreaRichiesta,
} from "@/lib/private/porta";
import { ackEmail, sendMail, type Lang } from "@/lib/private/mail";
import { MAIL_REPLY_TO } from "@/lib/private/brand";
import { BUDGET_BANDS } from "@/lib/private/bands";

// Private Collection credential request from the public ghost-card form.
// Creates a tagged LEAD_ (fonte = PRIVATE COLLECTION) + a PC_RICHIESTE row
// (status New) and sends a localized acknowledgement. NO credential is issued
// here — that happens only after Martino approves (see /api/private/cron).

const ZONES = new Set([
  "CENTRO", "SEMICENTRO", "COSTIERA", "BARCOLA", "BARCOLA-MIRAMARE",
  "ALTE", "MUGGIA", "SISTIANA-DUINO", "FVG",
]);
const BANDS = new Set<string>(BUDGET_BANDS);

const isEmail = (v: unknown): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v: unknown, max = 300): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Best-effort per-instance rate limit (serverless instances are short-lived;
// this just blunts bursts — real abuse control is the manual approval gate).
const hits = new Map<string, number[]>();
function limited(ip: string, max = 6, windowMs = 600_000): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

export async function POST(request: Request) {
  // ⚠️ «Non configurato» vuol dire: NESSUNA delle due strade è praticabile.
  // Fino al 23/09 qui bastava l'assenza del token Airtable per rifiutare, e
  // sarebbe diventato il difetto del giorno in cui il token si toglie: il
  // modulo avrebbe risposto 503 a tutti mentre la strada Postgres funzionava
  // benissimo. Si guarda quello che serve DAVVERO a chi scriverà.
  if (!PC_RICHIESTA_DA_POSTGRES
      && !process.env.AIRTABLE_TOKEN && !process.env.LEADS_AIRTABLE_TOKEN) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  if (ip && limited(ip)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // La richiesta si POSA nel fondo `ingresso` del CRM v4 PRIMA della validazione
  // — accanto ad Airtable, non al suo posto. Mai bloccante, spenta senza
  // INGRESSO_HMAC (src/lib/ingressoPorta.ts).
  //
  // ⚠️ Mancava, mentre il gemello TSV ce l'aveva dal 12/08: questa era l'UNICA
  // porta pubblica del gruppo che il v4 non vedeva. Trovata il 25/08 col
  // censimento fatto prima di invertire i moduli — spegnere la scrittura
  // Airtable senza questa riga avrebbe fatto sparire le richieste di accesso
  // alla Private Collection di TriesteImmobiliare, senza un errore da nessuna parte.
  //
  // ⚠️ RESTA anche con `PC_RICHIESTA_SORGENTE=pg`, e non è un doppione: questa
  // è la copia GREZZA di quello che ha premuto il cliente, posata prima di
  // qualunque validazione, e serve proprio a distinguere «nessuno ha
  // compilato» da «la porta è rotta» — cioè il caso in cui `crea-richiesta`
  // fallisse. Il fondo non genera un secondo lead: l'esecutore del v4 salta di
  // proposito il ramo `modulo-pc-richiesta` (lib/ingresso/motore.ts).
  await bussaIngresso(
    "pc-richiesta",
    { nome: body.nome, cognome: body.cognome, email: body.email, telefono: body.telefono },
    body,
  );

  const nome = clean(body.nome, 120);
  const cognome = clean(body.cognome, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const citta = clean(body.citta, 80);
  const intro = clean(body.intro, 500);
  const zone = (Array.isArray(body.zone) ? body.zone : [])
    .map((z) => clean(z, 40))
    .filter((z) => ZONES.has(z));
  const bands = (Array.isArray(body.bands) ? body.bands : [])
    .map((b) => clean(b, 10))
    .filter((b) => BANDS.has(b));
  const immobileTrigger = clean(body.immobileTrigger, 40);
  const lingua = (["it", "en", "de"].includes(clean(body.lingua)) ? clean(body.lingua) : "it") as Lang;

  if (body.privacyOk !== true) {
    return NextResponse.json({ ok: false, error: "privacy_required" }, { status: 400 });
  }
  if (!isEmail(email) || nome.length < 2 || cognome.length < 2) {
    return NextResponse.json({ ok: false, error: "contact_info" }, { status: 400 });
  }
  if (telefono.length < 6) {
    return NextResponse.json({ ok: false, error: "phone_required" }, { status: 400 });
  }
  // Città di residenza: obbligatoria dal 2026-07-21 (prima era "nazionalità",
  // facoltativa). Il controllo sta anche qui e non solo sul `required` del form,
  // perché il `required` HTML lo salta chiunque chiami la rotta direttamente —
  // ed è esattamente ciò che fa un bot che raccoglie accessi.
  if (citta.length < 2) {
    return NextResponse.json({ ok: false, error: "city_required" }, { status: 400 });
  }

  // ── DOVE NASCE LA RICHIESTA ──────────────────────────────────────
  // Strada storica: due POST su Airtable (LEAD_ + PC_RICHIESTE).
  // Strada nuova, dietro `PC_RICHIESTA_SORGENTE=pg`: la porta firmata del v4,
  // che la fa nascere in Postgres. L'interruttore nasce spento, e non si
  // accende senza `PC_SORGENTE=pg` — il perché sta nel cartello di
  // `src/lib/private/porta.ts`, ed è la riga da leggere prima di toccarlo.
  //
  // ⚠️ Il ripiego su Airtable è VOLUTO e vale solo sul GUASTO: se il v4 non
  // risponde, la richiesta di un cliente non si perde. Se invece il v4 RIFIUTA
  // il modulo, non si ripiega — sarebbe scrivere su Airtable una riga che il
  // sistema nuovo considera non valida.
  const modulo = { nome, cognome, email, telefono, citta, intro, zone, bands, immobileTrigger, lingua };
  let natoNelV4 = false;

  if (PC_RICHIESTA_NON_ARMATA) {
    // Acceso ma inerte: chi l'ha acceso crede di aver spostato la nascita del
    // dato. Lo deve sapere a ogni richiesta, non alla prima stranezza.
    console.error(`[pc] PC_RICHIESTA_SORGENTE=pg ma la strada non è armata — ${pcRichiestaPerche()}. Si continua su Airtable.`);
  }

  if (PC_RICHIESTA_DA_POSTGRES) {
    const esito = await pgCreaRichiesta(modulo);
    if (esito.esito === "rifiutato") {
      // Stesso vocabolario di errori delle validazioni qui sopra: il form sa
      // già tradurli, e un codice nuovo sarebbe una schermata muta.
      return NextResponse.json({ ok: false, error: esito.errore }, { status: 400 });
    }
    if (esito.esito === "creata") {
      natoNelV4 = true;
    } else {
      console.error(`[pc] crea-richiesta sul v4 non riuscita (${esito.perche}): ripiego su Airtable.`);
    }
  }

  if (!natoNelV4) {
    try {
      await createLeadAndRequest(modulo);
    } catch (e) {
      console.error("[pc] request save failed:", e);
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
    }
  }

  // Acknowledgement (best-effort): the saved request is the source of truth.
  const ack = ackEmail(lingua, nome);
  await sendMail(email, ack.subject, ack.html, MAIL_REPLY_TO);

  return NextResponse.json({ ok: true });
}
