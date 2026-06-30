# TriesteImmobiliare.com — Relaunch Brief (single source of truth)

> Authored 2026-06-30. Drives the `feat/tsi-relaunch` rebuild. Every subagent and
> implementer reads this first. Verbatim copy of the **current live WordPress site**
> (the content we must not lose) is in the repo at `docs/livesite/*.txt`.

## 0. Mission

Take the existing TSI draft (`triesteimmobiliare.vercel.app`) to a **quality leap** and
online. It must read, in one second, as **the non-luxury sibling of TriesteVillas**:
same marketing muscle, same property quality, **non-stratospheric budgets** (residential
Trieste + provincia up to ~€500k). Three jobs, in priority order:

1. **Property ACQUISITION (sellers)** — the #1 commercial goal. "0% al venditore" promo,
   fast valuation, simple 3-month mandate, real marketing. Make it shine.
2. **Off-market INVESTMENT funnel** — we hold ≥20 already-rented investment units, €200–400k,
   in very central recently-renovated buildings, that **cannot be advertised** but can be
   **told privately**. Spark curiosity → profile the person → land a LEAD in the CRM.
   (NOT a gated "Private Collection" like TSV — a lighter curiosity→profiling→lead path.)
3. **Sell the listed portfolio** (buyers) — browse + lead capture.

Everything funnels into the **shared CRM** (Airtable) intuitively. Trilingual **IT / EN / DE**.
Graphically **stunning**. Autonomous build → deploy on Vercel.

## 1. Brand & identity

- **Real logo:** origami **paper boat** (barchetta), 4-tone blues. Wordmark
  **Trieste**(bold, dark navy) + **Immobiliare** (regular, steel-blue). Source PNGs:
  `~/Downloads/logo_triesteimmobiliare_300x300.png`, `~/Desktop/LOGHI SITI NUOVI/LOGO TSI.png`.
  The current `Logo.tsx` is a PLACEHOLDER triangle — replace with a faithful multi-tone
  paper-boat SVG (crisp at all sizes; light + dark variants).
- **Palette (from logo):** brand `#2c6b96`, brand-dark `#1c4a6b`, brand-light `#6fa1c6`,
  pale boat-blue accent `#a9c8e0` (named `sand` for class-parity with TSV). Ink `#0f2737`.
  White paper background. (Already in `globals.css`.)
- **Positioning vs TSV:** TSV is dark/cinematic luxury. TSI is **light, clear, confident,
  nautical** — calmer motion, white paper, but NOT plain or cheap. "Less premium" in
  restraint, not in craft.
- **Font:** Poppins (var `--font-poppins`).

## 2. The group (6 brands) — recovered from live "Gruppo" page

"**Brand diversi, una regia sola.**" Ecosystem, each vertical specialised:
- **TriesteVillas** — capogruppo, polo premium/luxury Trieste; centrale marketing + back office.
- **TriesteImmobiliare** — residenziale Trieste e Provincia fino a ~€500k (this site).
- **TriesteAffitti** — locazioni 1–18 mesi (transitori/concordati/classici); nato 2013 turistico, evoluto.
- **FriuliVillas** — premium nel resto del FVG (Grado, Udine, Tarvisio, Lignano, Sappada).
- **TriesteBusiness** — commerciale: locali, attività, terreni, palazzi, uffici, capannoni, ricettivo.
- **LignanoVillas** — compravendite premium a Lignano, taglio internazionale.

Routing copy (home): "Se immobile di Lusso → TriesteVillas. Per il resto del FVG →
FriuliVillas / LignanoVillas. Per affitti → TriesteAffitti. Per il business → TriesteBusiness."
Group logos appear on the current live homepage — recreate a clean "ecosystem" strip/section.

## 3. Lost content to RECOVER (from live site — simplify & integrate, don't lose the ideas)

Full verbatim source: `docs/livesite/{home,vendi,gruppo}.txt`. The well-structured ideas:

### Seller / acquisition (priority #1)
- **Headline promise strip:** "Valutazione in 24h · Online entro 7 giorni · Mandato 3 mesi · **0% al venditore**".
- **Promo (time-boxed, keep accurate):** "0% al venditore per **mandati firmati entro settembre 2026**."
- **+ Buy-back incentive:** "Se vendi **e** ricompri con noi → **25% di sconto** sulla provvigione d'acquisto."
- **Valutazione rapidissima:** call col titolare → invio documentazione → sopralluogo entro 24h → se i documenti lo consentono, online entro 7 giorni.
- **Contratto semplice:** venditore non paga · esclusiva 3 mesi · **no tacito rinnovo** · nessun costo nascosto · foto/video/drone/tour 3D inclusi · **"se non rinnovi, ti regaliamo il materiale."**
- **Il massimo del marketing:** TSV è l'agenzia con più follower; **~2M visualizzazioni YouTube**, **~5.6M su Facebook** nell'ultimo anno (⚠️ cross-check exact figures). "TSI, pur non trattando Luxury, non merita di meno."
- **Check-up pre-vendita:** verifichiamo se la casa è pronta; check documentale con tecnici esterni; **anticipiamo il 50% del costo del controllo** e, se manca, **anche il costo dell'APE.**
- **Lifting pre-vendita:** non sempre conviene mettere casa online così com'è; architetto + artigiani per preventivi; **"potremmo essere partecipi all'investimento."**
- **Owner journey:** meno attrito — **visite concentrate in un solo giorno a settimana**, fascia concordata. "Una vendita ben fatta ti toglie peso, non te ne aggiunge."
- **Prima vendi bene, poi cerca:** errore comune innamorarsi della prossima casa prima di vendere → posizione debole → si svende.
- **Affitta mentre vendi:** messa a reddito temporanea con TriesteAffitti se non è il momento giusto.
- **Specialisti in acquirenti esteri:** call orientative Zoom, tour 3D, **house tour half/full-day in auto** per scoprire la Trieste autentica. "Trieste non va solo mostrata. Va spiegata."
- **Vendita discreta** via canale riservato quando serve (Private Collection-style, ma TSI lo chiama "vendita riservata").

### Buyer / investor
- **Ricerca libera:** "Spiegaci cosa cerchi: budget, lavori ammissibili, vincoli, composizione famiglia, destinazione → ricevi una lista di idee."
- **Ricerca per utile netto / ROI:** "Vuoi investire? Indicaci budget e ritorno atteso → case study con opzioni ordinate per ROI, costi all-inclusive d'acquisto." → **this is the off-market investment funnel.**
- "Inizia dal capire cosa Trieste può offrirti — investi mezz'ora con noi a orientare la ricerca."

### Tone
Confident, plain, concrete, no fluff. Italian master voice is practical and a bit witty/brit.
Martino HATES generic LLM real-estate filler. Every claim must be true and specific.

## 4. Information architecture (target)

- `/` Home — hero (paper-boat, claim, two CTAs) → promise strip (24h/7gg/3 mesi/0%) →
  featured listings → seller value blocks (recovered) → investor teaser → group ecosystem → valuation CTA.
- `/vendi` — **seller flagship**: all recovered seller blocks, the 0% promo, process timeline, valuation form.
- `/investimenti` (new) — off-market investment story + ROI/profiling funnel → investor lead.
- `/immobili` (+ `/annuncio/[slug]`) — browse listed portfolio + property dossier + lead modals.
- `/gruppo` — the 6-brand ecosystem with logos + story + team + legal.
- `/contatti` — info@triesteimmobiliare.com · 040 2473628 · Via Torino 34, 2° piano (su appuntamento).
- `/privacy` — keep.
Consider `/compra` content (buyer help, Ricerca libera) folded into `/immobili` or its own light page.

## 5. CRM / Airtable wiring (NO schema changes)

- **Properties** read: base `app1ZDay9vQNU5V2u`, table PROPRIETA `tblwAUWPnX7KF8FhU`.
  Publish gate: `tsv_com_online`=TRUE **and** `pubblicato_su` contains `triesteimmobiliare.com`.
- **Leads** write: SAME base, table **LEADS `tbl1RolmcvI7WxDdr`** — this is the real unified CRM
  (4,035 records, fed by Gmail/Immobiliare.it too). Writes are by **field NAME + typecast:true**.
  typecast creates missing **singleSelect options** but NOT missing columns → **only write to
  existing field names.** Existing names used by `/api/lead`: `nome_completo, nome, cognome, email,
  telefono, canale, azienda, tipo_richiesta, motivo, messaggio, zona_interesse_norm, zone_preferite,
  budget_min_eur, budget_max_eur, budget, dimensioni_mq, scopo, condizioni, ha_da_vendere,
  destinatario_interno, tempistiche, disponibilita_visita, email_amico, immobile_rif, immobile (link),
  immobile_url, privacy_ok, lingua, stato, data_contatto, flag_test`.
- **Routing already in place:** `azienda`="TriesteImmobiliare", `canale`="Sito TriesteImmobiliare",
  seller → `destinatario_interno`="owners@TSV". Emails via Resend (best-effort), localized recaps.
- **Investor lead (new `tipo`)**: reuse fields — `tipo_richiesta`="Investimento" (typecast adds option),
  `scopo`="Investimento / rendita", `budget_min_eur/budget_max_eur/budget`, `zona_interesse_norm`,
  `motivo`="Investitore sito: ROI atteso X% · orizzonte Y · ticket Z", `messaggio`. No new columns.

### TSV ↔ TSI triangulations / automations (set up what's possible)
- **One CRM, brand-tagged**: every TSI lead carries `azienda`/`canale`=TSI so it's filterable
  alongside TSV/FriuliVillas. Same fields, same shapes → CRM dashboards "just work".
- **Cross-brand routing in copy + links**: luxury seller → TSV; FVG → FriuliVillas/LignanoVillas;
  rental → TriesteAffitti; business → TriesteBusiness. Where a TSI listing or lead is really luxury,
  flag for hand-off (motivo/destinatario_interno).
- **Shared property DB**: both sites read the same PROPRIETA table; a unit shows on TSI vs TSV purely
  by `pubblicato_su`. "Affitta mentre vendi" references TriesteAffitti target.
- **Shared lead recap/email infra** (Resend env), shared design tokens/components for portability.

## 6. SEO

Trilingual (it default root, en, de; `localePrefix: as-needed`). Per-locale metadata, OpenGraph,
hreflang alternates, canonical, JSON-LD (`RealEstateAgent`/`Organization` with the group, `BreadcrumbList`,
`Offer`/`Residence` on listings, `FAQPage` for seller FAQ). Local SEO: Trieste + provincia, zones.
sitemap.ts + robots.ts already exist — extend with locales + new routes. Keywords: "vendere casa
Trieste 0 provvigione", "agenzia immobiliare Trieste", "investire immobili Trieste rendita",
"case Trieste", + EN/DE equivalents for foreign buyers.

## 7. Quality bar (port from triestevillas-web, adapt to light skin)

TSV home has: HeroCinema, Marquee, ScrollVideo, chapter-numbered sections, ProjectsShowcase,
YouTubeShowcase, Magnetic/Scene/Tilt motion. TSI should feel as crafted but **lighter**: a
strong photographic/gradient hero with the boat, kinetic headline, reveal-on-scroll, a refined
listings reel, an elegant seller process timeline, a tasteful investor teaser, a clean group strip.
Reuse TSI's existing `globals.css` grammar (kinetic-word, data-reveal, card-cine, btn-hero, pill-header).

## 8. Constraints / facts (verify before asserting)

- Contacts (TSI-specific): **info@triesteimmobiliare.com · 040 2473628 · Via Torino 34, 2° piano, Trieste · su appuntamento · Facebook**.
- Legal: TriesteVillas srl · Via Milano 5, 34132 Trieste · C.F./P.IVA 01235580329 · REA TS 134793 · cap. 10.200 € i.v. · PEC milou@pec.emailc.it.
- Promo "0% al venditore" is **time-boxed to mandati entro settembre 2026** — keep that nuance.
- Marketing stats (2M YT / 5.6M FB) — cross-check / soften to "milioni di visualizzazioni" if unverifiable.
- Team (from current it.json): Davide Carlin (titolare/agente), Martino Coppola di Canzano (socio/sviluppo),
  Giada Comelli (affitti), Cécile Van der Salm (affitti).
- Tech: Next.js **16.2.6** (breaking vs training data — see AGENTS.md, mirror existing patterns),
  React 19, Tailwind v4, next-intl v4. Dev/build with NO local Airtable token → uses `src/lib/seed.json`.
- Phone format: Italian numbers without +39 prefix in UI (KB rule), but tel: links may use +39.

## 9. Deploy

Existing Vercel project `triesteimmobiliare` (org trieste-villas) already has env + lead API; it's a
draft on `triesteimmobiliare.vercel.app` (DNS NOT cut over — production domain still WordPress).
Deploy the relaunch to that project (preview from branch → promote). Do NOT touch the live DNS.
