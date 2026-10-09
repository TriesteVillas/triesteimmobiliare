// La guardia delle mail per conto dei visitatori (guardiaMail.ts, modulo
// gemello). Stesso stile degli altri test: niente runner, `tsc` puro e node;
// exit 1 alla prima differenza.
//
// IL METRO DEVE SAPER DIRE DI NO: gli stessi casi girano anche sul codice di
// prima (`vecchiaCta`, `vecchioEsc`, copiati qui com'erano fino al 09/10) e
// devono trovarlo in difetto.
import { urlDelGruppo, escHtml, limitatore, ipDi, chiaveEmail } from "./guardiaMail";

let falliti = 0;
function pari(nome: string, avuto: unknown, atteso: unknown) {
  const a = JSON.stringify(avuto);
  const b = JSON.stringify(atteso);
  if (a === b) return;
  falliti += 1;
  console.error(`✗ ${nome}: atteso ${b}, avuto ${a}`);
}

const SITO = "https://triestevillas.com";

// ── urlDelGruppo ────────────────────────────────────────────────────────────
pari("scheda del sito", urlDelGruppo("https://triestevillas.com/en/annuncio/villa-x-0043", SITO),
  "https://triestevillas.com/en/annuncio/villa-x-0043");
pari("www del sito", urlDelGruppo("https://www.triestevillas.com/annuncio/x", SITO),
  "https://www.triestevillas.com/annuncio/x");
pari("dominio gemello", urlDelGruppo("https://www.triesteimmobiliare.com/annuncio/y", SITO),
  "https://www.triesteimmobiliare.com/annuncio/y");
pari("http su dominio del gruppo → https", urlDelGruppo("http://friulivillas.com/annuncio/z", SITO),
  "https://friulivillas.com/annuncio/z");
pari("dominio altrui", urlDelGruppo("https://evil.example/annuncio/x", SITO), null);
pari("sosia con suffisso", urlDelGruppo("https://triestevillas.com.evil.example/x", SITO), null);
pari("sosia con prefisso", urlDelGruppo("https://eviltriestevillas.com/x", SITO), null);
pari("sottodominio non ammesso", urlDelGruppo("https://phish.triestevillas.com/x", SITO), null);
pari("credenziali nell'url", urlDelGruppo("https://triestevillas.com@evil.example/x", SITO), null);
pari("utente sul dominio giusto", urlDelGruppo("https://u:p@triestevillas.com/x", SITO), null);
pari("javascript:", urlDelGruppo("javascript:alert(1)//triestevillas.com", SITO), null);
pari("data:", urlDelGruppo("data:text/html,<b>x</b>", SITO), null);
pari("relativo", urlDelGruppo("/annuncio/x", SITO), null);
pari("vuoto", urlDelGruppo("", SITO), null);
pari("porta sul gruppo", urlDelGruppo("https://triestevillas.com:8443/x", SITO), null);
pari("virgolette codificate", urlDelGruppo('https://triestevillas.com/a" onmouseover="x', SITO),
  "https://triestevillas.com/a%22%20onmouseover=%22x");
pari("localhost in sviluppo", urlDelGruppo("http://localhost:3000/annuncio/x", "http://localhost:3000"),
  "http://localhost:3000/annuncio/x");
pari("localhost su altra porta", urlDelGruppo("http://localhost:4000/x", "http://localhost:3000"), null);
pari("sito con www configurato", urlDelGruppo("https://triesteaffitti.com/annuncio/x", "https://www.triesteaffitti.com"),
  "https://triesteaffitti.com/annuncio/x");

// ── escHtml ─────────────────────────────────────────────────────────────────
pari("escHtml", escHtml(`a"b'c<d>e&f`), "a&quot;b&#39;c&lt;d&gt;e&amp;f");

// L'attacco del rapporto: un href che chiude l'attributo e ne apre altri.
const ATTACCO = 'https://evil.example/" style="font-size:40px" data-x="';
// Il codice di prima: `esc` senza virgolette, `mailCta` che interpola l'href.
const vecchioEsc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
const vecchiaCta = (href: string) => `<a href="${href}" target="_blank">x</a>`;
const attributi = (html: string) => (html.match(/\s[a-z-]+="/g) ?? []).length;
// Il metro dice di no al codice di prima: tre attributi in più nel tag.
pari("prima: l'attacco apre attributi", attributi(vecchiaCta(vecchioEsc(ATTACCO))) > 2, true);
// Adesso: l'href resta uno solo, anche se l'url arrivasse fin qui.
pari("ora: un solo href", attributi(`<a href="${escHtml(ATTACCO)}" target="_blank">x</a>`), 2);
pari("ora: l'url altrui non passa la guardia", urlDelGruppo(ATTACCO, SITO), null);

// ── limitatore ──────────────────────────────────────────────────────────────
{
  const passa = limitatore(3, 60_000);
  const t0 = 1_000_000;
  pari("1º", passa("a", t0), true);
  pari("2º", passa("a", t0 + 1), true);
  pari("3º", passa("a", t0 + 2), true);
  pari("4º nella finestra", passa("a", t0 + 3), false);
  pari("altra chiave", passa("b", t0 + 3), true);
  // Finestra scorrevole: a t0+60.010 i tre passaggi di t0..t0+2 sono usciti.
  pari("finestra scaduta", passa("a", t0 + 60_010), true);
  pari("di nuovo 2º", passa("a", t0 + 60_011), true);
  pari("di nuovo 3º", passa("a", t0 + 60_012), true);
  pari("e di nuovo fermo", passa("a", t0 + 60_013), false);
}
{
  // La mappa non cresce oltre il tetto, e la chiave appena usata resta.
  const passa = limitatore(1, 60_000, 10);
  for (let i = 0; i < 50; i++) passa(`k${i}`, 1_000 + i);
  pari("tetto: l'ultima chiave conta ancora", passa("k49", 1_100), false);
}

// ── ipDi / chiaveEmail ──────────────────────────────────────────────────────
const hdr = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null });
pari("x-real-ip", ipDi(hdr({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" })), "1.2.3.4");
pari("x-forwarded-for", ipDi(hdr({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" })), "5.6.7.8");
pari("senza ip", ipDi(hdr({})), "?");
pari("chiaveEmail", chiaveEmail("  Mario.Rossi@Example.COM "), "mario.rossi@example.com");

if (falliti) {
  console.error(`✗ guardiaMail: ${falliti} casi falliti`);
  process.exit(1);
}
console.log("✓ guardiaMail: tutti i casi");
