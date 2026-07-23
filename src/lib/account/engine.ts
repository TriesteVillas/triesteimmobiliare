import "server-only";
import { getProperties, getPrivateProperties } from "../airtable";
import type { Property } from "../properties";
import { ACCT_BRAND } from "./brand";
import {
  listActiveAccounts,
  listEventsSince,
  listAllPrefs,
  listMatchChiavi,
  listChatQuestionsSince,
  createMatch,
  patchAccount,
  patchLeadWebIntel,
  logEvent,
  type WebAccount,
  type EngineEvent,
  type Pref,
  type ChatQuestion,
} from "./store";

// Il motore di intelligenza dell'area clienti. Gira nel cron notturno e fa tre
// cose, tutte derivate dal registro WEB_EVENTS + WEB_PREFERITI:
//  1. engagement_score per account — formula a decadimento (half-life 14 giorni),
//     pesi dalla ricerca 2026-07-22: view 1, dwell>90s +2, vista di ritorno 3,
//     cuore/like 8, dislike 2, richiesta contatto 20; bonus +15 se lo stesso
//     immobile è stato riaperto ≥3 volte negli ultimi 7 giorni (il segnale
//     singolo più predittivo).
//  2. profilo_ai — riassunto leggibile dall'operatore: zone osservate, budget
//     mediano, tipologie, segnali forti, criteri dichiarati.
//  3. matching — nuove proposte in WEB_MATCHES: filtri duri (budget ±25%, zone
//     osservate), poi punteggio contenutistico. Niente collaborative filtering:
//     a ~300 immobili è solo rumore (cold start).

const HALF_LIFE_DAYS = 14;
const DAY_MS = 86_400_000;

const EVENT_WEIGHTS: Record<string, number> = {
  view: 1,
  fav_add: 8,
  like: 8,
  dislike: 2,
  chat: 2,
  contact_request: 20,
  search: 0.5,
};

const decay = (ageDays: number) => Math.pow(2, -ageDays / HALF_LIFE_DAYS);

type Profile = {
  zones: string[]; // top zone osservate (pesate)
  priceMin: number | null;
  priceMax: number | null;
  priceMedian: number | null;
  tipologie: string[];
  strongSignals: string[]; // frasi leggibili per profilo_ai e motivi match
  interactedSlugs: Set<string>;
};

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function euro(n: number): string {
  return `€${Math.round(n).toLocaleString("it-IT")}`;
}

function buildProfile(events: EngineEvent[], prefs: Pref[], bySlug: Map<string, Property>): Profile {
  const zoneWeight = new Map<string, number>();
  const tipoWeight = new Map<string, number>();
  const prices: number[] = [];
  const interactedSlugs = new Set<string>();
  const viewsPerSlug = new Map<string, number>();
  const now = Date.now();

  const bump = (map: Map<string, number>, key: string | null, w: number) => {
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + w);
  };

  for (const e of events) {
    if (!e.slug) continue;
    interactedSlugs.add(e.slug);
    const p = bySlug.get(e.slug);
    if (e.evento === "view") viewsPerSlug.set(e.slug, (viewsPerSlug.get(e.slug) ?? 0) + 1);
    if (!p) continue;
    const w = e.evento === "fav_add" || e.evento === "like" ? 3 : 1;
    bump(zoneWeight, p.zona, w);
    bump(tipoWeight, p.tipologia, w);
    const price = p.priceSale ?? null;
    if (price && (e.evento === "view" || e.evento === "fav_add" || e.evento === "like")) prices.push(price);
  }
  for (const pr of prefs) {
    if (!pr.cuore && pr.voto !== "Like") continue;
    interactedSlugs.add(pr.slug);
    const p = bySlug.get(pr.slug);
    if (!p) continue;
    bump(zoneWeight, p.zona, 3);
    bump(tipoWeight, p.tipologia, 2);
    if (p.priceSale) prices.push(p.priceSale);
  }

  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  const med = median(prices);
  const strongSignals: string[] = [];
  for (const [slug, n] of viewsPerSlug) {
    if (n < 3) continue;
    const recent = events.filter(
      (e) => e.slug === slug && e.evento === "view" && now - e.quandoMs < 7 * DAY_MS,
    ).length;
    if (recent >= 3) strongSignals.push(`${recent} visite su «${bySlug.get(slug)?.title ?? slug}» negli ultimi 7 giorni`);
    else strongSignals.push(`${n} visite totali su «${bySlug.get(slug)?.title ?? slug}»`);
  }

  return {
    zones: top(zoneWeight, 3),
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    priceMedian: med,
    tipologie: top(tipoWeight, 2),
    strongSignals: strongSignals.slice(0, 4),
    interactedSlugs,
  };
}

function computeScore(events: EngineEvent[], now: number): number {
  let score = 0;
  const viewSeen = new Set<string>();
  const recentReturns = new Map<string, number>();
  for (const e of events) {
    const ageDays = Math.max(0, (now - e.quandoMs) / DAY_MS);
    const d = decay(ageDays);
    if (e.evento === "view") {
      // La prima vista di un immobile pesa 1, quelle di RITORNO 3.
      const w = viewSeen.has(e.slug) ? 3 : 1;
      viewSeen.add(e.slug);
      score += w * d;
      if (now - e.quandoMs < 7 * DAY_MS) recentReturns.set(e.slug, (recentReturns.get(e.slug) ?? 0) + 1);
      continue;
    }
    if (e.evento === "dwell") {
      if (e.dwellSec >= 90) score += 2 * d;
      continue;
    }
    const w = EVENT_WEIGHTS[e.evento];
    if (w) score += w * d;
  }
  // Bonus stacking: ≥3 aperture dello stesso immobile in 7 giorni.
  if ([...recentReturns.values()].some((n) => n >= 3)) score += 15;
  return Math.round(score * 10) / 10;
}

function buildProfiloAi(acc: WebAccount, profile: Profile, score: number, nEvents: number): string {
  const rows: string[] = [];
  rows.push(`Engagement: ${score} (${nEvents} eventi 60gg)`);
  if (profile.zones.length) rows.push(`Zone osservate: ${profile.zones.join(", ")}`);
  if (profile.priceMedian)
    rows.push(
      `Budget osservato: ~${euro(profile.priceMedian)} (range ${euro(profile.priceMin ?? profile.priceMedian)}–${euro(profile.priceMax ?? profile.priceMedian)})`,
    );
  if (profile.tipologie.length) rows.push(`Tipologie: ${profile.tipologie.join(", ")}`);
  for (const s of profile.strongSignals) rows.push(`Segnale: ${s}`);
  if (acc.criteri.trim()) rows.push(`Criteri dichiarati: ${acc.criteri.trim()}`);
  rows.push(`Consensi: marketing ${acc.consMarketing ? "sì" : "no"} · profilazione ${acc.consProfilazione ? "sì" : "no"}`);
  rows.push(`Aggiornato dal motore: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`);
  return rows.join("\n");
}

// ---- web_intel: il riepilogo web stampato sulla scheda lead ---------------------
// Campo macchina su LEAD_ (si sovrascrive sempre, l'intestazione lo dichiara).
// Fonti: WEB_ACCOUNTS (login), WEB_PREFERITI (cuori/voti), WEB_EVENTS
// (articoli salvati e ricerche, finestra 60gg del motore) e WEB_CHAT_LOG
// (domande concierge, UNA fetch per giro raggruppata per email a monte).

const fmtRome = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", ...opts }).format(d);

function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function buildWebIntel(
  acc: WebAccount,
  events: EngineEvent[],
  prefs: Pref[],
  bySlug: Map<string, Property>,
  articleTitleBySlug: Map<string, string>,
  chat: ChatQuestion[],
): string {
  const now = new Date();
  const stamp = `${fmtRome(now, { day: "2-digit", month: "2-digit", year: "numeric" })} ${fmtRome(now, { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  const rows: string[] = [`[Aggiornato ${stamp} · automatico, non editare]`];

  const lastLogin = acc.ultimoLogin ? new Date(acc.ultimoLogin) : null;
  const lastTxt =
    lastLogin && !Number.isNaN(lastLogin.getTime())
      ? `, ultimo ${fmtRome(lastLogin, { day: "2-digit", month: "2-digit" })}`
      : "";
  rows.push(`Accessi area riservata: ${acc.loginCount} login${lastTxt}.`);

  const hearted = prefs.filter((p) => p.cuore);
  const heartTitles = hearted.slice(0, 5).map((p) => `«${bySlug.get(p.slug)?.title ?? p.slug}»`);
  rows.push(
    `Wishlist immobili: ${hearted.length}${heartTitles.length ? ` — ${heartTitles.join(", ")}` : ""}.`,
  );

  const likes = prefs.filter((p) => p.voto === "Like").length;
  const dislikes = prefs.filter((p) => p.voto === "Dislike").length;
  rows.push(`Like: ${likes} · Dislike: ${dislikes}.`);

  // Articoli salvati: stato ricostruito dal registro (per slug vince il più recente).
  const artLatest = new Map<string, { on: boolean; ts: number }>();
  for (const e of events) {
    if ((e.evento !== "article_fav" && e.evento !== "article_unfav") || !e.dettaglio) continue;
    const prev = artLatest.get(e.dettaglio);
    if (!prev || e.quandoMs >= prev.ts)
      artLatest.set(e.dettaglio, { on: e.evento === "article_fav", ts: e.quandoMs });
  }
  const artTitles = [...artLatest.entries()]
    .filter(([, v]) => v.on)
    .map(([slug]) => `«${articleTitleBySlug.get(slug) ?? slug}»`);
  rows.push(`Articoli Biblioteca salvati: ${artTitles.length ? artTitles.join(", ") : "nessuno"}.`);

  if (chat.length) {
    const ultime = [...chat]
      .sort((a, b) => b.quandoMs - a.quandoMs)
      .slice(0, 5)
      .map((q) => `«${truncate(q.domanda, 80)}»`);
    rows.push(
      `Concierge AI: ${chat.length} ${chat.length === 1 ? "domanda" : "domande"} — ultime: ${ultime.join(" ")}.`,
    );
  } else {
    rows.push("Concierge AI: nessuna domanda.");
  }

  // Ricerche: ultimi termini distinti, riga presente solo se ce ne sono.
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const e of [...events].sort((a, b) => b.quandoMs - a.quandoMs)) {
    if (e.evento !== "search" || !e.dettaglio) continue;
    const t = truncate(e.dettaglio, 60);
    if (seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    terms.push(t);
    if (terms.length >= 5) break;
  }
  if (terms.length) rows.push(`Ricerche: ${terms.join(" · ")}.`);

  return rows.join("\n");
}

// Punteggio contenutistico 0–100 di un immobile contro un profilo.
function matchScore(p: Property, profile: Profile): { score: number; motivi: string[] } {
  const motivi: string[] = [];
  let score = 0;
  if (profile.zones.length && p.zona && profile.zones.includes(p.zona)) {
    score += 40;
    motivi.push(`zona ${p.zona} tra le sue osservate`);
  }
  const price = p.priceSale;
  if (price && profile.priceMedian) {
    const rel = Math.abs(price - profile.priceMedian) / profile.priceMedian;
    if (rel <= 0.25) {
      const pts = Math.round(30 * (1 - rel / 0.25));
      score += pts;
      motivi.push(`prezzo ${euro(price)} vicino al suo budget osservato (~${euro(profile.priceMedian)})`);
    }
  }
  if (profile.tipologie.length && p.tipologia && profile.tipologie.includes(p.tipologia)) {
    score += 15;
    motivi.push(`tipologia ${p.tipologia}`);
  }
  return { score, motivi };
}

export type EngineResult = {
  accounts: number;
  scored: number;
  matchesCreated: number;
  skippedLowActivity: number;
  intelWritten: number;
  suspended: number;
};

// Anti-abuso, stessa euristica della PC (detectAbuse): login VALIDI dallo
// stesso account da più di 4 IP distinti in 24h = credenziale condivisa →
// stato Sospeso + nota. I login falliti NON sospendono (sarebbe un lockout
// pilotabile da un attaccante): restano visibili in WEB_EVENTS per il CRM.
const ABUSE_IP_THRESHOLD = 4;

async function detectAcctAbuse(accounts: WebAccount[], events: EngineEvent[], now: number): Promise<number> {
  const dayAgo = now - DAY_MS;
  const ipsByEmail = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.evento !== "login_ok" || !e.ip || e.quandoMs < dayAgo) continue;
    (ipsByEmail.get(e.email) ?? ipsByEmail.set(e.email, new Set()).get(e.email)!).add(e.ip);
  }
  let suspended = 0;
  for (const acc of accounts) {
    const ips = ipsByEmail.get(acc.email);
    if (!ips || ips.size <= ABUSE_IP_THRESHOLD || acc.stato !== "Attivo") continue;
    try {
      await patchAccount(acc.id, {
        stato: "Sospeso",
        sospeso_note: `Auto: ${ips.size} IP distinti in 24h (${[...ips].slice(0, 6).join(", ")}).`,
      });
      await logEvent({
        evento: "blocked",
        accountId: acc.id,
        email: acc.email,
        dettaglio: `${ips.size} distinct IPs/24h`,
      });
      suspended++;
    } catch (e) {
      console.error(`[acct-engine] suspend failed for ${acc.email}:`, e);
    }
  }
  return suspended;
}

export async function runEngine(): Promise<EngineResult> {
  const [accounts, events, prefsAll, pubProps, pcProps, existingMatches, articles, chatAll] =
    await Promise.all([
      listActiveAccounts(),
      listEventsSince(60),
      listAllPrefs(),
      getProperties(),
      getPrivateProperties().catch(() => [] as Property[]),
      listMatchChiavi(),
      // Best-effort entrambe: se Biblioteca o registro chat non rispondono, il
      // giro di scoring/matching non si ferma.
      Promise.resolve([] as { slug: string; title: unknown }[]), // TSI: nessuna Biblioteca — niente articoli
      listChatQuestionsSince(60).catch(() => [] as ChatQuestion[]),
    ]);
  // Le PC servono solo a risolvere slug interagiti (un utente PC può avere
  // eventi su immobili riservati): i CANDIDATI al match restano i pubblici.
  const bySlug = new Map<string, Property>();
  for (const p of [...pubProps, ...pcProps]) bySlug.set(p.slug, p);

  const evByEmail = new Map<string, EngineEvent[]>();
  for (const e of events) (evByEmail.get(e.email) ?? evByEmail.set(e.email, []).get(e.email)!).push(e);
  const prefsByEmail = new Map<string, Pref[]>();
  for (const pr of prefsAll) (prefsByEmail.get(pr.email) ?? prefsByEmail.set(pr.email, []).get(pr.email)!).push(pr);
  const chatByEmail = new Map<string, ChatQuestion[]>();
  for (const q of chatAll) (chatByEmail.get(q.email) ?? chatByEmail.set(q.email, []).get(q.email)!).push(q);
  // Titoli articolo in italiano: il web_intel è per l'operatore, non per il cliente.
  const artTitleBySlug = new Map<string, string>();
  for (const a of articles) artTitleBySlug.set(a.slug, String(a.title ?? a.slug)); // TSI: lista sempre vuota

  const now = Date.now();
  let scored = 0;
  let matchesCreated = 0;
  let skippedLowActivity = 0;
  let intelWritten = 0;

  for (const acc of accounts) {
    const ev = evByEmail.get(acc.email) ?? [];
    const prefs = prefsByEmail.get(acc.email) ?? [];
    const score = computeScore(ev, now);
    const profile = buildProfile(ev, prefs, bySlug);
    try {
      await patchAccount(acc.id, {
        engagement_score: score,
        profilo_ai: buildProfiloAi(acc, profile, score, ev.length),
      });
      scored++;
    } catch (e) {
      console.error(`[acct-engine] score patch failed for ${acc.email}:`, e);
    }

    // web_intel sulla scheda lead collegata: best-effort, un lead rotto non
    // ferma il giro. Campo macchina: si scrive sempre, senza confronto.
    if (acc.leadIds.length) {
      try {
        await patchLeadWebIntel(
          acc.leadIds[0],
          buildWebIntel(acc, ev, prefs, bySlug, artTitleBySlug, chatByEmail.get(acc.email) ?? []),
        );
        intelWritten++;
      } catch (e) {
        console.error(`[acct-engine] web_intel patch failed for ${acc.email}:`, e);
      }
    }

    // Matching: serve un minimo di storia, altrimenti si propone a caso.
    if (ev.length < 3 && !prefs.some((p) => p.cuore)) {
      skippedLowActivity++;
      continue;
    }
    const hidden = new Set(prefs.filter((p) => !p.cuore && p.voto === "Dislike").map((p) => p.slug));
    const candidates = pubProps
      .filter((p) => p.contratto !== "AFFITTO")
      .filter((p) => !profile.interactedSlugs.has(p.slug) && !hidden.has(p.slug))
      .filter((p) => !existingMatches.has(matchChiave(acc.email, p.slug)));
    const ranked = candidates
      .map((p) => ({ p, ...matchScore(p, profile) }))
      .filter((m) => m.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    for (const m of ranked) {
      try {
        await createMatch({
          email: acc.email,
          accountId: acc.id,
          slug: m.p.slug,
          propRecId: m.p.recId ?? null,
          score: m.score,
          motivi: m.motivi.join(" · "),
        });
        existingMatches.add(matchChiave(acc.email, m.p.slug));
        matchesCreated++;
      } catch (e) {
        console.error(`[acct-engine] match create failed:`, e);
      }
    }
  }

  const suspended = await detectAcctAbuse(accounts, events, now);

  return { accounts: accounts.length, scored, matchesCreated, skippedLowActivity, intelWritten, suspended };
}

// Deve combaciare con la chiave scritta da createMatch.
function matchChiave(email: string, slug: string): string {
  return `${ACCT_BRAND.code}|${email.trim().toLowerCase()}|${slug}`;
}
