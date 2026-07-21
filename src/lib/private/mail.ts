import "server-only";
import { MAIL_CONTACT, MAIL_FROM, SITE_URL } from "./brand";

// Transactional email for the Private Collection, via Resend (the same provider
// the lead route already uses). Every send is best-effort: the Airtable record
// is the source of truth, so an email failure never breaks the flow.
//
// Sender is luxury@ by default (set RESEND_FROM_PRIVATE; the domain must be
// verified in Resend). If RESEND_API_KEY is unset, sends are skipped and the
// caller still has the data in Airtable to act on manually.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = MAIL_FROM;
const ZOOM_URL = process.env.PC_ZOOM_URL ?? "";
const CONTACT = MAIL_CONTACT;

export type Lang = "it" | "en" | "de";

export function mailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Dark + gold shell, matching the Private Collection theme.
function shell(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070c;padding:28px 0;font-family:Georgia,'Times New Roman',serif;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0f18;border:1px solid #1b2b42;">
      <tr><td style="padding:30px 36px 8px 36px;text-align:center;border-bottom:1px solid #1b2b42;">
        <div style="color:#a9c8e0;font-size:11px;letter-spacing:4px;">TRIESTEIMMOBILIARE</div>
        <div style="color:#dfe9f3;font-size:21px;letter-spacing:1px;margin-top:8px;font-style:italic;">Private Collection</div>
      </td></tr>
      <tr><td style="padding:26px 36px 32px 36px;color:#c3d0dd;font-size:15px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">
        ${inner}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

function goldButton(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:#a9c8e0;color:#0a0f18;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.5px;padding:12px 26px;border-radius:2px;">${esc(label)}</a>`;
}

// ---- Credential grant -------------------------------------------------------

const CRED: Record<Lang, {
  subject: string; hi: string; body: string; codeLabel: string;
  validity: (d: string) => string; enter: string; zoomLine: string;
  zoomCta: string; contacts: string; closing: string;
}> = {
  it: {
    subject: "Il suo accesso alla TriesteImmobiliare Private Collection",
    hi: "Gentile",
    body: "il suo accesso riservato alla nostra Private Collection è stato approvato. Qui sotto la sua password temporanea.",
    codeLabel: "Password temporanea",
    validity: (d) => `Valida fino al ${d} — 15 giorni. Allo scadere potrà richiederne il rinnovo.`,
    enter: "Entra nella Private Collection",
    zoomLine: "C'è molto altro che possiamo condividere solo di persona: terreni, palazzi, progetti non ancora pubblici.",
    zoomCta: "Prenota una call di 30 minuti con uno Specialist",
    contacts: `Per qualsiasi cosa: ${CONTACT}`,
    closing: "A presto,",
  },
  en: {
    subject: "Your access to the TriesteImmobiliare Private Collection",
    hi: "Dear",
    body: "your private access to our Private Collection has been approved. Below is your temporary password.",
    codeLabel: "Temporary password",
    validity: (d) => `Valid until ${d} — 15 days. You can request a renewal once it expires.`,
    enter: "Enter the Private Collection",
    zoomLine: "There is much more we can only share in person: land, buildings, projects not yet public.",
    zoomCta: "Book a 30-minute call with a Specialist",
    contacts: `For anything at all: ${CONTACT}`,
    closing: "Speak soon,",
  },
  de: {
    subject: "Ihr Zugang zur TriesteImmobiliare Private Collection",
    hi: "Sehr geehrte/r",
    body: "Ihr privater Zugang zu unserer Private Collection wurde freigegeben. Unten finden Sie Ihr temporäres Passwort.",
    codeLabel: "Temporäres Passwort",
    validity: (d) => `Gültig bis ${d} — 15 Tage. Nach Ablauf können Sie eine Verlängerung anfordern.`,
    enter: "Zur Private Collection",
    zoomLine: "Vieles können wir nur persönlich teilen: Grundstücke, Palazzi, noch nicht öffentliche Projekte.",
    zoomCta: "Buchen Sie ein 30-minütiges Gespräch mit einem Specialist",
    contacts: `Für alles Weitere: ${CONTACT}`,
    closing: "Bis bald,",
  },
};

export function credentialEmail(lang: Lang, name: string, code: string, expiresLabel: string) {
  const L = CRED[lang] ?? CRED.en;
  const enterUrl = `${SITE_URL}/${lang}/private?c=${encodeURIComponent(code)}`;
  const inner = `
    <p style="margin:0 0 16px;">${L.hi} ${esc(name) || "—"},</p>
    <p style="margin:0 0 22px;">${L.body}</p>
    <div style="text-align:center;margin:6px 0 8px;">
      <div style="color:#8a97a6;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${L.codeLabel}</div>
      <div style="display:inline-block;margin-top:8px;border:1px solid #a9c8e0;color:#dfe9f3;font-size:24px;letter-spacing:4px;font-weight:700;padding:12px 22px;font-family:'Courier New',monospace;">${esc(code)}</div>
    </div>
    <p style="text-align:center;color:#8a97a6;font-size:13px;margin:4px 0 22px;">${L.validity(expiresLabel)}</p>
    <div style="text-align:center;margin:0 0 26px;">${goldButton(enterUrl, L.enter)}</div>
    <p style="margin:0 0 14px;color:#aebcc9;">${L.zoomLine}</p>
    ${ZOOM_URL ? `<div style="text-align:center;margin:0 0 22px;"><a href="${esc(ZOOM_URL)}" style="color:#a9c8e0;font-size:14px;">${esc(L.zoomCta)} →</a></div>` : ""}
    <p style="margin:18px 0 0;color:#8a97a6;font-size:13px;">${L.contacts}</p>
    <p style="margin:18px 0 0;color:#c3d0dd;">${L.closing}<br><span style="color:#a9c8e0;">TriesteImmobiliare Private Collection</span></p>`;
  return { subject: L.subject, html: shell(inner) };
}

// ---- Expiry courtesy --------------------------------------------------------

const EXP: Record<Lang, { subject: string; hi: string; body: string; cta: string; closing: string }> = {
  it: {
    subject: "Il suo accesso alla Private Collection è scaduto",
    hi: "Gentile",
    body: "il suo accesso temporaneo alla TriesteImmobiliare Private Collection è scaduto. Siamo a disposizione per rinnovarlo quando desidera.",
    cta: "Richiedi il rinnovo",
    closing: "Con i nostri saluti,",
  },
  en: {
    subject: "Your Private Collection access has expired",
    hi: "Dear",
    body: "your temporary access to the TriesteImmobiliare Private Collection has expired. We would be glad to renew it whenever you wish.",
    cta: "Request a renewal",
    closing: "Warm regards,",
  },
  de: {
    subject: "Ihr Zugang zur Private Collection ist abgelaufen",
    hi: "Sehr geehrte/r",
    body: "Ihr temporärer Zugang zur TriesteImmobiliare Private Collection ist abgelaufen. Gerne verlängern wir ihn, wann immer Sie möchten.",
    cta: "Verlängerung anfordern",
    closing: "Herzliche Grüße,",
  },
};

export function expiryEmail(lang: Lang, name: string) {
  const L = EXP[lang] ?? EXP.en;
  const renewUrl = `${SITE_URL}/${lang}/private/richiedi?renew=1`;
  const inner = `
    <p style="margin:0 0 16px;">${L.hi} ${esc(name) || "—"},</p>
    <p style="margin:0 0 24px;">${L.body}</p>
    <div style="text-align:center;margin:0 0 24px;">${goldButton(renewUrl, L.cta)}</div>
    <p style="margin:0;color:#8a97a6;font-size:13px;">${CONTACT}</p>
    <p style="margin:18px 0 0;color:#c3d0dd;">${L.closing}<br><span style="color:#a9c8e0;">TriesteImmobiliare Private Collection</span></p>`;
  return { subject: L.subject, html: shell(inner) };
}

// ---- Request acknowledgement ------------------------------------------------

const ACK: Record<Lang, { subject: string; hi: string; body: string; note: string; closing: string }> = {
  it: {
    subject: "Abbiamo ricevuto la sua richiesta — Private Collection",
    hi: "Gentile",
    body: "grazie, abbiamo ricevuto la sua richiesta di accesso alla TriesteImmobiliare Private Collection.",
    note: "Le richieste vengono verificate manualmente, generalmente entro 48 ore. Una volta concesso, l'accesso avrà validità di 15 giorni.",
    closing: "A presto,",
  },
  en: {
    subject: "We've received your request — Private Collection",
    hi: "Dear",
    body: "thank you, we've received your request to access the TriesteImmobiliare Private Collection.",
    note: "Requests are reviewed manually, usually within 48 hours. Once granted, your access is valid for 15 days.",
    closing: "Speak soon,",
  },
  de: {
    subject: "Wir haben Ihre Anfrage erhalten — Private Collection",
    hi: "Sehr geehrte/r",
    body: "vielen Dank, wir haben Ihre Anfrage für den Zugang zur TriesteImmobiliare Private Collection erhalten.",
    note: "Anfragen werden manuell geprüft, in der Regel innerhalb von 48 Stunden. Nach Freigabe ist der Zugang 15 Tage gültig.",
    closing: "Bis bald,",
  },
};

export function ackEmail(lang: Lang, name: string) {
  const L = ACK[lang] ?? ACK.en;
  const inner = `
    <p style="margin:0 0 16px;">${L.hi} ${esc(name) || "—"},</p>
    <p style="margin:0 0 18px;">${L.body}</p>
    <p style="margin:0 0 22px;color:#aebcc9;">${L.note}</p>
    <p style="margin:0;color:#8a97a6;font-size:13px;">${CONTACT}</p>
    <p style="margin:18px 0 0;color:#c3d0dd;">${L.closing}<br><span style="color:#a9c8e0;">TriesteImmobiliare Private Collection</span></p>`;
  return { subject: L.subject, html: shell(inner) };
}

// ---- Daily digest to Martino (internal, IT) --------------------------------

export type DigestRow = {
  nome: string; cognome: string; email: string; telefono: string; nazionalita: string;
  intro: string; zone: string[]; bands: string[]; immobile: string; quando: string;
};

export function digestEmail(rows: DigestRow[], airtableUrl: string) {
  const subject = `Private Collection — ${rows.length} nuova/e richiesta/e (24h)`;
  const cards = rows
    .map(
      (r) => `<div style="border:1px solid #1b2b42;border-radius:6px;padding:14px 16px;margin:0 0 12px;">
      <div style="color:#dfe9f3;font-size:15px;font-weight:700;">${esc(`${r.cognome} ${r.nome}`.trim() || "—")}</div>
      <div style="color:#a9c8e0;font-size:13px;margin-top:2px;">${esc(r.email)}${r.telefono ? ` · ${esc(r.telefono)}` : ""}${r.nazionalita ? ` · ${esc(r.nazionalita)}` : ""}</div>
      ${r.intro ? `<div style="color:#c3d0dd;font-size:13px;margin-top:8px;font-style:italic;">“${esc(r.intro)}”</div>` : ""}
      <div style="color:#93a1ae;font-size:12px;margin-top:8px;">${esc([r.zone.join(", "), r.bands.join(" / "), r.immobile].filter(Boolean).join(" · "))}</div>
      <div style="color:#6d7c8a;font-size:11px;margin-top:6px;">${esc(r.quando)}</div>
    </div>`,
    )
    .join("");
  const inner = `
    <p style="margin:0 0 18px;">Nelle ultime 24h sono arrivate <strong style="color:#dfe9f3;">${rows.length}</strong> richieste di accesso alla Private Collection. Approva o nega dalla Interface Airtable (campo <em>stato</em>): all'approvazione il sistema genera la credenziale e invia l'email.</p>
    ${cards}
    <div style="text-align:center;margin:18px 0 0;">${goldButton(airtableUrl, "Apri in Airtable")}</div>`;
  return { subject, html: shell(inner) };
}
