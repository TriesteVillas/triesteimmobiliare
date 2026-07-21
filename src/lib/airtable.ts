import "server-only";
import { F, mapRecord, type Property } from "./properties";
import { priceSlotLabel } from "./private/bands";
import { BRAND } from "./private/brand";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app1ZDay9vQNU5V2u";
const TABLE_ID = "tblwAUWPnX7KF8FhU";
const TOKEN = process.env.AIRTABLE_TOKEN;
const REVALIDATE_SECONDS = 600;

const FIELD_IDS = Object.values(F);
// Publish rule for the TriesteImmobiliare site:
//   1) tsv_com_online (checkbox) = true  — MASTER online/offline switch shared by
//      every TriesteVillas Group site (if false, the unit is offline everywhere).
//   2) cluster != PRIVATE — off-market units NEVER reach a public grid.
//   3) pubblicato_su contains one of SITE_TARGETS.
// pubblicato_su is multipleSelects -> membership via ARRAYJOIN+FIND.
// NOTE: the formula references {tsv_com_online}, {cluster} and {pubblicato_su} by
// NAME - if any is renamed in Airtable, update this formula (and the sibling sites').
//
// (2) is not belt-and-braces. Without it the confidentiality of an off-market unit
// rests on nobody ever ticking triesteimmobiliare.com on a PRIVATE record — a data
// invariant, not a code one. And the rest of the pipeline is primed to show it well:
// propertyView emits the `private` badge, PropertyBadge already styles it, it.json
// already has the "Vendita riservata" label, and sitemap.ts + generateStaticParams
// would hand the URL to crawlers. One stray tick would publish photos, price and
// address of a listing whose whole point is that it is not published. The sibling
// site (triestevillas-web/src/lib/airtable.ts) has always carried this clause; this
// one was missing it.
const SITE_TARGETS = ["triesteimmobiliare.com"];
const FILTER = `AND({tsv_com_online}=TRUE(),{cluster}!='PRIVATE',OR(${SITE_TARGETS.map(
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

async function fetchAllRaw(filter: string): Promise<RawRecord[]> {
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
    url.searchParams.set("filterByFormula", filter);
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
    raw = await fetchAllRaw(FILTER);
  } else {
    // Dev convenience: render real content from a committed snapshot until the
    // production AIRTABLE_TOKEN is set. Production always has the token.
    console.warn("[airtable] AIRTABLE_TOKEN not set — using dev seed snapshot.");
    // The seed bypasses FILTER, so the PRIVATE exclusion has to be re-applied by
    // hand here: a public grid must never show an off-market unit, not even in dev.
    raw = ((await import("./seed.json")).default as RawRecord[]).filter(
      (r) => String(r.fields[F.cluster] ?? "").toUpperCase().trim() !== "PRIVATE",
    );
  }
  return raw
    .map((r) => mapRecord(r.id, r.fields))
    .sort((a, b) => (b.priceSale ?? 0) - (a.priceSale ?? 0));
}

export async function getProperty(slug: string): Promise<Property | null> {
  const all = await getProperties();
  return all.find((p) => p.slug === slug) ?? null;
}

// ---- Private Collection ----------------------------------------------------

// Gate della collezione riservata di QUESTO sito:
//   tsv_com_online = TRUE  AND  cluster = PRIVATE  AND  pc_visibile_su ∋ questo dominio.
//
// La terza clausola è ciò che tiene separate le due Private Collection del gruppo.
// Senza, entrambi i siti girerebbero lo stesso identico filtro e mostrerebbero lo
// stesso identico inventario: una villa off-market da 3M comparirebbe qui dentro.
//
// pc_visibile_su NON è pubblicato_su. Quello significa "pubblicalo al mondo" e viene
// spuntato ogni giorno per motivi che con la riservatezza non c'entrano; riusarlo
// avrebbe legato la segretezza di un off-market a un campo che si tocca per altro.
const PRIVATE_FILTER = `AND({tsv_com_online}=TRUE(),{cluster}='PRIVATE',FIND("${BRAND.pcDomain}",ARRAYJOIN({pc_visibile_su})))`;

// Record privati COMPLETI, per l'area loggata. Il chiamante DEVE aver già applicato
// il gate (cookie valido + grant attivo) prima di mostrarli.
export async function getPrivateProperties(): Promise<Property[]> {
  let raw: RawRecord[];
  if (TOKEN) {
    raw = await fetchAllRaw(PRIVATE_FILTER);
  } else {
    // Ramo di sviluppo senza token: il seed è uno snapshot committato e non contiene
    // pc_visibile_su, quindi qui il gate resta il solo cluster. Non è un buco (senza
    // token non si parla con Airtable, e in produzione TOKEN c'è sempre), ma va
    // ricordato che l'area riservata non è collaudabile in locale dal solo seed.
    raw = ((await import("./seed.json")).default as RawRecord[]).filter(
      (r) => String(r.fields[F.cluster] ?? "").toUpperCase().trim() === "PRIVATE",
    );
  }
  return raw
    .map((r) => mapRecord(r.id, r.fields))
    .sort((a, b) => (b.priceSale ?? 0) - (a.priceSale ?? 0));
}

export async function getPrivateProperty(slug: string): Promise<Property | null> {
  const all = await getPrivateProperties();
  return all.find((p) => p.slug === slug) ?? null;
}

// Proiezione pubblica del teaser: deliberatamente PRIVA di titolo, foto e prezzo.
// Al browser arrivano solo la zona (per collocare la card) e una forbice grossolana,
// così la pagina pubblica non può far trapelare nulla dell'immobile riservato.
export type Teaser = { id: string; zona: string | null; band: string | null };

export async function getPrivateTeasers(): Promise<Teaser[]> {
  const all = await getPrivateProperties();
  return all.map((p) => ({ id: p.id, zona: p.zona, band: priceSlotLabel(p.priceSale) }));
}
