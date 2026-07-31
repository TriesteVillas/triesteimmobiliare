import "server-only";

// Le Risorse — la biblioteca editoriale di TriesteImmobiliare.
// Fonte di verità: Airtable WEB_ARTICLES (tblTgqKEDUYc80jcv), condivisa con
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

export type ArticleLocale = "it" | "en" | "de";

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
export function articleText(
  bag: Record<ArticleLocale, string>,
  locale: string,
): string {
  const l = (locale as ArticleLocale) in bag ? (locale as ArticleLocale) : "it";
  return bag[l] || bag.it || bag.en || bag.de || "";
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
    title: { it: str(f["titolo_it"]), en: str(f["titolo_en"]), de: str(f["titolo_de"]) },
    abstract: { it: str(f["abstract_it"]), en: str(f["abstract_en"]), de: str(f["abstract_de"]) },
    body: { it: str(f["corpo_it"]), en: str(f["corpo_en"]), de: str(f["corpo_de"]) },
  };
}

const FIELD_NAMES = [
  "slug", "categoria", "paesi", "journey_stage", "cover_url", "autore",
  "pubblicato_il", "aggiornato_il", "verificato_il", "in_evidenza", "ordine",
  "fonti", "aggiornamenti_pubblici", "titolo_it", "titolo_en", "titolo_de", "abstract_it", "abstract_en",
  "abstract_de", "corpo_it", "corpo_en", "corpo_de",
];

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
