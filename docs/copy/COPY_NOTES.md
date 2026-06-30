# TSI Copy Deck — Notes for EN/DE translators + implementer

`it.json` is the **MASTER**. EN (`en.json`) and DE (`de.json`) mirror it **key-for-key**:
same nesting, same key names, only values translated. Do not add/remove/rename keys per locale —
next-intl resolves by key path and a missing key throws.

## Voice (carry into EN/DE)
- Concrete, confident, plain, lightly witty. NO generic real-estate filler.
- Every claim TRUE. Marketing stats softened to "milioni di visualizzazioni" (no hard 2M/5.6M) — keep soft.
- EN = clear British-leaning professional. DE = sachlich, präzise, kein Werbe-Geschwätz; "Sie"-Form.
- Keep promo nuance **everywhere it appears**: "0% al venditore" is time-boxed to **mandati firmati entro settembre 2026**, and the **25% buy-back** (sconto provvigione d'acquisto se vendi+ricompri). Don't drop the date or the 25%.
- Numbers fixed across locales: 24h, 7 giorni, 3 mesi, ~500.000 €, 200.000–400.000 €, 50% costo controllo, APE, oltre 20 unità, 25%.

## Top-level namespaces
`nav · seo · home · sell · invest · immobili · zones · listing · property · group · contact · lead · buyerForm · sellerForm · investorForm · footer · meta`

`zones`, `listing`, `property`, `lead`, `buyerForm`, `sellerForm`, `meta` were **pre-existing** — kept compatible
(only `property.badgePrivate` reworded "Private Collection" → "Vendita riservata", and `sellerForm.title` shortened
+ new `sellerForm.hasToBuy*` added). Don't break component keys already wired.

## What each namespace drives (implementer)
- **nav** — header links + `ctaValuation` button. New routes: `invest` (/investimenti).
- **seo** — per-page title/description/og (home, sell, invest, properties, group, contact). `meta` is the root fallback. Use these in each page's `generateMetadata`.
- **home** — sections in render order:
  `hero` (eyebrow + titleLine1 + **titleKinetic** [animate this word/phrase] + titleLine2 + subtitle + 2 CTAs + scrollHint)
  → `promiseStrip` (4 pills: valuation/online/mandate/fee + `promoNote`)
  → `positioning` (title + body + `routingNote` + cta)
  → `featured` (listings reel; `empty` fallback)
  → `sellerValue` (4 cards: fast / zeroFee / simpleMandate / marketing + cta)
  → `investorTeaser` (block + cta)
  → `groupRouting` (4 routing lines: luxury/fvg/rent/business + cta)
  → `valuationCta` (final seller CTA, 2 buttons).
- **sell** (/vendi) — `hero` (2 CTAs) → `blocks.*` (14 discrete blocks: velocita, zeroProvvigione [has `promoBadge`+`buybackBadge`], mandatoSemplice, checkup [cta], materiale [cta], liftingPreVendita, ownerJourney, primaVendiPoiCerca [cta], affittaMentreVendi [cta], acquirentiEsteri [+`quote` pull-quote + cta], houseTour, venditaRiservata, forzaDelGruppo) → `process.steps.*` (5 numbered: call/docs/online/visits/deal, each `n`+title+text) → `closing` (2 CTAs). Render blocks as cards/alternating sections; some carry their own CTA.
- **invest** (/investimenti) — `hero` → `narrative` (perché Trieste + income sub-block) → `ricercaLibera` + `ricercaROI` (two-up) → `teaser` (off-market, has `disclaimer`) → `howItWorks.steps.*` (4 numbered) → `cta` (2 buttons). Funnel target = investorForm.
- **immobili** — listing index intro + `buyerHelp` block (Ricerca libera CTA → buyerForm).
- **group** (/gruppo) — `title`="Brand diversi, una regia sola" → `ecosystem` (intro + tagline) → `brands.*` (6: tsv/tsi/affitti/friuli/business/lignano, each name+**tag**[chip]+desc) → `story.*` (start/pivot/today) → `values.*` (4) → `team.*` (4 people) → `cta*` (2 buttons) → `legal.*` (exact legal data from brief).
- **contact** (/contatti) — labels + values (info@triesteimmobiliare.com · 040 2473628 · Via Torino 34 2° piano · su appuntamento · Facebook).
- **lead / buyerForm / sellerForm / investorForm** — modal/form copy. Option objects (`*Options`) are index-keyed ("0","1",…) — keep order, map to `<option>` by index.
- **footer** — tagline, link group titles, legal/privacy/cookie links, appointment note.

## investorForm → CRM (no schema changes, brief §5)
Map to existing LEADS fields by NAME, typecast:true. Suggested:
- `tipo_richiesta`="Investimento", `scopo`="Investimento / rendita", `canale`="Sito TriesteImmobiliare", `azienda`="TriesteImmobiliare".
- `budget_min_eur`/`budget_max_eur`/`budget` from `budget` select; `zona_interesse_norm`/`zone_preferite` from `zones`.
- `motivo` = "Investitore sito: ROI atteso {roi} · orizzonte {horizon} · scopo {purpose}".
- `messaggio` = free `notes`. `lingua` = locale. `privacy_ok` from privacy checkbox.
sellerForm new `hasToBuy` → fold into `ha_da_vendere`/`messaggio` (signals the 25% buy-back path).

## Kinetic / motion hooks
`home.hero.titleKinetic` is the animated phrase (globals.css `kinetic-word`). Numbers in `promiseStrip` can data-reveal. Keep TSI light/nautical, calmer than TSV.
