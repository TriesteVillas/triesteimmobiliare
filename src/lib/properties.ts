// Field-ID map for the Airtable PROPRIETA table (base app1ZDay9vQNU5V2u, table tblwAUWPnX7KF8FhU).
// We key on field IDs (stable across renames) for both the live REST fetch
// (returnFieldsByFieldId=true) and the dev seed.
export const F = {
  id: "fldR3kYOEvMTn7qKA",
  internalName: "fldv1buS8yk2NZKOZ",
  publicName: "fldcGog8cRFRjZIrI",
  contratto: "fld8sD96k6YChA8pA",
  cluster: "fldcdPH8aCWSfvFlD",
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
  oneliner: "fldIMsfxvOW95HV90",
  tags: "fldVdulUcA3uTtx5v",
  foto: "fldUS4uDvqXibknNL",
  coverPhoto: "fldvlnrfE1zdXFOsF",
  topPhotos: "flduAPbRd81GwJhlw",
  planimetrie: "fld8kB5lTpuzZ2IB9",
  youtubeVideos: "fldzBgkjk7K8ACVxa",
  // NB: youtube_walkthrough (fldfJBFclRBTD4oGs) was removed from Airtable — its
  // content was folded into youtube_video_urls. Requesting it 422'd the whole
  // fetch (UNKNOWN_FIELD_NAME), which broke prod builds and ISR revalidation.
  matterport: "fldVT95yZFaGa8yFv",
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
  // Full-resolution original. Used for the hero and the lightbox (full view).
  url: string;
  // Airtable's pre-rendered "large" rendition (~917px wide), used for cards and
  // thumbnail grids so we never ship a multi-MB original into a small box.
  thumb: string;
  width: number | null;
  height: number | null;
  alt: string;
};

export type Property = {
  id: string;
  slug: string;
  title: string;
  contratto: "VENDITA" | "AFFITTO" | null;
  cluster: string | null;
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
  description: string | null;
  oneliner: string | null;
  tags: string[];
  photos: Photo[];
  coverPhoto: Photo | null;
  topPhotos: Photo[];
  planimetrie: Photo[];
  videos: string[];
  matterportUrl: string | null;
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
};

type RawAttachment = {
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
          url: a.url,
          thumb: a.thumbnails?.large?.url ?? a.url,
          width: a.width ?? null,
          height: a.height ?? null,
          alt,
        }))
    : [];
}
// Split a multiline text cell into trimmed non-empty lines (one URL per line).
function lines(v: unknown): string[] {
  return typeof v === "string"
    ? v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [];
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

// Internal name — used only as the title fallback when public_tsv_name is empty.
// NOTE: must NOT feed the URL slug; the internal name often carries the owner's
// surname (e.g. "Valta Penthouse Large"), which can't appear in a public URL.
function buildName(f: Fields): string {
  const named = str(f[F.internalName]);
  if (named) return named;
  const derived = [str(f[F.tipologia]), str(f[F.zona])]
    .filter(Boolean)
    .join(" · ");
  if (derived) return derived;
  return str(f[F.id]) ?? "Immobile";
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

export function mapRecord(recordId: string, f: Fields): Property {
  const id = str(f[F.id]) ?? recordId;
  const contratto = str(f[F.contratto]) as Property["contratto"];
  const priceSale = num(f[F.prezzo]);
  const priceRent = num(f[F.canone]);
  const tags = Array.isArray(f[F.tags]) ? (f[F.tags] as string[]) : [];
  const name = buildName(f); // title fallback only (see slugSource for the URL)
  // Public display name: public_tsv_name when set, else the internal name.
  const title = str(f[F.publicName]) ?? name;

  const photos = attachments(f[F.foto], title); // full gallery
  const topPhotos = attachments(f[F.topPhotos], title); // curated in-card order
  const planimetrie = attachments(f[F.planimetrie], title);
  // Cover: dedicated foto_copertina, else first curated, else first gallery photo.
  const coverPhoto = attachments(f[F.coverPhoto], title)[0] ?? topPhotos[0] ?? photos[0] ?? null;

  return {
    id,
    slug: `${slugify(slugSource(f))}-${idNumber(id)}`,
    title,
    contratto,
    cluster: str(f[F.cluster]),
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
    description: str(f[F.descrizione]),
    oneliner: str(f[F.oneliner]),
    tags,
    photos,
    coverPhoto,
    topPhotos,
    planimetrie,
    videos: lines(f[F.youtubeVideos]),
    matterportUrl: str(f[F.matterport]),
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
  };
}

// Suggest similar listings: same contract type, prioritising the same zona and
// a nearby price (±30% best, ±60% ok), then closest price wins.
export function similarProperties(
  current: Property,
  all: Property[],
  limit = 4,
): Property[] {
  const price = current.priceSale ?? current.priceRent ?? null;
  return all
    .filter((p) => p.slug !== current.slug && p.contratto === current.contratto)
    .map((p) => {
      const pp = p.priceSale ?? p.priceRent ?? null;
      let score = 0;
      if (current.zona && p.zona === current.zona) score += 3;
      else if (current.comune && p.comune === current.comune) score += 1;
      let dist = Number.POSITIVE_INFINITY;
      if (price && pp) {
        dist = Math.abs(pp - price) / price;
        if (dist <= 0.3) score += 2;
        else if (dist <= 0.6) score += 1;
      }
      return { p, score, dist };
    })
    .sort((a, b) => b.score - a.score || a.dist - b.dist)
    .slice(0, limit)
    .map((x) => x.p);
}

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
