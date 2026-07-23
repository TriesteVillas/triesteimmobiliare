import "server-only";
import { ACCT_BRAND, acctBrandClause, PRIVACY_VERSION } from "./brand";

// Accesso Airtable dell'area clienti: WEB_ACCOUNTS (account), WEB_EVENTS (log
// comportamentale), WEB_PREFERITI (stato corrente cuore/voto per immobile),
// WEB_MATCHES (proposte del motore) + aggancio alla tabella LEAD_ esistente.
// Scritture per NOME campo + typecast, come lib/private/store.ts.
//
// BRAND-AWARENESS: le quattro tabelle WEB_* sono condivise con l'altro sito,
// quindi OGNI lettura è filtrata da acctBrandClause() e ogni scrittura stampa
// `brand`. LEAD_ invece NON è filtrata: una persona è una sola su entrambi i
// brand — lì distinguono `azienda` + `fonte_lead` (stessa regola della PC).

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app1ZDay9vQNU5V2u";
const TOKEN = process.env.LEADS_AIRTABLE_TOKEN ?? process.env.AIRTABLE_TOKEN;

const T_ACC = "tblKOlljVokJdn0Vh"; // WEB_ACCOUNTS
const T_EVT = "tbli8lWAciSGBhI4v"; // WEB_EVENTS
const T_PREF = "tbl7ral88bbcBBhep"; // WEB_PREFERITI
const T_MATCH = "tblKiZVrqJtzUJQRv"; // WEB_MATCHES
const T_LEAD = "tbl1RolmcvI7WxDdr"; // LEAD_
const T_CHAT = "tblC0SweZRdCrhLHO"; // WEB_CHAT_LOG (scritta dal CRM, qui solo lettura)

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
const escFormula = (s: string) => s.replace(/["\\]/g, "").replace(/[\x00-\x1f]/g, "");

export const normEmail = (e: string) => e.trim().toLowerCase();

// ---- Account ----------------------------------------------------------------

export type WebAccount = {
  id: string;
  email: string;
  nome: string;
  telefono: string;
  hash: string;
  googleSub: string;
  stato: string; // Attivo | Sospeso | Cancellato
  lingua: string;
  leadIds: string[];
  consMarketing: boolean;
  consProfilazione: boolean;
  digest: string;
  criteri: string;
  loginCount: number;
  ultimoLogin: string; // ISO o "" — serve al riepilogo web_intel sul lead
  emailVerificata: boolean;
};

function toAccount(r: AirRecord): WebAccount {
  const f = r.fields;
  return {
    id: r.id,
    email: normEmail(str(f.email)),
    nome: str(f.nome),
    telefono: str(f.telefono),
    hash: str(f.password_hash),
    googleSub: str(f.google_sub),
    stato: str(f.stato),
    lingua: str(f.lingua) || "it",
    leadIds: Array.isArray(f.lead_link) ? (f.lead_link as string[]) : [],
    consMarketing: f.consenso_marketing === true,
    consProfilazione: f.consenso_profilazione === true,
    digest: str(f.digest_freq),
    criteri: str(f.criteri),
    loginCount: typeof f.login_count === "number" ? f.login_count : 0,
    ultimoLogin: str(f.ultimo_login),
    emailVerificata: f.email_verificata === true,
  };
}

export async function findAccountByEmail(email: string): Promise<WebAccount | null> {
  const em = normEmail(email);
  if (!em) return null;
  const recs = await aList(T_ACC, {
    filter: `AND(LOWER({email})="${escFormula(em)}",${acctBrandClause()})`,
    max: 1,
  });
  return recs[0] ? toAccount(recs[0]) : null;
}

export async function findAccountByGoogleSub(sub: string): Promise<WebAccount | null> {
  if (!sub) return null;
  const recs = await aList(T_ACC, {
    filter: `AND({google_sub}="${escFormula(sub)}",${acctBrandClause()})`,
    max: 1,
  });
  return recs[0] ? toAccount(recs[0]) : null;
}

export async function findAccountByResetHash(hash: string): Promise<WebAccount | null> {
  if (!hash) return null;
  const recs = await aList(T_ACC, {
    filter: `AND({reset_hash}="${escFormula(hash)}",{reset_exp}!="",IS_AFTER({reset_exp},NOW()),${acctBrandClause()})`,
    max: 1,
  });
  return recs[0] ? toAccount(recs[0]) : null;
}

// Il recId arriva dal cookie firmato, ma il filtro brand resta: stessa difesa in
// profondità di findGrantById della PC.
export async function getAccount(id: string): Promise<WebAccount | null> {
  if (!id) return null;
  const recs = await aList(T_ACC, {
    filter: `AND(RECORD_ID()="${escFormula(id)}",${acctBrandClause()})`,
    max: 1,
  });
  return recs[0] ? toAccount(recs[0]) : null;
}

export type NewAccountInput = {
  email: string;
  nome: string;
  telefono?: string;
  hash?: string; // registrazione email+password
  googleSub?: string; // registrazione via Google
  emailVerificata?: boolean; // true solo se garantita dal provider (Google)
  lingua: string;
  consMarketing: boolean;
  consProfilazione: boolean;
  criteri?: string;
};

export async function createAccount(input: NewAccountInput): Promise<string | null> {
  const email = normEmail(input.email);
  const leadId = await linkOrCreateLead({
    email,
    nome: input.nome,
    telefono: input.telefono ?? "",
    lingua: input.lingua,
  });
  const now = new Date().toISOString();
  return aPost(T_ACC, {
    account: `${ACCT_BRAND.code} · ${email}`,
    brand: ACCT_BRAND.code,
    email,
    nome: input.nome,
    ...(input.telefono ? { telefono: input.telefono } : {}),
    ...(input.hash ? { password_hash: input.hash } : {}),
    ...(input.googleSub ? { google_sub: input.googleSub } : {}),
    email_verificata: input.emailVerificata === true,
    lingua: input.lingua,
    stato: "Attivo",
    ...(leadId ? { lead_link: [leadId] } : {}),
    consenso_marketing: input.consMarketing,
    consenso_profilazione: input.consProfilazione,
    consensi_ts: now,
    // La versione dell'informativa accettata: accountability GDPR.
    note: `Informativa ${PRIVACY_VERSION}`,
    ...(input.criteri ? { criteri: input.criteri } : {}),
    digest_freq: input.consMarketing ? "Settimanale" : "Mai",
    login_count: 0,
    creato: now,
  });
}

export async function patchAccount(id: string, fields: Record<string, unknown>): Promise<void> {
  await aPatch(T_ACC, id, fields);
}

export async function linkGoogleSub(id: string, sub: string): Promise<void> {
  await aPatch(T_ACC, id, { google_sub: sub, email_verificata: true });
}

export async function registerLogin(acc: WebAccount): Promise<void> {
  await aPatch(T_ACC, acc.id, {
    ultimo_login: new Date().toISOString(),
    login_count: (acc.loginCount ?? 0) + 1,
  });
}

export async function setResetToken(id: string, hash: string, expIso: string): Promise<void> {
  await aPatch(T_ACC, id, { reset_hash: hash, reset_exp: expIso });
}

export async function setPassword(id: string, hash: string): Promise<void> {
  await aPatch(T_ACC, id, { password_hash: hash, reset_hash: "", reset_exp: null });
}

// ---- LEAD_: aggancio email-first ---------------------------------------------
// Stessa logica della PC (createLeadAndRequest): l'account si lega al lead che
// POSSIEDE l'email — match esatto per riga sul campo multilinea — preferendo la
// scheda con storia. Se non esiste, il lead si crea: ogni registrato È un lead.

export async function linkOrCreateLead(input: {
  email: string;
  nome: string;
  telefono: string;
  lingua: string;
}): Promise<string | null> {
  const email = normEmail(input.email);
  if (!email) return null;
  try {
    const cands = await aList(T_LEAD, {
      filter: `FIND("${escFormula(email)}", LOWER({email}&""))`,
      fields: ["email", "sintesi_intel", "immobile", "telefono"],
    });
    const exacts = cands.filter((c) =>
      String(c.fields.email ?? "")
        .split(/[\n,;]+/)
        .map((x) => x.trim().toLowerCase())
        .includes(email),
    );
    const rich = (c: AirRecord) =>
      (String(c.fields.sintesi_intel ?? "").trim() ? 100 : 0) +
      (Array.isArray(c.fields.immobile) ? (c.fields.immobile as unknown[]).length : 0);
    const best = exacts.sort((a, b) => rich(b) - rich(a))[0];
    if (best?.id) {
      // Si COLMA, non si sovrascrive: il telefono va sul lead solo se lì manca.
      const patch: Record<string, unknown> = { data_contatto: new Date().toISOString() };
      if (input.telefono && !String(best.fields.telefono ?? "").trim()) patch.telefono = input.telefono;
      try {
        await aPatch(T_LEAD, best.id, patch);
      } catch (e) {
        console.error("[acct] lead enrich failed:", e);
      }
      return best.id;
    }
  } catch (e) {
    console.error("[acct] lead dedup lookup failed:", e);
  }
  try {
    return await aPost(T_LEAD, {
      nome_completo: input.nome || email,
      email,
      ...(input.telefono ? { telefono: input.telefono } : {}),
      canale: ACCT_BRAND.leadCanale,
      azienda: ACCT_BRAND.leadAzienda,
      tipo_richiesta: ACCT_BRAND.leadTipoRichiesta,
      fonte_lead: ACCT_BRAND.leadFonte,
      lingua: input.lingua,
      privacy_ok: true,
      stato: "NUOVO",
      data_contatto: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[acct] lead create failed:", e);
    return null;
  }
}

// ---- Eventi -------------------------------------------------------------------

export type AcctEvent =
  | "signup"
  | "login_ok"
  | "login_fail"
  | "logout"
  | "view"
  | "dwell"
  | "fav_add"
  | "fav_remove"
  | "like"
  | "dislike"
  | "vote_removed"
  | "search"
  | "article_fav"
  | "article_unfav"
  | "prefs_update"
  | "digest_optin"
  | "digest_optout"
  | "chat"
  | "contact_request"
  | "verify_email"
  | "delete_request"
  | "blocked";

export async function logEvent(e: {
  evento: AcctEvent;
  accountId?: string;
  email?: string;
  slug?: string;
  propRecId?: string | null;
  dettaglio?: string;
  dwellSec?: number;
  ip?: string;
  ua?: string;
}): Promise<void> {
  try {
    await aPost(T_EVT, {
      chiave: `${e.evento} · ${e.slug ?? "-"} · ${e.email ?? "?"}`,
      brand: ACCT_BRAND.code,
      evento: e.evento,
      ...(e.accountId ? { account_link: [e.accountId] } : {}),
      ...(e.email ? { email: e.email } : {}),
      ...(e.slug ? { slug_immobile: e.slug } : {}),
      ...(e.propRecId ? { immobile_link: [e.propRecId] } : {}),
      ...(e.dettaglio ? { dettaglio: e.dettaglio } : {}),
      ...(typeof e.dwellSec === "number" ? { dwell_sec: e.dwellSec } : {}),
      ...(e.ip ? { ip: e.ip } : {}),
      ...(e.ua ? { user_agent: e.ua } : {}),
      quando: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[acct] event log failed:", err);
  }
}

// ---- Articoli salvati (Biblioteca) ---------------------------------------------
// Nessuna tabella di stato: lo stato corrente si RICOSTRUISCE dal registro
// eventi (per slug vince l'evento più recente). A volumi account è banale, e
// tiene WEB_EVENTS come unica fonte — la stessa che legge il motore notturno.
// Lo slug dell'articolo viaggia in `dettaglio`: `slug_immobile` resta riservato
// agli immobili, così i conteggi del motore non si sporcano.

export async function listSavedArticleSlugs(email: string): Promise<string[]> {
  const em = normEmail(email);
  if (!em) return [];
  const recs = await aList(T_EVT, {
    filter: `AND(OR({evento}='article_fav',{evento}='article_unfav'),LOWER({email})="${escFormula(em)}",${acctBrandClause()})`,
    fields: ["evento", "dettaglio", "quando"],
  });
  const latest = new Map<string, { on: boolean; ts: number }>();
  for (const r of recs) {
    const slug = str(r.fields.dettaglio);
    if (!slug) continue;
    const ts = r.fields.quando ? new Date(str(r.fields.quando)).getTime() : 0;
    const prev = latest.get(slug);
    if (!prev || ts >= prev.ts) latest.set(slug, { on: str(r.fields.evento) === "article_fav", ts });
  }
  return [...latest.entries()].filter(([, v]) => v.on).map(([slug]) => slug);
}

// ---- WEB_CHAT_LOG (sola lettura, per il web_intel) ------------------------------
// La tabella la scrive il CRM (bridge concierge); qui si legge per NOME campo.
// UNA fetch per giro del motore — tutte le righe TSV della finestra — poi si
// raggruppa per email in memoria: mai una query per account (rate limit Airtable).

export type ChatQuestion = { email: string; domanda: string; quandoMs: number };

export async function listChatQuestionsSince(days: number): Promise<ChatQuestion[]> {
  const recs = await aList(T_CHAT, {
    filter: `AND(IS_AFTER({quando},DATEADD(NOW(),-${Math.max(1, Math.floor(days))},'days')),${acctBrandClause()})`,
    fields: ["email", "domanda", "quando"],
  });
  return recs
    .map((r) => ({
      email: normEmail(str(r.fields.email)),
      domanda: str(r.fields.domanda),
      quandoMs: r.fields.quando ? new Date(str(r.fields.quando)).getTime() : 0,
    }))
    .filter((q) => q.email && q.domanda);
}

// Il riepilogo web-intel stampato sulla scheda lead (campo macchina, si
// sovrascrive sempre). Scrittura per NOME campo + typecast, come tutto qui.
export async function patchLeadWebIntel(leadId: string, text: string): Promise<void> {
  await aPatch(T_LEAD, leadId, { web_intel: text });
}

// De-dupe durevole delle view, chiave email+slug (stessa filosofia della PC:
// meglio un doppione che perdere una view legittima → best-effort false).
export async function recentViewExists(email: string, slug: string, sinceIso: string): Promise<boolean> {
  if (!email || !slug) return false;
  try {
    const recs = await aList(T_EVT, {
      filter: `AND({evento}='view',LOWER({email})="${escFormula(normEmail(email))}",{slug_immobile}="${escFormula(slug)}",IS_AFTER({quando},'${escFormula(sinceIso)}'),${acctBrandClause()})`,
      fields: ["quando"],
      max: 1,
    });
    return recs.length > 0;
  } catch {
    return false;
  }
}

// ---- Preferiti / voti (stato corrente) -----------------------------------------

export type Pref = {
  id: string;
  slug: string;
  cuore: boolean;
  voto: "Like" | "Dislike" | "";
  votoMotivo: string;
};

function toPref(r: AirRecord): Pref {
  const f = r.fields;
  const voto = str(f.voto);
  return {
    id: r.id,
    slug: str(f.slug_immobile),
    cuore: f.cuore === true,
    voto: voto === "Like" || voto === "Dislike" ? voto : "",
    votoMotivo: str(f.voto_motivo),
  };
}

const prefChiave = (email: string, slug: string) => `${ACCT_BRAND.code}|${normEmail(email)}|${slug}`;

// Le preferenze si leggono per EMAIL, non per link: ARRAYJOIN su un campo link
// espone i nomi primari, non i recId, quindi filtrare per account_link non è
// affidabile. La chiave email è denormalizzata apposta su ogni riga.
export async function listPrefsByEmail(email: string): Promise<Pref[]> {
  const em = normEmail(email);
  if (!em) return [];
  const recs = await aList(T_PREF, {
    filter: `AND(LOWER({email})="${escFormula(em)}",${acctBrandClause()})`,
  });
  return recs.map(toPref);
}

export async function upsertPref(
  acc: { id: string; email: string },
  slug: string,
  propRecId: string | null,
  patch: { cuore?: boolean; voto?: "Like" | "Dislike" | ""; votoMotivo?: string },
): Promise<void> {
  const chiave = prefChiave(acc.email, slug);
  const now = new Date().toISOString();
  const existing = await aList(T_PREF, {
    filter: `AND({chiave}="${escFormula(chiave)}",${acctBrandClause()})`,
    max: 1,
  });
  const fields: Record<string, unknown> = { aggiornato_il: now };
  if (typeof patch.cuore === "boolean") {
    fields.cuore = patch.cuore;
    if (patch.cuore) fields.aggiunto_il = now;
  }
  if (patch.voto !== undefined) fields.voto = patch.voto || null;
  if (patch.votoMotivo !== undefined) fields.voto_motivo = patch.votoMotivo;
  if (existing[0]) {
    await aPatch(T_PREF, existing[0].id, fields);
    return;
  }
  await aPost(T_PREF, {
    chiave,
    brand: ACCT_BRAND.code,
    account_link: [acc.id],
    email: normEmail(acc.email),
    slug_immobile: slug,
    ...(propRecId ? { immobile_link: [propRecId] } : {}),
    aggiunto_il: now,
    ...fields,
  });
}

// ---- Dati per il motore (cron) --------------------------------------------------

export type EngineEvent = {
  email: string;
  evento: string;
  slug: string;
  dettaglio: string; // slug articolo per article_fav/unfav, termini per search
  dwellSec: number;
  quandoMs: number;
  ip: string;
};

export async function listEventsSince(days: number): Promise<EngineEvent[]> {
  const recs = await aList(T_EVT, {
    filter: `AND(IS_AFTER({quando},DATEADD(NOW(),-${Math.max(1, Math.floor(days))},'days')),${acctBrandClause()})`,
    fields: ["email", "evento", "slug_immobile", "dettaglio", "dwell_sec", "quando", "ip"],
  });
  return recs
    .map((r) => ({
      email: normEmail(str(r.fields.email)),
      evento: str(r.fields.evento),
      slug: str(r.fields.slug_immobile),
      dettaglio: str(r.fields.dettaglio),
      dwellSec: typeof r.fields.dwell_sec === "number" ? (r.fields.dwell_sec as number) : 0,
      quandoMs: r.fields.quando ? new Date(str(r.fields.quando)).getTime() : 0,
      ip: str(r.fields.ip),
    }))
    .filter((e) => e.email && e.quandoMs > 0);
}

export async function listActiveAccounts(): Promise<WebAccount[]> {
  const recs = await aList(T_ACC, {
    filter: `AND({stato}='Attivo',${acctBrandClause()})`,
  });
  return recs.map(toAccount);
}

export async function listAllPrefs(): Promise<(Pref & { email: string })[]> {
  const recs = await aList(T_PREF, { filter: acctBrandClause() });
  return recs.map((r) => ({ ...toPref(r), email: normEmail(str(r.fields.email)) }));
}

// Le proposte del motore per la pagina /account ("Selezionati per te").
// La chiave contiene brand|email|slug: si filtra su quella, non sui link.
export async function listMatchesByEmail(
  email: string,
  max = 6,
): Promise<{ slug: string; score: number; motivi: string }[]> {
  const em = normEmail(email);
  if (!em) return [];
  const recs = await aList(T_MATCH, {
    filter: `AND(FIND("${escFormula(`${ACCT_BRAND.code}|${em}|`)}",{chiave})=1,{stato}!='Scartato',${acctBrandClause()})`,
    fields: ["slug_immobile", "score", "motivi"],
    sort: [{ field: "score", dir: "desc" }],
    max,
  });
  return recs.map((r) => ({
    slug: str(r.fields.slug_immobile),
    score: typeof r.fields.score === "number" ? (r.fields.score as number) : 0,
    motivi: str(r.fields.motivi),
  }));
}

export async function listMatchChiavi(): Promise<Set<string>> {
  const recs = await aList(T_MATCH, { filter: acctBrandClause(), fields: ["chiave"] });
  return new Set(recs.map((r) => str(r.fields.chiave)).filter(Boolean));
}

export async function createMatch(m: {
  email: string;
  accountId: string;
  slug: string;
  propRecId: string | null;
  score: number;
  motivi: string;
}): Promise<void> {
  await aPost(T_MATCH, {
    chiave: `${ACCT_BRAND.code}|${normEmail(m.email)}|${m.slug}`,
    brand: ACCT_BRAND.code,
    account_link: [m.accountId],
    ...(m.propRecId ? { immobile_link: [m.propRecId] } : {}),
    slug_immobile: m.slug,
    score: Math.round(m.score * 10) / 10,
    motivi: m.motivi,
    stato: "Nuovo",
    creato: new Date().toISOString(),
  });
}
