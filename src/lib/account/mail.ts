import "server-only";
import { ACCT_BRAND, ACCT_SITE_URL } from "./brand";

// Email transazionali dell'area clienti, via Resend, fail-closed: se
// RESEND_API_KEY manca (stato attuale della produzione) non parte nulla e il
// chiamante lo sa — nessun percorso semi-configurato silenzioso. Il giorno in
// cui la chiave viene impostata su Vercel, verifica email e reset password si
// accendono da soli, senza deploy.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_ACCOUNT ?? process.env.RESEND_FROM ?? "";

export type Lang = "it" | "en" | "de";

export function acctMailConfigured(): boolean {
  return !!(RESEND_API_KEY && FROM);
}

export async function sendAcctMail(to: string, subject: string, html: string): Promise<{ sent: boolean; reason?: string }> {
  if (!acctMailConfigured()) return { sent: false, reason: "mail_not_configured" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  }).catch(() => null);
  if (!res || !res.ok) return { sent: false, reason: `send_${res ? res.status : "network"}` };
  return { sent: true };
}

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shell(body: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <div style="border-bottom:2px solid #2c6b96;padding:18px 0 10px"><span style="font-size:19px;letter-spacing:.5px;color:#2c6b96;font-weight:bold">${esc(ACCT_BRAND.displayName)}</span></div>
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;padding:18px 0">${body}</div>
  <div style="border-top:1px solid #ddd;padding:12px 0;font-family:Arial,sans-serif;font-size:12px;color:#777">
    ${esc(ACCT_BRAND.displayName)} · info@triesteimmobiliare.com · 331 8940822<br/>Claude · Assistente AI TriesteVillas
  </div></div>`;
}

const RESET_COPY: Record<Lang, { subject: string; hi: (n: string) => string; body: string; cta: string; ignore: string }> = {
  it: {
    subject: "Reimposta la tua password",
    hi: (n) => `Ciao${n ? ` ${esc(n)}` : ""},`,
    body: "abbiamo ricevuto una richiesta di reimpostare la password del tuo account. Il link vale 2 ore.",
    cta: "Reimposta la password",
    ignore: "Se non hai richiesto tu il cambio, ignora questa email: la password attuale resta valida.",
  },
  en: {
    subject: "Reset your password",
    hi: (n) => `Hello${n ? ` ${esc(n)}` : ""},`,
    body: "we received a request to reset your account password. The link is valid for 2 hours.",
    cta: "Reset password",
    ignore: "If you did not request this, just ignore this email: your current password stays valid.",
  },
  de: {
    subject: "Passwort zurücksetzen",
    hi: (n) => `Guten Tag${n ? ` ${esc(n)}` : ""},`,
    body: "wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Der Link ist 2 Stunden gültig.",
    cta: "Passwort zurücksetzen",
    ignore: "Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail: Ihr Passwort bleibt gültig.",
  },
};

export function resetEmail(lang: Lang, nome: string, token: string): { subject: string; html: string } {
  const c = RESET_COPY[lang] ?? RESET_COPY.it;
  const url = `${ACCT_SITE_URL}${lang === "it" ? "" : `/${lang}`}/account/reset?token=${encodeURIComponent(token)}`;
  return {
    subject: c.subject,
    html: shell(
      `<p>${c.hi(nome)}</p><p>${c.body}</p>
       <p style="margin:22px 0"><a href="${url}" style="background:#2c6b96;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none">${c.cta}</a></p>
       <p style="color:#777;font-size:13px">${c.ignore}</p>`,
    ),
  };
}
