// Shared shell for every client-facing email the site sends (form recaps,
// account and Private Collection messages). One look, mirrored on the site's
// brand tokens in globals.css: Poppins, brand blues, paper background, pale
// blue accents and dark footer. Everything is inline-styled and table-based so
// Gmail/Outlook/Apple Mail agree on it. The header logo is a PNG because Gmail
// does not render SVG reliably; white alt text covers blocked images.

const SITE = (
  (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
  "https://www.triesteimmobiliare.com"
).replace(/\/$/, "");

export type MailLang = "it" | "en" | "de";

// Poppins arrives via @import where supported (Apple Mail); Gmail/Outlook fall
// back to the closest geometric system fonts.
const FONT = "'Poppins','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const BRAND = "#2c6b96";
const BRAND_DARK = "#1c4a6b";
const ACCENT = "#a9c8e0";
const PAPER = "#f5f7f9";
const INK = "#0f2737";
const MUTED = "#6b7a82";
const FAINT = "#8a9aa3";
// Light tints for the dark footer. Full hex only, never rgba: Outlook's Word
// rendering engine would turn rgba colors black.
const ON_DARK = "#dce4e8";
const ON_DARK_MUTED = "#9db0b8";
const ON_DARK_FAINT = "#7f939c";

const EMAIL = "info@triesteimmobiliare.com";
const PHONE = "040 2473628";
const WHATSAPP = "331 8940822";
const VAT = "01235580329";

export const mailContact = {
  email: EMAIL,
  phone: PHONE,
  whatsapp: WHATSAPP,
} as const;

// Forma canonica con l'id nel percorso, non `profile.php?id=…`: è quella su cui
// Facebook stesso reindirizza, e soprattutto non contiene `=` — quindi non ha
// bisogno di mailSafeUrl e non può rompersi in consegna (vedi lì il perché).
const SOCIAL: Array<{ label: string; href: string }> = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/TriesteImmobiliare/61576375390569/",
  },
];

const ADDRESS: Record<MailLang, string> = {
  it: "Via Torino 34, 34123 Trieste",
  en: "Via Torino 34, 34123 Trieste, Italy",
  de: "Via Torino 34, 34123 Triest, Italien",
};

/**
 * Mette un URL al riparo dal quoted-printable.
 *
 * Le email partono codificate quoted-printable, dove `=` è il carattere di
 * escape e `=XY` (X e Y cifre esadecimali) significa "il byte 0xXY". Un `=`
 * letterale andrebbe scritto `=3D`, ma non tutti i mittenti lo fanno: risultato,
 * `?token=3458e6…` arriva al destinatario come `?token458e6…` perché `=34` è
 * stato interpretato come il carattere `4`.
 *
 * Non è teoria: verificato il 2026-07-30 su email realmente consegnate — il link
 * di reset password era rotto SEMPRE (il token è esadecimale, quindi comincia
 * sempre con due cifre esadecimali) e lo era anche il codice d'accesso della
 * Private Collection. `?family=Poppins` invece sopravviveva, perché `P` non è
 * una cifra esadecimale: è esattamente la firma del problema.
 *
 * Rimedio: percent-encoding della prima delle due cifre. Dopo l'`=` finisce un
 * `%`, che non è una cifra esadecimale, quindi la sequenza non viene più
 * interpretata; il valore resta identico perché il parser dell'URL fa la
 * decodifica inversa. Nessuna modifica a chi legge il parametro.
 */
export function mailSafeUrl(url: string): string {
  return url.replace(
    /=([0-9A-Fa-f])(?=[0-9A-Fa-f])/g,
    (_, digit: string) => `=%${digit.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Centered CTA button for email bodies. */
export function mailCta(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 6px">
    <tr><td style="background:${BRAND};border-radius:8px">
      <a href="${mailSafeUrl(href)}" target="_blank" style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:14px;font-weight:600;letter-spacing:.3px;color:#ffffff;text-decoration:none">${label}</a>
    </td></tr>
  </table>`;
}

/** Summary card for label/value rows, matching the site's visual language. */
export function mailRecapCard(title: string, rows: Array<[string, string]>): string {
  const tr = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 16px 7px 0;font-family:${FONT};font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top">${label}</td><td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${INK};font-weight:600">${value}</td></tr>`,
    )
    .join("");
  if (!tr) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0;background:${PAPER};border-radius:10px">
    <tr><td style="padding:20px 24px">
      <p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${ACCENT}">${title}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">${tr}</table>
    </td></tr>
  </table>`;
}

/**
 * Shared brand shell: dark logo header, white body card and dark footer with
 * social, contacts, address and VAT number. `footerExtra` supports optional
 * lines such as a newsletter unsubscribe link.
 */
export function brandMailShell(opts: {
  lang: MailLang;
  body: string;
  footerExtra?: string;
}): string {
  const { lang, body, footerExtra } = opts;
  const social = SOCIAL.map(
    ({ label, href }) =>
      `<a href="${href}" target="_blank" style="font-family:${FONT};font-size:13px;color:#ffffff;text-decoration:none;font-weight:600">${label}</a>`,
  ).join(`<span style="color:${ACCENT}">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`);

  return `<style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');</style>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAPER};padding:28px 12px">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%">
      <tr><td style="background:${BRAND_DARK};border-radius:14px 14px 0 0;padding:30px 32px 26px" align="center">
        <a href="${SITE}/${lang}" target="_blank" style="text-decoration:none">
          <img src="${SITE}/brand/logo-email.png" width="230" alt="triesteimmobiliare" style="display:block;border:0;max-width:80%;height:auto;margin:0 auto;font-family:${FONT};font-size:22px;font-weight:600;letter-spacing:.04em;color:#ffffff" />
          <span style="display:block;margin-top:12px;font-family:${FONT};font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:${ACCENT}">Trieste&nbsp;·&nbsp;Italia</span>
        </a>
      </td></tr>
      <tr><td style="background:#ffffff;padding:32px 34px 28px">${body}</td></tr>
      <tr><td style="background:${BRAND_DARK};border-radius:0 0 14px 14px;padding:24px 34px 28px" align="center">
        <p style="margin:0 0 13px">${social}</p>
        <p style="margin:0;font-family:${FONT};font-size:12px;color:${ON_DARK_MUTED}">
          <a href="${SITE}" target="_blank" style="color:${ON_DARK};text-decoration:none;font-weight:600">triesteimmobiliare.com</a>
          <span style="color:${ACCENT}">&nbsp;·&nbsp;</span><a href="mailto:${EMAIL}" style="color:${ON_DARK};text-decoration:none">${EMAIL}</a>
        </p>
        <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;color:${ON_DARK_MUTED}">
          <a href="tel:+390402473628" style="color:${ON_DARK};text-decoration:none">${PHONE}</a>
          <span style="color:${ACCENT}">&nbsp;·&nbsp;</span><a href="https://wa.me/393318940822" target="_blank" style="color:${ON_DARK};text-decoration:none">WhatsApp ${WHATSAPP}</a>
        </p>
        <p style="margin:8px 0 0;font-family:${FONT};font-size:11px;color:${ON_DARK_MUTED}">${ADDRESS[lang]}</p>
        <p style="margin:6px 0 0;font-family:${FONT};font-size:11px;color:${ON_DARK_FAINT}">© ${new Date().getFullYear()} TriesteImmobiliare · P.IVA ${VAT}</p>
        ${footerExtra ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:11px;color:${ON_DARK_FAINT}">${footerExtra}</p>` : ""}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

/** Shared body text styles for callers. */
export const mailText = {
  title: `margin:0 0 8px;font-family:${FONT};font-size:19px;font-weight:600;color:${BRAND}`,
  p: `margin:14px 0 0;font-family:${FONT};font-size:14px;line-height:1.7;color:${INK}`,
  small: `margin:22px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${FAINT}`,
} as const;
