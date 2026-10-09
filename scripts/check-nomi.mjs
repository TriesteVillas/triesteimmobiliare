// Cancello del prebuild sui nomi riservati (08/10/2026, audit dei siti del
// 07/10). REGOLA FERREA del gruppo (25/08/2026): dal sito non escono i NOMI
// INTERNI degli immobili né i nomi dei PROPRIETARI. Il nome interno porta
// dentro il cognome di chi vende: darlo a un compratore gli dice chi è la
// controparte prima che lo decida il venditore.
//
// QUESTO REPO È PUBBLICO, e per questo il cancello è fatto di CAMPI e non di
// nomi: una lista di hash di 1-3 parole senza sale (come quella degli atlanti)
// si rovescia in pochi secondi con un elenco di cognomi, e pubblicarla vorrebbe
// dire pubblicare i cognomi (correzione del critico all'audit, 08/10). Stesso
// impianto del gemello lignanovillas. Tiene chiuse le strade da cui un nome
// interno arriverebbe in pagina:
//
//  1. nessun file di src/ o messages/ usa un CAMPO che porta un nome interno o
//     un proprietario (internal_name, nome_interno, nickname, owner_*,
//     proprietario_*…);
//  2. il tipo della riga di vetrina (src/lib/vetrina.ts, RigaVetrina) dichiara
//     come nomi SOLO public_name e le sue traduzioni;
//  3. la mappa dei campi Airtable (src/lib/properties.ts, F) non chiede il nome
//     interno: un campo che non arriva non può finire in pagina per sbaglio.
//  4. (09/10/2026) la stessa regola del punto 1 per la nota interna sulle
//     imposte: è un campo di APPUNTI di chi lavora la casa, non un testo per
//     chi compra, e il popup delle imposte la stampava come «criteri di
//     calcolo». Il popup mostra solo le cifre. Non è un nome, ma vale lo
//     stesso: dal sito esce solo ciò che è scritto per il cliente.
//
// La vetrina del CRM ha il suo cancello lato server (tsv-pg scripts/check-nomi.mjs
// §7). Il confronto dei testi con i nomi veri si fa nel CRM, mai qui.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errori = [];

const CAMPI_VIETATI =
  /\b(internal_name|internalName|nome_interno|nomeInterno|nickname|nome_proprietario|proprietario_[a-z_]+|proprietari_[a-z_]+|owner_[a-z_]+|ownerName|note_imposte|noteImposte)\b/g;

function file(dir) {
  const out = [];
  for (const voce of readdirSync(dir)) {
    const p = join(dir, voce);
    if (statSync(p).isDirectory()) out.push(...file(p));
    else if (/\.(ts|tsx|js|mjs|json)$/.test(voce)) out.push(p);
  }
  return out;
}

const riga = (testo, indice) => testo.slice(0, indice).split("\n").length;

// 1 · I campi vietati, in tutto src/ e messages/.
for (const p of [...file(join(root, "src")), ...file(join(root, "messages"))]) {
  const testo = readFileSync(p, "utf8");
  for (const m of testo.matchAll(CAMPI_VIETATI)) {
    errori.push(
      /^note/i.test(m[0])
        ? `${relative(root, p)}:${riga(testo, m.index)}: campo «${m[0]}» — è la nota INTERNA sulle imposte, che dal sito non esce (09/10/2026, §4)`
        : `${relative(root, p)}:${riga(testo, m.index)}: campo «${m[0]}» — porta un nome interno o di un proprietario, che dal sito non esce (regola del 25/08/2026)`,
    );
  }
}

// 2 · La riga di vetrina dichiara come nomi solo public_name*.
const vetrina = readFileSync(join(root, "src/lib/vetrina.ts"), "utf8");
const tipo = vetrina.match(/type RigaVetrina = \{([\s\S]*?)\n\};/);
if (!tipo) {
  errori.push("src/lib/vetrina.ts: tipo `RigaVetrina` non trovato — il cancello non sa più che cosa si legge dalla vetrina");
} else {
  for (const campo of tipo[1].matchAll(/^\s*([a-z_0-9]+)\??:/gm)) {
    if (/name|nome/i.test(campo[1]) && !/^public_name(_(en|de|sl))?$/.test(campo[1])) {
      errori.push(
        `src/lib/vetrina.ts: la riga di vetrina legge «${campo[1]}»: dei nomi si leggono solo public_name e le sue traduzioni`,
      );
    }
  }
}

// 3 · La mappa dei campi Airtable non chiede nomi diversi dal nome pubblico.
const props = readFileSync(join(root, "src/lib/properties.ts"), "utf8");
const mappa = props.match(/export const F = \{([\s\S]*?)\n\} as const;|export const F = \{([\s\S]*?)\n\};/);
if (!mappa) {
  errori.push("src/lib/properties.ts: mappa `F` non trovata — il cancello non sa più quali campi si chiedono ad Airtable");
} else {
  for (const campo of (mappa[1] ?? mappa[2]).matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)) {
    if (/name|nome|owner|proprietari/i.test(campo[1]) && campo[1] !== "publicName") {
      errori.push(
        `src/lib/properties.ts: la mappa F chiede «${campo[1]}» ad Airtable: dei nomi si chiede solo publicName`,
      );
    }
  }
}

if (errori.length) {
  console.error(`✗ check-nomi: ${errori.length} problemi\n  ${errori.join("\n  ")}`);
  process.exit(1);
}
console.log("✓ check-nomi: nessun campo di nomi interni o proprietari nel codice; dalla vetrina e da Airtable solo il nome pubblico");
