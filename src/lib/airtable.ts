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
// pubblicato_su is multipleSelects -> membership via ARRAYJOIN+FIND.
// NOTE: the formula references {tsv_com_online} and {pubblicato_su} by NAME - if
// either field is renamed in Airtable, update this formula (and the sibling sites').
const SITE_TARGETS = ["triesteimmobiliare.com"];
const FILTER = `AND({tsv_com_online}=TRUE(),OR(${SITE_TARGETS.map(
  (s) => `FIND("${s}",ARRAYJOIN({pubblicato_su}))`,
).join(",")}))`;

type RawRecord = { id: string; fields: Record<string, unknown> };

// Pull the offending field id out of an Airtable UNKNOWN_FIELD_NAME 422 body.
function unknownFieldId(status: number, body: string): string | null {
  if (status !== 422) return null;
  try {
    const err = JSON.parse(body) as { error?: { type?: string; message?: string } };
    if (err.error?.type !== "UNKNOWN_FIELD_NAME") return null;
    return err.error.message?.match(/fld[A-Za-z0-9]{14}/)?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchAllRaw(): Promise<RawRecord[]> {
  const out: RawRecord[] = [];
  // A field id that no longer exists in the table (schema drift, or a stale/typo
  // id in F) makes Airtable 422 the ENTIRE fetch — which breaks the build and
  // silently freezes ISR revalidation. So be resilient: drop the offending id
  // and retry, keeping every other field. `fields` only ever shrinks, and an
  // empty list means "all fields" (never 422s), so this loop is bounded by
  // FIELD_IDS.length. Dropped fields just map to null downstream.
  const fields: string[] = [...FIELD_IDS];
  let offset: string | undefined;

  while (true) {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("filterByFormula", FILTER);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("returnFieldsByFieldId", "true");
    for (const id of fields) url.searchParams.append("fields[]", id);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["properties"] },
    });

    if (!res.ok) {
      const body = await res.text();
      const badField = unknownFieldId(res.status, body);
      if (badField && fields.includes(badField)) {
        console.warn(
          `[airtable] unknown field id "${badField}" — dropping it and retrying (schema drift)`,
        );
        fields.splice(fields.indexOf(badField), 1);
        continue; // retry the SAME page with the reduced field set
      }
      throw new Error(`Airtable ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { records: RawRecord[]; offset?: string };
    out.push(...data.records);
    offset = data.offset;
    if (!offset) break;
  }

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
