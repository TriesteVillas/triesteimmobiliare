import "server-only";
import { type Lang } from "./mail";
import { BRAND, brandClause } from "./brand";

// Airtable data access for the Private Collection: PC_RICHIESTE (requests +
// credential lifecycle), PC_ACCESS_LOG (audit) and the existing LEAD_ table.
// Writes go by field NAME + typecast (mirrors /api/lead), so missing select
// options (e.g. fonte_lead "PRIVATE COLLECTION") are created on first use.
//
// BRAND-AWARENESS (2026-07-21). PC_RICHIESTE and PC_ACCESS_LOG are shared with
// the TriesteImmobiliare Private Collection, so EVERY read here is scoped by
// `brandClause()` and every write stamps `brand`. The rule has no exceptions:
// an unscoped read is a row of the other brand leaking into this panel, and an
// unstamped write is a grant that belongs to neither site and works on neither.
// LEAD_ is deliberately NOT scoped — a person is one person across both brands;
// what tells the two apart there is `azienda` + `fonte_lead`.

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app1ZDay9vQNU5V2u";
const TOKEN = process.env.LEADS_AIRTABLE_TOKEN ?? process.env.AIRTABLE_TOKEN;

const T_REQ = "tblZv7oM5ZzNargOY"; // PC_RICHIESTE
const T_LOG = "tblpOeoNn7EOZ0Roj"; // PC_ACCESS_LOG
const T_LEAD = "tbl1RolmcvI7WxDdr"; // LEAD_
const T_PROP = "tblwAUWPnX7KF8FhU"; // PROPRIETA

export const VALIDITY_DAYS = BRAND.validityDays;

// Airtable Interface/grid deep-link for the daily digest CTA.
export function requestsAirtableUrl(): string {
  return `https://airtable.com/${BASE_ID}/${T_REQ}`;
}

type AirRecord = { id: string; fields: Record<string, unknown> };

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

async function aPost(table: string, fields: Record<string, unknown>): Promise<string | null> {
  if (!TOKEN) return null;
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable POST ${table} ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { records: AirRecord[] };
  return data.records[0]?.id ?? null;
}

async function aPatch(table: string, id: string, fields: Record<string, unknown>): Promise<void> {
  if (!TOKEN) return;
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable PATCH ${table} ${res.status}: ${await res.text()}`);
}

async function aList(
  table: string,
  opts: { filter?: string; fields?: string[]; max?: number; sort?: { field: string; dir?: "asc" | "desc" }[] } = {},
): Promise<AirRecord[]> {
  if (!TOKEN) return [];
  const out: AirRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${table}`);
    if (opts.filter) url.searchParams.set("filterByFormula", opts.filter);
    if (opts.max) url.searchParams.set("maxRecords", String(opts.max));
    url.searchParams.set("pageSize", "100");
    for (const f of opts.fields ?? []) url.searchParams.append("fields[]", f);
    (opts.sort ?? []).forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.dir ?? "asc");
    });
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Airtable GET ${table} ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { records: AirRecord[]; offset?: string };
    out.push(...data.records);
    offset = data.offset;
  } while (offset && (!opts.max || out.length < opts.max));
  return out;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const escFormula = (s: string) => s.replace(/'/g, "\\'");

// L'immobile da cui è partita la richiesta (?p=GINESTRE2026) è un tsv_prop_id, cioè
// il codice di un record PROPRIETA vero. Finiva SOLO come prosa dentro note_modulo
// ("Immobile di partenza: GINESTRE2026") e come testo su PC_RICHIESTE.immobile_trigger:
// il campo link LEAD_.immobile restava vuoto, quindi il CRM sapeva quale immobile
// aveva scatenato il contatto ma non lo mostrava come abbinamento (caso Döllerer,
// 18 lug 2026). Qui il codice diventa un recId, e il link si scrive davvero.
// Best-effort: se il codice non risolve, il lead nasce comunque — senza link.
async function resolvePropRecId(tsvPropId: string): Promise<string | null> {
  const code = tsvPropId.trim();
  if (!code || !TOKEN) return null;
  try {
    const esc = code.replace(/["\\]/g, "").replace(/[\u0000-\u001f]/g, "");
    // Uguaglianza, non FIND: "GINESTRE2026" non deve agganciare "GINESTRE2026B".
    const recs = await aList(T_PROP, { filter: `{tsv_prop_id}="${esc}"`, fields: ["tsv_prop_id"], max: 2 });
    const exact = recs.filter((r) => str(r.fields.tsv_prop_id).trim().toLowerCase() === code.toLowerCase());
    // Due record con lo stesso codice = dato ambiguo: meglio nessun link che quello sbagliato.
    if (exact.length !== 1) {
      if (exact.length > 1) console.error(`[pc] tsv_prop_id ambiguo (${exact.length} record): ${code}`);
      return null;
    }
    return exact[0].id;
  } catch (e) {
    console.error("[pc] property lookup failed:", e);
    return null;
  }
}

// ---- Form input → LEAD_ + PC_RICHIESTE -------------------------------------

export type RequestInput = {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  nazionalita: string;
  intro: string;
  zone: string[]; // 9-zone taxonomy (zona_Section_TSV)
  bands: string[]; // "<1M" | "1-2M" | "2-3M" | "3M+"
  immobileTrigger: string; // tsv_prop_id or ""
  lingua: Lang;
};

// 9-zone form taxonomy → LEAD_.zona_interesse_norm (13-zone). Only the
// combined BARCOLA-MIRAMARE splits; everything else is 1:1.
const ZONE_LEAD_MAP: Record<string, string[]> = {
  CENTRO: ["CENTRO"],
  SEMICENTRO: ["SEMICENTRO"],
  COSTIERA: ["COSTIERA"],
  BARCOLA: ["BARCOLA"],
  "BARCOLA-MIRAMARE": ["BARCOLA", "MIRAMARE"],
  ALTE: ["ALTE"],
  MUGGIA: ["MUGGIA"],
  "SISTIANA-DUINO": ["SISTIANA-DUINO"],
  FVG: ["FVG"],
};

// Estremi numerici delle fasce mid-market (vedi bands.ts). Il minimo della prima
// fascia non è 0: chi spunta "<100k" cerca comunque un immobile, non un box, e un
// budget_min a zero renderebbe inutile il matching sul lato CRM.
const BAND_LOW: Record<string, number> = { "<100k": 40_000, "100-200k": 100_000, "200-350k": 200_000, "350k+": 350_000 };
const BAND_HIGH: Record<string, number> = { "<100k": 100_000, "100-200k": 200_000, "200-350k": 350_000, "350k+": 700_000 };

// propRecId: l'immobile di partenza già risolto a recId (vedi resolvePropRecId).
// La riga in prosa dentro note_modulo resta — è leggibile a colpo d'occhio e non
// costa nulla — ma ora accanto c'è anche il LINK vero, che è ciò che il CRM sa usare.
function leadFieldsFrom(input: RequestInput, propRecId?: string | null): Record<string, unknown> {
  const leadZones = [...new Set(input.zone.flatMap((z) => ZONE_LEAD_MAP[z] ?? []))];
  const lows = input.bands.map((b) => BAND_LOW[b]).filter((n) => typeof n === "number");
  const highs = input.bands.map((b) => BAND_HIGH[b]).filter((n) => typeof n === "number");
  const noteParts = [
    input.nazionalita ? `Nazionalità: ${input.nazionalita}` : "",
    input.immobileTrigger ? `Immobile di partenza: ${input.immobileTrigger}` : "",
  ].filter(Boolean);
  return {
    nome: input.nome,
    cognome: input.cognome,
    nome_completo: `${input.nome} ${input.cognome}`.trim(),
    email: input.email,
    ...(input.telefono ? { telefono: input.telefono } : {}),
    // Identità di brand del lead. `azienda` è popolato al 3% su LEAD_ (116 record
    // su 4.398): è un debito che si paga esattamente qui, perché con due Private
    // Collection il brand di provenienza di un contatto smette di essere deducibile
    // a posteriori. Da questo flusso esce sempre valorizzato.
    canale: "Sito TriesteImmobiliare",
    azienda: "TriesteImmobiliare",
    tipo_richiesta: "Private Collection",
    fonte_lead: "PRIVATE COLLECTION TSI",
    ...(leadZones.length ? { zona_interesse_norm: leadZones, zone_preferite: leadZones.join(", ") } : {}),
    ...(lows.length ? { budget_min_eur: Math.min(...lows) } : {}),
    ...(highs.length ? { budget_max_eur: Math.max(...highs) } : {}),
    ...(input.bands.length ? { budget: input.bands.join(" / ") } : {}),
    ...(input.intro ? { messaggio: input.intro } : {}),
    ...(noteParts.length ? { note_modulo: noteParts.join(" · ") } : {}),
    ...(propRecId ? { immobile: [propRecId] } : {}),
    privacy_ok: true,
    lingua: input.lingua,
    stato: "NUOVO",
    data_contatto: new Date().toISOString(),
  };
}

// Create the LEAD_ (so every requester becomes a tagged lead) and the linked
// PC_RICHIESTE row (status New, no credential yet). Returns the request id.
export async function createLeadAndRequest(input: RequestInput): Promise<string | null> {
  let leadId: string | null = null;
  // Risolto UNA volta e usato su entrambi i rami (lead nuovo e lead riusato).
  const propRecId = await resolvePropRecId(input.immobileTrigger);
  // Dedup: se esiste GIÀ un lead con questa email, riusalo invece di crearne uno nuovo.
  // Prima il form creava sempre un lead → per un cliente già noto nasceva una scheda-stub
  // vuota accanto a quella con la storia (doppione). Match best-effort per email (esatta,
  // gestendo il campo multiline con più indirizzi); su qualunque errore si ricade sul create.
  const email = input.email.trim().toLowerCase();
  if (email) {
    try {
      const esc = email.replace(/["\\]/g, "").replace(/[\u0000-\u001f]/g, "");
      // FIND è un test di SOTTOSTRINGA: pre-filtra soltanto, NON mettere un cap (un
      // maxRecords rischia di escludere proprio la riga esatta se molte email la
      // contengono come sottostringa) → l'uguaglianza vera si fa in JS qui sotto.
      const cands = await aList(T_LEAD, { filter: `FIND("${esc}", LOWER({email}&""))`, fields: ["email", "sintesi_intel", "immobile", "zone_preferite", "budget", "messaggio"] });
      const exacts = cands.filter((c) => String(c.fields.email ?? "").split(/[\n,;]+/).map((x) => x.trim().toLowerCase()).includes(email));
      // Fra doppioni con la stessa email preferisci la scheda "vera" (con storia), non lo stub.
      const rich = (c: AirRecord) => (String(c.fields.sintesi_intel ?? "").trim() ? 100 : 0) + (Array.isArray(c.fields.immobile) ? (c.fields.immobile as unknown[]).length : 0);
      const best = exacts.sort((a, b) => rich(b) - rich(a))[0];
      if (best?.id) {
        leadId = best.id;
        // Riusa la scheda esistente arricchendola SENZA sovrascrivere: colma solo i campi
        // vuoti coi dati del form e aggiorna la data di ultimo contatto (ha appena riscritto).
        const lf = leadFieldsFrom(input, propRecId);
        const patch: Record<string, unknown> = { data_contatto: new Date().toISOString() };
        if (!String(best.fields.zone_preferite ?? "").trim() && lf.zone_preferite) { patch.zone_preferite = lf.zone_preferite; if (lf.zona_interesse_norm) patch.zona_interesse_norm = lf.zona_interesse_norm; }
        if (!String(best.fields.budget ?? "").trim() && lf.budget) patch.budget = lf.budget;
        if (!String(best.fields.messaggio ?? "").trim() && lf.messaggio) patch.messaggio = lf.messaggio;
        // L'immobile si AGGIUNGE, non sostituisce: una scheda con storia può già averne
        // altri collegati, e una richiesta PC non è motivo per cancellarli.
        if (propRecId) {
          const già = (Array.isArray(best.fields.immobile) ? best.fields.immobile : [])
            .map((x) => (typeof x === "string" ? x : String((x as { id?: string })?.id ?? "")));
          if (!già.includes(propRecId)) patch.immobile = [...già, propRecId];
        }
        try { await aPatch(T_LEAD, best.id, patch); } catch (e) { console.error("[pc] lead enrich failed:", e); }
      }
    } catch (e) { console.error("[pc] lead dedup lookup failed:", e); }
  }
  if (!leadId) {
    try {
      leadId = await aPost(T_LEAD, leadFieldsFrom(input, propRecId));
    } catch (e) {
      console.error("[pc] lead create failed:", e);
      // Non-fatal: still record the access request below.
    }
  }
  const reqFields: Record<string, unknown> = {
    etichetta: `${input.cognome} ${input.nome} — ${input.email}`.trim(),
    brand: BRAND.code,
    stato: "New",
    creata_il: new Date().toISOString(),
    nome: input.nome,
    cognome: input.cognome,
    email: input.email,
    ...(input.telefono ? { telefono: input.telefono } : {}),
    nazionalita: input.nazionalita,
    intro: input.intro,
    ...(input.zone.length ? { zone: input.zone } : {}),
    ...(input.bands.length ? { budget_bands: input.bands } : {}),
    ...(input.immobileTrigger ? { immobile_trigger: input.immobileTrigger } : {}),
    ...(leadId ? { lead: [leadId] } : {}),
    lingua: input.lingua,
  };
  return aPost(T_REQ, reqFields);
}

// ---- Grant lookup / login --------------------------------------------------

export type Grant = {
  id: string;
  stato: string;
  codice: string;
  nome: string;
  cognome: string;
  email: string;
  lingua: Lang;
  expiresAtMs: number | null;
  accessi: number;
  leadIds: string[];
};

function toGrant(r: AirRecord): Grant {
  const f = r.fields;
  const exp = str(f.expires_at);
  const lang = (str(f.lingua) || "en") as Lang;
  const lead = Array.isArray(f.lead) ? (f.lead as string[]) : [];
  return {
    id: r.id,
    stato: str(f.stato),
    codice: str(f.codice),
    nome: str(f.nome),
    cognome: str(f.cognome),
    email: str(f.email),
    lingua: ["it", "en", "de"].includes(lang) ? lang : "en",
    expiresAtMs: exp ? new Date(exp).getTime() : null,
    accessi: typeof f.accessi === "number" ? f.accessi : 0,
    leadIds: lead,
  };
}

export function isActive(g: Grant): boolean {
  return (
    g.stato === "Approved" &&
    !!g.codice &&
    g.expiresAtMs !== null &&
    g.expiresAtMs > Date.now()
  );
}

// La query di AUTENTICAZIONE. È l'unico punto in cui un filtro dimenticato
// diventerebbe un accesso cross-brand invece di un fastidio cosmetico: il
// codice del brand gemello NON deve risolvere qui, nemmeno se attivo e valido.
export async function findGrantByCode(code: string): Promise<Grant | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const recs = await aList(T_REQ, {
    filter: `AND(UPPER({codice})='${escFormula(c)}',${brandClause()})`,
    max: 1,
  });
  return recs[0] ? toGrant(recs[0]) : null;
}

// Anche il lookup per recId è filtrato: il recId arriva dal cookie, e un cookie
// resta valido finché non scade. Se un giorno i due segreti coincidessero per
// errore, questo filtro è ciò che impedisce a una sessione dell'altro brand di
// risolvere un grant qui.
export async function findGrantById(id: string): Promise<Grant | null> {
  const recs = await aList(T_REQ, {
    filter: `AND(RECORD_ID()='${escFormula(id)}',${brandClause()})`,
    max: 1,
  });
  return recs[0] ? toGrant(recs[0]) : null;
}

export async function registerLogin(g: Grant): Promise<void> {
  await aPatch(T_REQ, g.id, {
    ultimo_accesso: new Date().toISOString(),
    accessi: (g.accessi ?? 0) + 1,
  });
}

// ---- Access log ------------------------------------------------------------

export type AccessEvent = "login_ok" | "login_fail" | "view" | "blocked" | "expired";

export async function logAccess(e: {
  evento: AccessEvent;
  codice?: string;
  email?: string;
  ip?: string;
  ua?: string;
  dettaglio?: string;
  requestId?: string;
}): Promise<void> {
  try {
    await aPost(T_LOG, {
      evento_key: `${e.email ?? e.codice ?? "?"} — ${e.evento} — ${new Date().toISOString()}`,
      quando: new Date().toISOString(),
      brand: BRAND.code,
      evento: e.evento,
      ...(e.codice ? { codice: e.codice } : {}),
      ...(e.email ? { email: e.email } : {}),
      ...(e.ip ? { ip: e.ip } : {}),
      ...(e.ua ? { user_agent: e.ua } : {}),
      ...(e.dettaglio ? { dettaglio: e.dettaglio } : {}),
      ...(e.requestId ? { richiesta: [e.requestId] } : {}),
    });
  } catch (err) {
    console.error("[pc] access log failed:", err);
  }
}

// ---- Cron: credential issuance, expiry, abuse ------------------------------

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I O L 0 1

// Il prefisso non è decorativo: è il namespacing del brand. Insieme al filtro
// {brand} in findGrantByCode fa sì che, anche se una riga finisse senza brand o
// una query restasse non filtrata, il peggio possibile sia un record nel
// pannello sbagliato — mai un accesso al portale sbagliato.
export function genCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const p = (i: number) => ALPHABET[bytes[i] % ALPHABET.length];
  return `${BRAND.codePrefix}-${p(0)}${p(1)}${p(2)}${p(3)}-${p(4)}${p(5)}${p(6)}${p(7)}`;
}

// I cron dei due siti girano su progetti Vercel distinti ma leggono la STESSA
// tabella. Senza questo filtro sarebbero due mailer concorrenti sulle stesse
// righe: ensureCredential è idempotente sul codice, markCredentialSent no —
// quindi il risultato sarebbe un doppio invio, o la credenziale di un brand
// spedita col template dell'altro.
export async function listApprovedNeedingCredential(): Promise<Grant[]> {
  const recs = await aList(T_REQ, {
    filter: `AND({stato}='Approved',{credenziali_inviate}!=1,${brandClause()})`,
  });
  return recs.map(toGrant);
}

// Ensure a code exists (so login works immediately) and return the live values.
export async function ensureCredential(g: Grant): Promise<{ code: string; expiresAtMs: number }> {
  if (g.codice && g.expiresAtMs) return { code: g.codice, expiresAtMs: g.expiresAtMs };
  const code = g.codice || genCode();
  const issued = new Date();
  const expires = new Date(issued.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  await aPatch(T_REQ, g.id, {
    codice: code,
    issued_at: issued.toISOString(),
    expires_at: expires.toISOString(),
    approvata_da: "Martino",
  });
  // Promote the linked lead to HOT — an approved requester is engaged.
  for (const leadId of g.leadIds) {
    try {
      await aPatch(T_LEAD, leadId, { temperatura: "HOT" });
    } catch {
      /* non-fatal */
    }
  }
  return { code, expiresAtMs: expires.getTime() };
}

export async function markCredentialSent(id: string): Promise<void> {
  await aPatch(T_REQ, id, { credenziali_inviate: true });
}

export async function listExpiredNeedingCourtesy(): Promise<Grant[]> {
  const recs = await aList(T_REQ, {
    filter: `AND({stato}='Approved',{codice}!='',IS_BEFORE({expires_at},NOW()),{cortesia_inviata}!=1,${brandClause()})`,
  });
  return recs.map(toGrant);
}

export async function markExpired(id: string): Promise<void> {
  await aPatch(T_REQ, id, { stato: "Expired", cortesia_inviata: true });
}

export async function setUnderReview(id: string, note: string): Promise<void> {
  await aPatch(T_REQ, id, { stato: "Under review", abuso_note: note });
}

// Abuse heuristic: an active credential used from too many distinct IPs in 24h.
const ABUSE_IP_THRESHOLD = 4;

export async function detectAbuse(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // Filtrato per brand: senza, gli accessi legittimi dell'altro portale
  // gonfierebbero il conteggio di IP distinti e metterebbero "Under review"
  // credenziali sane.
  const logs = await aList(T_LOG, {
    filter: `AND({evento}='login_ok',IS_AFTER({quando},'${since}'),${brandClause()})`,
    fields: ["codice", "ip"],
  });
  const byCode = new Map<string, Set<string>>();
  for (const r of logs) {
    const code = str(r.fields.codice);
    const ip = str(r.fields.ip);
    if (!code || !ip) continue;
    (byCode.get(code) ?? byCode.set(code, new Set()).get(code)!).add(ip);
  }
  let flagged = 0;
  for (const [code, ips] of byCode) {
    if (ips.size <= ABUSE_IP_THRESHOLD) continue;
    const g = await findGrantByCode(code);
    if (g && g.stato === "Approved") {
      await setUnderReview(g.id, `Auto: ${ips.size} IP distinti in 24h (${[...ips].slice(0, 6).join(", ")}).`);
      await logAccess({ evento: "blocked", codice: code, email: g.email, dettaglio: `${ips.size} distinct IPs/24h` });
      flagged++;
    }
  }
  return flagged;
}

// ---- Digest ----------------------------------------------------------------

export async function listNewSince(hours: number): Promise<AirRecord[]> {
  return aList(T_REQ, {
    filter: `AND({stato}='New',IS_AFTER({creata_il},DATEADD(NOW(),-${hours},'hours')),${brandClause()})`,
    sort: [{ field: "creata_il", dir: "desc" }],
  });
}

export function digestRowFrom(r: AirRecord) {
  const f = r.fields;
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  return {
    nome: str(f.nome),
    cognome: str(f.cognome),
    email: str(f.email),
    telefono: str(f.telefono),
    nazionalita: str(f.nazionalita),
    intro: str(f.intro),
    zone: arr(f.zone),
    bands: arr(f.budget_bands),
    immobile: str(f.immobile_trigger),
    quando: str(f.creata_il),
  };
}
