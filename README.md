# TriesteImmobiliare — sito

Sito ufficiale di **TriesteImmobiliare**, il brand mid-market del gruppo TriesteVillas:
l'agenzia smart per comprare e vendere casa a Trieste, col marketing e la rete della
capogruppo — compratori esteri compresi.

> ⚠️ **03/09/2026 — la promo «0% al venditore» è ritirata.** Era il claim di lancio
> ("mandati firmati entro settembre 2026") e stava in decine di punti: strip della home,
> hero di `/vendi`, blocco dedicato, FAQ JSON-LD, meta tag e og:title delle tre lingue.
> Decisione di Martino: i mandati non li ha portati lo sconto, li ha portati il nome
> TriesteVillas, la notorietà social e la capacità di proporre gli immobili all'estero.
> **Nel sito non deve rientrare nessun accenno allo 0%, alla provvigione azzerata per
> chi vende o alla scadenza «entro settembre 2026».** La provvigione del venditore si
> concorda in sede di incarico e il sito non la dichiara.

Gemello strutturale di `triestevillas-web` (stessi componenti, stessa pipeline immobili
da Airtable, stessi nomi di classe CSS per la portabilità), ma con una skin volutamente
più semplice: tema chiaro, palette blu nautica dal logo a barchetta, niente coreografie
cinematografiche.

- **Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl · Leaflet
- **Hosting**: Vercel (progetto `trieste-villas/triesteimmobiliare`, deploy automatico a ogni push su `main`)
- **i18n**: IT (default, root) · EN · DE · SL — `localePrefix: as-needed`
- **Dati immobili**: fetch live/ISR (10 min) dalla vetrina pubblica del CRM (Postgres),
  con `CATALOGO_SORGENTE=pg` — acceso in produzione dal 24/08/2026; senza, il ramo di
  ripiego legge Airtable `TSV_PROPERTIES` (tabella `PROPRIETA`; gli identificativi di
  base e tabelle stanno nella KB del gruppo, non in questo repo pubblico)

## Regola di pubblicazione (gate)

Un immobile appare su questo sito solo se **entrambe** vere:

1. `tsv_com_online` (checkbox) = ✓ — interruttore master di gruppo (se spento,
   l'immobile è offline su tutti i siti);
2. `pubblicato_su` (multipleSelects) contiene **`triesteimmobiliare.com`**.

Con la vetrina accesa la regola la applica il CRM (`/api/vetrina?sito=triesteimmobiliare.com`).
Sul ramo Airtable il filtro vive in `src/lib/airtable.ts` (`SITE_TARGETS`) e
referenzia i campi per **nome**; le colonne della scheda sono invece agganciate per
**field ID** (`src/lib/properties.ts`, oggetto `F`) — rinominare è sicuro, cancellare no.

## Lead

I form (richiesta info, prenota visita, invia a un amico, popup buyer, valutazione
venditore) passano da `/api/lead`, che posa la richiesta nella porta `ingresso` del
CRM (`src/lib/ingressoPorta.ts`, firma `INGRESSO_HMAC`). Con `LEAD_SU_AIRTABLE=no`
(produzione, dal 25/08/2026) la porta è l'unico deposito e la scrittura su Airtable
`LEAD_` è spenta; senza il flag resta anche quella. Le email (Resend) sono best-effort.

## Setup locale

Richiede **Node ≥ 22.12**.

```bash
npm ci
cp .env.example .env.local   # e mettere CATALOGO_SORGENTE=pg per il catalogo
npm run dev                  # http://localhost:3000
npm run prebuild             # i cancelli del repo, compresi i test (npm test)
```

Lo snapshot committato `src/lib/seed.json` non c'è più (08/10/2026: conteneva due
record veri dell'anagrafica, in un repo pubblico). In locale il catalogo si legge
dalla vetrina pubblica del CRM con `CATALOGO_SORGENTE=pg`; senza, e senza
`AIRTABLE_TOKEN`, è vuoto. Articoli, account e Private Collection leggono ancora
Airtable e in locale, senza token, restano vuoti.

## Contatti del brand

info@triesteimmobiliare.com · 331 8940822 (telefono e WhatsApp) · Via Torino 34, secondo piano · Trieste
