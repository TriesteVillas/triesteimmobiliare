# TriesteImmobiliare — sito

Sito ufficiale di **TriesteImmobiliare**, il brand mid-market del gruppo TriesteVillas
("l'agenzia smart per comprare e vendere casa a Trieste: provvigione 0% per chi vende").

Gemello strutturale di `triestevillas-web` (stessi componenti, stessa pipeline immobili
da Airtable, stessi nomi di classe CSS per la portabilità), ma con una skin volutamente
più semplice: tema chiaro, palette blu nautica dal logo a barchetta, niente coreografie
cinematografiche.

- **Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl · Leaflet
- **Hosting**: Vercel (progetto `trieste-villas/triesteimmobiliare`, deploy automatico a ogni push su `main`)
- **i18n**: IT (default, root) · EN · DE — `localePrefix: as-needed`
- **Dati immobili**: fetch live/ISR (10 min) da Airtable `TSV_PROPERTIES`
  (base `app1ZDay9vQNU5V2u`, tabella `PROPRIETA`)

## Regola di pubblicazione (gate)

Un immobile appare su questo sito solo se **entrambe** vere:

1. `tsv_com_online` (checkbox) = ✓ — interruttore master di gruppo (se spento,
   l'immobile è offline su tutti i siti);
2. `pubblicato_su` (multipleSelects) contiene **`triesteimmobiliare.com`**.

Il filtro vive in `src/lib/airtable.ts` (`SITE_TARGETS`) e referenzia i campi
per **nome**; le colonne della scheda sono invece agganciate per **field ID**
(`src/lib/properties.ts`, oggetto `F`) — rinominare è sicuro, cancellare no.

## Lead

I form (richiesta info, prenota visita, invia a un amico, popup buyer, valutazione
venditore) scrivono nella tabella `LEAD_` della stessa base via `/api/lead`, con
`azienda: TriesteImmobiliare` e `canale: Sito TriesteImmobiliare`. Le email
(Resend) sono best-effort e al momento non configurate: fa fede il record Airtable.

## Setup locale

Richiede **Node ≥ 22.12**.

```bash
npm install
cp .env.example .env.local   # opzionale: senza token usa lo snapshot src/lib/seed.json
npm run dev                  # http://localhost:3000
```

Senza `AIRTABLE_TOKEN` il sito rende i dati dallo snapshot committato
`src/lib/seed.json` (i soli immobili TSI al momento della rigenerazione). In
produzione impostare `AIRTABLE_TOKEN` (PAT con `data.records:read` +
`data.records:write` per i lead sulla base `TSV_PROPERTIES`) e, se serve,
`AIRTABLE_BASE_ID`.

## Contatti del brand

info@triesteimmobiliare.com · 040 2473628 · Via Torino 34, secondo piano · Trieste
