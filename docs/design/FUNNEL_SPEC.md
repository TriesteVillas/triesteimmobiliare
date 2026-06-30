# TriesteImmobiliare — Funnel & Business Architecture Spec

> Authored 2026-06-30. Role: Funnel & Business Architect.
> Source of truth: `docs/RELAUNCH_BRIEF.md` (§3, §5), verbatim live copy in
> `docs/livesite/{home,vendi,gruppo}.txt`, and the **already-shipped** intake route
> `src/app/api/lead/route.ts`. Every payload and field name below was read off the
> real route, not invented. Where this spec asks for a NEW behaviour (investor lead),
> it is specified as a **new `tipo` handler** that reuses existing Airtable columns
> only — no schema change, consistent with brief §5 ("typecast adds singleSelect
> options but NOT columns").
>
> **Hard rule applied throughout:** the off-market investment funnel is a
> *curiosity → profiling → lead* path. It is **NOT** a gated Private Collection.
> No login wall, no "request access" gate. Anonymized teasers are visible to anyone;
> the gate is the *profiling form*, and the only thing you "unlock" is a human
> callback with a tailored ROI shortlist.

---

## 0. The two funnels at a glance

```
(A) SELLER ACQUISITION  — priority #1 — goal: a VALUATION LEAD (tipo_richiesta="Valutazione")
    cold visitor → promise strip (24h/7gg/3 mesi/0%) → trust+objection blocks → process timeline
                 → valuation form (4 mandatory-feel fields, rest optional) → LEAD → owners@TSV desk

(B) OFF-MARKET INVESTMENT — priority #2 — goal: a QUALIFIED INVESTOR LEAD (tipo_richiesta="Investimento")
    curious visitor → narrative "why off-market exists" → anonymized teaser wall (no address/photos)
                 → choice of two intents: "Ricerca libera" or "Ricerca per ROI"
                 → profiling form (budget, ROI atteso, orizzonte, scopo, zone, contatto) → LEAD → owners@TSV
```

Both POST to the **same** endpoint `/api/lead`, the same Airtable base/table
(`app1ZDay9vQNU5V2u` / `tbl1RolmcvI7WxDdr`), differentiated by the `tipo` discriminator
in the JSON body. Brand tagging (`azienda`, `canale`) makes every lead filterable next to
TSV / FriuliVillas in the shared CRM dashboards.

---

## A. SELLER ACQUISITION FUNNEL (`/vendi` + home seller section)

### A.1 Funnel stages and the recovered block that lives in each

The 14 recovered seller assets are not a flat list — each one neutralises a specific
objection at a specific moment of doubt. Placement is by *psychological stage*, not by
visual convenience. Order top-to-bottom on `/vendi`:

| # | Stage (visitor's mental state) | Recovered block placed here | Job it does |
|---|---|---|---|
| 0 | **Land** ("is this even for me?") | Hero + **promise strip**: "Valutazione in 24h · Online entro 7 giorni · Mandato 3 mesi · **0% al venditore**" | One-second proof this is serious + free. The 0% is the hook. |
| 1 | **The catch?** ("0% — where's the trick?") | **Promo nuance**: "0% al venditore per mandati firmati **entro settembre 2026**." + **Contratto semplice**: venditore non paga · esclusiva 3 mesi · **no tacito rinnovo** · nessun costo nascosto · foto/video/drone/tour 3D inclusi · **"se non rinnovi, ti regaliamo il materiale."** | Kills the "free = low effort / hidden lock-in" fear immediately. The give-back-the-material line is the trust spike — lead with it. |
| 2 | **Speed** ("how fast, really?") | **Valutazione rapidissima**: call col titolare → invio documentazione → sopralluogo entro 24h → se i documenti lo consentono, online entro 7 giorni. Render as the **process timeline** (4 steps). | Converts the abstract "24h/7gg" into a concrete, believable sequence. |
| 3 | **Will it actually sell?** ("marketing muscle") | **Il massimo del marketing**: TSV è l'agenzia con più follower; "milioni di visualizzazioni" (soft figure — see A.5). "TSI, pur non trattando Luxury, non merita di meno." + foto/video/drone/tour 3D. | Borrows TSV's reach as proof. Same craft, smaller budget. |
| 4 | **Is my house ready?** (pre-sale doubt) | **Check-up pre-vendita**: check documentale con tecnici esterni; **anticipiamo il 50% del costo del controllo** e, se manca, **anche il costo dell'APE.** + **Buy-back incentive**: "vendi **e** ricompri con noi → **25% di sconto** sulla provvigione d'acquisto." | De-risks the "my papers are a mess" objection (we front the money) and plants the repeat-customer hook. |
| 5 | **Should I list as-is?** (value-add) | **Lifting pre-vendita**: architetto + artigiani per preventivi; **"potremmo essere partecipi all'investimento."** | We don't just list — we co-invest in making it sell higher. Premium signal at a non-premium price. |
| 6 | **Will selling wreck my life?** (friction) | **Owner journey**: **visite concentrate in un solo giorno a settimana**, fascia concordata. "Una vendita ben fatta ti toglie peso, non te ne aggiunge." | The empathy block. Most agencies never address the lived hassle. |
| 7 | **Timing anxiety** | **Prima vendi bene, poi cerca** (link to blog article) + **Affitta mentre vendi** (messa a reddito temporanea con **TriesteAffitti**). | Removes the "but I need the next house first" panic that makes sellers undersell. Cross-brand handoff to TriesteAffitti. |
| 8 | **Foreign / out-of-town seller** | **Specialisti in acquirenti esteri / house tour**: call orientative Zoom, tour 3D, **house tour half/full-day in auto**. "Trieste non va solo mostrata. Va spiegata." | Widens the buyer pool — a seller benefit, not just a buyer one. Frame it as "we reach buyers you can't." |
| 9 | **Discretion** | **Vendita riservata** (Private-Collection-style channel, TSI calls it "vendita riservata"). | For sellers who don't want a public portal listing. Mentioned, not gated. |
| 10 | **Convert** | **Valuation CTA** → SellerLeadModal. Repeated at top (hero) and bottom. | The single conversion action of the page. |

**Design intent:** stages 1→2 carry the most conversion weight (catch + speed). Put the
form CTA sticky/persistent so a seller convinced at stage 1 never has to scroll back.

### A.2 The valuation FORM (already built as `SellerLeadModal.tsx`)

The form already exists and is correctly *agile*. **Keep it agile** — this is the #1
friction lever. Spec confirms the current fields and the friction rules:

**Fields, in order:**
1. `nome` (Nome) — text, optional
2. `cognome` (Cognome) — text, optional
3. `telefono` (Cellulare) — tel, optional*
4. `email` (Email) — email, optional*
5. `indirizzo` (Dove si trova l'immobile?) — text, optional, placeholder "Via e civico, comune"
6. `tipologia` — single-choice chips: Appartamento · Attico · Villa · Casa con giardino · Terreno · Altro
7. `taglia` (Dimensioni) — chips: `< 80 mq` · `80 – 150 mq` · `150 – 250 mq` · `250+ mq`
8. `statoImmobile` (Stato) — chips: Ottimo / ristrutturato · Buono / abitabile · Da ristrutturare
9. `tempistiche` — chips: Il prima possibile · Entro 6 mesi · Solo esplorativo
10. `note` (`messaggio`) — textarea, optional
11. `privacyOk` — checkbox, **REQUIRED**

\* **Friction-minimizing flow (enforced server-side, keep it):**
- Only **two** things are truly required: `privacyOk === true` AND at least one reachable
  contact (`isEmail(email)` **OR** `telefono.length >= 6`). Everything else is optional.
  Rationale: a name+phone is a closeable lead; demanding address/type/state up front
  bleeds 30–50% of mobile submits. The titolare gets the rest on the call.
- Chips (single-select, tap-to-toggle-off) instead of dropdowns: zero typing, thumb-friendly.
- Property summary (`indirizzo/tipologia/taglia/statoImmobile`) is concatenated server-side
  into one human-readable `ha_da_vendere` block — the desk reads it as a paragraph, not 4 columns.
- On success: branded localized recap email to the seller (replies route to the team) +
  internal notify to `info@triesteimmobiliare.com`. The lead is the source of truth; email is best-effort.

**Where the modal is triggered (CTAs that open SellerLeadModal):**
"Richiedi valutazione" (hero), "Richiedi una valutazione strategica" (mid), "Compila la
richiesta" (rapidissima block), "Vuoi sapere quanto vale la tua casa?" (home closing CTA).
All share one modal via `SellerCta`.

### A.3 Process timeline (recovered "valutazione rapidissima" → 4 steps)

Render stage 2 as a numbered horizontal timeline (mirrors TSV `Timeline.tsx`, light skin):

1. **Call con il titolare** — orientamento, zero impegno.
2. **Invio documentazione** — ti diciamo cosa serve; se manca, ci pensiamo noi (vedi check-up).
3. **Sopralluogo entro 24h** — vediamo la casa, non solo le carte.
4. **Online entro 7 giorni** — se documenti e immobile lo consentono.

### A.4 Cross-brand exits embedded in the seller journey (in copy + links)

- "Affitta mentre vendi" → **TriesteAffitti** (rental handoff).
- "Se è Luxury" / value > ~€500k flagged at intake → **TriesteVillas** (luxury handoff via
  `motivo`/`destinatario_interno`).
- "Resto del FVG" (Grado/Udine/Lignano/…) → **FriuliVillas / LignanoVillas**.
- Commercial asset mentioned → **TriesteBusiness**.

### A.5 Accuracy guardrails (brief §8)

- **0% promo:** always render the "entro settembre 2026" nuance. Never the bare "0%" without it.
- **Marketing stats:** brief flags 2M YT / 5.6M FB as ⚠️ cross-check. **Default to the soft
  form "milioni di visualizzazioni"** unless Martino confirms the exact figures. Do not assert
  precise numbers we can't source.
- **APE / 50% check-up cost:** keep the conditional phrasing ("se manca", "possiamo
  anticipare") — it's a conditional offer, not an unconditional promise.

---

## B. OFF-MARKET INVESTMENT FUNNEL (`/investimenti`)

### B.1 The problem this page solves

We hold **≥20 already-rented units**, €200–400k, very central, recently renovated, that
**cannot be advertised** (existing tenants, owner discretion, portal rules) but **can be told
privately**. A normal listing grid is illegal/inappropriate here; a gated Private Collection
is overkill and kills curiosity. The page's only job: **make a qualified investor raise their
hand** by giving us enough to send them a tailored ROI shortlist.

### B.2 Page narrative (sparks curiosity, stays honest)

Recovers the live "Comprare e investire a Trieste" intent and the two live search modes.
Sections top-to-bottom:

1. **Hero / hook** — copy direction (IT master, witty/brit, true):
   "Alcuni dei nostri migliori immobili non li vedrai mai su un portale. Sono già locati,
   già a reddito, in centro, ristrutturati di recente — e si raccontano solo a chi sa cosa
   cerca. Dicci cosa cerchi: te li portiamo noi."
   (EN: "Some of our best properties never reach a portal…"; DE equivalent.)
2. **Why off-market exists** — 3 honest reasons, no mystique-for-mystique:
   - *Sono locati.* Pubblicarli disturberebbe inquilini paganti. Il reddito è già lì.
   - *Sono pochi e buoni.* Centro, ristrutturati, ticket €200–400k: vanno a chi è pronto.
   - *Discrezione del proprietario.* Alcuni venditori non vogliono vetrina pubblica.
3. **Anonymized teaser wall** (see B.3) — proof the inventory is real, with zero leakage.
4. **Two ways in** (recovers live "Ricerca libera" + "Ricerca per utile netto / ROI"):
   - **Ricerca libera** — "Spiegaci cosa cerchi: budget, lavori ammissibili, vincoli,
     destinazione → ricevi una lista di idee." (opens the profiling form in *libera* mode)
   - **Ricerca per utile netto / ROI** — "Indicaci budget e ritorno atteso → case study con
     opzioni ordinate per ROI, costi all-inclusive d'acquisto." (opens the form in *ROI* mode)
5. **How it works** — 3 steps: profilo (2 min) → call di orientamento (mezz'ora) → shortlist
   ordinata per ROI con costi all-inclusive. ("Inizia dal capire cosa Trieste può offrirti —
   investi mezz'ora con noi a orientare la ricerca.")
6. **Profiling form CTA** (see B.4) — repeated.

### B.3 Anonymized teaser concept (visible to all, leaks nothing)

A grid of 4–8 **anonymized cards**. **No address, no photos, no map, no slug, no link to a
dossier.** Each card is hand-authored (or derived from PROPRIETA with identifying fields
stripped) and carries only non-identifying economics. Card anatomy:

```
┌────────────────────────────────┐
│  RISERVATO · OFF-MARKET         │  ← pill, brand-light
│                                 │
│  Bilocale a reddito             │  ← tipologia generica
│  Centro · locato                │  ← macro-zona + status (no via)
│  ~5,0% lordo                    │  ← yield band, rounded
│  ~€185k                         │  ← price band, rounded to 5k
│                                 │
│  [ Scopri immobili come questo ]│  ← opens profiling form (ROI mode, prefilled budget band)
└────────────────────────────────┘
```

Rules that keep it legal/discreet:
- Price rounded to the nearest €5k and prefixed "~"; yield rounded to 0.5% and labelled
  **lordo** (gross) explicitly — never imply net without the all-in cost call.
- Macro-zone only (Centro / Semicentro / Borgo Teresiano-level), never street.
- No image; use a tasteful brand-gradient placeholder or an abstract nautical motif.
- A persistent disclaimer under the wall: *"Esempi rappresentativi del nostro portafoglio
  off-market. Dati indicativi, non un'offerta. Gli immobili reali si condividono in privato,
  previo profilo."*
- The card CTA does **not** reveal a unit — it opens the **profiling form** with the budget
  band pre-selected. Curiosity is the currency; the form is the till.

### B.4 The INVESTOR PROFILING FORM (new `InvestorLeadModal`)

Same agile pattern as Buyer/Seller modals (chips + dual-range sliders, privacy + one contact
required, everything else optional). Posts `tipo: "investitore"`.

**Fields, in order:**
1. `nome` (Nome) — text, optional
2. `cognome` (Cognome) — text, optional
3. `telefono` (Cellulare) — tel, optional*
4. `email` (Email) — email, optional*
5. `budgetMin` / `budgetMax` — **dual-range slider**, €100k–€600k, step €25k (mid-market
   investor band; default whole range, only sent if touched). Mirrors BuyerLeadModal's RangeDual.
6. `roiAtteso` — single-choice chips: `≥ 3%` · `≥ 4%` · `≥ 5%` · `≥ 6%` · `Massimo possibile`
   (ROI atteso lordo; the live "Ricerca per utile netto / ROI" idea, made concrete)
7. `orizzonte` — chips: `Breve (rivendita 1–3 anni)` · `Medio (3–7 anni)` · `Lungo / rendita`
8. `scopo` — chips reusing the canonical buyer scopo value `Investimento / rendita`
   (single option, pre-selected since this is the investment page) — kept so the CRM
   `scopo` column is populated consistently with buyer leads.
9. `zone` — multi-select chips (reuse buyer zone set: CENTRO, SEMICENTRO, BARCOLA, …, FVG, ALTRO)
10. `modalita` — hidden/segmented: `"libera"` | `"roi"` (set by which CTA opened the modal;
    drives copy + lands in the `motivo` string so the desk knows which mode they chose)
11. `note` (`messaggio`) — textarea ("Vincoli, lavori ammissibili, ticket ideale…"), optional
12. `privacyOk` — checkbox, **REQUIRED**

\* **Friction rule (identical to the other two forms):** required = `privacyOk === true` AND
(`isEmail(email)` OR `telefono.length >= 6`). Budget/ROI/horizon are what *qualify* the lead,
but we never block submission on them — a reachable serious investor is worth more than a
perfectly profiled bounce. The call fills the gaps.

**Two entry modes (one form, two pre-fills):**
- **Ricerca libera CTA** → opens with `modalita="libera"`, ROI chips collapsed, copy
  emphasises "raccontaci cosa cerchi".
- **Ricerca per ROI CTA / teaser card** → opens with `modalita="roi"`, ROI chips prominent,
  budget pre-set from the card's band.

---

## C. LEAD PAYLOAD MAPPING (exact JSON → exact Airtable field NAMES)

Endpoint: `POST /api/lead`. Base `app1ZDay9vQNU5V2u`, table `tbl1RolmcvI7WxDdr`,
`typecast: true`. **Only existing column names are written** (brief §5). typecast may create
new *singleSelect options* (e.g. a new `tipo_richiesta` choice "Investimento") but never new
columns. Conditional spreads (`...(x ? {x} : {})`) mean empty optionals are simply omitted.

### C.1 SELLER (valuation) — `tipo: "valutazione"` — **already shipped, documented for completeness**

POST body:
```json
{
  "tipo": "valutazione",
  "nome": "Anna", "cognome": "Rossi",
  "telefono": "3331234567", "email": "anna@example.com",
  "indirizzo": "Via Rossetti 12, Trieste",
  "tipologia": "Appartamento",
  "taglia": "80 – 150 mq",
  "statoImmobile": "Buono / abitabile",
  "tempistiche": "Entro 6 mesi",
  "messaggio": "Terzo piano con ascensore, terrazzo.",
  "privacyOk": true,
  "lingua": "it"
}
```
Airtable fields written:
```
nome_completo="Anna Rossi", nome="Anna", cognome="Rossi",
email, telefono,
canale="Sito TriesteImmobiliare", azienda="TriesteImmobiliare",
tipo_richiesta="Valutazione",
destinatario_interno="owners@TSV",
motivo="CTA sito: Valutazione riservata",
ha_da_vendere="Indirizzo: …\nTipologia: …\nDimensioni: …\nStato: …"   (concatenated),
dimensioni_mq=<taglia>,
tempistiche, messaggio,
privacy_ok=true, lingua, stato="NUOVO", data_contatto=<ISO now>,
[flag_test="true" only if body.test===true]
```

### C.2 BUYER (browse / "Diteci cosa cercate") — `tipo: "buyer"` — **already shipped**

POST body keys: `tipo, fonteCta, nome, cognome, telefono, email, zone[], budgetMin,
budgetMax, mqMin, mqMax, scopo, condizioni, privacyOk, lingua`.
Airtable fields written:
```
nome_completo, nome, cognome, email, telefono,
canale="Sito TriesteImmobiliare", azienda="TriesteImmobiliare",
tipo_richiesta="Cerco casa",
motivo="CTA sito: <fonteCta>"  (or "Popup buyer sito"),
messaggio,
zona_interesse_norm=<zone[]>, zone_preferite=<zone.join(", ")>,
budget_min_eur, budget_max_eur, budget="<min> – <max>", dimensioni_mq="<mqMin> – <mqMax> mq",
scopo, condizioni,
privacy_ok=true, lingua, stato="NUOVO", data_contatto=<ISO now>
```

### C.3 INVESTOR (off-market profiling) — `tipo: "investitore"` — **NEW handler to add**

**Exact POST body** the `InvestorLeadModal` sends:
```json
{
  "tipo": "investitore",
  "nome": "Marco", "cognome": "Bianchi",
  "telefono": "3489876543", "email": "marco@example.com",
  "budgetMin": 150000, "budgetMax": 300000,
  "roiAtteso": "≥ 5%",
  "orizzonte": "Lungo / rendita",
  "scopo": "Investimento / rendita",
  "zone": ["CENTRO", "SEMICENTRO"],
  "modalita": "roi",
  "messaggio": "Cerco bilocali già locati, no lavori.",
  "privacyOk": true,
  "lingua": "it"
}
```

**Exact Airtable field mapping** the new `handleInvestitore(body)` must write (existing
columns only; typecast adds the new `tipo_richiesta` option "Investimento"):
```
nome_completo = "<nome> <cognome>"
nome, cognome, email, telefono
canale            = "Sito TriesteImmobiliare"
azienda           = "TriesteImmobiliare"
tipo_richiesta    = "Investimento"                 ← NEW singleSelect option (typecast)
scopo             = "Investimento / rendita"        ← reuses existing canonical buyer value
destinatario_interno = "owners@TSV"                 ← same desk as sellers (off-market is our stock)
motivo            = "Investitore sito (<modalita>): ROI atteso <roiAtteso> · orizzonte <orizzonte> · ticket <budget>"
                     e.g. "Investitore sito (roi): ROI atteso ≥ 5% · orizzonte Lungo / rendita · ticket 150.000 € – 300.000 €"
budget_min_eur    = <budgetMin>            (only if sent)
budget_max_eur    = <budgetMax>            (only if sent)
budget            = "<min> – <max>"         (formatted, only if a band sent)
zona_interesse_norm = <zone[]>             (only if non-empty)
zone_preferite      = <zone.join(", ")>    (only if non-empty)
messaggio         = <note>
privacy_ok        = true
lingua, stato="NUOVO", data_contatto=<ISO now>
[flag_test="true" if body.test===true]
```
Notes on the new handler:
- Mirror `handleBuyer`/`handleValutazione` exactly: same `clean`/`isEmail`/`num` helpers, same
  privacy + one-contact guard, same try/catch → 502 on Airtable failure, same best-effort
  Resend notify to `info@triesteimmobiliare.com` + localized customer recap.
- **Validate `roiAtteso`, `orizzonte`, `modalita` against canonical Sets** (like `BUYER_SCOPI`)
  so typecast only ever creates the intended options. Note: ROI/horizon do NOT have their own
  Airtable columns — they are folded into the `motivo` string (and the recap email rows).
  Only columns that already exist are written.
- `scopo` is forced to the canonical `"Investimento / rendita"` so the CRM's existing scopo
  facet groups investor + buyer-investment leads together.
- Add `tipo === "investitore"` dispatch in `POST()` next to the existing
  `if (body.tipo === "buyer")` / `if (body.tipo === "valutazione")` branches.
- Recap email rows (reuse `RECAP`/`recapHtml`): [Budget, budget band], [Scopo, "Investimento /
  rendita"], [Zone, zone], plus a literal "ROI atteso" / "Orizzonte" row (add two keys to RECAP
  it/en/de, or pass them via the generic message row). Keep it consistent with existing recaps.

### C.4 Field-name discipline (the one rule that breaks silently if ignored)

`tipo_richiesta`, `scopo`, `condizioni`, `motivo`, `stato`, `flag_test` are singleSelect →
typecast safely adds options. `budget_min_eur`/`budget_max_eur` are numeric. `zona_interesse_norm`
is multipleSelects (array). `immobile` is a *link* field — only the property forms write it (by
`tsv_prop_id`); the three profile forms (buyer/seller/investor) never link a property. Writing a
non-existent column name is a **silent no-op under typecast** — that's the trap; this spec lists
only names already present in `route.ts`.

---

## D. TSV ↔ TSI TRIANGULATIONS

### D.1 Doable NOW (no new infra; mostly copy/links + the one new handler)

1. **One CRM, brand-tagged.** Every TSI lead already carries `azienda="TriesteImmobiliare"`,
   `canale="Sito TriesteImmobiliare"`. The investor handler keeps the same tags. Result: a single
   Airtable view filtered by `azienda` shows TSI leads next to TSV/FriuliVillas with identical
   field shapes → existing CRM dashboards, digests and the WHT recap "just work" with zero new wiring.
2. **Shared PROPRIETA DB by `pubblicato_su`.** Both sites read base `app1ZDay9vQNU5V2u` /
   `tblwAUWPnX7KF8FhU`. A unit appears on TSI vs TSV purely by whether `pubblicato_su` contains
   `triesteimmobiliare.com` (+ `tsv_com_online=TRUE`). No data duplication; one source of truth.
   The off-market teaser cards can be **derived** from PROPRIETA rows flagged off-market with all
   identifying fields stripped at render time (or hand-authored if no flag exists yet).
3. **Cross-brand routing in copy + links (the "entra dalla porta giusta" map):**
   - Luxury seller / value > ~€500k → **TriesteVillas** (flag via `motivo` + `destinatario_interno`
     for hand-off).
   - Resto del FVG (Grado, Udine, Tarvisio, Lignano, Sappada) → **FriuliVillas / LignanoVillas**.
   - Locazione / "affitta mentre vendi" → **TriesteAffitti**.
   - Commerciale (locali, attività, terreni, uffici, capannoni, ricettivo) → **TriesteBusiness**.
   These are deep links + copy on home/gruppo/vendi, recovered from the live routing line.
4. **Hand-off flags already in the schema.** `destinatario_interno` ("owners@TSV") + `motivo`
   give the operator a routing instruction without new columns. A TSI lead that turns out luxury
   is re-routed by editing `destinatario_interno` — no integration needed.
5. **Shared Resend recap infra.** `/api/lead` already uses the shared Resend env
   (`RESEND_API_KEY`/`RESEND_FROM`) with localized IT/EN/DE recaps. The investor handler reuses
   the same `sendEmail`/`recapHtml` — zero new email setup.
6. **Shared design tokens/components.** globals.css grammar (kinetic-word, data-reveal, card-cine,
   btn-hero, pill-header) + RangeDual/modal pattern are portable between TSV and TSI → the investor
   modal is a 1-day clone of BuyerLeadModal, not a new build.
7. **`flag_test` discipline shared.** Test submits carry `flag_test="true"` so CRM views can exclude
   them — same convention across both sites.

### D.2 Future ideas (need a decision or new infra — not in this build)

- **Auto-routing rule** (Airtable automation / script): when a TSI valuation lead's `ha_da_vendere`
  parses to value > €500k or zone ∉ Trieste-provincia, auto-set `destinatario_interno` to the right
  brand desk and notify. Today it's manual.
- **Off-market inventory as a real PROPRIETA facet:** add an `off_market` boolean + `yield_lordo`
  numeric to PROPRIETA so teaser cards are generated, not hand-authored. (Schema change → out of
  scope for the no-schema-change build; flag for Martino.)
- **Investor ROI shortlist generator:** a script that, given a profiling lead's budget/ROI/zone,
  queries off-market PROPRIETA and emits the "case study ordered by ROI, all-in costs" the live copy
  promises. High value, but needs the off-market facet above + a costs model.
- **Bi-directional dedup with TSV/Immobiliare.it feeds:** the LEADS table is already fed by
  Gmail/Immobiliare.it; a match rule on email/phone to merge a TSI web lead with an existing
  contact would prevent double-touch. Needs a matching job.
- **Shared SSO/owner-portal tie-in:** TSV has an Owner Portal; an investor who becomes a client could
  be onboarded there. Cross-brand, later.

---

## E. Build checklist (what this spec asks the implementers to add)

- [ ] `/investimenti` page (narrative B.2, teaser wall B.3) — IT/EN/DE.
- [ ] `InvestorLeadModal.tsx` (clone BuyerLeadModal; fields B.4; two entry modes).
- [ ] New `handleInvestitore` in `src/app/api/lead/route.ts` + `tipo:"investitore"` dispatch
      (mapping C.3; canonical Sets for `roiAtteso`/`orizzonte`/`modalita`; reuse helpers).
- [ ] Two RECAP keys (ROI atteso / Orizzonte) in it/en/de, or fold into message row.
- [ ] `/vendi` rebuilt to the A.1 stage order with the process timeline (A.3) and all 14 blocks.
- [ ] Cross-brand deep links (D.1.3) on home/vendi/gruppo.
- [ ] Accuracy guardrails (A.5): promo nuance + soft marketing figure.
- [ ] i18n strings for all new copy in messages/{it,en,de}.json under `investitoreForm` + `invest`.
```
