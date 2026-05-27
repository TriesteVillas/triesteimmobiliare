# TriesteImmobiliare — sito

Restyling del sito ufficiale TriesteImmobiliare (TSI), brand mid-budget del gruppo TriesteVillas.

- **Stack**: Astro 6 (static export) · TypeScript · CSS vanilla con custom properties
- **Hosting**: Vercel (adapter ufficiale, Cron per rebuild listing immobili)
- **i18n**: 4 lingue — IT (default, no prefix), EN, DE, SL
- **Data immobili**: build-time fetch da Airtable `TSV_PROPERTIES`
- **Repo upstream**: `github.com/TriesteVillas/triesteimmobiliare`

## Setup locale

Richiede **Node ≥ 22.12**.

```bash
npm install
cp .env.example .env.local   # poi compila le chiavi Airtable
npm run dev                  # http://localhost:4321
```

## Script

| Comando | Cosa fa |
|---|---|
| `npm run dev` | dev server con HMR |
| `npm run build` | build statica in `dist/` (gen Vercel adapter) |
| `npm run preview` | preview locale del build |
| `npm run astro -- ...` | accesso diretto al CLI Astro |

## Struttura

```
src/
├── components/      # Astro components riusabili
├── content/         # Content Collections (blog, faq) — MDX
├── data/            # JSON generato al build (es. properties.generated.json)
├── i18n/            # dizionari + helper localizzazione
├── layouts/         # layout root (Base, Editorial)
├── pages/           # routing file-based — IT no prefix, EN/DE/SL prefissati
├── styles/          # tokens.css + reset.css + global.css
└── utils/           # helper generici

scripts/
└── fetch-properties.mjs   # pull build-time da Airtable
```

## i18n

Routing nativo Astro: IT è default senza prefisso (`/`), le altre lingue stanno sotto `/en/`, `/de/`, `/sl/`. Tutte le pagine devono avere il `hreflang` corretto — viene gestito automaticamente da `Base.astro`.

Master traduzioni: `src/i18n/it.json`. Le altre derivano (EN scritto direttamente, DE + SL placeholder finché non passa per TranslatePress + revisione madrelingua — vedi piano fase 7).

## Design tokens

Tutti i token vivono in `src/styles/tokens.css` come CSS custom properties.
Modifiche centrali al brand passano da lì.

## Contatti progetto

- Owner: Martino Coppola di Canzano · TriesteVillas
- Dev/AI: Claude · Assistente AI TriesteVillas
- Mail tecniche: `info@triesteimmobiliare.com`
