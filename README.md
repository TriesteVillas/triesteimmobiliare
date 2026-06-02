# TriesteImmobiliare — sito

Sito ufficiale di **TriesteImmobiliare**, il brand mid-market del gruppo TriesteVillas
("l'agenzia smart per vendere casa a Trieste con provvigione 0% per il venditore").

Fork strutturale del sito `triestevillas-web`: stessa logica, stesso header/footer,
stessa pipeline immobili da Airtable. Cambiano branding, copy e il filtro della
collection (`TS_Immobilaire` invece di `TSV_PUBLIC`).

- **Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl · Leaflet
- **Hosting**: Vercel
- **i18n**: IT (default, root) · EN · DE — `localePrefix: as-needed`
- **Dati immobili**: fetch build/ISR da Airtable `TSV_PROPERTIES`
  (base `app1ZDay9vQNU5V2u`, tabella `PROPRIETA`), filtro
  `status = ACTIVE AND COLLECTION contiene "TS_Immobilaire"`.

## Setup locale

Richiede **Node ≥ 22.12**.

```bash
npm install
cp .env.example .env.local   # opzionale: senza token usa lo snapshot src/lib/seed.json
npm run dev                  # http://localhost:3000
```

Senza `AIRTABLE_TOKEN` il sito rende i dati dallo snapshot committato
`src/lib/seed.json` (gli immobili reali al momento del build). In produzione,
impostare `AIRTABLE_TOKEN` (PAT read-only, scope `data.records:read` sulla base
`TSV_PROPERTIES`) per il fetch live con revalidation ogni 10 minuti.

## Struttura

```
src/
├── app/[locale]/        # routing i18n — home, immobili, annuncio/[slug], gruppo, vendi, contatti
├── components/          # Header, Footer, Logo, HeroVideo, ImmobiliBrowser, PropertyCard, PropertyMap, ...
├── i18n/                # routing + request config next-intl
└── lib/                 # airtable.ts (fetch+filtro), properties.ts (map+zone), seed.json (snapshot)
messages/                # it.json (master) · en.json · de.json
```

## Branding

- Logo: barchetta origami ufficiale (`src/components/Logo.tsx`, glyph + wordmark).
- Palette: blu del logo — token in `src/app/globals.css` (`--color-brand*`).
- Contatti: `info@triesteimmobiliare.com` · 040 2473628 · Via Torino 34, Trieste (su appuntamento).

## Owner

- Owner: Martino Coppola di Canzano · TriesteVillas Group
- Repo: `github.com/TriesteVillas/triesteimmobiliare`
