import type { FotoAi, FotoTrasparenza, MarcaXmp, TrasparenzaImmobile } from "./trasparenza";
import { videoAnnuncio, type VideoAnnuncio } from "../content/annunciVideo";
// Field-ID map for the Airtable PROPRIETA table (base e tabella: vedi la KB).
// We key on field IDs (stable across renames) for the live REST fetch
// (returnFieldsByFieldId=true).
export const F = {
  id: "fldR3kYOEvMTn7qKA",
  // Il nome interno NON si chiede ad Airtable (08/10/2026): non serve a niente
  // in pagina (titolo e slug vengono dal nome pubblico o da tipologia · zona) e
  // porta spesso il cognome di chi vende. Un campo che non arriva non può
  // finire in pagina per sbaglio. Il cancello scripts/check-nomi.mjs lo tiene fuori.
  publicName: "fldcGog8cRFRjZIrI",
  contratto: "fld8sD96k6YChA8pA",
  cluster: "fldcdPH8aCWSfvFlD",
  // 2026-09-10: progetto/cantiere (singleSelect → string, es. «DUINO»).
  // Serve alla scheda per riconoscere le unità di un progetto con sito dedicato
  // (invito Elegie Duino). Stesso field id del gemello triestevillas-web.
  progetto: "fldJjLwwFF2ipL6zJ",
  // 2026-09-08: lo stato COMMERCIALE (ACTIVE · UNDER_OFFER · SOLD · RENTED …).
  // Da non confondere con `stato` qui sotto, che è la condizione FISICA
  // dell'immobile (imm_stato_immobile). Oggi serve solo al badge «Venduto».
  statusCommerciale: "fldwoixrfkBqOClHV", // status (singleSelect → string)
  tipologia: "fldr7auGhgNEOpiHg",
  via: "fldSOUwCWIs69WX8B",
  civico: "fld9eWwzOafQXHNFC",
  // 2026-06-12: the free-text "comune" field was dropped from Airtable in
  // favour of the comune_fvg singleSelect (REST returns the option name as a
  // plain string, so handling is unchanged). Foreign listings (e.g. Croatia)
  // have no value and the place line simply omits the city.
  comune: "fldIE9Aoao5sWbLIL",
  zona: "fld9TInMRcGm41BgC",
  lat: "fldfnLewUQSpJHUyK",
  lng: "fldwDeiuG7O48DPhl",
  prezzo: "fldpNpYEuRWFnWbTU",
  canone: "fldNMma0b89urbTMT",
  mq: "fldLwLwMtRgmT9aAM",
  locali: "fldWDIuHeOQxjaKd1",
  bagni: "fldGaMYAmTdXYbY0Q",
  piano: "fldIk6RfMe410Bj2q",
  ape: "fldKDtf6sKM6vmDRH",
  descrizione: "fldz7K3GScs9chlvy",
  // Varianti anti-duplicate-content per TSI (stessi fatti, wording diverso da triestevillas.com).
  // Il sito le preferisce; fallback sul testo TSV solo se vuote.
  descrizioneTsi: "fldG2oaACx19tI4Gm",
  // Traduzioni TSI (multilineText, quindi SCRIVIBILI via API: le riempie il
  // generatore testi del CRM, non un bottone AI di Airtable). Tono TSI —
  // concreto e accessibile, non luxury. Fallback: vedi localizedDescription().
  descrizioneTsiEn: "fldQNanhc34DHilid", // descrizione_TSI_EN_#
  descrizioneTsiDe: "fldkXX2gDgO03Lw88", // descrizione_TSI_DE_#
  oneliner: "fldIMsfxvOW95HV90",
  onelinerTsi: "fldeva3OriJioMOmS",
  // Titoli pubblici tradotti, condivisi con triestevillas.com: il nome pubblico
  // dell'immobile è lo stesso su entrambi i siti (è public_tsv_name).
  titleEn: "fldrTJMbSO4nNW32W", // public_tsv_name_EN_#
  titleDe: "fldXYXscxt7V8EueO", // public_tsv_name_DE_#
  // Sloveno (2026-10-01). Il nome pubblico sloveno è condiviso col gemello TSV
  // (campo creato l'11/09). ⚠️ Su Airtable questo campo è VUOTO: il cron
  // traduzioni-sl del CRM scrive solo su Postgres (`immobile.public_name_sl`),
  // quindi il nome sloveno arriva dalla vetrina, non da qui. Chi legge Airtable
  // — le schede della Private Collection, o il catalogo se torna su Airtable —
  // ripiega sull'inglese. Una descrizione TSI slovena non esiste in nessuna
  // delle due banche dati: vedi localizedDescription().
  titleSl: "fldPIse8uguVRfJ1x", // public_tsv_name_SL_#
  inEvidenza: "fld3bgYTqcgnYLADd", // in_evidenza (checkbox → boolean)
  onlineDa: "fldk27y6rT8xUZ7XQ", // online_da (date ISO yyyy-mm-dd → string|null)
  tags: "fldVdulUcA3uTtx5v",
  foto: "fldUS4uDvqXibknNL",
  coverPhoto: "fldvlnrfE1zdXFOsF",
  topPhotos: "flduAPbRd81GwJhlw",
  planimetrie: "fld8kB5lTpuzZ2IB9",
  youtubeVideos: "fldzBgkjk7K8ACVxa",
  // NB: youtube_walkthrough was removed from Airtable — its
  // content was folded into youtube_video_urls. Requesting it 422'd the whole
  // fetch (UNKNOWN_FIELD_NAME), which broke prod builds and ISR revalidation.
  matterport: "fldVT95yZFaGa8yFv",
  // URL esterno di prenotazione visita (es. modulo Google Open Day). Quando c'è,
  // la scheda mostra una CTA "Prenota una visita" in evidenza nell'hero.
  bookingUrl: "fldWQVYnv8kqxfiN1", // link_prenota_visita
  arredato: "fldRZiLzqQpZS24n9",
  ascensore: "fld1cWZRm66Pc1pRI",
  piscina: "fldUsLdpcMqlSPUG2",
  parcheggio: "fldQCABCfjCb1HDYE",
  annoCostruzione: "fldjDrYlFEMxhW2E8",
  pianiEdificio: "fld2Xc2ADuhSU21dv",
  // immobiliare.it-aligned characteristics (2026-06-15). These Airtable columns
  // are not yet renamed with the site-facing "_#" suffix — see note to Martino.
  stato: "fldSczmkeh2wDpTgj", // imm_stato_immobile (singleSelect → string)
  camere: "fld6JhgbSH4my1nGd", // camere (number) — bedrooms
  cucina: "fldOaSDiMth24ikzW", // imm_cucina (singleSelect → string)
  terrazzo: "fldPtlfKgEc0Itoyb", // imm_terrazzo (checkbox → boolean)
  riscaldamento: "fld3DSckVUdjUxkO3", // imm_riscaldamento (singleSelect → string)
  // 4 columns created 2026-06-15 to complete the immobiliare.it characteristic set.
  disponibilita: "fld4OIu1LZznmkoGu", // imm_disponibilita_# (singleSelect → string)
  balcone: "fldadPY6LLLQ4oUVW", // imm_balcone_# (checkbox → boolean)
  giardino: "fld56b0y4X7zAZtUS", // imm_giardino_# (singleSelect → string)
  accessoDisabili: "fldJxCCFqJ7lqi570", // imm_accesso_disabili_# (checkbox → boolean)
  tipoProprieta: "fldZiREblKauVYoWM", // imm_tipo_proprieta_# (singleSelect → string)
  classeImmobile: "fldqxd7FwkFMgFfPS", // imm_classe_immobile_# (singleSelect → string)
  trattativaRiservata: "fld6JmapDP4Qi8RT6",
  pubblicatoSu: "fldcF2m1cmxHmumWN", // pubblicato_su (multipleSelects: canali accesi)
  // 2026-07-23: tax box + tabella costi area riservata (stessi campi del gemello TSV).
  impostePrima: "fld8SMr41gceLNOiN", // imposte_prima (currency)
  imposteSeconda: "fldFQIfYqL0m48QWu", // imposte_seconda (currency)
  // La nota interna sulle imposte non si chiede più (09/10/2026): sono appunti
  // di lavoro, e un campo che non arriva non può finire in pagina.
  soggettoIva: "fldKMwdnvCGCSXqzx", // soggetto_iva (checkbox)
  speseCondoMensili: "fldHEZbfTOw0g0Wlj", // spese_condo_mensili (currency, monthly)
  catastoRendita: "fldI7xrGEursVgodv", // catasto_rendita (currency)
  iliaAnnua: "fldulZHH7o8dIKGAN", // ilia_annua_stima_eur (formula → number, AI estimate)
  tariAnnua: "fld4JmLypFkLqN341", // tari_annua_stima_eur (formula → number, AI estimate)
  // 2026-07-23: data di ingresso in Private Collection (la scrive il CRM quando
  // pc_visibile_su passa da vuoto a valorizzato). Ordina la collezione riservata
  // (più recente prima) e alimenta la bubble "Nuovo"/"N mesi" sulle card PC.
  pcSince: "fldN79XrZJkd4uEIe", // pc_data_ingresso (date ISO yyyy-mm-dd → string|null)
} as const;

// Display order of the zona codes (Airtable singleSelect). Codes not listed here
// (and null/empty) fall into the "other" bucket, rendered last.
export const ZONE_ORDER = [
  "CENTRO",
  "SEMICENTRO",
  "BARCOLA",
  "BARCOLA-MIRAMARE",
  "COSTIERA",
  "SISTIANA-DUINO",
  "ALTE",
  "MUGGIA",
  "FVG",
] as const;

// Bucket key used when a property has no zona or an unknown code.
export const ZONE_OTHER = "ALTRE";

export type Photo = {
  // Id attachment Airtable, quando c'è: la chiave stabile con cui
  // /foto/<attId>/<w>.webp indirizza questa foto. Vedi src/lib/photoSrc.ts.
  id: string | null;
  // Full-resolution original. Used for the hero and the lightbox (full view).
  url: string;
  // Airtable's pre-rendered "large" rendition (~917px wide), used for cards and
  // thumbnail grids so we never ship a multi-MB original into a small box.
  thumb: string;
  width: number | null;
  height: number | null;
  alt: string;
  // Original Airtable filename. Stable across attachment fields for the same
  // upload, so the gallery can de-dupe a photo that appears in more than one
  // field (cover / topPhotos / foto) even though each field's signed url differs.
  filename: string | null;
  // Trasparenza AI (01/10/2026, lib/trasparenza.ts). Due forme, mai insieme:
  // `trasparenza` sono i dati grezzi del CRM in quattro lingue, attaccati da
  // getProperties() abbinando per `filename`; `ai` è la loro resa nella lingua
  // del visitatore, che la pagina mette al loro posto prima di passare la foto
  // al browser (localizzaFoto). Assenti entrambi = foto senza dati: si mostra
  // esattamente come prima.
  trasparenza?: FotoTrasparenza;
  ai?: FotoAi;
  // La marcatura IPTC che il proxy /foto scrive nell'XMP del file (SPEC §5.7),
  // dal trattamento del CRM: entra anche nell'URL (photoSrc), perché un URL
  // già servito senza marcatura resta in cache immutabile per un anno. Solo
  // sulle righe VERE del CRM; assente = URL e file come prima.
  xmp?: MarcaXmp;
};

export type Property = {
  id: string;
  // Airtable record id (recXXX): serve alle scritture che linkano l'immobile
  // (WEB_EVENTS/WEB_PREFERITI/WEB_MATCHES). `id` resta il tsv_prop_id pubblico.
  recId: string;
  slug: string;
  title: string;
  // Titolo pubblico tradotto; null quando la traduzione non c'è ancora.
  titleEn: string | null;
  titleDe: string | null;
  titleSl: string | null;
  inEvidenza: boolean;
  onlineDa: string | null;
  contratto: "VENDITA" | "AFFITTO" | null;
  cluster: string | null;
  // Progetto/cantiere di appartenenza («DUINO»…), null se l'unità non
  // fa parte di un progetto. Decide l'invito al sito dedicato nella scheda.
  progetto: string | null;
  // Stato commerciale grezzo (SOLD, ACTIVE, …): la vetrina lo espone e lo
  // specchio Airtable lo porta con lo stesso nome. Non è la condizione fisica.
  statusCommerciale: string | null;
  tipologia: string | null;
  zona: string | null;
  comune: string | null;
  via: string | null;
  lat: number | null;
  lng: number | null;
  priceSale: number | null;
  priceRent: number | null;
  mq: number | null;
  rooms: string | null;
  baths: number | null;
  floor: string | null;
  energyClass: string | null;
  // Indice di prestazione energetica globale non rinnovabile (EPgl,nren, in
  // kWh/m² anno) e lo stato dell'APE dal CRM («APE disponibile», «APE a fine
  // lavori», «APE mancante»). Solo dalla vetrina: sul ramo Airtable sono null.
  energyIndex: number | null;
  apeStato: string | null;
  // Descrizione italiana già risolta (descrizione_TSI_# → descrizione).
  description: string | null;
  // Traduzioni grezze: null quando mancano. Non usarle direttamente in pagina —
  // passa da localizedDescription(), che garantisce il ritorno all'italiano.
  descriptionEn: string | null;
  descriptionDe: string | null;
  // Sloveno: arriva solo dalla vetrina del CRM (`descrizione_tsi_sl`, colonna
  // ancora da creare al 2026-10-01). Da Airtable è sempre null.
  descriptionSl: string | null;
  oneliner: string | null;
  tags: string[];
  photos: Photo[];
  coverPhoto: Photo | null;
  topPhotos: Photo[];
  planimetrie: Photo[];
  videos: string[];
  matterportUrl: string | null;
  bookingUrl: string | null;
  arredato: string | null;
  ascensore: string | null;
  piscina: string | null;
  parcheggio: string | null;
  annoCostruzione: number | null;
  pianiEdificio: number | null;
  stato: string | null;
  camere: number | null;
  cucina: string | null;
  terrazzo: boolean;
  riscaldamento: string | null;
  disponibilita: string | null;
  balcone: boolean;
  giardino: string | null;
  accessoDisabili: boolean;
  tipoProprieta: string | null;
  classeImmobile: string | null;
  trattativaRiservata: boolean;
  // Canali su cui il record e' pubblicato: serve alla regola di
  // de-cannibalizzazione col gemello TSV (v. canonical nella scheda).
  pubblicatoSu: string[];
  impostePrima: number | null;
  imposteSeconda: number | null;
  soggettoIva: boolean;
  // Annual ownership costs. condoMensile is the raw monthly condo fee (×12 for
  // the year); ilia/tari are AI-estimated annual figures (Airtable formulas).
  condoMensile: number | null;
  iliaAnnua: number | null;
  tariAnnua: number | null;
  pcSince: string | null;
  // Video di testata della scheda (content/annunciVideo.ts, 02/10/2026): dal
  // registro del sito per codice di catalogo (`id`), null se l'immobile non
  // ne ha uno — e allora l'hero è la sola copertina, come prima.
  heroVideo: VideoAnnuncio | null;
  // Riepilogo della trasparenza AI sulle foto (lib/trasparenza.ts): presente
  // solo quando il CRM ha dati per questo immobile.
  trasparenza?: TrasparenzaImmobile | null;
};

type RawAttachment = {
  // Airtable attachment id ("attXXXXXXXXXXXXXX"): l'UNICO identificatore stabile
  // di una foto. Le url firmate ruotano a ogni revalidation, il filename può
  // ripetersi fra immobili — l'id no. È la chiave di /foto/<attId>/<w>.webp.
  id?: string;
  url: string;
  width?: number;
  height?: number;
  filename?: string;
  // Airtable generates these renditions per attachment (small/large/full).
  thumbnails?: { large?: { url: string } };
};

type Fields = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
// Map an Airtable attachment cell to our Photo[] (skips entries without a url).
function attachments(v: unknown, alt: string): Photo[] {
  return Array.isArray(v)
    ? (v as RawAttachment[])
        .filter((a) => typeof a?.url === "string")
        .map((a) => ({
          id: a.id ?? null,
          url: a.url,
          thumb: a.thumbnails?.large?.url ?? a.url,
          width: a.width ?? null,
          height: a.height ?? null,
          alt,
          filename: a.filename ?? null,
        }))
    : [];
}
// Split a multiline text cell into trimmed non-empty lines (one URL per line).
function lines(v: unknown): string[] {
  return typeof v === "string"
    ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [];
}
// Normalize a Matterport link into an embeddable showcase URL (/show/?m=<id>).
// The dashboard URL (/models/<id>) — often pasted from the logged-in Matterport
// backend — refuses iframe embedding (X-Frame-Options) and renders as
// "connection refused". Handles /models/, /show/?m= and a bare model id.
// Esportata dal 24/08: la usa anche src/lib/vetrina.ts (catalogo da Postgres),
// così i due percorsi normalizzano il link Matterport nello stesso identico modo.
export function matterportEmbed(v: unknown): string | null {
  const raw = str(v);
  if (!raw) return null;
  if (/matterport\.com\/show\/\?/i.test(raw)) return raw; // already embeddable
  const id =
    raw.match(/matterport\.com\/(?:models|show)\/(?:\?m=)?([A-Za-z0-9]+)/i)?.[1] ??
    raw.match(/^([A-Za-z0-9]{6,})$/)?.[1];
  return id ? `https://my.matterport.com/show/?m=${id}` : raw;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Title fallback when public_tsv_name is empty.
//
// The internal name is NOT used here any more, and the reason is the same one
// already written for the slug: it very often carries the owner's surname
// (zone + surname is the usual shape of the real values in the live base —
// never write one here: this repo is public). Keeping it as the title fallback meant that the day someone published
// a listing before filling public_tsv_name, that surname would appear in the <h1>,
// in <title>, in the OpenGraph card and in every photo alt text. Protecting the
// URL and leaving the headline exposed protects nothing: the same string was one
// empty field away from the top of the page.
//
// The neutral fallback (type · area) is worse copy and infinitely safer. It also
// makes the omission visible to whoever publishes, instead of silently producing
// a page titled with a private surname. The internal id is the last resort — but
// see the comment on `title` in mapRecord: that too can be a speaking code.
function buildName(f: Fields): string {
  const derived = [str(f[F.tipologia]), str(f[F.zona])]
    .filter(Boolean)
    .join(" · ");
  if (derived) return derived;
  return "Immobile";
}

// Source of the public URL slug: the public display name. Falls back to a
// neutral tipologia + zona, and NEVER to the internal name — so an owner's
// surname can never leak into /annuncio/<slug>, even when public_tsv_name is
// not yet filled. The trailing -<id> in the slug keeps URLs unique and stable.
function slugSource(f: Fields): string {
  const pub = str(f[F.publicName]);
  if (pub) return pub;
  const derived = [str(f[F.tipologia]), str(f[F.zona])].filter(Boolean).join(" ");
  return derived || "immobile";
}

function idNumber(tsvId: string | null): string {
  const m = tsvId?.match(/(\d+)\s*$/);
  return m ? m[1] : "0";
}

/** Slug unici (08/10/2026, gemello di triestevillas-web). Il suffisso dello slug
 *  è il numero finale del codice, e i codici senza cifre finali finiscono
 *  tutti in «-0»: due case con lo stesso nome pubblico e un codice senza numero
 *  avrebbero avuto lo stesso indirizzo, e la seconda sarebbe sparita dietro la
 *  prima (la scheda prende la prima che trova). Gli slug esistenti NON cambiano
 *  (il CRM li ricostruisce con la stessa regola, web/lib/url-sito.ts): solo un
 *  doppione, dal secondo in poi in ordine di codice, prende in coda un pezzo
 *  stabile calcolato dal codice — mai il codice in chiaro, che può essere
 *  parlante. Lo verifica src/lib/slug.test.ts, nel prebuild. */
export function conSlugUnici<T extends { id: string; slug: string }>(lista: T[]): T[] {
  const perSlug = new Map<string, T[]>();
  for (const p of lista) perSlug.set(p.slug, [...(perSlug.get(p.slug) ?? []), p]);
  const nuovo = new Map<T, string>();
  for (const [slug, gruppo] of perSlug) {
    if (gruppo.length < 2) continue;
    [...gruppo]
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(1)
      .forEach((p) => nuovo.set(p, `${slug}-${impronta(p.id)}`));
  }
  return nuovo.size ? lista.map((p) => (nuovo.has(p) ? { ...p, slug: nuovo.get(p)! } : p)) : lista;
}

function impronta(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 5);
}

// ─── Uno slug che non c'è più (08/10/2026) ──────────────────────────────────
// Lo slug è slugify(nome pubblico) + numero di catalogo: cambia il nome
// pubblico e cambia l'URL. Fino all'08/10 ogni slug sconosciuto andava con un
// 307 a /immobili — temporaneo, e Google lo legge come soft-404 — e il vecchio
// URL di una casa ancora in vendita si perdeva. Ora, come sul gemello
// triesteaffitti (risolviSlug, 30/09):
//   · slug esatto → la scheda;
//   · lo stesso numero di catalogo (o la stessa base) su UNA sola scheda viva →
//     308 allo slug di oggi;
//   · nient'altro → 404 vero (notFound), con la pagina localizzata.
// Con due candidate non si tira a indovinare: 404.
export type EsitoSlug<T> =
  | { tipo: "esatto"; property: T }
  | { tipo: "sposta"; property: T }
  | { tipo: "assente" };

export function risolviSlug<T extends Pick<Property, "slug" | "id">>(
  slug: string,
  catalogo: readonly T[],
): EsitoSlug<T> {
  const esatta = catalogo.find((p) => p.slug === slug);
  if (esatta) return { tipo: "esatto", property: esatta };
  const una = (xs: T[]) => (xs.length === 1 ? xs[0] : null);
  const s = slug.trim().toLowerCase();
  const m = s.match(/^(.*)-(\d+)$/);
  const numero = m && m[2] !== "0" ? m[2] : null;
  const base = m ? m[1] : s;
  const meta =
    // 1) lo stesso numero di catalogo (il nome pubblico è cambiato)
    (numero ? una(catalogo.filter((p) => idNumber(p.id) === numero)) : null) ??
    // 2) la stessa base (il codice è cambiato, o il link aveva perso la coda)
    una(catalogo.filter((p) => p.slug.startsWith(`${base}-`) && /^\d+$/.test(p.slug.slice(base.length + 1))));
  return meta ? { tipo: "sposta", property: meta } : { tipo: "assente" };
}

// ─── Chi tiene il canonical di una casa condivisa con triestevillas.com ──────
// Regola complementare a quella di TSV (audit 2026-08-11): dai 500k in su il
// pregio è mestiere di TriesteVillas — se il record è pubblicato anche là,
// questa copia cede il canonical e resta fuori dalla sitemap. Sotto i 500k (o
// senza prezzo) vince TSI. Un posto solo, letto dalla scheda e dalla sitemap.
export function tsvVince(p: Pick<Property, "pubblicatoSu" | "priceSale">): boolean {
  return p.pubblicatoSu.includes("triestevillas.com") && p.priceSale != null && p.priceSale >= 500_000;
}

// Le stime ILIA e TARI (formule di Airtable) e la scheda TARI interattiva usano
// l'aliquota e le tariffe del Comune di Trieste. Fuori Trieste — Muggia,
// Duino-Aurisina… — stampavano l'importo di un altro Comune: si spengono, come su
// triestevillas.com (1221d6c, 01/10/2026) e FriuliVillas. Comune vuoto = record
// storico triestino, si lascia com'era.
export function aTrieste(comune: string | null | undefined): boolean {
  return !comune || comune.trim().toLowerCase() === "trieste";
}

export function mapRecord(recordId: string, f: Fields): Property {
  const id = str(f[F.id]) ?? recordId;
  const contratto = str(f[F.contratto]) as Property["contratto"];
  const priceSale = num(f[F.prezzo]);
  const priceRent = num(f[F.canone]);
  const tags = Array.isArray(f[F.tags]) ? (f[F.tags] as string[]) : [];
  const name = buildName(f); // title fallback only (see slugSource for the URL)
  // Public display name: public_tsv_name when set, else a NEUTRAL fallback.
  // Never the internal name and never the internal id: `tsv_prop_id` is a free
  // text field and 38 of the 765 records carry a speaking code (place + word,
  // sometimes a surname) rather than a progressive number.
  const title = str(f[F.publicName]) ?? name;

  const photos = attachments(f[F.foto], title); // full gallery
  const topPhotos = attachments(f[F.topPhotos], title); // curated in-card order
  const planimetrie = attachments(f[F.planimetrie], title);
  // Cover: dedicated foto_copertina, else first curated, else first gallery photo.
  const coverPhoto = attachments(f[F.coverPhoto], title)[0] ?? topPhotos[0] ?? photos[0] ?? null;

  return {
    id,
    recId: recordId,
    slug: `${slugify(slugSource(f))}-${idNumber(id)}`,
    title,
    titleEn: str(f[F.titleEn]),
    titleDe: str(f[F.titleDe]),
    titleSl: str(f[F.titleSl]),
    inEvidenza: f[F.inEvidenza] === true,
    onlineDa: typeof f[F.onlineDa] === "string" ? (f[F.onlineDa] as string) : null,
    contratto,
    cluster: str(f[F.cluster]),
    progetto: str(f[F.progetto]),
    statusCommerciale: str(f[F.statusCommerciale]),
    tipologia: str(f[F.tipologia]),
    zona: str(f[F.zona]),
    comune: str(f[F.comune]),
    via: str(f[F.via]),
    lat: num(f[F.lat]),
    lng: num(f[F.lng]),
    priceSale,
    priceRent,
    mq: num(f[F.mq]),
    rooms: str(f[F.locali]),
    baths: num(f[F.bagni]),
    floor: str(f[F.piano]),
    energyClass: str(f[F.ape]),
    energyIndex: null,
    apeStato: null,
    description: str(f[F.descrizioneTsi]) || str(f[F.descrizione]),
    descriptionEn: str(f[F.descrizioneTsiEn]),
    descriptionDe: str(f[F.descrizioneTsiDe]),
    descriptionSl: null,
    oneliner: str(f[F.onelinerTsi]) || str(f[F.oneliner]),
    tags,
    photos,
    coverPhoto,
    topPhotos,
    planimetrie,
    videos: lines(f[F.youtubeVideos]),
    matterportUrl: matterportEmbed(f[F.matterport]),
    bookingUrl: str(f[F.bookingUrl]),
    arredato: str(f[F.arredato]),
    ascensore: str(f[F.ascensore]),
    piscina: str(f[F.piscina]),
    parcheggio: str(f[F.parcheggio]),
    annoCostruzione: num(f[F.annoCostruzione]),
    pianiEdificio: num(f[F.pianiEdificio]),
    stato: str(f[F.stato]),
    camere: num(f[F.camere]),
    cucina: str(f[F.cucina]),
    terrazzo: f[F.terrazzo] === true,
    riscaldamento: str(f[F.riscaldamento]),
    disponibilita: str(f[F.disponibilita]),
    balcone: f[F.balcone] === true,
    giardino: str(f[F.giardino]),
    accessoDisabili: f[F.accessoDisabili] === true,
    tipoProprieta: str(f[F.tipoProprieta]),
    classeImmobile: str(f[F.classeImmobile]),
    trattativaRiservata: f[F.trattativaRiservata] === true,
    pubblicatoSu: Array.isArray(f[F.pubblicatoSu])
      ? (f[F.pubblicatoSu] as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    impostePrima: num(f[F.impostePrima]),
    imposteSeconda: num(f[F.imposteSeconda]),
    soggettoIva: f[F.soggettoIva] === true,
    condoMensile: num(f[F.speseCondoMensili]),
    iliaAnnua: aTrieste(str(f[F.comune])) ? num(f[F.iliaAnnua]) : null,
    tariAnnua: aTrieste(str(f[F.comune])) ? num(f[F.tariAnnua]) : null,
    pcSince: typeof f[F.pcSince] === "string" ? (f[F.pcSince] as string) : null,
    heroVideo: videoAnnuncio(id),
  };
}

// Venduto: solo lo stato commerciale SOLD (UNDER_OFFER e RESERVED non si
// annunciano). Stessa lettura di soldBadge in propertyView.ts; qui serve ai
// dati strutturati, che a un venduto non devono dare `InStock`.
export function isSold(p: Pick<Property, "statusCommerciale">): boolean {
  return p.statusCommerciale?.toUpperCase().trim() === "SOLD";
}

// Gli «immobili simili» della scheda vivono in lib/simili.ts (dal 02/10/2026).

// Normalize a property's zona to a known ZONE_ORDER code, or the "other" bucket.
export function zoneKey(p: Property): string {
  const z = p.zona?.toUpperCase().trim();
  return z && (ZONE_ORDER as readonly string[]).includes(z) ? z : ZONE_OTHER;
}

// Group properties by zona in ZONE_ORDER, with the "other" bucket last.
// Only buckets that actually contain properties are returned.
export function groupByZone(
  properties: Property[],
): { code: string; items: Property[] }[] {
  const buckets = new Map<string, Property[]>();
  for (const p of properties) {
    const key = zoneKey(p);
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(p);
  }
  const ordered = [...ZONE_ORDER, ZONE_OTHER];
  return ordered
    .filter((code) => buckets.has(code))
    .map((code) => ({ code, items: buckets.get(code)! }));
}
