import "server-only";
import { matterportEmbed, slugify, type Photo, type Property } from "./properties";

// ─────────────────────────────────────────────────────────────────────────────
// IL CATALOGO DA POSTGRES — fase 2 del taglio Airtable → Postgres (24/08/2026).
//
// Stessa forma (`Property`), altra sorgente: la rotta pubblica
// `/api/vetrina?sito=triesteimmobiliare.com` di tsv-pg, che applica LA STESSA
// regola a tre condizioni della formula qui accanto (online + mai il cluster
// PRIVATE + pubblicato su questo dominio). Si accende con
// CATALOGO_SORGENTE=pg; senza, il sito legge Airtable come sempre. Il rollback
// è rimettere la variabile: nessun revert di codice. Gemello di
// triesteaffitti/src/lib/vetrina.ts, con la mappa campi più larga di TSI.
//
// LE FOTO non cambiano strada: le card e le gallerie passano già dal proxy
// /foto/<attId>/<w>.webp del sito (photoSrc.ts), e il proxy risolve gli id con
// la SUA fetch leggera su Airtable (getPhotoSources) — che resta com'è. Qui
// serve solo che ogni Photo porti il suo `id` e un url servibile: gli url
// firmati che arrivano dentro gli allegati della vetrina sono SCADUTI per
// costruzione (lo specchio li copia e ruotano in poche ore), quindi url e
// thumb puntano anch'essi al proxy — mai all'url firmata. Un allegato senza
// id si scarta: meglio una foto in meno che un riquadro rotto per sempre.
//
// ⚠️ La PRIVATE COLLECTION non passa di qui: resta su PRIVATE_FILTER/Airtable
// (airtable.ts), come da regola — la vetrina serve solo il pubblico.
// ─────────────────────────────────────────────────────────────────────────────

const VETRINA_URL =
  process.env.VETRINA_URL ?? "https://tsv-pg.vercel.app/api/vetrina";
const SITO = "triesteimmobiliare.com";
const REVALIDATE_SECONDS = 600;

/** L'interruttore della fase 2: Postgres solo se acceso di proposito. */
export const VETRINA_ATTIVA = process.env.CATALOGO_SORGENTE === "pg";

type Allegato = {
  id?: string;
  filename?: string;
  type?: string;
  width?: number;
  height?: number;
};

type RigaVetrina = {
  tsv_prop_id: string | null;
  airtable_id: string;
  nome: string | null;
  public_name: string | null;
  public_name_en: string | null;
  public_name_de: string | null;
  status: string | null;
  contratto: string | null;
  tipologia: string | null;
  cluster: string | null;
  prezzo_eur: string | number | null;
  canone_mensile_eur: string | number | null;
  mq: string | number | null;
  locali: string | null;
  bagni: string | number | null;
  piano: string | null;
  ascensore: string | null;
  map_via: string | null;
  comune: string | null;
  zona: string | null;
  map_lat: string | number | null;
  map_lng: string | number | null;
  descrizione: string | null;
  descrizione_tsi: string | null;
  descrizione_tsi_en: string | null;
  descrizione_tsi_de: string | null;
  oneliner: string | null;
  oneliner_tsi: string | null;
  online_da: string | null;
  in_evidenza: boolean | null;
  pubblicato_su: string[] | null;
  tags: string[] | null;
  ape_classe: string | null;
  arredato: string | null;
  piscina: string | null;
  parcheggio: string | null;
  matterport_url: string | null;
  youtube_urls: string | null;
  anno_costruzione: string | null;
  piani_edificio: string | null;
  trattativa_riservata: string | null;
  booking_url: string | null;
  stato_immobile: string | null;
  camere: string | null;
  cucina: string | null;
  terrazzo: string | null;
  riscaldamento: string | null;
  disponibilita: string | null;
  balcone: string | null;
  giardino: string | null;
  accesso_disabili: string | null;
  tipo_proprieta: string | null;
  classe_immobile: string | null;
  imposte_prima: string | null;
  imposte_seconda: string | null;
  note_imposte: string | null;
  soggetto_iva: string | null;
  spese_condo_mensili: string | null;
  ilia_annua: string | null;
  tari_annua_stima_eur: string | number | null;
  pc_data_ingresso: string | null;
  foto: Allegato[] | null;
  copertina: Allegato[] | null;
  foto_top8: Allegato[] | null;
  planimetrie: Allegato[] | null;
};

// ⚠️ numeric di Postgres arriva come STRINGA (pg non converte per non perdere
// precisione), integer come numero, e i valori estratti da `extra` con ->>
// sono sempre testo: tutto passa da qui.
function num(v: string | number | null | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

// Un checkbox che ha viaggiato dentro `extra` con ->> è la stringa "true".
const flag = (v: string | null): boolean => v === "true";

function lines(v: string | null): string[] {
  return typeof v === "string"
    ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [];
}

// Una colonna `date` esce dal JSON come ISO completo: il giorno è i primi 10
// caratteri. Il taglio è lecito perché il server di tsv-pg gira in UTC e lo
// specchio salva date pure (niente ore da spostare).
const giorno = (v: string | null): string | null =>
  typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : null;

// Le stesse larghezze dell'allowlist di /foto/[att]/[spec] (photoSrc.ts).
function attachments(v: Allegato[] | null, alt: string): Photo[] {
  return Array.isArray(v)
    ? v
        .filter((a): a is Allegato & { id: string } =>
          typeof a?.id === "string" && (a.type ?? "image/").startsWith("image/"))
        .map((a) => ({
          id: a.id,
          url: `/foto/${a.id}/2000.webp`,
          thumb: `/foto/${a.id}/800.webp`,
          width: a.width ?? null,
          height: a.height ?? null,
          alt,
          filename: a.filename ?? null,
        }))
    : [];
}

function idNumber(tsvId: string | null): string {
  const m = tsvId?.match(/(\d+)\s*$/);
  return m ? m[1] : "0";
}

// Stessi criteri di slugSource/buildName in properties.ts: il nome pubblico
// guida lo slug, il ritorno è NEUTRO (tipologia + zona), MAI il nome interno —
// il cognome di un proprietario non deve finire in /annuncio/<slug>.
function slugSource(r: RigaVetrina): string {
  const pub = str(r.public_name);
  if (pub) return pub;
  const derived = [str(r.tipologia), str(r.zona)].filter(Boolean).join(" ");
  return derived || "immobile";
}

function buildName(r: RigaVetrina): string {
  const derived = [str(r.tipologia), str(r.zona)].filter(Boolean).join(" · ");
  return derived || "Immobile";
}

function mapRiga(r: RigaVetrina): Property {
  const id = str(r.tsv_prop_id) ?? r.airtable_id;
  const title = str(r.public_name) ?? buildName(r);

  const photos = attachments(r.foto, title);
  const topPhotos = attachments(r.foto_top8, title);
  const planimetrie = attachments(r.planimetrie, title);
  const coverPhoto =
    attachments(r.copertina, title)[0] ?? topPhotos[0] ?? photos[0] ?? null;

  return {
    id,
    recId: r.airtable_id,
    slug: `${slugify(slugSource(r))}-${idNumber(id)}`,
    title,
    titleEn: str(r.public_name_en),
    titleDe: str(r.public_name_de),
    inEvidenza: r.in_evidenza === true,
    onlineDa: giorno(r.online_da),
    contratto: str(r.contratto) as Property["contratto"],
    cluster: str(r.cluster),
    tipologia: str(r.tipologia),
    zona: str(r.zona),
    comune: str(r.comune),
    via: str(r.map_via),
    lat: num(r.map_lat),
    lng: num(r.map_lng),
    priceSale: num(r.prezzo_eur),
    priceRent: num(r.canone_mensile_eur),
    mq: num(r.mq),
    rooms: str(r.locali),
    baths: num(r.bagni),
    floor: str(r.piano),
    energyClass: str(r.ape_classe),
    description: str(r.descrizione_tsi) || str(r.descrizione),
    descriptionEn: str(r.descrizione_tsi_en),
    descriptionDe: str(r.descrizione_tsi_de),
    oneliner: str(r.oneliner_tsi) || str(r.oneliner),
    tags: Array.isArray(r.tags) ? r.tags : [],
    photos,
    coverPhoto,
    topPhotos,
    planimetrie,
    videos: lines(r.youtube_urls),
    matterportUrl: matterportEmbed(r.matterport_url),
    bookingUrl: str(r.booking_url),
    arredato: str(r.arredato),
    ascensore: str(r.ascensore),
    piscina: str(r.piscina),
    parcheggio: str(r.parcheggio),
    annoCostruzione: num(r.anno_costruzione),
    pianiEdificio: num(r.piani_edificio),
    stato: str(r.stato_immobile),
    camere: num(r.camere),
    cucina: str(r.cucina),
    terrazzo: flag(r.terrazzo),
    riscaldamento: str(r.riscaldamento),
    disponibilita: str(r.disponibilita),
    balcone: flag(r.balcone),
    giardino: str(r.giardino),
    accessoDisabili: flag(r.accesso_disabili),
    tipoProprieta: str(r.tipo_proprieta),
    classeImmobile: str(r.classe_immobile),
    trattativaRiservata: flag(r.trattativa_riservata),
    pubblicatoSu: Array.isArray(r.pubblicato_su) ? r.pubblicato_su : [],
    impostePrima: num(r.imposte_prima),
    imposteSeconda: num(r.imposte_seconda),
    noteImposte: str(r.note_imposte),
    soggettoIva: flag(r.soggetto_iva),
    condoMensile: num(r.spese_condo_mensili),
    iliaAnnua: num(r.ilia_annua),
    tariAnnua: num(r.tari_annua_stima_eur),
    pcSince: giorno(r.pc_data_ingresso),
  };
}

/** Il catalogo pubblico da Postgres, nella stessa forma di getProperties().
 *  L'ordinamento (compareShowcase) lo applica il chiamante, identico per le
 *  due sorgenti. */
export async function getPropertiesDaVetrina(): Promise<Property[]> {
  const res = await fetch(`${VETRINA_URL}?sito=${SITO}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["properties"] },
  });
  if (!res.ok) {
    throw new Error(`vetrina ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { immobili: RigaVetrina[] };
  return data.immobili.map(mapRiga);
}
