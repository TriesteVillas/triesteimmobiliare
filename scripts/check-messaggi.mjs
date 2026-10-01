// Cancello del prebuild per i dizionari (nato il 2026-10-01 con lo sloveno).
// La build FALLISCE se un dizionario di messages/ non ha esattamente le chiavi
// di en.json (il master di redazione), se un messaggio non è ICU valido, se
// usa argomenti diversi da quelli dell'inglese — {count} tradotto in {conteggio}
// esce in pagina come «{conteggio}» — o se un plurale non copre le forme della
// sua lingua. Lo sloveno ne ha quattro (one/two/few/other: 1 dan, 2 dneva,
// 3 dnevi, 5 dni) e un plurale scritto all'inglese ricade su `other` senza
// errori: è esattamente il guasto che a occhio non si vede.
// Le lingue si leggono da routing.ts, non si ricopiano.
import { existsSync, readFileSync } from "node:fs";
import { parse, TYPE } from "@formatjs/icu-messageformat-parser";

const errori = [];
const routing = readFileSync("src/i18n/routing.ts", "utf8");
const lingue = [...(routing.match(/locales:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z]{2})"/g)].map((m) => m[1]);
if (!lingue.includes("en")) errori.push("routing.ts: lingue non lette o senza «en», il master di confronto");

// Chiave piatta → valore (stringa o array di stringhe).
function piatto(o, p = "", out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) piatto(v, key, out);
    else out[key] = v;
  }
  return out;
}

// Argomenti usati da un messaggio (nomi) e plurali (opzioni presenti), in profondità.
function analizza(ast, acc = { arg: new Set(), plurali: [] }) {
  for (const el of ast) {
    if (el.type === TYPE.argument || el.type === TYPE.number || el.type === TYPE.date || el.type === TYPE.time) acc.arg.add(el.value);
    if (el.type === TYPE.select || el.type === TYPE.plural) {
      acc.arg.add(el.value);
      if (el.type === TYPE.plural && el.pluralType !== "ordinal") acc.plurali.push({ arg: el.value, opzioni: Object.keys(el.options) });
      for (const o of Object.values(el.options)) analizza(o.value, acc);
    }
    if (el.type === TYPE.tag) analizza(el.children, acc);
  }
  return acc;
}

// Le forme che un plurale DEVE avere in una lingua. `many` resta fuori: il CLDR
// recente lo dà anche all'italiano per i milioni, che qui non si contano. La
// forma `one` si può sostituire con «=1» solo dove `one` vuol dire davvero
// «uno e basta»: in sloveno `one` è anche 101, 201… e «=1» non basta.
function formeObbligatorie(lingua) {
  const pr = new Intl.PluralRules(lingua);
  const forme = pr.resolvedOptions().pluralCategories.filter((c) => c !== "many");
  const oneSoloUno = ![21, 101, 1001].some((n) => pr.select(n) === "one");
  return { forme, oneSoloUno };
}

function leggi(l) {
  const f = `messages/${l}.json`;
  if (!existsSync(f)) { errori.push(`${f}: manca il dizionario di una lingua dichiarata in routing.ts`); return null; }
  try { return piatto(JSON.parse(readFileSync(f, "utf8"))); }
  catch (e) { errori.push(`${f}: JSON non valido (${e.message})`); return null; }
}

function messaggi(v) { return Array.isArray(v) ? v : [v]; }

const master = leggi("en");
if (master) {
  const argMaster = {};
  for (const [k, v] of Object.entries(master)) {
    argMaster[k] = messaggi(v).map((s) => { try { return [...analizza(parse(String(s))).arg].sort().join(","); } catch { return null; } });
  }
  for (const l of lingue) {
    const d = l === "en" ? master : leggi(l);
    if (!d) continue;
    const mancano = Object.keys(master).filter((k) => !(k in d));
    const inPiu = Object.keys(d).filter((k) => !(k in master));
    if (mancano.length) errori.push(`messages/${l}.json: ${mancano.length} chiavi mancanti rispetto a en.json (${mancano.slice(0, 5).join(", ")}${mancano.length > 5 ? ", …" : ""})`);
    if (inPiu.length) errori.push(`messages/${l}.json: ${inPiu.length} chiavi che en.json non ha (${inPiu.slice(0, 5).join(", ")}${inPiu.length > 5 ? ", …" : ""})`);
    const { forme, oneSoloUno } = formeObbligatorie(l);
    for (const [k, v] of Object.entries(d)) {
      if (!(k in master)) continue;
      if (Array.isArray(master[k]) !== Array.isArray(v) || (Array.isArray(v) && v.length !== master[k].length)) {
        errori.push(`messages/${l}.json: ${k} non ha la forma di en.json (lista di ${Array.isArray(master[k]) ? master[k].length : "—"} voci)`);
        continue;
      }
      messaggi(v).forEach((s, i) => {
        if (typeof s !== "string" || !s.trim()) { errori.push(`messages/${l}.json: ${k} è vuota`); return; }
        let info;
        try { info = analizza(parse(s)); }
        catch (e) { errori.push(`messages/${l}.json: ${k} non è ICU valido (${e.message})`); return; }
        const arg = [...info.arg].sort().join(",");
        if (argMaster[k][i] !== null && arg !== argMaster[k][i]) errori.push(`messages/${l}.json: ${k} usa gli argomenti {${arg}}, en.json {${argMaster[k][i]}}`);
        for (const p of info.plurali) {
          const assenti = forme.filter((c) => !p.opzioni.includes(c) && !(c === "one" && oneSoloUno && p.opzioni.includes("=1")));
          if (assenti.length) errori.push(`messages/${l}.json: ${k} — il plurale di {${p.arg}} non ha le forme ${assenti.join("/")} (servono ${forme.join("/")})`);
        }
      });
    }
  }
}

if (errori.length) { console.error("✖ check-messaggi:\n  - " + errori.join("\n  - ")); process.exit(1); }
console.log(`✓ check-messaggi: ${lingue.join(", ")} con le stesse ${Object.keys(master).length} chiavi di en.json, ICU valido, plurali completi`);
