/* ================================================================
   Address lookup for the intake forms.

   One provider behind one interface: the forms never learn who
   answers. Today that is Photon (Komoot's OSM geocoder) — no API
   key, no billing account, and built for search-as-you-type.
   Nominatim is deliberately NOT used: its usage policy forbids
   autocomplete outright.

   Swapping in Google Places later means rewriting `search()` and
   nothing else.
   ================================================================ */

const ENDPOINT = "https://photon.komoot.io/api/";

// Results are biased towards Trieste rather than hard-filtered, so an
// owner living elsewhere in FVG still finds their street — Trieste just
// ranks first.
const BIAS = { lat: 45.6495, lon: 13.7768 };

export type AddressSuggestion = {
  /** Single line to show in the dropdown and store in the field. */
  label: string;
  street: string | null;
  houseNumber: string | null;
  postcode: string | null;
  city: string | null;
  /** OSM has no province field; kept for whatever the provider offers. */
  region: string | null;
  lat: number | null;
  lon: number | null;
};

type PhotonFeature = {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    countrycode?: string;
    country?: string;
    osm_key?: string;
  };
  geometry?: { coordinates?: [number, number] };
};

/** "Via Torino 34, 34123 Trieste" — the shape people expect to read back. */
function toLabel(p: PhotonFeature["properties"]): string {
  const street = p.street ?? p.name ?? "";
  const line1 = [street, p.housenumber].filter(Boolean).join(" ");
  const town = p.city ?? p.district ?? p.county ?? "";
  const line2 = [p.postcode, town].filter(Boolean).join(" ");
  return [line1, line2].filter(Boolean).join(", ");
}

export async function search(query: string, limit = 6): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit * 2)); // room to drop non-IT hits
  url.searchParams.set("lat", String(BIAS.lat));
  url.searchParams.set("lon", String(BIAS.lon));

  const res = await fetch(url, {
    headers: { "User-Agent": "TriesteImmobiliare/1.0 (info@triesteimmobiliare.com)" },
    // Photon asks callers to "be fair"; the route caches on top of this.
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`photon ${res.status}`);

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];

  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    if (p.countrycode && p.countrycode !== "IT") continue;
    // Streets, addresses and places only — skip shops, churches, bus stops.
    if (p.osm_key && !["place", "highway", "building", "boundary"].includes(p.osm_key)) continue;

    const label = toLabel(p);
    if (!label || seen.has(label)) continue;
    seen.add(label);

    const [lon, lat] = f.geometry?.coordinates ?? [];
    out.push({
      label,
      street: p.street ?? p.name ?? null,
      houseNumber: p.housenumber ?? null,
      postcode: p.postcode ?? null,
      city: p.city ?? p.district ?? p.county ?? null,
      region: p.state ?? null,
      lat: typeof lat === "number" ? lat : null,
      lon: typeof lon === "number" ? lon : null,
    });
    if (out.length >= limit) break;
  }
  return out;
}
