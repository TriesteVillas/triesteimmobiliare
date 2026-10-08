import "server-only";

// Le Risorse — la biblioteca editoriale di TriesteImmobiliare.
// Fonte di verità: Airtable WEB_ARTICLES, condivisa con
// TriesteVillas: ogni lettura è filtrata per BRAND, come le tabelle WEB_* degli
// account. Il sito vede solo le righe stato=Pubblicato con data di uscita
// passata — bozze, programmati e coda idee restano nel CRM.
//
// Perché il filtro brand non è una formalità: le due biblioteche parlano a due
// lettori diversi (qui il mercato locale, là chi compra dall'estero) e vivono su
// due domini. Servire qui un articolo dell'altro brand sarebbe duplicazione
// cross-dominio fra due siti dello stesso gruppo: traffico sottratto, non sommato.
//
// Le letture vanno per NOME campo (convenzione dei siti per le tabelle non
// immobiliari) con la stessa finestra di Data Cache (600s) del listino, così
// Airtable viene interrogata una volta per rivalidazione, non una per visita.

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app1ZDay9vQNU5V2u";
const TABLE_ID = "tblTgqKEDUYc80jcv"; // WEB_ARTICLES
const TOKEN = process.env.AIRTABLE_TOKEN;
const REVALIDATE_SECONDS = 600;
const ARTICLE_BRAND = "TSI";

export type ArticleLocale = "it" | "en" | "de" | "sl";

export type Article = {
  id: string;
  slug: string;
  categoria: string | null;
  paesi: string[];
  journeyStage: string[];
  coverUrl: string | null;
  autore: string | null;
  publishedAt: string | null; // YYYY-MM-DD
  updatedAt: string | null;
  verifiedAt: string | null; // data dell'ultimo controllo dei fatti — in pagina è un patto, non un vezzo
  inEvidenza: boolean;
  ordine: number;
  fonti: string | null;
  aggiornamenti: string | null; // cronologia pubblica aggiornamenti (righe "YYYY-MM-DD | testo")
  title: Record<ArticleLocale, string>;
  abstract: Record<ArticleLocale, string>;
  body: Record<ArticleLocale, string>;
};

// Qui l'italiano è la lingua master (il lettore è a Trieste) ed è anche la
// lingua della radice del sito. Una traduzione mancante ripiega it → en → quel
// che c'è, così un articolo tradotto a metà non rende mai una pagina vuota.
// Lo sloveno (2026-10-01) fa eccezione: finché un articolo non ha i campi
// *_sl, a un lettore sloveno serve l'inglese — la lingua internazionale — non
// l'italiano. Catena sl → en → it → de, la stessa del gemello triestevillas-web.
// ⚠️ Al 01/10 i *_sl degli articoli TSI non li riempie nessuno: la passata
// slovena dell'editoriale del CRM traduce solo gli articoli TSV.
function catena(locale: string): ArticleLocale[] {
  if (locale === "sl") return ["sl", "en", "it", "de"];
  if (locale === "en" || locale === "de") return [locale, "it", "en", "de"];
  return ["it", "en", "de"];
}

export function articleText(
  bag: Record<ArticleLocale, string>,
  locale: string,
): string {
  for (const l of catena(locale)) if (bag[l]) return bag[l];
  return "";
}

/** Le lingue in cui l'articolo ESISTE: corpo suo, non un ripiego. Servono a
 *  hreflang e sitemap — dichiarare `sl` su un testo inglese di ripiego mette in
 *  gara su Google due copie dello stesso articolo (/en e /sl). Un articolo
 *  senza corpo in nessuna lingua le tiene tutte: niente da preferire. */
export function articleLocales(a: Article, all: readonly string[]): string[] {
  const vere = all.filter((l) => !!a.body[l as ArticleLocale]);
  return vere.length ? vere : [...all];
}

/** La lingua del corpo che la pagina in `locale` mostra davvero. */
export function articleServedLocale(a: Article, locale: string): string {
  for (const l of catena(locale)) if (a.body[l]) return l;
  return locale;
}

/** Una guida si PROPONE in una pagina solo se esiste nella sua lingua (08/10/2026).
 *  Vale per lo sloveno, dove il ripiego è l'inglese: le fasce «guide» di /sl,
 *  /sl/immobili e /sl/vendi mostravano titoli e sommari inglesi («The six
 *  stages of a sale…») e portavano la quota di parole slovene della pagina al
 *  69-80% (audit dei contenuti del 07/10). Senza articoli sloveni la fascia
 *  sparisce, come /sl/risorse rimanda già alla biblioteca inglese; quando il
 *  CRM scriverà i *_sl torna da sola. Per it/en/de non cambia niente. */
export function proponibileIn(a: Article, locale: string): boolean {
  return locale !== "sl" || !!a.body.sl;
}

// ─── Il recapito dentro il testo delle guide (08/10/2026) ───────────────────
// I corpi arrivano dal CRM (WEB_ARTICLES) e le guide del primo lotto chiudono
// con «oppure chiama 040 2473628» — il fisso dell'ufficio che la regola dei
// recapiti di Martino (09/06/2026) ha sostituito col 331 8940822, telefono e
// WhatsApp. Su 39 pagine il numero vecchio restava nel testo (audit del 07/10)
// mentre il resto del sito dava già il nuovo. La correzione vera è nel CRM;
// questa è la rete sotto: il numero vecchio non arriva più in pagina, anche
// da un articolo scritto domani con il testo di ieri. In italiano senza +39.
const FISSO = String.raw`(?:\+39\s?)?0\s?4\s?0[\s.]?2\s?4\s?7[\s.]?3\s?6[\s.]?2\s?8`;
const APOS = String.raw`(?:'|’|&#39;|&#x27;)`;
const RECAPITO_VECCHIO: { re: RegExp; con: string }[] = [
  // La frase che dava fisso E WhatsApp: diventa un numero solo, per tutti e due.
  { re: new RegExp(String.raw`chiama ${FISSO} \(dall${APOS}estero \+39\) o scrivi su WhatsApp al 331 ?8940822`, "g"), con: "chiama o scrivi su WhatsApp al 331 8940822" },
  { re: new RegExp(String.raw`call ${FISSO} \(from abroad \+39\) or send a WhatsApp message to (?:\+39 )?331 ?8940822`, "g"), con: "call or send a WhatsApp message to +39 331 8940822" },
  { re: new RegExp(String.raw`rufen Sie ${FISSO} an \(aus dem Ausland \+39\) oder schreiben Sie per WhatsApp an (?:\+39 )?331 ?8940822`, "g"), con: "rufen Sie uns an oder schreiben Sie per WhatsApp an +39 331 8940822" },
  // I link tel: col fisso.
  { re: /tel:\+?(?:39)?0402473628/g, con: "tel:+393318940822" },
];

function recapitoAttuale(testo: string, lingua: ArticleLocale): string {
  if (!testo) return testo;
  let t = testo;
  for (const { re, con } of RECAPITO_VECCHIO) t = t.replace(re, con);
  // Ogni altro fisso rimasto: il numero nuovo, col +39 fuori dall'italiano.
  return t.replace(new RegExp(FISSO, "g"), lingua === "it" ? "331 8940822" : "+39 331 8940822");
}

type RawRecord = { id: string; fields: Record<string, unknown> };

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strOrNull = (v: unknown): string | null => str(v) || null;
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function mapArticle(r: RawRecord): Article {
  const f = r.fields;
  return {
    id: r.id,
    slug: str(f["slug"]),
    categoria: strOrNull(f["categoria"]),
    paesi: arr(f["paesi"]),
    journeyStage: arr(f["journey_stage"]),
    coverUrl: strOrNull(f["cover_url"]),
    autore: strOrNull(f["autore"]),
    publishedAt: strOrNull(f["pubblicato_il"]),
    updatedAt: strOrNull(f["aggiornato_il"]),
    verifiedAt: strOrNull(f["verificato_il"]),
    inEvidenza: f["in_evidenza"] === true,
    ordine: typeof f["ordine"] === "number" ? f["ordine"] : 0,
    fonti: strOrNull(f["fonti"]),
    aggiornamenti: strOrNull(f["aggiornamenti_pubblici"]),
    title: { it: str(f["titolo_it"]), en: str(f["titolo_en"]), de: str(f["titolo_de"]), sl: str(f["titolo_sl"]) },
    abstract: { it: str(f["abstract_it"]), en: str(f["abstract_en"]), de: str(f["abstract_de"]), sl: str(f["abstract_sl"]) },
    body: {
      it: recapitoAttuale(str(f["corpo_it"]), "it"),
      en: recapitoAttuale(str(f["corpo_en"]), "en"),
      de: recapitoAttuale(str(f["corpo_de"]), "de"),
      sl: recapitoAttuale(str(f["corpo_sl"]), "sl"),
    },
  };
}

const FIELD_NAMES = [
  "slug", "categoria", "paesi", "journey_stage", "cover_url", "autore",
  "pubblicato_il", "aggiornato_il", "verificato_il", "in_evidenza", "ordine",
  "fonti", "aggiornamenti_pubblici", "titolo_it", "titolo_en", "titolo_de", "titolo_sl", "abstract_it", "abstract_en",
  "abstract_de", "abstract_sl", "corpo_it", "corpo_en", "corpo_de", "corpo_sl",
];
// I tre campi *_sl (titolo_sl, abstract_sl, corpo_sl) esistono su
// WEB_ARTICLES dall'11/09/2026, creati
// per triestevillas.com: la tabella è condivisa, quindi valgono anche qui.

// stato e brand stanno nella formula; la data di pubblicazione si ri-controlla
// in memoria (un articolo datato domani non deve passare da una pagina in cache).
const PUBLISHED_FILTER = `AND({brand}='${ARTICLE_BRAND}',{stato}='Pubblicato')`;

async function fetchAllRaw(): Promise<RawRecord[]> {
  const out: RawRecord[] = [];
  let offset: string | undefined;
  while (true) {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("filterByFormula", PUBLISHED_FILTER);
    url.searchParams.set("pageSize", "100");
    for (const n of FIELD_NAMES) url.searchParams.append("fields[]", n);
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["articles"] },
    });
    if (!res.ok) throw new Error(`Airtable articles ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { records: RawRecord[]; offset?: string };
    out.push(...data.records);
    offset = data.offset;
    if (!offset) break;
  }
  return out;
}

export async function getArticles(): Promise<Article[]> {
  if (!TOKEN) {
    // Per gli articoli non esiste un seed committato: senza token la sezione
    // rende vuota (la pagina indice e la fascia in home si nascondono da sole).
    console.warn("[articles] AIRTABLE_TOKEN non impostato — Risorse vuote.");
    return [];
  }
  const today = new Date().toISOString().slice(0, 10);
  return (await fetchAllRaw())
    .map(mapArticle)
    .filter((a) => a.slug && a.title.it && (!a.publishedAt || a.publishedAt <= today))
    .sort(
      (a, b) =>
        (b.inEvidenza ? 1 : 0) - (a.inEvidenza ? 1 : 0) ||
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") ||
        a.ordine - b.ordine,
    );
}

export async function getArticle(slug: string): Promise<Article | null> {
  const all = await getArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

// Prima la stessa categoria, poi i più recenti — per la fascia "continua a leggere".
export async function getRelatedArticles(article: Article, n = 3): Promise<Article[]> {
  const all = await getArticles();
  return all
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => {
      const sameA = a.categoria && a.categoria === article.categoria ? 1 : 0;
      const sameB = b.categoria && b.categoria === article.categoria ? 1 : 0;
      return sameB - sameA;
    })
    .slice(0, n);
}

// Tempo di lettura grezzo dal corpo nella lingua giusta; mai sotto 1.
export function readingMinutes(a: Article, locale: string): number {
  const words = articleText(a.body, locale).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
