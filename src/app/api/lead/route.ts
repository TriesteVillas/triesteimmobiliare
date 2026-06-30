import { NextResponse } from "next/server";

// Lead intake for the property forms (richiesta info / prenota visita / invia a
// un amico). Writes to the unified Airtable LEADS table (by field name +
// typecast) and, when configured, sends an email via Resend. Email is
// best-effort: a saved lead is the source of truth, so an email failure never
// fails the request.

// LEADS now lives in the SAME base as the properties (app1ZDay9vQNU5V2u),
// table tbl1RolmcvI7WxDdr. The site token (AIRTABLE_TOKEN) just needs
// data.records:write on that base in addition to the existing read.
const LEADS_BASE_ID = process.env.LEADS_BASE_ID ?? "app1ZDay9vQNU5V2u";
const LEADS_TABLE = process.env.LEADS_TABLE ?? "tbl1RolmcvI7WxDdr";
const LEADS_TOKEN = process.env.LEADS_AIRTABLE_TOKEN ?? process.env.AIRTABLE_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM; // e.g. "TriesteVillas <noreply@triestevillas.com>"
const NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL ?? "info@triesteimmobiliare.com";

const MOTIVI = new Set([
  "Richiedere maggiori informazioni",
  "Richiedere più foto",
  "Richiedere disponibilità",
  "Altro",
]);

const isEmail = (v: unknown): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v: unknown, max = 2000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

async function airtableCreate(fields: Record<string, unknown>) {
  const res = await fetch(`https://api.airtable.com/v0/${LEADS_BASE_ID}/${LEADS_TABLE}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LEADS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY || !RESEND_FROM) return; // email not configured yet
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  }).catch(() => {});
}

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

// Customer-facing recap copy, localized (the API has no i18n context).
const RECAP = {
  it: {
    subject: "Abbiamo ricevuto la vostra richiesta — TriesteImmobiliare",
    hello: "Buongiorno",
    received: "abbiamo ricevuto la vostra richiesta e vi ricontatteremo a breve.",
    recapTitle: "Riepilogo della richiesta",
    zones: "Zone di interesse", budget: "Budget", size: "Dimensioni",
    purpose: "Scopo", condition: "Stato immobile", listing: "Immobile",
    request: "Richiesta", message: "Messaggio", visit: "Disponibilità per la visita",
    timing: "Tempistiche", roi: "Rendita attesa", horizon: "Orizzonte", objective: "Obiettivo",
    closing: "Per qualsiasi cosa rispondete pure a questa email o chiamateci allo 040 2473628.",
    sign: "TriesteImmobiliare · info@triesteimmobiliare.com",
  },
  en: {
    subject: "We received your request — TriesteImmobiliare",
    hello: "Hello",
    received: "we received your request and will get back to you shortly.",
    recapTitle: "Your request at a glance",
    zones: "Areas of interest", budget: "Budget", size: "Size",
    purpose: "Purpose", condition: "Property condition", listing: "Property",
    request: "Request", message: "Message", visit: "Availability for the visit",
    timing: "Timing", roi: "Target yield", horizon: "Horizon", objective: "Objective",
    closing: "Feel free to reply to this email or call us on +39 040 2473628.",
    sign: "TriesteImmobiliare · info@triesteimmobiliare.com",
  },
  de: {
    subject: "Wir haben Ihre Anfrage erhalten — TriesteImmobiliare",
    hello: "Guten Tag",
    received: "wir haben Ihre Anfrage erhalten und melden uns in Kürze.",
    recapTitle: "Ihre Anfrage im Überblick",
    zones: "Interessensgebiete", budget: "Budget", size: "Größe",
    purpose: "Zweck", condition: "Zustand der Immobilie", listing: "Immobilie",
    request: "Anfrage", message: "Nachricht", visit: "Verfügbarkeit für die Besichtigung",
    timing: "Zeitrahmen", roi: "Erwartete Rendite", horizon: "Horizont", objective: "Ziel",
    closing: "Antworten Sie gerne auf diese E-Mail oder rufen Sie uns an unter +39 040 2473628.",
    sign: "TriesteImmobiliare · info@triesteimmobiliare.com",
  },
} as const;

// Branded recap wrapper: dark header + clean rows, renders everywhere.
function recapHtml(
  lang: keyof typeof RECAP,
  name: string,
  rows: Array<[string, string]>,
  extra = "",
) {
  const L = RECAP[lang];
  const tr = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6b7a82;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#0e2a36;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">
    <div style="background:#1c4a6b;border-radius:12px 12px 0 0;padding:18px 24px">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.5px">triesteimmobiliare</span>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px">
      <p style="color:#0e2a36">${L.hello}${name ? ` ${esc(name)}` : ""}, ${L.received}</p>
      <p style="margin-top:18px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a9aa3">${L.recapTitle}</p>
      <table style="border-collapse:collapse;font-size:14px">${tr}</table>
      ${extra}
      <p style="margin-top:20px;color:#475560;font-size:14px">${L.closing}</p>
      <p style="margin-top:16px;color:#8a9aa3;font-size:12px">${L.sign}</p>
    </div>
  </div>`;
}

// Canonical values for the buyer popup (typecast creates missing select
// options on first use, then they're stable).
const BUYER_ZONES = new Set([
  "CENTRO", "SEMICENTRO", "BARCOLA", "MIRAMARE", "GRIGNANO", "COSTIERA",
  "SISTIANA-DUINO", "PORTOPICCOLO", "AURISINA", "MUGGIA", "ALTE", "FVG", "ALTRO",
]);
const BUYER_SCOPI = new Set(["Abitazione principale", "Investimento / rendita", "Casa vacanze"]);
const BUYER_CONDIZIONI = new Set([
  "Primo ingresso", "Abitabile da subito", "Anche da ristrutturare", "Indifferente",
]);
const eur = (n: number) => `${n.toLocaleString("it-IT")} €`;

// Buyer-profile intake from the site-wide popup (Parla con noi / Diteci
// cosa cercate / House Tour Days). Same table, richer profile fields.
async function handleBuyer(body: Record<string, unknown>) {
  const nome = clean(body.nome, 120);
  const cognome = clean(body.cognome, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const messaggio = clean(body.messaggio, 4000);
  const fonteCta = clean(body.fonteCta, 120);
  const lingua = ["it", "en", "de"].includes(clean(body.lingua)) ? clean(body.lingua) : "it";
  const zone = (Array.isArray(body.zone) ? body.zone : [])
    .map((z) => clean(z, 40))
    .filter((z) => BUYER_ZONES.has(z));
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  const budgetMin = num(body.budgetMin);
  const budgetMax = num(body.budgetMax);
  const mqMin = num(body.mqMin);
  const mqMax = num(body.mqMax);
  const scopo = BUYER_SCOPI.has(clean(body.scopo)) ? clean(body.scopo) : "";
  const condizioni = BUYER_CONDIZIONI.has(clean(body.condizioni)) ? clean(body.condizioni) : "";

  if (body.privacyOk !== true) {
    return NextResponse.json({ ok: false, error: "privacy_required" }, { status: 400 });
  }
  // Agile form: one reachable contact is enough.
  if (!isEmail(email) && telefono.length < 6) {
    return NextResponse.json({ ok: false, error: "contact_info" }, { status: 400 });
  }

  const budgetText =
    budgetMin || budgetMax
      ? `${budgetMin ? eur(budgetMin) : "—"} – ${budgetMax ? eur(budgetMax) : "—"}`
      : "";
  const mqText = mqMin || mqMax ? `${mqMin ?? "—"} – ${mqMax ?? "—"} mq` : "";

  try {
    await airtableCreate({
      nome_completo: [nome, cognome].filter(Boolean).join(" "),
      nome,
      cognome,
      email,
      telefono,
      canale: "Sito TriesteImmobiliare",
      azienda: "TriesteImmobiliare",
      tipo_richiesta: "Cerco casa",
      motivo: fonteCta ? `CTA sito: ${fonteCta}` : "Popup buyer sito",
      messaggio,
      ...(zone.length ? { zona_interesse_norm: zone, zone_preferite: zone.join(", ") } : {}),
      ...(budgetMin ? { budget_min_eur: budgetMin } : {}),
      ...(budgetMax ? { budget_max_eur: budgetMax } : {}),
      ...(budgetText ? { budget: budgetText } : {}),
      ...(mqText ? { dimensioni_mq: mqText } : {}),
      ...(scopo ? { scopo } : {}),
      ...(condizioni ? { condizioni } : {}),
      privacy_ok: true,
      lingua,
      stato: "NUOVO",
      data_contatto: new Date().toISOString(),
      ...(body.test === true ? { flag_test: "true" } : {}),
    });
  } catch (e) {
    console.error("[lead] buyer airtable write failed:", e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }

  await sendEmail(
    NOTIFY_EMAIL,
    `Nuovo profilo buyer dal sito${fonteCta ? ` (${fonteCta})` : ""}`,
    `<p><strong>Nome:</strong> ${esc([nome, cognome].filter(Boolean).join(" ") || "—")}<br>
     <strong>Email:</strong> ${esc(email) || "—"}<br>
     <strong>Telefono:</strong> ${esc(telefono) || "—"}</p>
     <p><strong>Zone:</strong> ${esc(zone.join(", ") || "—")}<br>
     <strong>Budget:</strong> ${esc(budgetText || "—")}<br>
     <strong>Dimensioni:</strong> ${esc(mqText || "—")}<br>
     <strong>Scopo:</strong> ${esc(scopo || "—")}<br>
     <strong>Condizioni:</strong> ${esc(condizioni || "—")}</p>
     ${messaggio ? `<p><strong>Messaggio:</strong><br>${esc(messaggio)}</p>` : ""}
     <p><small>lingua ${esc(lingua)}</small></p>`,
    isEmail(email) ? email : undefined,
  );

  // Recap to the customer, in their language; replies route to the team.
  if (isEmail(email)) {
    const lang = lingua as keyof typeof RECAP;
    const L = RECAP[lang];
    await sendEmail(
      email,
      L.subject,
      recapHtml(lang, nome, [
        [L.zones, zone.join(", ")],
        [L.budget, budgetText],
        [L.size, mqText],
        [L.purpose, scopo],
        [L.condition, condizioni],
      ]),
      NOTIFY_EMAIL,
    );
  }

  return NextResponse.json({ ok: true });
}

// Seller intake from /vendi ("Richiedi una valutazione riservata").
// The structured property summary lands in ha_da_vendere; routing goes
// to the owners desk via destinatario_interno.
const SELLER_TIPOLOGIE = new Set([
  "Appartamento", "Attico", "Villa", "Casa con giardino", "Terreno", "Altro",
]);
const SELLER_TAGLIE = new Set(["< 80 mq", "80 – 150 mq", "150 – 250 mq", "250+ mq"]);
const SELLER_STATI = new Set(["Ottimo / ristrutturato", "Buono / abitabile", "Da ristrutturare"]);
const SELLER_TEMPI = new Set(["Il prima possibile", "Entro 6 mesi", "Solo esplorativo"]);

// Investor intake from /investimenti (off-market "portfolio a reddito" funnel).
// Reuses existing LEADS fields only (no schema changes): tipo_richiesta
// "Investimento" + scopo "Investimento / rendita", with ROI/horizon/objective
// folded into `motivo` so the CRM stays one shape across every brand site.
const INVEST_ROI = new Set([
  "Conservativo (basta che tenga)", "≈ 4–5%", "≈ 5–7%", "Massimizzare",
]);
const INVEST_ORIZZONTI = new Set([
  "Lungo termine (reddito)", "Medio (3–5 anni)", "Rivendita rapida", "Da valutare",
]);
const INVEST_OBIETTIVI = new Set([
  "Messa a reddito", "Rivalutazione", "Diversificazione", "Uso + reddito",
]);

async function handleValutazione(body: Record<string, unknown>) {
  const nome = clean(body.nome, 120);
  const cognome = clean(body.cognome, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const indirizzo = clean(body.indirizzo, 300);
  const tipologia = SELLER_TIPOLOGIE.has(clean(body.tipologia)) ? clean(body.tipologia) : "";
  const taglia = SELLER_TAGLIE.has(clean(body.taglia)) ? clean(body.taglia) : "";
  const statoImmobile = SELLER_STATI.has(clean(body.statoImmobile)) ? clean(body.statoImmobile) : "";
  const tempistiche = SELLER_TEMPI.has(clean(body.tempistiche)) ? clean(body.tempistiche) : "";
  const messaggio = clean(body.messaggio, 4000);
  const lingua = ["it", "en", "de"].includes(clean(body.lingua)) ? clean(body.lingua) : "it";

  if (body.privacyOk !== true) {
    return NextResponse.json({ ok: false, error: "privacy_required" }, { status: 400 });
  }
  if (!isEmail(email) && telefono.length < 6) {
    return NextResponse.json({ ok: false, error: "contact_info" }, { status: 400 });
  }

  const daVendere = [
    indirizzo && `Indirizzo: ${indirizzo}`,
    tipologia && `Tipologia: ${tipologia}`,
    taglia && `Dimensioni: ${taglia}`,
    statoImmobile && `Stato: ${statoImmobile}`,
  ].filter(Boolean).join("\n");

  try {
    await airtableCreate({
      nome_completo: [nome, cognome].filter(Boolean).join(" "),
      nome,
      cognome,
      email,
      telefono,
      canale: "Sito TriesteImmobiliare",
      azienda: "TriesteImmobiliare",
      tipo_richiesta: "Valutazione",
      destinatario_interno: "owners@TSV",
      motivo: "CTA sito: Valutazione riservata",
      ...(daVendere ? { ha_da_vendere: daVendere } : {}),
      ...(taglia ? { dimensioni_mq: taglia } : {}),
      ...(tempistiche ? { tempistiche } : {}),
      messaggio,
      privacy_ok: true,
      lingua,
      stato: "NUOVO",
      data_contatto: new Date().toISOString(),
      ...(body.test === true ? { flag_test: "true" } : {}),
    });
  } catch (e) {
    console.error("[lead] valutazione airtable write failed:", e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }

  await sendEmail(
    NOTIFY_EMAIL,
    "Nuova richiesta di valutazione dal sito",
    `<p><strong>Nome:</strong> ${esc([nome, cognome].filter(Boolean).join(" ") || "—")}<br>
     <strong>Email:</strong> ${esc(email) || "—"}<br>
     <strong>Telefono:</strong> ${esc(telefono) || "—"}</p>
     <p>${esc(daVendere || "—").replace(/\n/g, "<br>")}</p>
     ${tempistiche ? `<p><strong>Tempistiche:</strong> ${esc(tempistiche)}</p>` : ""}
     ${messaggio ? `<p><strong>Note:</strong><br>${esc(messaggio)}</p>` : ""}
     <p><small>lingua ${esc(lingua)}</small></p>`,
    isEmail(email) ? email : undefined,
  );

  if (isEmail(email)) {
    const lang = lingua as keyof typeof RECAP;
    const L = RECAP[lang];
    await sendEmail(
      email,
      L.subject,
      recapHtml(lang, nome, [
        [L.request, "Valutazione riservata"],
        [L.listing, [indirizzo, tipologia, taglia].filter(Boolean).join(" · ")],
        [L.condition, statoImmobile],
        [L.timing, tempistiche],
        [L.message, messaggio],
      ]),
      NOTIFY_EMAIL,
    );
  }

  return NextResponse.json({ ok: true });
}

async function handleInvestitore(body: Record<string, unknown>) {
  const nome = clean(body.nome, 120);
  const cognome = clean(body.cognome, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const messaggio = clean(body.messaggio, 4000);
  const lingua = ["it", "en", "de"].includes(clean(body.lingua)) ? clean(body.lingua) : "it";
  const zone = (Array.isArray(body.zone) ? body.zone : [])
    .map((z) => clean(z, 40))
    .filter((z) => BUYER_ZONES.has(z));
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  const budgetMin = num(body.budgetMin);
  const budgetMax = num(body.budgetMax);
  const roi = INVEST_ROI.has(clean(body.roi)) ? clean(body.roi) : "";
  const orizzonte = INVEST_ORIZZONTI.has(clean(body.orizzonte)) ? clean(body.orizzonte) : "";
  const obiettivo = INVEST_OBIETTIVI.has(clean(body.obiettivo)) ? clean(body.obiettivo) : "";

  if (body.privacyOk !== true) {
    return NextResponse.json({ ok: false, error: "privacy_required" }, { status: 400 });
  }
  if (!isEmail(email) && telefono.length < 6) {
    return NextResponse.json({ ok: false, error: "contact_info" }, { status: 400 });
  }

  const budgetText =
    budgetMin || budgetMax
      ? `${budgetMin ? eur(budgetMin) : "—"} – ${budgetMax ? eur(budgetMax) : "—"}`
      : "";
  const motivo = [
    "Investitore sito",
    roi && `rendita attesa ${roi}`,
    orizzonte && `orizzonte ${orizzonte}`,
    obiettivo && `obiettivo ${obiettivo}`,
  ].filter(Boolean).join(" · ");

  try {
    await airtableCreate({
      nome_completo: [nome, cognome].filter(Boolean).join(" "),
      nome,
      cognome,
      email,
      telefono,
      canale: "Sito TriesteImmobiliare",
      azienda: "TriesteImmobiliare",
      tipo_richiesta: "Investimento",
      scopo: "Investimento / rendita",
      destinatario_interno: "owners@TSV",
      motivo,
      messaggio,
      ...(zone.length ? { zona_interesse_norm: zone, zone_preferite: zone.join(", ") } : {}),
      ...(budgetMin ? { budget_min_eur: budgetMin } : {}),
      ...(budgetMax ? { budget_max_eur: budgetMax } : {}),
      ...(budgetText ? { budget: budgetText } : {}),
      privacy_ok: true,
      lingua,
      stato: "NUOVO",
      data_contatto: new Date().toISOString(),
      ...(body.test === true ? { flag_test: "true" } : {}),
    });
  } catch (e) {
    console.error("[lead] investitore airtable write failed:", e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }

  await sendEmail(
    NOTIFY_EMAIL,
    "Nuovo lead investitore dal sito (portfolio a reddito)",
    `<p><strong>Nome:</strong> ${esc([nome, cognome].filter(Boolean).join(" ") || "—")}<br>
     <strong>Email:</strong> ${esc(email) || "—"}<br>
     <strong>Telefono:</strong> ${esc(telefono) || "—"}</p>
     <p><strong>Budget:</strong> ${esc(budgetText || "—")}<br>
     <strong>Zone:</strong> ${esc(zone.join(", ") || "—")}<br>
     <strong>Rendita attesa:</strong> ${esc(roi || "—")}<br>
     <strong>Orizzonte:</strong> ${esc(orizzonte || "—")}<br>
     <strong>Obiettivo:</strong> ${esc(obiettivo || "—")}</p>
     ${messaggio ? `<p><strong>Messaggio:</strong><br>${esc(messaggio)}</p>` : ""}
     <p><small>lingua ${esc(lingua)}</small></p>`,
    isEmail(email) ? email : undefined,
  );

  if (isEmail(email)) {
    const lang = lingua as keyof typeof RECAP;
    const L = RECAP[lang];
    await sendEmail(
      email,
      L.subject,
      recapHtml(lang, nome, [
        [L.request, "Investimento a reddito"],
        [L.zones, zone.join(", ")],
        [L.budget, budgetText],
        [L.roi, roi],
        [L.horizon, orizzonte],
        [L.objective, obiettivo],
        [L.message, messaggio],
      ]),
      NOTIFY_EMAIL,
    );
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!LEADS_TOKEN) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (body.tipo === "buyer") return handleBuyer(body);
  if (body.tipo === "valutazione") return handleValutazione(body);
  if (body.tipo === "investitore") return handleInvestitore(body);

  const tipo =
    body.tipo === "amico"
      ? "Invia a un amico"
      : body.tipo === "visita"
        ? "Prenota visita"
        : "Richiesta info";
  const privacyOk = body.privacyOk === true;
  const nome = clean(body.nome, 120);
  const email = clean(body.email, 160);
  const telefono = clean(body.telefono, 40);
  const messaggio = clean(body.messaggio, 4000);
  const emailAmico = clean(body.emailAmico, 160);
  const motivo = MOTIVI.has(clean(body.motivo)) ? clean(body.motivo) : "Altro";
  const rif = clean(body.rif, 40);
  const immobileNome = clean(body.immobileNome, 200);
  const url = clean(body.url, 500);
  const disponibilita = clean(body.disponibilita, 800);
  const lingua = ["it", "en", "de"].includes(clean(body.lingua)) ? clean(body.lingua) : "it";
  const sito = clean(body.sito, 60) || "triesteimmobiliare.com";
  const isTI = sito === "triesteimmobiliare.com";
  const canale = isTI ? "Sito TriesteImmobiliare" : "Sito TriesteVillas";
  const azienda = isTI ? "TriesteImmobiliare" : "TriesteVillas";

  if (!privacyOk) {
    return NextResponse.json({ ok: false, error: "privacy_required" }, { status: 400 });
  }
  if (tipo === "Invia a un amico") {
    if (!isEmail(emailAmico)) {
      return NextResponse.json({ ok: false, error: "friend_email" }, { status: 400 });
    }
  } else if (!isEmail(email) || nome.length < 2) {
    return NextResponse.json({ ok: false, error: "contact_info" }, { status: 400 });
  }

  try {
    await airtableCreate({
      nome_completo: nome,
      nome,
      email,
      telefono,
      canale,
      azienda,
      tipo_richiesta: tipo,
      motivo,
      messaggio,
      disponibilita_visita: disponibilita,
      email_amico: emailAmico,
      privacy_ok: privacyOk,
      immobile_rif: rif,
      // `immobile` is a linked field to PROPRIETA: link by tsv_prop_id so
      // typecast matches the existing record instead of creating a phantom one.
      ...(rif ? { immobile: rif } : {}),
      immobile_url: url,
      lingua,
      stato: "NUOVO",
      data_contatto: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[lead] airtable write failed:", e);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }

  // Best-effort notifications.
  const listingLine = immobileNome
    ? `<p><strong>${esc(immobileNome)}</strong>${rif ? ` (${esc(rif)})` : ""}${
        url ? `<br><a href="${esc(url)}">${esc(url)}</a>` : ""
      }</p>`
    : "";

  if (tipo === "Invia a un amico") {
    const fl = (["it", "en", "de"].includes(lingua) ? lingua : "it") as "it" | "en" | "de";
    const FRIEND = {
      it: { subj: "Un immobile che potrebbe interessarti — TriesteImmobiliare", intro: "Ti è stato segnalato questo immobile:", sign: "— TriesteImmobiliare" },
      en: { subj: "A property you might like — TriesteImmobiliare", intro: "Someone wanted you to see this property:", sign: "— TriesteImmobiliare" },
      de: { subj: "Eine Immobilie für Sie — TriesteImmobiliare", intro: "Diese Immobilie wurde Ihnen empfohlen:", sign: "— TriesteImmobiliare" },
    }[fl];
    await sendEmail(
      emailAmico,
      FRIEND.subj,
      `<p>${FRIEND.intro}</p>${listingLine}${
        messaggio ? `<p>${esc(messaggio)}</p>` : ""
      }<p>${FRIEND.sign}</p>`,
      isEmail(email) ? email : undefined,
    );
    // Notify the team — otherwise a referral leaves no internal trace beyond Airtable.
    await sendEmail(
      NOTIFY_EMAIL,
      `Segnalazione a un amico dal sito${immobileNome ? `: ${immobileNome}` : ""}`,
      `<p>Un visitatore ha segnalato un immobile a <strong>${esc(emailAmico)}</strong>.</p>${listingLine}<p><small>${esc(sito)} · lingua ${esc(lingua)}</small></p>`,
      isEmail(email) ? email : undefined,
    );
  } else {
    await sendEmail(
      NOTIFY_EMAIL,
      `${tipo === "Prenota visita" ? "Richiesta visita" : "Nuovo contatto"} dal sito${immobileNome ? `: ${immobileNome}` : ""}`,
      `<p><strong>Motivo:</strong> ${esc(motivo)}</p>
       <p><strong>Nome:</strong> ${esc(nome)}<br>
       <strong>Email:</strong> ${esc(email)}<br>
       <strong>Telefono:</strong> ${esc(telefono) || "—"}</p>
       ${messaggio ? `<p><strong>Messaggio:</strong><br>${esc(messaggio)}</p>` : ""}
       ${disponibilita ? `<p><strong>Disponibilità:</strong><br>${esc(disponibilita).replace(/\n/g, "<br>")}</p>` : ""}
       ${listingLine}
       <p><small>${esc(sito)} · lingua ${esc(lingua)}</small></p>`,
      isEmail(email) ? email : undefined,
    );

    // Recap to the customer (info / visita requests).
    if (isEmail(email)) {
      const lang = lingua as keyof typeof RECAP;
      const L = RECAP[lang];
      await sendEmail(
        email,
        L.subject,
        recapHtml(
          lang,
          nome,
          [
            [L.request, tipo === "Prenota visita" ? tipo : motivo],
            [L.listing, immobileNome + (rif ? ` (${rif})` : "")],
            [L.message, messaggio],
            [L.visit, disponibilita],
          ],
          url
            ? `<p style="margin-top:14px;font-size:14px"><a href="${esc(url)}" style="color:#2c6b96">${esc(url)}</a></p>`
            : "",
        ),
        NOTIFY_EMAIL,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
