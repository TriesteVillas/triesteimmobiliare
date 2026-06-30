# TriesteImmobiliare Relaunch — Fact Cross-Check Audit

> Role: Fact Cross-Check Auditor. Every factual claim the relaunch will make, verified against
> the live-site source (`docs/livesite/{home,vendi,gruppo}.txt`), the brief (`docs/RELAUNCH_BRIEF.md`),
> the current draft copy (`messages/{it,en,de}.json`), and the lead API (`src/app/api/lead/route.ts`).
> Authored 2026-06-30. External checks via WebSearch where noted; legal data corroborated against
> the Chamber-of-Commerce footprint.

## Status legend
- **verified** — claim is supported by a primary source we control (live site or brief) and/or corroborated externally; ship as-is.
- **needs-softening** — claim is plausible but the exact figure/wording is not independently verifiable, or the draft overstates the live source; reword to a defensible form.
- **unverifiable** — could not corroborate; do not assert until a source is supplied.
- **contradiction** — the draft (`it/en/de.json`) says something that conflicts with the live site / brief. Must be reconciled before launch.

---

## A. THE 0% PROMO — THE SINGLE BIGGEST FACTUAL RISK

The live site is unambiguous: **0% al venditore is a TIME-BOXED PROMO**, not a permanent structural fee model.
The draft `it/en/de.json` reframes it as a **permanent "the buyer pays our commission" arrangement.**
These are materially different claims (one is a limited-time offer; the other is a standing fee structure that
also has regulatory/disclosure implications). This is the #1 must-fix.

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| A1 | "0% al venditore" framed as a **permanent** model: *"La nostra provvigione è a carico della parte acquirente"* (it.json `sell.channel.text`) / *"Our commission is paid by the buyer's side"* (en) / *"Unsere Provision trägt die Käuferseite"* (de) | **contradiction** | Live home L17–18: *"0% al venditore … Promozionalmente, mandati firmati entro Settembre 2026."* Live vendi L24–25: *"Per i mandati firmati entro settembre 2026, il venditore non paga provvigione."* The live site NEVER says the buyer structurally pays; it says the seller doesn't pay **during the promo window.** | Drop "a carico della parte acquirente / paid by the buyer's side / trägt die Käuferseite" everywhere. Use: IT *"Per i mandati firmati entro settembre 2026, il venditore non paga la nostra provvigione."* · EN *"For mandates signed by September 2026, the seller pays no commission to us."* · DE *"Für bis September 2026 unterzeichnete Aufträge zahlt der Verkäufer keine Provision an uns."* Always carry the **September 2026** time-box wherever 0% appears. |
| A2 | "Provvigione 0% per chi vende" used as a permanent headline (it.json `home.beyond.publicLabel`, `sell.title`, `sell.channel.title`, meta description; same in en/de) with **no time-box** | **needs-softening** | Live site always pairs 0% with the promo caveat (home L18, vendi L25). Draft drops the caveat in the headline and meta. | Keep "0% al venditore" as the hook, but the **first body line under any 0% headline must state the window.** Meta description: *"…0% al venditore sui mandati firmati entro settembre 2026…"*. Never let a standalone "Provvigione 0%" claim ship without the date in the same viewport. |
| A3 | Promo window = "entro settembre 2026" | **verified** | Live home L18, live vendi L25, brief §3/§8/§0. Consistent across all three sources. | Use literally: IT "entro settembre 2026", EN "by September 2026", DE "bis September 2026". Note for maintenance: this is a **dated promo** — add a `// promo expiry` marker so it can be pulled/extended after Sept 2026. |
| A4 | Buy-back incentive: *"Se vendi e ricompri con noi → 25% di sconto sulla provvigione d'acquisto"* | **verified** | Live vendi L25: *"Se vendi e ricompri con noi, hai anche il 25% di sconto sulla provvigione d'acquisto."* Brief §3. **Note:** this claim is on the live `vendi` page but NOT on the live `home`; it is also **absent from the current draft it/en/de.json entirely.** | Recover it onto `/vendi` (and optionally the home seller block). Exact: IT *"Se vendi e ricompri con noi, il 25% di sconto sulla provvigione d'acquisto."* The "provvigione d'acquisto" wording implicitly confirms the buyer normally pays a purchase-side commission — keep A1's framing consistent with this (promo waives the **seller** side; buyer-side commission still exists and is what the 25% discounts). |

---

## B. SPEED / PROCESS PROMISES

The live **home** and live **vendi** pages disagree with each other on the exact numbers. The draft must not invent a third version.

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| B1 | "Valutazione in 24h" (brief §3 headline strip; live home L17) | **needs-softening** | Live **home** L17/L27: sopralluogo **entro 24h**. Live **vendi** L18/L22: *"valutazione entro 48h … primo contatto entro 24 [ore]."* So "24h" on the home = the **on-site visit**, while the **written valuation** is 48h per the vendi page. The brief's strip ("Valutazione in 24h") conflates them. | Disambiguate, don't merge. Recommended strip: *"Primo contatto in 24h · Sopralluogo entro 24h · Online entro 7 giorni · Mandato 3 mesi · 0% al venditore (entro set. 2026)."* If a single "valutazione" number is needed, use **48h** (the cautious live-vendi figure), not 24h. Do not state "valutazione in 24h" as a flat promise — it's contradicted by the agency's own vendi page. |
| B2 | "Online entro 7 giorni" | **verified** (conditional) | Live home L27 and vendi L22 both say it, but **conditioned**: *"Se documenti e situazione dell'immobile lo consentono."* | Always keep the condition attached: *"online entro 7 giorni, se i documenti lo consentono."* Never as an unconditional guarantee. |
| B3 | "Mandato 3 mesi · no tacito rinnovo · nessun costo nascosto" | **verified** | Live home L31, vendi L27. | Ship as-is. |
| B4 | "Se non rinnovi, ti regaliamo il materiale" / material stays yours | **verified** | Live home L31, vendi L28. | Ship as-is (IT witty register is fine: *"se non rinnovi, il materiale resta tuo."*). |
| B5 | "Foto, video, drone, tour 3D inclusi" | **verified** | Live home L31, vendi L33–34. | Ship as-is. |

---

## C. CHECK-UP / APE / LIFTING / "INVESTMENT PARTICIPATION"

These are the most legally loaded operational promises (money advanced, co-investment). The draft `it/en/de.json`
currently **omits all of them** — so there is no draft contradiction, but the recovered wording must be ported carefully.

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| C1 | Check-up pre-vendita: *"anticipiamo il 50% del costo del controllo e, se manca, anche il costo dell'APE"* | **verified** (commitment — keep conditional) | Live home L39, vendi L31. Identical wording on both live pages. | Port verbatim with the conditional intact: *"possiamo attivare un check documentale con tecnici esterni, anticipare il 50% del costo del controllo e, se manca, anche il costo dell'APE."* Keep "**possiamo … anticipare**" (we *can* advance), not "anticipiamo sempre" — it's an option, not an unconditional guarantee. **Flag for Martino:** confirm this offer is still live (it commits real money per lead). |
| C2 | Lifting pre-vendita: *"Potremmo essere partecipi all'investimento"* | **verified** (deliberately soft — keep it soft) | Live home L47, vendi L50. | Keep the conditional **"potremmo"**: *"valutare insieme se un piccolo lifting pre-vendita abbia senso. Potremmo essere partecipi all'investimento."* Do NOT upgrade to "partecipiamo / we co-invest" — the live site hedges on purpose. Co-investment is a per-case judgement, not a standing offer. |
| C3 | "architetto + artigiani / impresa per preventivi" | **verified** | Live home L47, vendi L50. | Ship as-is. |

---

## D. MARKETING / SOCIAL STATS — HIGHEST EXTERNAL-VERIFICATION RISK

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| D1 | "TriesteVillas è l'agenzia con più follower sui social" | **needs-softening** | Asserted on live home L35. No independent corroboration found. Public FB page shows **~6,459 likes** (WebSearch, facebook.com/triestevillas) — a normal local-agency figure, not a market-leading "most followers" claim on its face. | Soften to a defensible, non-superlative form: *"Tra le agenzie immobiliari di Trieste più seguite sui social"* / EN *"one of the most-followed Trieste agencies on social"*. Drop the absolute superlative "**l'agenzia con più follower**" unless Martino can produce a ranked source. |
| D2 | "2 milioni di visualizzazioni YouTube … solo nello scorso anno" | **needs-softening** | Live home L35; brief §3/§8 explicitly flags ⚠️ cross-check. The TSV YouTube channel exists (youtube.com/channel/UCzc3f3DvatJUrGhvqdP0HeQ) but the public about/stats page is consent-gated; **the exact 2M figure could not be independently confirmed.** "Views" (visualizzazioni) ≠ followers — the figure is plausible as cumulative content views but unproven. | Either (a) keep the number ONLY if Martino confirms it from YouTube Studio analytics, OR (b) soften per brief §8 to *"milioni di visualizzazioni sui nostri contenuti nell'ultimo anno"* with no precise count. Always say **"visualizzazioni"** (views), never "follower/iscritti" — don't conflate the two. |
| D3 | "5.6 milioni su Facebook solo nello scorso anno" | **needs-softening** | Live home L35; brief flags ⚠️. Independent FB data found is **~6,459 page likes** — i.e. the 5.6M is clearly a **content-reach / views** figure, NOT a follower count, and is unverifiable from outside. | Same treatment as D2. Label it precisely as **reach/visualizzazioni** ("5,6 milioni di visualizzazioni su Facebook"), never as followers. If unconfirmed, fold into *"milioni di visualizzazioni"* and drop the decimal precision (a precise "5.6M" reads as audited when it isn't). **Recommended safe combined line:** *"Marketing del gruppo capogruppo: milioni di visualizzazioni l'anno su YouTube e Facebook. TriesteImmobiliare, pur non trattando Luxury, non merita di meno."* |
| D4 | "TriesteImmobiliare, pur non trattando Luxury, non merita di meno" | **verified** | Live home L35. Pure positioning, no factual claim. | Ship as-is — it's the brand's own line and on-tone. |

---

## E. INVESTOR / OFF-MARKET FUNNEL CLAIMS

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| E1 | "≥20 already-rented investment units, €200–400k, in very central recently-renovated buildings, that cannot be advertised" | **unverifiable** (internal — do not publish as a number) | Brief §0.2 only. **Not on the live site, not in any external source.** This is an internal inventory fact. | Do NOT publish "20 units" or "€200–400k" as a hard public claim — it's an internal figure and naming a count/price invites scrutiny we can't back. Keep the public copy curiosity-led and qualitative: *"Disponiamo di immobili a reddito, in palazzi centrali ristrutturati, che non pubblichiamo: li raccontiamo solo a chi profiliamo."* Let the lead form capture budget/ROI; reveal specifics 1:1. |
| E2 | "Ricerca per utile netto / ROI → case study con opzioni ordinate per ROI, costi all-inclusive d'acquisto" | **verified** | Live home L76–77. | Ship as-is — it's a process description, not a yield promise. **Crucially: do NOT attach a specific % yield/ROI figure anywhere** (the live site wisely never does). |
| E3 | "Vendita riservata / discreta tramite canale riservato" (brief renames TSV's "Private Collection" to "vendita riservata") | **needs-softening** | Live **vendi** L37 literally says *"vendita discreta tramite **Private Collection**"* — i.e. the live site uses the TSV term. Brief §3 instructs TSI to call it "vendita riservata" instead. | Follow the brief: use **"vendita riservata"** on TSI, not "Private Collection" (that's TSV's gated brand). This is a deliberate divergence from the live wording — correct, not an error. Just don't claim TSI has a "Private Collection" product. |

---

## F. CONTACTS

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| F1 | Email `info@triesteimmobiliare.com` | **verified** | Live home/vendi/gruppo footers (L108/L65/L58); it.json `contact.email`; lead API `NOTIFY_EMAIL` default. Consistent everywhere. | Ship as-is. |
| F2 | Phone `040 2473628` | **verified** | Live footers; it.json `contact.phone`; lead API recap copy. Externally, ufficiocamerale lists 0402473628 for the group. | UI display **without +39** (KB rule) → "040 2473628". `tel:` links may use `+390402473628`. Lead API already uses "+39 040 2473628" in EN/DE recap text — acceptable in body prose. |
| F3 | Address `Via Torino 34, 2° piano, Trieste · solo su appuntamento` | **verified** | Live footers L107/L64/L57; it.json `contact.office`. | Ship as-is. **Note the split with legal HQ:** the *operational/visiting* address is Via Torino 34; the *registered legal seat* is Via Milano 5 (see G2). Keep them distinct — don't merge. |
| F4 | Facebook as the (only) named social channel in footer | **verified** | Live footers list only "Facebook". | Fine to keep Facebook; if adding YouTube/Instagram, confirm handles first (TSV IG is @triestevillas; a TSI-specific handle is unconfirmed — don't invent one). |

---

## G. LEGAL / COMPANY DATA

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| G1 | "Powered by TriesteVillas – P.IVA 01235580329" | **verified** | Live footers (all 3 pages); it.json `group.legal.vat`; **externally corroborated** (ufficiocamerale / camcom VG agency list: TRIESTEVILLAS S.R.L., P.IVA 01235580329, REA TS 134793, Via Milano 5, 34132 Trieste). | Ship as-is. |
| G2 | "TriesteVillas srl · Via Milano 5, 34132 Trieste · REA TS 134793 · cap. 10.200 € i.v." | **verified** | it.json `group.legal.*` + brief §8; externally corroborated for company name, P.IVA, REA, and Via Milano 5 address. Share capital 10.200 € is in the draft/brief; external source confirmed the company but did not surface the capital figure — **plausible and self-consistent, treat as verified from internal records.** | Ship as-is. Keep the legal seat (Via Milano 5) distinct from the operational address (Via Torino 34). |
| G3 | PEC `milou@pec.emailc.it` | **verified** (with context) | Brief §8; it.json `group.legal.pec`. External note: the Chamber record surfaces a historical name **"MILOU SAS DI DAVIDE CARLIN"** — i.e. the PEC's "milou" stem traces to the company's prior denomination before becoming TriesteVillas srl. Internally consistent, not an error. | Ship as-is. (Optional: this confirms Davide Carlin as the historical principal — supports the team claim G/H below.) |
| G4 | "Cap. sociale 10.200,00 € i.v." precision | **needs-softening** (verify before printing) | Internal only; not independently confirmed. | Low-risk, but since it's a printed legal figure, have Martino confirm against the visura before launch. If unconfirmed, it's safe to omit the capital line entirely (not legally required on a website). |

---

## H. THE GROUP — 6 BRANDS

The brief and live `gruppo` page list **6 brands incl. TriesteBusiness**; the current draft `it/en/de.json`
lists only **5** (TriesteBusiness is MISSING). That's the second contradiction to fix.

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| H1 | The group has **6** brands, including **TriesteBusiness** | **contradiction** | Live **home** L99 and live **gruppo** L43–44 both describe **TriesteBusiness** ("Locali commerciali, attività, terreni, palazzi, uffici, capannoni/strutture ricettive"). Brief §2 lists 6. BUT it.json `group.brands` defines only 5 (tsv, tsi, affitti, friuli, lignano) and `group.groupTitle` literally says *"**Cinque** brand, un'unica regia"* (en: "Five brands", de: "Fünf Marken" — verify). | Add the 6th brand. Change "Cinque brand" → **"Sei brand, un'unica regia"** (EN "Six brands", DE "Sechs Marken"). Add `group.brands.business = { name: "TriesteBusiness", desc: "Locali commerciali, attività, terreni, palazzi, uffici, capannoni, strutture ricettive." }`. **TriesteBusiness is a real, live brand on the current site — confirmed.** |
| H2 | TriesteVillas = capogruppo / premium-luxury Trieste + marketing & back-office hub | **verified** | Live gruppo L25, L34; brief §2. | Ship as-is. |
| H3 | TriesteAffitti = locazioni 1–18 mesi, "nato 2013 turistico, evoluto" | **verified** | Live gruppo L38: *"Nati nel 2013 per affitti turistici, evoluti…"* Brief §2. **Note draft mismatch:** it.json `home`/footer taglines describe affitti as "da 1 a 18 mesi" (brief §2) but the live home L94 caps it at *"Affitti fino a 1.500€/mese. Oltre, ci pensa TriesteVillas."* — a price cap, not a duration. | Keep both facts but don't conflate: duration **1–18 mesi** (brief) AND the routing rule **"fino a 1.500 €/mese; oltre → TriesteVillas"** (live home L94). Both are true and serve different purposes. |
| H4 | FriuliVillas = premium nel resto del FVG (Grado, Udine, Tarvisio, Lignano, Sappada) | **verified** | Live home L97; brief §2. | Ship as-is. **Minor draft weakness:** it.json `group.brands.friuli.desc` = "Il resto del Friuli-Venezia Giulia" — thin vs the live geographic list. Recommend recovering the city list. |
| H5 | LignanoVillas = compravendite premium a Lignano, taglio internazionale | **verified** | Live home L103, gruppo L46–47; brief §2. | Ship as-is. **Draft weakness:** it.json `group.brands.lignano.desc` = "Il verticale locale del lusso a Lignano" — acceptable but recover the "semplici per compratori e proprietari esteri" angle (live home L103). |
| H6 | TSI perimeter = "residenziale Trieste e Provincia fino a ~500.000 €" | **verified** | Live gruppo L28/L31, live home L84; brief §0. Consistent. | Ship as-is. Use **"fino a circa 500.000 €"** (the live "circa" hedge matters — it's not a hard ceiling). |
| H7 | Routing copy: Lusso→TSV · resto FVG→FriuliVillas/LignanoVillas · affitti→TriesteAffitti · business→TriesteBusiness | **verified** | Live home L23 (covers TSV/FriuliVillas/LignanoVillas/TriesteAffitti); TriesteBusiness routing is brief §2 (live home L23 omits business in the inline routing line but the brand block L99 exists). | Ship the full 4-way routing incl. business. Note: the live inline routing sentence (home L23) does NOT mention business — adding it is an improvement, not a contradiction. |

---

## I. TEAM

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| I1 | Davide Carlin — Agente · Titolare e Amministratore | **verified** | it.json `group.team.carlin`; brief §8; externally supported by the Chamber record "MILOU SAS DI DAVIDE CARLIN" (Carlin = historical principal of the company now TriesteVillas srl). | Ship as-is. |
| I2 | Martino Coppola di Canzano — Socio · Sviluppo del gruppo | **verified** | it.json `group.team.martino`; brief §8. (Self-consistent; Martino is the operator.) | Ship as-is. |
| I3 | Giada Comelli — Agente · Affitti | **verified** | it.json `group.team.giada`; brief §8. | Ship as-is. |
| I4 | Cécile Van der Salm — Agente · Affitti | **verified** | it.json `group.team.cecile`; brief §8. | Ship as-is. |

---

## J. SECONDARY DRAFT-vs-LIVE / DRAFT-vs-BRIEF MISMATCHES (lower stakes, still fix)

| # | CLAIM | STATUS | EVIDENCE | RECOMMENDED WORDING |
|---|---|---|---|---|
| J1 | it.json `group.groupTitle` = "Cinque brand" | **contradiction** | See H1. | "Sei brand, un'unica regia." |
| J2 | Draft hero (it.json `home.heroTitle/Subtitle`) = generic "agenzia smart … in modo semplice" with no 0%-promo time-box, no speed strip | **needs-softening** | Live home leads with the promise strip (L17) + the spin-off positioning (L19). Draft is thinner and drops the time-box. | Recover the live promise strip + "Spin-off del Gruppo TriesteVillas, dedicato a ciò che non è Luxury" (live home L19) into the hero region. Brief §3 wants this. |
| J3 | it.json `footer.tagline` / `home` = "L'agenzia smart per la casa a Trieste" | **needs-softening** | "smart" is generic LLM-real-estate filler that Martino explicitly dislikes (CLAUDE.md §1, brief §3 tone). Not on the live site. | Replace with a concrete line from the live site, e.g. *"Lo spin-off TriesteVillas per il residenziale di Trieste e provincia."* Avoid "smart". |
| J4 | it.json `group.story` invents a narrative ("L'inizio nell'hospitality di pregio", "pivot alle compravendite") | **needs-softening** | This pivot story is broadly true (matches KB `gruppo.md` / TSV history) but is NOT on the live `gruppo` page — the live page's story is "specializzazione / ecosistema", not "hospitality origin". Risk: asserting a specific origin narrative the public page doesn't make. | Either align to the live page's "ecosistema costruito per specializzazione" framing (live gruppo L18–29), or keep the pivot story only if it matches KB facts. Don't invent dates/sequence. The TriesteAffitti "2013 turistico" origin (live gruppo L38) IS safe to cite. |
| J5 | Live "Affitta mentre vendi" → temporary income via TriesteAffitti | **verified** | Live home L57. Absent from draft. | Recover onto /vendi (brief §3). Ship live wording. |
| J6 | "Specialisti in acquirenti esteri … house tour half/full-day in auto" / "Trieste non va solo mostrata. Va spiegata." | **verified** | Live home L43, vendi L52–53. Absent from draft. | Recover. Ship live wording (it's on-tone and concrete). |
| J7 | "Visite concentrate in un solo giorno a settimana, fascia concordata" | **verified** | Live home L50, vendi L40/L56. | Recover onto /vendi. Ship as-is. |

---

## SUMMARY — MUST-FIX BEFORE LAUNCH (ranked)

1. **A1/A2 (contradiction):** Strip the permanent *"provvigione a carico dell'acquirente / buyer pays our commission / Käuferseite trägt"* framing from it/en/de `sell.channel`. 0% is a **promo until September 2026**, full stop.
2. **A2/A3:** Every 0% headline must carry the **September 2026** time-box in the same viewport. Add to meta descriptions too.
3. **A4 (missing):** Recover the **25% buy-back discount** (sell + rebuy → 25% off the purchase-side commission) — present on live `vendi`, absent from all draft JSON.
4. **H1/J1 (contradiction):** Add the **6th brand TriesteBusiness** and change "Cinque/Five/Fünf brand" → "Sei/Six/Sechs". TriesteBusiness is confirmed real on the live site.
5. **D1–D3 (needs-softening):** Reframe social stats as **"visualizzazioni/reach"** not followers; drop the "**l'agenzia con più follower**" superlative and the precise "5.6M/2M" unless Martino confirms from analytics — external data shows only ~6,459 FB likes.
6. **B1 (needs-softening):** Don't promise "valutazione in 24h" — the agency's own vendi page says 48h. Disambiguate: contatto 24h / sopralluogo 24h / **valutazione 48h** / online 7gg (conditional).
7. **C1 (verify + keep conditional):** "Anticipiamo il 50% del controllo + costo APE" commits real money — keep the "**possiamo**" conditional and have Martino confirm it's still offered.
8. **C2 (keep soft):** Lifting co-investment stays **"potremmo essere partecipi"** — never upgrade to a firm "co-investiamo".
9. **E1 (do not publish):** Keep the off-market "≥20 units / €200–400k" figure **internal** — public copy stays qualitative/curiosity-led. Never attach a specific ROI % anywhere (E2).
10. **E3:** On TSI, call discreet sales **"vendita riservata"**, not "Private Collection" (that's TSV's gated brand).
11. **G4 (verify):** Confirm share capital "10.200 €" against the visura before printing it (or omit — not legally required).
12. **J2/J3 (tone):** Recover the live hero promise strip + spin-off line; kill the generic "agenzia smart" filler Martino dislikes.

### External-verification status
- **Verified externally:** company name TRIESTEVILLAS S.R.L., P.IVA/C.F. 01235580329, REA TS 134793, Via Milano 5 34132 Trieste, historical name "Milou Sas di Davide Carlin" (→ confirms PEC stem + Davide Carlin as principal). Phone 0402473628.
- **Could NOT corroborate (treat as needs-softening):** "2M YouTube views", "5.6M Facebook", "agenzia con più follower". Public FB page shows ~6,459 likes; YouTube stats consent-gated. These must be softened or sourced from the agency's own analytics before publishing as precise figures.
- **Internal-only (no public source — do not publish as hard numbers):** off-market "≥20 units / €200–400k"; share capital 10.200 € (printed-legal, verify against visura).
