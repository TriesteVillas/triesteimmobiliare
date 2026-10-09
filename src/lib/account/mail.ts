import "server-only";
import { ACCT_SITE_URL } from "./brand";
import { signVerifyToken } from "./session";
import { brandMailShell, mailCta, mailText, type MailLang } from "@/lib/brandMail";

// Email transazionali dell'area clienti, via Resend, fail-closed: se
// RESEND_API_KEY manca (stato attuale della produzione) non parte nulla e il
// chiamante lo sa — nessun percorso semi-configurato silenzioso. Il giorno in
// cui la chiave viene impostata su Vercel, verifica email e reset password si
// accendono da soli, senza deploy.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_ACCOUNT ?? process.env.RESEND_FROM ?? "";

export type Lang = "it" | "en" | "de" | "sl";

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

// Shared site shell (logo and dark footer): one look for every account email.
function shell(body: string, lang: MailLang = "it"): string {
  return brandMailShell({ lang, body: `<div style="${mailText.p};margin:0">${body}</div>` });
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
  // Stesso testo del gemello triestevillas-web (2026-09-11).
  sl: {
    subject: "Ponastavite svoje geslo",
    hi: (n) => `Pozdravljeni${n ? ` ${esc(n)}` : ""},`,
    body: "prejeli smo zahtevo za ponastavitev gesla vašega računa. Povezava velja 2 uri.",
    cta: "Ponastavite geslo",
    ignore: "Če spremembe niste zahtevali vi, to sporočilo prezrite: vaše trenutno geslo ostane veljavno.",
  },
};

export function resetEmail(lang: Lang, nome: string, token: string): { subject: string; html: string } {
  const c = RESET_COPY[lang] ?? RESET_COPY.it;
  const url = `${ACCT_SITE_URL}${lang === "it" ? "" : `/${lang}`}/account/reset?token=${encodeURIComponent(token)}`;
  return {
    subject: c.subject,
    html: shell(
      `<p>${c.hi(nome)}</p><p>${c.body}</p>
       ${mailCta(url, c.cta)}
       <p style="${mailText.small}">${c.ignore}</p>`,
      lang,
    ),
  };
}

// ---- Verifica dell'email (09/10/2026) ------------------------------------------
// Il link conferma solo insieme alla credenziale dell'account (sessione in quel
// browser, o la password): la mail lo dice, perché chi la apre da un altro
// dispositivo se la vedrà chiedere. E dice a chi NON si è registrato che può
// ignorarla senza conseguenze — è vero: senza conferma l'account non è legato
// al suo lead (lib/account/verifica.ts). EN/DE/SL come il gemello triestevillas-web.

const VERIFY_COPY: Record<
  Lang,
  { subject: string; hi: (n: string) => string; body: string; cta: string; why: string; ignore: string }
> = {
  it: {
    subject: "Conferma la tua email",
    hi: (n) => `Ciao${n ? ` ${esc(n)}` : ""},`,
    body: "per completare il tuo account conferma che questo indirizzo è tuo. Il link vale 48 ore; se lo apri da un altro dispositivo ti chiederemo la password scelta alla registrazione.",
    cta: "Confermo la mia email",
    why: "Dopo la conferma troverai nel tuo account anche le visite in programma con noi.",
    ignore: "Se la registrazione non l'hai fatta tu, ignora questa email: senza conferma l'account non viene collegato ai tuoi dati.",
  },
  en: {
    subject: "Confirm your email",
    hi: (n) => `Hello${n ? ` ${esc(n)}` : ""},`,
    body: "to complete your account, please confirm that this address is yours. The link is valid for 48 hours; if you open it on another device, we will ask for the password you chose when you signed up.",
    cta: "Confirm my email",
    why: "Once confirmed, your account will also show the viewings you have scheduled with us.",
    ignore: "If you did not sign up, just ignore this email: without confirmation the account is not linked to your details.",
  },
  de: {
    subject: "Bestätigen Sie Ihre E-Mail-Adresse",
    hi: (n) => `Guten Tag${n ? ` ${esc(n)}` : ""},`,
    body: "um Ihr Konto abzuschließen, bestätigen Sie bitte, dass diese Adresse Ihnen gehört. Der Link ist 48 Stunden gültig; wenn Sie ihn auf einem anderen Gerät öffnen, fragen wir nach dem Passwort, das Sie bei der Registrierung gewählt haben.",
    cta: "E-Mail-Adresse bestätigen",
    why: "Nach der Bestätigung sehen Sie in Ihrem Konto auch die mit uns vereinbarten Besichtigungen.",
    ignore: "Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail: Ohne Bestätigung wird das Konto nicht mit Ihren Daten verknüpft.",
  },
  sl: {
    subject: "Potrdite svoj e-poštni naslov",
    hi: (n) => `Pozdravljeni${n ? ` ${esc(n)}` : ""},`,
    body: "za dokončanje registracije potrdite, da je ta naslov vaš. Povezava velja 48 ur; če jo odprete na drugi napravi, vas bomo prosili za geslo, ki ste ga izbrali ob registraciji.",
    cta: "Potrdite e-poštni naslov",
    why: "Po potrditvi boste v svojem računu videli tudi oglede, ki ste jih dogovorili z nami.",
    ignore: "Če se niste registrirali vi, to sporočilo prezrite: brez potrditve račun ni povezan z vašimi podatki.",
  },
};

export function verifyEmail(lang: Lang, nome: string, token: string): { subject: string; html: string } {
  const c = VERIFY_COPY[lang] ?? VERIFY_COPY.it;
  const url = `${ACCT_SITE_URL}${lang === "it" ? "" : `/${lang}`}/account/verifica?token=${encodeURIComponent(token)}`;
  return {
    subject: c.subject,
    html: shell(
      `<p>${c.hi(nome)}</p><p>${c.body}</p>
       ${mailCta(url, c.cta)}
       <p>${c.why}</p>
       <p style="${mailText.small}">${c.ignore}</p>`,
      lang,
    ),
  };
}

/** Firma un link nuovo e lo spedisce. false se il mailer non c'è o l'invio fallisce. */
export async function sendVerifyMail(acc: { id: string; email: string; nome: string; lingua: string }): Promise<boolean> {
  if (!acctMailConfigured()) return false;
  const lang = (["it", "en", "de", "sl"].includes(acc.lingua) ? acc.lingua : "it") as Lang;
  const m = verifyEmail(lang, acc.nome.split(" ")[0] ?? "", await signVerifyToken({ uid: acc.id, em: acc.email }));
  return (await sendAcctMail(acc.email, m.subject, m.html)).sent;
}
