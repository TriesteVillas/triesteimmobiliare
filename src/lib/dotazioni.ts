// ─────────────────────────────────────────────────────────────────────────────
// DOTAZIONI — c'è, non c'è, non si sa. Una regola sola per la tabella
// «Caratteristiche» della scheda e per i dati strutturati (amenityFeature).
//
// ⚠️ GEMELLO IDENTICO in triestevillas-web, triesteimmobiliare, friulivillas e
// triesteaffitti (src/lib/dotazioni.ts): si cambia in tutti e quattro. Modulo
// PURO: niente fetch, niente import — lo carica anche il cancello del prebuild
// (scripts/check-dotazioni.mjs) con lo strip dei tipi di Node.
//
// PERCHÉ ESISTE (07/10/2026). La scheda leggeva le dotazioni come «campo non
// vuoto = c'è» (`property.ascensore && t("elevator")`), sul presupposto — scritto
// in un commento — che il campo fosse popolato SOLO quando la dotazione esiste.
// Non è così: il CRM scrive anche i NO. `ascensore` vale "Si" o "No", `giardino`
// vale "Nessuno", `parcheggio` è una frase che spesso comincia con «Nessun posto
// auto…» o «Box auto NON inclusi…». Misurato il 06-07/10 sulla produzione:
//  · il JSON-LD dichiarava `Ascensore: true` su ogni casa col campo a "No"
//    (12 su triestevillas.com, 8 su triesteimmobiliare.com, 5 su friulivillas.com),
//    `Giardino: true` dove il CRM dice "Nessuno" (13 e 7), `Box / posti auto:
//    true` dove il testo dice che non ce ne sono;
//  · su triestevillas.com, nelle pagine en/de/sl, lo stesso errore era VISIBILE:
//    «Lift: Yes», «Aufzug: Ja», «Dvigalo: Da» su un quarto piano senza ascensore
//    — lì la tabella sostituiva il testo italiano con un «sì» di presenza.
//
// LA REGOLA. Tre stati, non due:
//   true  = c'è (un sì esplicito, una casella spuntata, un valore che descrive);
//   false = il CRM dice di NO, con una parola che è solo un no;
//   null  = non si sa: campo vuoto, casella non spuntata, oppure un testo libero
//           che non è né un sì né un no. Di ciò che non si sa non si dichiara
//           niente: né la riga «Sì» in tabella, né la voce nel JSON-LD.
// L'errore ammesso è uno solo, ed è quello prudente: tacere una dotazione che
// c'è. Mai dichiararne una che non c'è.
// ─────────────────────────────────────────────────────────────────────────────

export type Presenza = boolean | null;

type Valore = string | boolean | null | undefined;

// Vocabolario CHIUSO: valori che sono un sì o un no e nient'altro.
const SOLO_SI = /^(s[iì]|yes|true|1|presente)$/i;
const SOLO_NO = /^(no|none|nessun[oa]?|assente)$/i;
// Una casella non spuntata che arriva come testo: non dichiarato, NON «no» —
// su Airtable «non spuntato» vuol dire che nessuno l'ha compilato.
const NON_DETTO = /^(false|0|-|n\/?[ad]\.?)$/i;

function pulito(v: Valore): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

// Il valore è SOLO un sì o un no (e quindi si traduce, invece di mostrarlo)?
export function soloSiNo(v: Valore): boolean {
  const s = pulito(v);
  return s != null && (SOLO_SI.test(s) || SOLO_NO.test(s));
}

// Campi a scelta (ascensore: Si/No · giardino: Privato/Condominiale/Nessuno ·
// arredato: Si/No/Parzialmente) e caselle (terrazzo, balcone, vista mare…).
export function presenza(v: Valore): Presenza {
  if (v === true) return true;
  const s = pulito(v);
  if (s == null || NON_DETTO.test(s)) return null;
  if (SOLO_NO.test(s)) return false;
  return true;
}

// Parole che negano. Confini di parola fatti a mano: `\b` non conosce le
// lettere accentate («né»).
const NEGA =
  /(^|[^\p{L}])(no|non|né|nessun[oa]?|senza|a parte|opzional[ei]|optional|esclus[oiae]|assent[ei]|not|without)(?=$|[^\p{L}])/iu;

// Testo libero (parcheggio): il CRM ci scrive una frase. È un sì solo se la
// PRIMA proposizione non nega — «In giardino 2 posti scoperti inclusi. Box
// doppio acquistabile a parte» è un sì, «Nessun posto auto incluso. Box doppio
// acquistabile a parte» no. Un testo che nega non diventa `false`: un'euristica
// può tacere, non può affermare un'assenza. Resta `null`, e chi vuole il
// dettaglio legge la frase (che la scheda italiana mostra per intero).
export function presenzaDaTesto(v: Valore): Presenza {
  if (v === true) return true;
  const s = pulito(v);
  if (s == null || NON_DETTO.test(s)) return null;
  if (SOLO_NO.test(s)) return false;
  const prima = s.split(/\.\s|;|\n/)[0];
  return NEGA.test(prima) ? null : true;
}

// Piscina: il campo del CRM è stato riusato per cose che piscine non sono
// ("PUBLIC STAIRS TO SECLUDED BEACH AREA") e per piscine solo POSSIBILI
// ("POOL OPTION", "PROJECT WITH POOL"). È un sì solo se il testo nomina una
// piscina e non la dà per opzione — la stessa lettura di mapRiga/mapRecord su
// triestevillas.com, qui valida per tutti e quattro i siti.
export function presenzaPiscina(v: Valore): Presenza {
  if (v === true) return true;
  const s = pulito(v);
  if (s == null || NON_DETTO.test(s)) return null;
  if (SOLO_NO.test(s)) return false;
  if (SOLO_SI.test(s)) return true;
  if (!/piscin|pool/i.test(s)) return null;
  if (/option|opzion|project|possibilit/i.test(s)) return null;
  return true;
}

export type ChiaveDotazione =
  | "terrazzo"
  | "balcone"
  | "giardino"
  | "piscina"
  | "ascensore"
  | "parcheggio"
  | "accessoDisabili"
  | "vistaMare"
  | "arredato";

// I soli campi che la regola legge: ogni `Property` dei quattro siti ci sta.
export type CasaPerDotazioni = Partial<Record<ChiaveDotazione, string | boolean | null>>;

export type StatoDotazioni = Record<ChiaveDotazione, Presenza>;

// Lo stato di tutte le dotazioni di una casa. La scheda lo calcola UNA volta e
// ci costruisce sia le righe della tabella sia le voci del JSON-LD: nascendo
// dalla stessa lettura non possono più dire due cose diverse.
export function statoDotazioni(p: CasaPerDotazioni): StatoDotazioni {
  return {
    terrazzo: presenza(p.terrazzo),
    balcone: presenza(p.balcone),
    giardino: presenza(p.giardino),
    piscina: presenzaPiscina(p.piscina),
    ascensore: presenza(p.ascensore),
    parcheggio: presenzaDaTesto(p.parcheggio),
    accessoDisabili: presenza(p.accessoDisabili),
    vistaMare: presenza(p.vistaMare),
    arredato: presenza(p.arredato),
  };
}

export type VoceSchema = { name: string; value: boolean };

// Le voci di amenityFeature, nell'ordine di `nomi`. Esce solo ciò che si SA:
// `true` per ciò che c'è, `false` per ciò che il CRM dice di non avere (un
// quarto piano senza ascensore è un fatto, e a chi cerca serve saperlo); ciò
// che è `null` non esce.
export function vociSchema(
  stato: StatoDotazioni,
  nomi: Partial<Record<ChiaveDotazione, string>>,
): VoceSchema[] {
  const out: VoceSchema[] = [];
  for (const chiave of Object.keys(nomi) as ChiaveDotazione[]) {
    const name = nomi[chiave];
    const value = stato[chiave];
    if (name && value !== null) out.push({ name, value });
  }
  return out;
}
