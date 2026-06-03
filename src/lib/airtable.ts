import "server-only";
import { F, mapRecord, type Property } from "./properties";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app1ZDay9vQNU5V2u";
const TABLE_ID = "tblwAUWPnX7KF8FhU";
const TOKEN = process.env.AIRTABLE_TOKEN;
const REVALIDATE_SECONDS = 600;

const FIELD_IDS = Object.values(F);
// Publish rule for the TriesteImmobiliare site:
//   1) tsv_com_online (checkbox) = true  — MASTER online/offline switch shared by
//      every TriesteVillas Group site (if false, the unit is offline everywhere).
//   2) pubblicato_su contains one of SITE_TARGETS.
// pubblicato_su is multipleSelects → membership via ARRAYJOIN+FIND.
// NOTE: the formula references {tsv_com_online} and {pubblicato_su} by NAME — if
// either field is renamed in Airtable, update this formula (and the TSV site's).
const SITE_TARGETS = ["triesteimmobiliare.com"];
const FILTER = `AND({tsv_com_online}=TRUE(),OR(${SITE_TARGETS.map(
  (s) => `FIND("${s}",ARRAYJOIN({pubblicato_su}))`,
).join(",")}))`;

type RawRecord = { id: string; fields: Record<string, unknown> };

async function fetchAllRaw(): Promise<RawRecord[]> {
  const out: RawRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("filterByFormula", FILTER);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("returnFieldsByFieldId", "true");
    for (const id of FIELD_IDS) url.searchParams.append("fields[]", id);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["properties"] },
    });
    if (!res.ok) {
      throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as { records: RawRecord[]; offset?: string };
    out.push(...data.records);
    offset = data.offset;
  } while (offset);

  return out;
}

export async function getProperties(): Promise<Property[]> {
  let raw: RawRecord[];
  if (TOKEN) {
    raw = await fetchAllRaw();
  } else {
    // Dev convenience: render real content from a committed snapshot until the
    // production AIRTABLE_TOKEN is set. Production always has the token.
    console.warn("[airtable] AIRTABLE_TOKEN not set — using dev seed snapshot.");
    raw = (await import("./seed.json")).default as RawRecord[];
  }
  return raw
    .map((r) => mapRecord(r.id, r.fields))
    .sort((a, b) => (b.priceSale ?? 0) - (a.priceSale ?? 0));
}

export async function getProperty(slug: string): Promise<Property | null> {
  const all = await getProperties();
  return all.find((p) => p.slug === slug) ?? null;
}
