import { NextResponse } from "next/server";
import { search } from "@/lib/geocode";

/* Address suggestions for the intake forms.

   Proxied rather than called from the browser for three reasons: the
   upstream provider stays swappable in one file, visitors' keystrokes
   never reach a third party directly, and the in-memory cache keeps us
   well inside Photon's "please be fair" request budget. */

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; body: unknown }>();

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 3) return NextResponse.json({ results: [] });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.body, { headers: { "x-cache": "hit" } });
  }

  try {
    const results = await search(q);
    const body = { results };
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body, {
      headers: {
        "x-cache": "miss",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    // A geocoder hiccup must never block the form: the field stays free text.
    console.error("[geocode]", e);
    return NextResponse.json({ results: [], error: "upstream" }, { status: 200 });
  }
}
