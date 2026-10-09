import { NextResponse } from "next/server";
import { bussaIngresso } from "@/lib/ingressoPorta";

export const runtime = "nodejs";
export const maxDuration = 20;

// ─────────────────────────────────────────────────────────────────────────────
// LA LETTERA AL TEAM DEL CONCIERGE AI (09/10/2026) — il passaggio a una persona.
//
// Martino: «dopo 2-3 risposte invita super cortesemente a scriverci
// direttamente per aprire un filo di dialogo». Fino al 09/10 alla quarta
// domanda il CRM chiedeva nome e recapito PER CONTINUARE A PARLARE COL BOT (i
// dati compravano risposte). Ora dopo tre risposte il widget apre una lettera,
// e la lettera non va al bot: va al team, dalla porta unica dei moduli del CRM
// (lib/ingressoPorta.ts) con il modulo `chat` — o `chat-valutazione` per chi
// scrive «ho una casa». Il CRM ne fa un lead («SITO TSI /CHAT»), lo lega alla
// conversazione (tsv-pg, lib/concierge.ts → lettereDelleSessioni, per
// `dati.sessione`) e avvisa richieste@ (lib/ingresso/avviso-moduli.ts). Lo
// stesso giro di sloveniavillas.com, che lo fa dal suo assistente.
//
// Le DOMANDE arrivano dal browser: sono quelle che il visitatore ha fatto, e
// le manda lui con la sua lettera — come il testo di un modulo. Il registro
// del concierge (WEB_CHAT_LOG) resta la fonte delle risposte.
//
// ⚠️ Gemella in triestevillas-web (stessa rotta, porta `sito-tsv`).
// ─────────────────────────────────────────────────────────────────────────────

const LINGUE = ["it", "en", "de", "sl"];
const RE_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const RE_SID = /^web_[a-z0-9]{10,32}$/;

const ORA = 60 * 60 * 1000;
const colpi = new Map<string, number[]>();
function frenato(chiave: string, max: number): boolean {
  const ora = Date.now();
  if (colpi.size > 1000) for (const [k, v] of colpi) if (!v.some((t) => ora - t < ORA)) colpi.delete(k);
  const v = (colpi.get(chiave) ?? []).filter((t) => ora - t < ORA);
  v.push(ora);
  colpi.set(chiave, v);
  return v.length > max;
}

const s = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";

export async function POST(request: Request) {
  // Solo dal sito stesso.
  const origine = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (origine) {
    try {
      if (new URL(origine).host !== host) return NextResponse.json({ ok: false, error: "origin" }, { status: 403 });
    } catch {
      return NextResponse.json({ ok: false, error: "origin" }, { status: 403 });
    }
  }
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (frenato(`l:${ip}`, 6)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const sid = typeof b.sid === "string" && RE_SID.test(b.sid) ? b.sid : "";
  if (!sid) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  // L'identità: nome, un recapito, il consenso. È il gesto che rende i dati nostri da trattare.
  const id = (b.identita && typeof b.identita === "object" ? b.identita : {}) as Record<string, unknown>;
  const nome = s(id.nome, 80).replace(/\s+/g, " ");
  const emailGrezza = s(id.email, 160).toLowerCase();
  const email = RE_EMAIL.test(emailGrezza) ? emailGrezza : "";
  const telefono = s(id.telefono, 40).replace(/\D/g, "").length >= 6 ? s(id.telefono, 40) : "";
  if (id.consenso !== true || nome.replace(/[^\p{L}]/gu, "").length < 2 || (!email && !telefono)) {
    return NextResponse.json({ ok: false, error: "dati" }, { status: 400 });
  }

  const lingua = LINGUE.includes(String(b.locale)) ? String(b.locale) : "it";
  const pagina = typeof b.origin === "string" && b.origin.startsWith("/") ? b.origin.slice(0, 200) : "";
  const nota = s(b.nota, 1500);
  const vende = b.intento === "valutazione";
  const domande = (Array.isArray(b.domande) ? b.domande : [])
    .map((d) => s(d, 600).replace(/\s+/g, " ")).filter(Boolean).slice(-8);
  const paese = request.headers.get("x-vercel-ip-country") ?? "";

  // Lo stesso formato della lettera di sloveniavillas.com (tsv-pg, lib/sv-chat.ts
  // → payloadIngressoSv): la vista del CRM toglie l'intestazione e mostra la nota.
  const messaggio = [
    ...(nota ? ["Lettera al team:", nota, ""] : []),
    `Conversazione col concierge AI di TriesteImmobiliare (triesteimmobiliare.com), sessione ${sid}.`,
    [`lingua ${lingua}`, paese ? `paese ${paese}` : "", pagina ? `pagina ${pagina}` : ""].filter(Boolean).join(" · "),
    `Intento: ${vende ? "ha una casa (dichiarato nella lettera)" : b.intento === "buyer" ? "cerca casa (dichiarato nella lettera)" : "non dichiarato"}.`,
    "",
    ...(domande.length
      ? ["Domande fatte all'assistente:", ...domande.map((d, i) => `${i + 1}. ${d}`)]
      : ["Nessuna domanda all'assistente: ha scritto subito al team."]),
  ].join("\n").slice(0, 4000);

  const posata = await bussaIngresso(vende ? "chat-valutazione" : "chat", { nome, email, telefono }, {
    privacyOk: true,
    lingua,
    messaggio,
    fonteCta: "Lettera al team dal concierge AI",
    sessione: sid,
    // L'indirizzo della scheda da cui scrive: il motore ne ricava la casa (lib/ingresso/immobili-modulo.ts).
    ...(pagina ? { url: pagina, pagina } : {}),
    ...(paese ? { paese } : {}),
  });
  if (!posata) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
