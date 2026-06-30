# TriesteImmobiliare.com — Creative Direction & Section-by-Section Design Spec

> Authored 2026-06-30 for the `feat/tsi-relaunch` rebuild. Companion to `docs/RELAUNCH_BRIEF.md`
> (mission, recovered copy, CRM wiring) and `messages/{it,en,de}.json` (copy keys).
> **Audience: a senior Next.js 16 / Tailwind v4 / next-intl dev who builds straight from this.**
> Every motion class, gradient and copy block below already exists in the repo or is specified
> exactly. Nothing here invents a new design language — it composes the `globals.css` grammar
> we already have into a confident, light, nautical site.

---

## 0. The one-second test

When the page loads, a returning TSV visitor must think **"same agency, calmer water."**
TSV = dark cinema, gold, video that scrubs under your scroll. TSI = **white paper, four-tone
nautical blues, a paper boat, motion that glides instead of looms.** Same craft, less premium —
restraint, not cheapness. We earn that read with three things, in order: (1) the real origami
**paper-boat** mark, used confidently and large; (2) a **light hero** with a kinetic headline over
a soft blue-gradient "sea"; (3) the **0% al venditore** promise stated as a hard, dated fact, not
a slogan. If any section feels like generic-agency stock ("la casa dei tuoi sogni", smiling-couple
hero), it's wrong — kill it.

---

## 1. Art direction system

### 1.1 Palette (already in `globals.css` — do not redefine, just use)

| Token (Tailwind class) | Hex | Role |
|---|---|---|
| `brand` | `#2c6b96` | primary blue — boat mid-tone, CTAs, links, eyebrows |
| `brand-dark` | `#1c4a6b` | navy — dark sections, footer, headings on white |
| `brand-light` | `#6fa1c6` | steel-blue — gradients, timeline line, glows |
| `sand` | `#a9c8e0` | palest boat-blue — accents on dark surfaces (the "light pier" tone) |
| `ink` `#0f2737` / `ink-2` `#16384f` | — | photo overlays, lightbox, rare dark sheets |
| `paper` | `#f5f7f9` | the off-white "paper" band that separates white sections |
| `background` `#ffffff` / `foreground` `#14344a` | — | base page |

**The four boat blues ARE the palette.** The real logo is an origami boat split into four facets:
deep steel-blue (`#1c4a6b`-ish), mid-blue (`#2c6b96`), lighter blue (`#6fa1c6`), palest (`#a9c8e0`),
separated by **white crease lines** (negative space, not strokes). Every gradient, glow and accent
on the site is drawn from those four stops. Crease-white is a design primitive: thin white rules /
gaps to separate blue planes echo the boat's folds.

### 1.2 The "sea & paper" gradient kit

Three named treatments. Use them verbatim; do not improvise new gradients.

- **`grad-paper-sea`** (light hero, light bands): `bg-gradient-to-b from-paper via-white to-white`
  with two blurred radial glows already proven on the current home hero:
  `bg-brand-light/15 blur-3xl` (top-right) + `bg-brand/10 blur-3xl` (left). This is the calm
  "morning harbour" wash — keep it as the default light backdrop.
- **`grad-deep-sea`** (dark sections — "How we work", investor teaser, footer): `bg-brand-dark`
  flat, or `bg-gradient-to-b from-brand to-brand-dark` for hero-style dark bands. Accent text in
  `sand`; body in `white/75`.
- **`grad-crease`** (separators): a 1px white-to-`brand-light/30` hairline or a `paper` band edge.
  Used between two white sections to avoid a flat scroll — the "fold" between paper planes.

**Photographic treatment.** TSI has real listing photos (Airtable covers) but NO hero film (unlike
TSV's `/hero.mp4`). So imagery is **photographic in the listings reel and dossiers, gradient-and-mark
everywhere else.** Where a photo sits on a dark plane (card overlays, group strip hover), apply
`from-ink/60 via-ink/20 to-transparent` bottom-up so white text stays legible. Never full-bleed a
photo behind hero copy — that's TSV's move; TSI's hero is paper + boat + a single kinetic line.

### 1.3 Typography

- Font: **Poppins** (`--font-poppins`, already wired). One family, three weights: 400 body,
  600 eyebrows/labels/nav, 700 display.
- `display-hero` (clamp 2.3→4.1rem) for page H1s. `display-chapter` (clamp 1.6→2.5rem) for section
  H2s. `eyebrow` (0.78rem, 0.22em tracking, uppercase, `brand`) above every section title.
- Body: `text-neutral-600` on white, `text-white/75` on dark. Never pure black — `brand-dark` or
  `neutral-900` for the darkest ink.
- **Number-forward copy.** TSI's whole pitch is concrete numbers (24h, 7gg, 3 mesi, 0%, 25%, 50%,
  ~€500k). Set the four headline promises as a **stat strip** with the number large in `brand` and
  the label small under it — numbers do the persuading.

### 1.4 Motion grammar (reuse ONLY these — all defined in `src/app/globals.css`)

| Class / component | Behaviour | Where |
|---|---|---|
| `.kinetic-line` + `.kinetic-word` (`--word-delay`) | words rise from a mask on load | hero H1s only |
| `[data-reveal]` / `[data-reveal="left"]` / `[data-reveal="scale"]` | fade+rise on scroll-in | section intros, blocks |
| `[data-reveal-stagger]` | children cascade in (90/180/270ms) | grids, lists |
| `.card-cine` (+ `.card-photo`, `.card-sheen`) | listing/photo tile: border warms, photo zooms 1.04, sheen sweep | listing cards, group cards, team |
| `.btn-hero` | filled pill: lifts -1px, blue shadow, press-scale | primary CTAs |
| `.btn-press` | outline pill: lifts on hover, scale on press | secondary CTAs |
| `.pill-header` | light glass (blur 14px, 82% white) | header, carousel arrows, floating chips |
| `.par-zoom` (Scene sets `--p`) | parallax scale on photo heroes | dossier hero only |
| `Scene` (`mode="cover"\|"pin"`, `--p`) | one shared scroll engine → `--p` 0→1 | parallax, pinned scenes |
| `Tilt` (`.tilt-card`/`.tilt-glare`) | 3D tilt + glare on hover, mouse-only | team cards, brand cards |
| `Magnetic` | child drifts to cursor, springs back | hero primary CTA, key buttons |
| `Timeline` | scroll-driven vertical line + dot fill | seller process, group story |
| `.reel-scroll` + `FeaturedCarousel` | snap horizontal scroll + glass arrows | listings reel |
| `.nav-underline` | underline grows L→R on hover | nav, inline links |

**Motion budget (the discipline that makes it "lighter" than TSV):** at most **one kinetic
hero per page**, **no scroll-scrubbed video anywhere**, **no pinned 200vh hero**. Reveals are the
workhorse. `Tilt`/`Magnetic` are seasoning — team grid, brand cards, the single hero CTA. Everything
respects `prefers-reduced-motion` (already handled in globals). The feeling is **glide, not loom**.

### 1.5 Spacing & shape

- Content widths: `max-w-6xl` for reels/grids, `max-w-5xl` for home prose, `max-w-4xl` for
  single-column pages (vendi/gruppo/contatti). Section vertical rhythm: `py-16`→`py-24`.
- Radius: pills fully round (`rounded-full`); cards/panels `rounded-2xl`; the boat motif favours
  **soft, not sharp** — no hard right angles on interactive surfaces.
- Crease rules: `border-neutral-200` hairlines, `divide-neutral-200` for stacked lists.

---

## 2. The paper-boat logo — usage system

The real mark is `~/Downloads/logo_triesteimmobiliare_300x300.png` /
`~/Desktop/LOGHI SITI NUOVI/LOGO TSI.png`: an **origami boat, ~12 facets in 4 blues, divided by
white crease lines**. The current `Logo.tsx` is a **placeholder two-path triangle — REPLACE it.**

### 2.1 Build a faithful multi-tone SVG (`Logo.tsx` rewrite)

- Trace the PNG into a crisp vector: a low hull trapezoid + a tall triangular sail, faceted into
  ~10–12 polygons across the **four** brand blues, with **white crease lines as gaps** (1.5–2px
  in the artwork, scaling with the mark). Target viewBox ~ `0 0 200 130`.
- Two color modes via prop `tone`:
  - **`tone="brand"` (default, light header / light hero):** full 4-tone boat as drawn. Wordmark
    `Trieste` in `neutral-900`, `Immobiliare` in `brand`.
  - **`tone="light"` (dark footer / dark hero lockup):** the boat rendered in **white + `sand`
    two-tone** (keep the crease-folds reading by alternating white / `sand`, NOT a flat white
    silhouette — a flat fill loses the origami). Wordmark all-white.
- Keep the same component API (`tone`, `className`, `markClassName`, `wordClassName`) so Header /
  Footer / hero call sites don't change. Ship the boat as **inline SVG** (theme-able, crisp) — and
  also export a static `/public/logo-tsi.svg` (brand) + `/public/logo-tsi-white.svg` for OG images
  and `next/image` priority use in the hero lockup.

### 2.2 Placement rules

- **Header (light glass pill):** boat `markClassName="h-6 w-auto"` + wordmark `text-base`, `tone="brand"`.
  Already wired in `Header.tsx` — just inherits the new SVG.
- **Hero lockup (home):** boat larger — `h-10` to `h-12` — set ABOVE the kinetic H1 as a confident
  "flag". On the light hero use `tone="brand"`. Give it a faint `drop-shadow` only if it sits over a
  glow. This is the one place the boat is hero-sized.
- **Footer (dark navy):** `tone="light"`, default size. The white+sand boat reads as a small "night
  harbour" mark. Already wired.
- **Favicon / OG:** export the boat-only mark (no wordmark) at 512px for `app/icon` and a 1200×630
  OG card (boat + wordmark on `grad-paper-sea`, or white-on-`brand-dark`).
- **Watermark / loading:** a single pale `brand-light/10` boat outline may sit as a giant background
  motif behind ONE section max (e.g. investor teaser) — subtle, `aria-hidden`, never behind text it
  would fight.

---

## 3. The TSI hero concept — "Calm harbour"

**Distinct from TSV's dark cinema by construction.** No video, no pin, no veil. Instead:

- **Backdrop:** `grad-paper-sea` (paper→white) + the two blurred radial glows (top-right
  `brand-light/15`, left `brand/10`). Optionally one very faint, large, `aria-hidden` boat-outline
  or a thin horizon hairline (`grad-crease`) low in the hero to suggest a waterline — restrained.
- **Lockup:** paper-boat mark `h-10/12` as a flag, then the **kinetic H1** using `.kinetic-line` /
  `.kinetic-word` with staggered `--word-delay` (150 + i·70ms), in `brand-dark`. Headline carries the
  positioning, not a tagline: e.g. **IT** "La casa giusta a Trieste, senza la parte complicata." /
  **EN** "The right home in Trieste — minus the hard part." / **DE** "Das richtige Zuhause in Triest,
  ohne den schwierigen Teil." (final copy in §6 / messages).
- **Sub:** one `data-reveal` line — the TSI positioning recovered from live: *spin-off non-luxury del
  Gruppo TriesteVillas, rapidi ed efficienti, stessa qualità di promozione.*
- **Two CTAs (Magnetic on the primary):**
  - Primary `.btn-hero` filled `brand`: **"Richiedi una valutazione"** → opens `SellerCta`
    (acquisition is job #1, so the hero's loud button is the seller one).
  - Secondary `.btn-press` outline: **"Sfoglia gli immobili"** → `Link href="/immobili"`.
- **Immediately under the hero, NOT inside it: the promise stat-strip** (see §5 Home, section 2) —
  this is the conversion engine and must be the first thing below the fold.

Why this beats a photo hero: TSI's credibility is **process + numbers + the group**, not a single
glamour shot (that's TSV). A clean paper hero + a hard promise strip says "efficient, honest, fast"
in one screen — exactly the brand.

---

## 4. Components to PORT from `triestevillas-web` (and how to adapt to the light skin)

| TSV component | Port? | Light-skin adaptation |
|---|---|---|
| `Marquee.tsx` + `.marquee*` CSS | **YES** | Copy `Marquee.tsx` verbatim. Port the CSS but recolor: `.marquee-item` color `#2c6b96` (was sand-gold `#cfb795`), `.marquee-dot` `rgba(44,107,150,0.5)`, use the boat `◆`. Use it as the **promise marquee** ("Valutazione 24h ◆ Online 7 giorni ◆ Mandato 3 mesi ◆ 0% al venditore") — an infinite, hover-pausable strip. |
| `Timeline.tsx` | **Already in TSI** | Reuse as-is for the **seller process** and the **group story**. It already uses `brand-light` for the line — on-brand. |
| `FeaturedCarousel.tsx` | **Already in TSI** | Reuse for the listings reel. Arrows already use `.pill-header` (light glass) — good. |
| `ProjectsShowcase.tsx` | **YES, repurpose** | Becomes the **6-brand ecosystem strip**: same `aspect-[3/4]` rounded cards + `data-reveal-stagger`, but cards carry **brand logos + one-line role** instead of project covers; `kind: external` links out to the live sibling sites, `soon` for not-yet-live ones. Swap `bg-ink-2` → `bg-brand-dark`/`bg-paper` per card; overlay `from-brand-dark/70`. |
| `YouTubeShowcase.tsx` | **Adapt (lightweight)** | The "Il massimo del marketing" proof block links to TSV's channel. Either port a slim 2–3 thumbnail version OR a single stat card + "Canale YouTube ↗" button. Keep it light — this is proof, not a media wall. Recolor section to `grad-deep-sea` or keep white with `brand` accents. |
| `HeroCinema.tsx` | **NO** | TSI hero is light/static (§3). Do not port the pinned video hero. |
| `ScrollVideo.tsx` / `LoopVideo` | **NO** | No hero film for TSI. Skip. |
| `Tilt` / `Magnetic` / `Scene` | **Already in TSI** | Reuse. Tilt on team + brand cards; Magnetic on hero primary CTA; Scene only for the dossier `par-zoom`. |
| `BuyerCta` / `SellerCta` / their modals / `LeadForm` / `VisitForm` | **Already in TSI** | Reuse. Add ONE new `InvestorCta` + `InvestorLeadModal` (§7) modeled on `BuyerLeadModal`. |
| `PropertyCard` / `ImmobiliBrowser` / `PhotoGallery` / `Lightbox` / `PropertyMap` | **Already in TSI** | Reuse for `/immobili` and `/annuncio/[slug]`. |
| `NewsletterSignup.tsx` | **Optional** | Only if Martino wants the owner-resources capture; otherwise omit for v1. |

**New components to author:** `Logo.tsx` (rewrite, §2), `Marquee.tsx` (port+recolor),
`StatStrip.tsx` (the 4-promise number strip), `BrandEcosystem.tsx` (6-brand strip, from
ProjectsShowcase), `InvestorCta.tsx` + `InvestorLeadModal.tsx` (§7), `ProcessTimeline` (thin wrapper
over `Timeline` with numbered steps), and small presentational blocks for the seller value cards.

---

## 5. PAGE: `/` Home

**Section order (top → bottom):**
`Hero → Promise stat-strip → Promise marquee → Featured listings reel → Seller value blocks (3) →
Owner-journey reassurance → Investor teaser → 6-brand ecosystem → Marketing proof → Valuation CTA band`

### 5.1 Hero — "Calm harbour" (§3)
- Layout: `grad-paper-sea` + glows, `max-w-5xl`, `pt-36/44 pb-16/24`. Boat lockup `h-10/12` → kinetic
  H1 (`brand-dark`) → `data-reveal` sub → two CTAs (Magnetic primary = SellerCta "Richiedi una
  valutazione"; secondary = `/immobili`).
- Copy: `home.heroTitle` (rewrite to the positioning line, §6), `home.heroSubtitle` (the recovered
  spin-off line).

### 5.2 Promise stat-strip — **the conversion engine** (NEW `StatStrip.tsx`)
- Layout: 4 cells, `grid grid-cols-2 md:grid-cols-4`, on `paper` band or white with a `grad-crease`
  top rule. Each cell: big number in `brand` (700, ~2.5rem) + small label under it.
- Content (recovered "headline promise strip"):
  **24h** Valutazione · **7 giorni** Online · **3 mesi** Mandato · **0%** Al venditore.
- Under the 0% cell, a small `brand-dark` line: *"Promozione: mandati firmati entro settembre 2026."*
  (the dated nuance — keep it true). `data-reveal-stagger` on the four cells.

### 5.3 Promise marquee (ported `Marquee`, recolored)
- One thin infinite strip reinforcing the promises in motion. Items: same four promises + "+25% se
  vendi e ricompri". Hover-pauses. This is the only place the four promises move — adds life without
  TSV's heavy film. (Optional: fold this into 5.2 if the page feels busy — Martino's call; default = keep.)

### 5.4 Featured listings reel (existing `FeaturedCarousel` + `PropertyCard`)
- Already built in `page.tsx` — keep. `eyebrow` "In evidenza" + `display-chapter` "Immobili in
  evidenza", then the snap reel of priciest-first covers, ending in a "Vedi tutti →" chip
  (`nav-forward` transition to `/immobili`).
- Empty-state safe: section only renders when `reelItems.length > 0` (already coded).

### 5.5 Seller value blocks — the recovered pitch, condensed (NEW presentational)
- This is where the recovered live-site seller ideas land on the home (the full set lives on `/vendi`).
  Pick the **three strongest** for the home, as a `grid sm:grid-cols-3`, `data-reveal-stagger`:
  1. **"Valutazione rapidissima"** — call col titolare → documenti → sopralluogo entro 24h → online
     entro 7 giorni. CTA "Compila la richiesta" (SellerCta).
  2. **"Contratto semplice"** — venditore non paga · esclusiva 3 mesi · no tacito rinnovo · niente
     costi nascosti · foto/video/drone/tour 3D inclusi · *"se non rinnovi, ti regaliamo il materiale."*
  3. **"Il massimo del marketing"** — TSV è l'agenzia con più follower del settore; milioni di
     visualizzazioni nell'ultimo anno. *"TSI, pur non trattando Luxury, non merita di meno."* CTA
     "Canale YouTube ↗". (⚠️ Use "milioni di visualizzazioni" unless the 2M YT / 5.6M FB figures are
     re-verified — brief §8. Do NOT print unverified exact numbers.)
- Each block: small `brand` H3 + `neutral-600` body, optional inline CTA. Recover blocks by NAME from
  brief §3; do not paraphrase into LLM filler.
- Then a full-width link row: "Scopri la sezione dedicata ai venditori →" `Link /vendi`.

### 5.6 Owner-journey reassurance (the dark "How we work" band — keep, re-skin)
- Existing dark `brand-dark` band. Keep the two-promise idea but re-anchor to the **owner-journey**
  recovered copy: left "Una vendita ben fatta ti toglie peso, non te ne aggiunge" (visite concentrate
  in un giorno a settimana); right "Prima vendi bene, poi cerca la casa successiva" (don't fall in
  love before selling → weak position). `eyebrow text-sand`, headings white/sand, body `white/75`,
  CTA `bg-white text-brand-dark` (BuyerCta or SellerCta). `data-reveal` per column.

### 5.7 Investor teaser (NEW — light curiosity hook, full block in §7)
- A restrained band (white with a giant pale `brand-light/10` boat watermark `aria-hidden`, OR
  `grad-deep-sea`). `eyebrow` "Investire a Trieste" + `display-chapter` "Unità già a reddito, fuori
  dal mercato." + 2–3 lines of the off-market story (≥20 units, €200–400k, central, recently
  renovated, *non si possono pubblicizzare ma si possono raccontare*). One CTA → `InvestorCta`
  ("Scopri come funziona" / "Parlami delle opportunità"). **No prices, no addresses, no listings** —
  curiosity → profiling. Links to `/investimenti` for the full story.

### 5.8 6-brand ecosystem strip (NEW `BrandEcosystem`, from `ProjectsShowcase`)
- `eyebrow` "Il Gruppo" + `display-chapter` **"Brand diversi, una regia sola."** (recovered headline).
- A `grid grid-cols-2 lg:grid-cols-3` (6 cards) or a horizontal strip: each card = brand logo + one
  line. **All six:** TriesteVillas (capogruppo, premium/luxury), TriesteImmobiliare (questo sito,
  residenziale ≤~€500k), TriesteAffitti (locazioni 1–18 mesi), FriuliVillas (premium nel resto del
  FVG), TriesteBusiness (commerciale), LignanoVillas (premium Lignano, taglio internazionale).
- Routing copy line under the grid (recovered): *"Lusso → TriesteVillas. Resto del FVG →
  FriuliVillas / LignanoVillas. Affitti → TriesteAffitti. Business → TriesteBusiness."*
- External cards link to live siblings (TSV, TriesteAffitti); `soon` badge on the not-yet-live ones.
  `Tilt` on cards, `data-reveal-stagger`. CTA "Scopri il Gruppo →" → `/gruppo`.

### 5.9 Marketing proof (adapted `YouTubeShowcase`, light)
- Optional but on-brand: a slim proof block (2–3 YouTube thumbnails or one stat card) reinforcing
  5.5's "massimo del marketing", linking to TSV's channel. Keep light; recolor to `brand`/`paper`.

### 5.10 Valuation CTA band (existing — keep)
- The `paper` rounded band: `eyebrow` "Vuoi vendere?" + `display-chapter` "Valutazione gratuita del
  tuo immobile" + body + `SellerCta` "Richiedi una valutazione". `data-reveal="left"`. This is the
  page's final, unmissable acquisition nudge.

---

## 6. PAGE: `/vendi` — seller flagship (priority #1)

**Section order:**
`Seller hero → Stat-strip (24h/7gg/3mesi/0%) → Process timeline → Seller value grid (all recovered
blocks) → "Two smart moves" (lifting + check-up) → Foreign-buyer block → Discreet-sale note →
Cross-brand "Forza del gruppo" → Valuation form band`

### 6.1 Seller hero
- `grad-deep-sea` (`from-brand to-brand-dark`, white) — the ONE dark hero on the site (sellers get
  the confident, premium-feeling treatment; matches the recovered live `/vendi` energy). `eyebrow
  text-white/85` "Vendi con TriesteImmobiliare", H1 (kinetic optional, or plain `display-hero`):
  **"Vendi casa a Trieste con più strategia, meno attrito e 0% al venditore."** (recovered verbatim),
  intro = recovered ("Valutazione entro 48 ore, primo contatto entro 24, online anche in 7 giorni…"),
  CTA `.btn-hero bg-white text-brand-dark` "Richiedi una valutazione strategica" → SellerCta.

### 6.2 Stat-strip (reuse `StatStrip`)
- Same four-number strip as home, on the dark hero's foot or a `paper` band right after. The 0%
  September-2026 nuance + the **+25% buy-back** line ("se vendi e ricompri con noi → 25% di sconto
  sulla provvigione d'acquisto") sit here as fine print.

### 6.3 Seller PROCESS timeline (NEW `ProcessTimeline` over `Timeline`)
- THE signature treatment for `/vendi`. Use `Timeline` with **numbered steps** instead of years
  (pass `year: "01".."05"`). Scroll-driven `brand-light` line fills as you read. Steps (recovered
  "valutazione rapidissima" + "contratto semplice" flow):
  1. **01 · Call con il titolare** — ci racconti l'immobile in una call.
  2. **02 · Documenti** — ci invii la documentazione; verifichiamo cosa serve.
  3. **03 · Sopralluogo entro 24h** — veniamo a vedere, foto/video/drone/tour 3D.
  4. **04 · Online entro 7 giorni** — se documenti e immobile lo consentono, sei pubblicato.
  5. **05 · Visite concentrate** — un solo giorno a settimana, fascia concordata; meno attrito.
- Left column intro: `eyebrow` "Come funziona" + `display-chapter` "Dalla call al cartello
  'Venduto', senza caos." Right = the timeline. This is the calmer TSI answer to TSV's scroll-video.

### 6.4 Seller value grid — recover ALL the live blocks (don't lose them)
- A `grid sm:grid-cols-2` of value cards (`data-reveal-stagger`), each a recovered block BY NAME
  (brief §3). Include the full set, not the home's three:
  - **Velocità** (24h/48h/7gg) · **0% al venditore** (+25% buy-back) · **Mandato semplice** (no
    tacito rinnovo, "il materiale resta tuo") · **Casa pronta a vendere** (check documentale,
    anticipiamo il 50% del costo del controllo e, se manca, l'APE) · **Foto/video/drone/tour 3D**
    ("non serve a fare scena: filtra visite inutili") · **Vendita riservata** (canale discreto quando
    serve — TSI lo chiama "vendita riservata", non "Private Collection") · **Owner journey** (visite
    in un giorno) · **Reach internazionale** (gestione da remoto, inglese fluente, house tour).
- Card style: white `card-cine`-lite or simple bordered tiles, `brand` H3, `neutral-600` body.

### 6.5 "Due mosse giuste prima di vendere" (recovered)
- A two-card or prose block: **Check-up pre-vendita** (verifichiamo se la casa è pronta; tecnici
  esterni; anticipiamo 50% del controllo + APE) and **Lifting pre-vendita** (architetto + artigiani
  per preventivi; *"potremmo essere partecipi all'investimento"*). Keep the witty-honest tone:
  *"Non sempre conviene mettere casa online così com'è. A volte basta correggere poco per cambiare
  molto."* CTA "Richiedi un check-up" → SellerCta (tag fonte).

### 6.6 Foreign-buyer block (recovered "Trieste non va solo mostrata. Va spiegata")
- `eyebrow` "Acquirenti esteri" + headline + copy: call orientative Zoom, tour 3D, house tour
  half/full-day in auto per scoprire la Trieste autentica. Optional EN/DE emphasis (this block is
  where the trilingual promise pays off). CTA "Pianifica un House Tour" → BuyerCta (or a dedicated
  fonte tag).

### 6.7 Cross-brand "Forza del gruppo" (recovered)
- A short band: con TSI non lavori con una sola insegna — se serve, TriesteVillas (se è davvero
  luxury → hand-off), FriuliVillas/LignanoVillas (FVG), TriesteAffitti ("Affitta mentre vendi":
  messa a reddito temporanea se non è il momento giusto). Links out to siblings. This carries the
  TSV↔TSI triangulation in copy (brief §5).

### 6.8 Valuation form band
- The closing acquisition band: `paper`, `display-chapter` "Vuoi sapere quanto vale la tua casa?" +
  body + `SellerCta` (opens `SellerLeadModal`, writes `tipo_richiesta="Valutazione"`,
  `destinatario_interno="owners@TSV"` — already wired in `/api/lead`).

---

## 7. PAGE: `/investimenti` (NEW) — off-market funnel (priority #2)

**Goal (brief §2):** spark curiosity about ≥20 already-rented, central, recently-renovated units
(€200–400k) that **cannot be advertised** → profile the person → land a **lead in the CRM**. NOT a
gated Private Collection — a **lighter curiosity → profiling → lead** path. No listings, no prices,
no addresses on the page.

**Section order:**
`Investor hero → The off-market story (3 facts) → "Two ways to search" → ROI/profiling explainer →
Investor lead CTA → Cross-link to /immobili & /vendi`

### 7.1 Investor hero
- Light but distinct: `grad-paper-sea` with a giant pale `brand-light/10` boat watermark
  (`aria-hidden`) behind, OR a quiet `grad-deep-sea`. `eyebrow` "Investire a Trieste", kinetic H1
  **"Le occasioni migliori non finiscono in vetrina."** (or "Unità già a reddito, fuori dal
  mercato."), sub = the recovered "Inizia dal capire cosa Trieste può offrirti — investi mezz'ora
  con noi a orientare la ricerca." One CTA → `InvestorCta`.

### 7.2 The off-market story (3 facts, `data-reveal-stagger`)
- Three honest fact cards (no glamour): **Già a reddito** (unità affittate, rendita da subito) ·
  **Centrali e recenti** (palazzi centrali ristrutturati di recente) · **Fuori dal mercato** (non
  pubblicizzabili — *si raccontano in privato, non si mettono in vetrina*). Tone: confident,
  concrete, slightly conspiratorial-but-honest. Ticket band "tipicamente €200–400k" stated as a
  range, no specific units.

### 7.3 "Due modi di cercare" (recovered "Ricerca libera" + "Ricerca per ROI")
- Two columns:
  - **Ricerca libera** — "Spiegaci cosa cerchi: budget, lavori ammissibili, vincoli, composizione
    famiglia, destinazione → ricevi una lista di idee." (this can route to the buyer funnel.)
  - **Ricerca per utile netto / ROI** — "Indicaci budget e ritorno atteso → un case study con
    opzioni ordinate per ROI, costi all-inclusive d'acquisto." (THE investor funnel.)

### 7.4 ROI/profiling explainer
- A simple 3-step strip (reuse `Timeline` numbered, or a `grid-cols-3`): **01** ci dici budget +
  ROI atteso + orizzonte → **02** costruiamo un case study con opzioni ordinate per rendimento →
  **03** ti raccontiamo le unità off-market che combaciano, in privato. Sets expectation that the
  payoff is a conversation, not a download.

### 7.5 Investor lead CTA (NEW `InvestorCta` + `InvestorLeadModal`)
- Author `InvestorLeadModal` modeled on `BuyerLeadModal` (same white `.buyer-panel` sheet, RangeDual
  for budget, privacy gate, one-reachable-contact rule). Extra fields specific to investing:
  **budget min/max** (RangeDual), **ROI atteso** (% — free or select), **orizzonte** (breve/medio/lungo),
  **ticket** (derives from budget), optional **zona**, message.
- **CRM wiring (NO schema changes — brief §5):** POST `/api/lead` with a new `tipo: "investor"`
  branch (add `handleInvestor` to `route.ts`) writing to existing field NAMES + `typecast:true`:
  - `azienda="TriesteImmobiliare"`, `canale="Sito TriesteImmobiliare"`,
  - `tipo_richiesta="Investimento"` (typecast adds the singleSelect option),
  - `scopo="Investimento / rendita"`,
  - `budget_min_eur` / `budget_max_eur` / `budget` (formatted),
  - `zona_interesse_norm` (if zona chosen),
  - `motivo="Investitore sito: ROI atteso X% · orizzonte Y · ticket Z"`,
  - `messaggio`, `privacy_ok`, `lingua`, `stato="NUOVO"`, `data_contatto`.
  - Reuse the localized `recapHtml` for the customer recap; notify `info@triesteimmobiliare.com`.
  - **Do NOT add columns** — typecast only creates missing select OPTIONS, never fields (brief §5).

### 7.6 Cross-links
- Quiet footer-of-page links: "Cerchi casa per viverci? → /immobili" · "Hai un immobile da mettere a
  reddito? → /vendi (Affitta mentre vendi, con TriesteAffitti)."

---

## 8. PAGE: `/immobili` (+ `/annuncio/[slug]`) — browse the portfolio (priority #3)

**Already built** (`ImmobiliBrowser`, `PropertyCard`, `PhotoGallery`, `Lightbox`, `PropertyMap`,
`PropertyCharacteristics`, `Planimetrie`, lead/visit/friend modals). Spec = keep + light polish.

### `/immobili` section order:
`Light intro header → zone filter (existing) → grouped/filtered card grid → "Ricerca libera" buyer
nudge → contact strip`
- Intro: `eyebrow` "Tutte le zone" + `display-chapter` "Immobili" + `immobili.intro`, on
  `grad-paper-sea`.
- Cards: existing `card-cine` tiles, `data-reveal-stagger`, zone anchors (`#CENTRO` etc.) so home's
  zone index deep-links land correctly.
- Empty per-zone state already handled (`listing.empty`). Add ONE light **"Ricerca libera"** band at
  the foot: "Non trovi quello che cerchi? Diteci cosa cercate →" → `BuyerCta` (recovered buyer-help
  idea folded in here per brief §4, instead of a separate `/compra`).

### `/annuncio/[slug]` (dossier) section order:
`Photo hero (par-zoom) → title + price + key facts → gallery (PhotoGallery/Lightbox) → description →
characteristics → map (approx) → lead rail (Richiedi info / Prenota visita / Invia a un amico) →
similar listings`
- The ONE place `Scene` + `.par-zoom` is used (subtle photo-hero zoom). Everything else reveals.
- Lead rail wires to `/api/lead` default branch (already built): `tipo_richiesta` Richiesta info /
  Prenota visita / Invia a un amico, `immobile` linked by `tsv_prop_id`, `azienda/canale` = TSI.
- Reuse `PropertyCharacteristics`, `Planimetrie`, `VisitForm`, `LeadForm`, `PropertyMap` as-is.

---

## 9. PAGE: `/gruppo` — the 6-brand ecosystem

**Section order:**
`Group hero → "Brand diversi, una regia sola" intro → Group story timeline → 6-brand ecosystem (full)
→ Values → Team → Legal (in footer)`

- **Hero:** `grad-deep-sea`, `eyebrow` "TriesteVillas Group", H1 "Il Gruppo", intro = recovered
  ecosystem framing. (Existing page is close — extend to SIX brands.)
- **Intro:** recover the verbatim ideas: *"Non un contenitore generico. Un sistema costruito bene."*
  + *"TriesteVillas non si allarga fino a diventare generica. Attorno nasce un ecosistema più
  intelligente."* + the TSI raison d'être (residenziale ≤€500k, brand dedicato, linguaggio proprio).
- **Story timeline:** existing `Timeline` (2013 turistico → 2020 pivot compravendite → 2026 gruppo a
  6 brand). Keep, but make the 2026 node explicitly "sei brand verticali".
- **6-brand ecosystem (full):** upgrade the existing 5-brand `<ul>` to **all six** — ADD
  **TriesteBusiness** (locali, attività, terreni, palazzi, uffici, capannoni, ricettivo). Use
  `Tilt` brand cards (logos when available) with role copy from `gruppo.txt`. External links to live
  siblings; `soon` badges where not live.
- **Values + Team:** existing blocks are good — keep `Tilt` team cards (Davide Carlin, Martino,
  Giada, Cécile, photos in `/public/team/*.webp`). Roles per `it.json`.
- **Legal:** TriesteVillas srl · Via Milano 5, 34132 Trieste · C.F./P.IVA 01235580329 · REA TS 134793
  · cap. 10.200 € i.v. · PEC milou@pec.emailc.it (already in footer; keep there).

---

## 10. PAGE: `/contatti`

**Section order:** `Light hero → contact details (email/phone/office/hours) → quick lead nudge → map`
- Upgrade the current plain page: put it on `grad-paper-sea`, add the **paper-boat mark** beside the
  H1, set details as a clean `dl`. **TSI-specific (brief §8):** info@triesteimmobiliare.com · 040
  2473628 (no +39 in UI; `tel:` may use +39) · Via Torino 34, 2° piano, Trieste · su appuntamento ·
  Facebook (the live profile in `Footer.tsx`).
- Add a short **dual CTA**: "Vuoi vendere? → Richiedi una valutazione" (SellerCta) + "Cerchi casa? →
  Diteci cosa cercate" (BuyerCta), so contatti also captures leads.
- Optional small `PropertyMap`-style static map of Via Torino 34. Keep light.

`/privacy` — keep as-is (legal text).

---

## 11. Header / Footer / global chrome

- **Header (`Header.tsx`):** light glass `.pill-header`, auto-hide on scroll-down (existing). Nav:
  add **Vendi** prominence (it's job #1) and add **Investimenti** to the nav set →
  `Immobili · Vendi · Investimenti · Gruppo · Contatti`. New paper-boat `Logo` inherits automatically.
  Add a small `.btn-hero` "Valutazione" CTA in the pill on desktop (acquisition shortcut).
- **`MobileNav.tsx`:** mirror the new nav incl. Investimenti; keep kinetic word reveal in the sheet.
- **Footer (`Footer.tsx`):** keep dark navy, `tone="light"` boat, legal block, TSI Facebook, sitemap,
  contacts. Add `/investimenti` to the `NAV` array. `footer.tagline` stays light/witty.
- **`LocaleSwitcher`:** IT/EN/DE, `localePrefix: as-needed` (it at root). Ensure every new copy key
  exists in all three message files.

---

## 12. Implementation checklist (build order for the dev)

1. **Rewrite `Logo.tsx`** to the faithful 4-tone paper-boat SVG (+ export `/public/logo-tsi*.svg`,
   favicon, OG). Verify crisp at `h-6`, `h-10`, `h-12`.
2. **Port `Marquee.tsx`** + recolored marquee CSS into `globals.css` (brand-blue, not gold).
3. **Author `StatStrip.tsx`** (4 promises) and wire into home + `/vendi`.
4. **Build the home** in the §5 order (most sections already exist; add stat-strip, seller-value
   grid, investor teaser, expand brand strip to 6, marketing proof).
5. **Build `/vendi`** in the §6 order — `ProcessTimeline`, full recovered seller grid, lifting/check-up,
   foreign-buyer, cross-brand, valuation form.
6. **Build `/investimenti`** (§7) + `InvestorCta`/`InvestorLeadModal` + `handleInvestor` in
   `/api/lead/route.ts` (existing field names + typecast only).
7. **Repurpose `ProjectsShowcase` → `BrandEcosystem`** (6 brands, logos, links) for home + `/gruppo`.
8. **Polish `/immobili`, `/annuncio/[slug]`, `/contatti`** per §8/§10 (boat marks, Ricerca-libera
   nudge, dual CTAs). Extend nav/footer with Investimenti.
9. **Fill IT/EN/DE** message keys for every new block (recovered copy verbatim where it exists;
   translate the rest). Keep `meta`, `hreflang`, JSON-LD (RealEstateAgent/Organization with the 6
   brands, FAQPage for seller FAQ) per brief §6.
10. **Verify** in prod (no local Airtable token → seed data; data-dependent bits only confirm on
    Vercel). Respect `prefers-reduced-motion` everywhere.

---

## 13. Hard rules carried from Martino (do not violate)

- **No generic LLM real-estate fluff.** Every claim concrete and TRUE. Recover blocks BY NAME from
  `home.txt`/`vendi.txt`/`gruppo.txt`; don't paraphrase them into mush.
- **The 0% promo is dated** — always "mandati firmati entro settembre 2026". The buy-back is **25%**
  on the *purchase* commission, only "se vendi e ricompri con noi".
- **Marketing numbers:** "milioni di visualizzazioni" unless 2M YT / 5.6M FB are re-verified.
- **Investor page:** no advertised units, no prices, no addresses — curiosity → profiling → lead.
- **One CRM, brand-tagged:** every lead carries `azienda`/`canale`=TriesteImmobiliare; only write to
  existing field NAMES; typecast adds select options, never columns.
- **Lighter than TSV by construction:** light paper skin, one kinetic hero per page, no scroll-video,
  glide not loom. Same craft, calmer water.
</content>
</invoke>
