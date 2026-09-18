// Cancello del prebuild: la build FALLISCE se il tag GA4 o il banner del consenso
// spariscono dal layout, o se il consenso salvato dal banner non è quello che il
// tag legge. Nato il 2026-09-18, dopo che tre siti del gruppo sono andati online
// senza tag e le proprietà GA4 sono rimaste vuote per settimane senza che nessuno
// se ne accorgesse. Non si spegne per «sbloccare» la build: si ripara il layout.
import { readFileSync } from "node:fs";

const errori = [];
const analytics = readFileSync("src/components/Analytics.tsx", "utf8");
const id = analytics.match(/const GA_ID = "(G-[A-Z0-9]{8,12})"/)?.[1];
if (!id) errori.push("Analytics.tsx: GA_ID mancante o malformato (atteso \"G-XXXXXXXXXX\")");
if (!/gtag\('consent','default'/.test(analytics)) errori.push("Analytics.tsx: manca gtag('consent','default') — Consent Mode v2");
const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8");
if (!/<Analytics\s*\/>/.test(layout)) errori.push("layout.tsx: <Analytics /> non montato");
if (!/<CookieBanner\s*\/>/.test(layout)) errori.push("layout.tsx: <CookieBanner /> non montato");
const banner = readFileSync("src/components/CookieBanner.tsx", "utf8");
const chiave = banner.match(/CHIAVE_CONSENSO = "([a-z0-9_]+)"/)?.[1];
if (!chiave) errori.push("CookieBanner.tsx: CHIAVE_CONSENSO mancante");
else if (!analytics.includes(`'${chiave}'`)) errori.push(`Analytics.tsx non legge la chiave '${chiave}' del banner: un consenso dato non arriverebbe mai a GA`);
for (const l of ["it", "en", "de"]) {
  const m = JSON.parse(readFileSync(`messages/${l}.json`, "utf8"));
  for (const k of ["testo", "accetta", "rifiuta", "privacy", "preferenze", "aria"]) if (!m.cookie?.[k]) errori.push(`messages/${l}.json: manca cookie.${k}`);
}
if (errori.length) { console.error("✖ check-analytics:\n  - " + errori.join("\n  - ")); process.exit(1); }
console.log(`✓ check-analytics: GA4 ${id} montato nel layout, banner con chiave ${chiave}`);
