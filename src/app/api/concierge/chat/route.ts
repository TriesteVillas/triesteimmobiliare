import { NextResponse } from "next/server";
import { currentAcctSession } from "@/lib/account/auth";
import { signWebTurn, verifyWebTurn } from "@/lib/concierge/sig";

export const runtime = "nodejs";
export const maxDuration = 60;

// Proxy del Concierge AI PUBBLICO (Buyer Hub). Stessa spina dorsale del
// Concierge Private Collection (/api/private/chat): il sito NON parla mai con
// l'LLM — inoltra server-to-server al CRM, che possiede prompt, tool, logging
// (WEB_CHAT_LOG) e guardrail. Differenze deliberate rispetto alla PC:
//  - niente gate: chiunque può chiedere. L'identità, quando c'è, è la sessione
//    account letta QUI server-side (mai dal body: il client non nomina se stesso);
//  - rate limit doppio (sessione + IP) perché non esiste un grant da spegnere;
//  - il "blocked" a valle chiude la sessione di chat, non un account.

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CONTENT_CHARS = 4000;

// Bucket per sessione E per IP, prima di qualunque I/O. Best-effort per
// istanza (pattern del resto del sito): il tetto vero è nel CRM, questo
// evita di svegliare lambda e scrivere log per un client che martella.
const SID_PER_HOUR = 30;
const IP_PER_HOUR = 60;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();
function limited(key: string, max: number): boolean {
  const now = Date.now();
  if (hits.size > 1000) for (const [k, arr] of hits) if (!arr.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}

// sid generato dal client: serve solo come bucket di rate limit, chiave delle
// firme dei turni e id di sessione nel registro. Formato stretto, niente fantasia.
function validSid(v: unknown): v is string {
  return typeof v === "string" && /^web_[a-z0-9]{10,32}$/.test(v);
}

async function sanitizeMessages(raw: unknown, sid: string): Promise<ChatMessage[] | null> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const kept: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || !content.trim()) return null;
    const text = content.slice(0, MAX_CONTENT_CHARS);
    if (role === "assistant") {
      // Turni del bot solo se firmati da NOI per QUESTA sessione (vedi lib/concierge/sig).
      if (!(await verifyWebTurn(sid, content, (m as { sig?: unknown }).sig))) continue;
    }
    kept.push({ role, content: text });
  }
  // Turni user consecutivi (dopo uno scarto) si fondono: l'API a valle vuole l'alternanza.
  const out: ChatMessage[] = [];
  for (const m of kept) {
    const prev = out[out.length - 1];
    if (prev && prev.role === "user" && m.role === "user")
      prev.content = `${prev.content}\n\n${m.content}`.slice(0, MAX_CONTENT_CHARS);
    else out.push({ ...m });
  }
  if (!out.length || out[out.length - 1].role !== "user") return null;
  return out;
}

export async function POST(request: Request) {
  const bridgeUrl = process.env.BUYER_BRIDGE_URL ?? "";
  const bridgeSecret = process.env.BUYER_BRIDGE_SECRET ?? "";
  if (!bridgeUrl || !bridgeSecret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { sid?: unknown; messages?: unknown; locale?: unknown; origin?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  if (!validSid(body.sid)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const sid = body.sid;

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(`s:${sid}`, SID_PER_HOUR) || limited(`i:${ip}`, IP_PER_HOUR)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  const messages = await sanitizeMessages(body.messages, sid);
  if (!messages) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const locale = typeof body.locale === "string" ? body.locale.slice(0, 5) : "it";
  // Pagina di provenienza: contesto per l'operatore nel registro, non un dato fidato.
  const origin = typeof body.origin === "string" ? body.origin.slice(0, 120) : "";

  // Se l'utente è loggato all'area clienti, l'email viaggia col turno e il CRM
  // aggancia account e scheda lead. Solo firma verificata, niente body.
  const acct = await currentAcctSession();

  try {
    const res = await fetch(bridgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": bridgeSecret,
      },
      body: JSON.stringify({
        messages,
        sid,
        locale,
        origin,
        email: acct?.em ?? "",
        brand: "TSI",
        ip,
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "bridge_error" }, { status: 502 });
    const data = (await res.json()) as { ok?: boolean; text?: string; blocked?: boolean };
    const text = typeof data.text === "string" ? data.text : "";
    return NextResponse.json({
      ok: data.ok === true,
      text,
      blocked: data.blocked === true,
      sig: text ? await signWebTurn(sid, text) : "",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "bridge_error" }, { status: 502 });
  }
}
