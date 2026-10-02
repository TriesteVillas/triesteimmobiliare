/* I RIQUADRI IN EVIDENZA DELLE SCHEDE (02/10/2026) — due o tre fatti che di
   un immobile contano più dei dati di tabella, scritti in alto nella scheda,
   subito sotto l'hero (prezzo e titolo): «Rendita Airbnb 2025», «Detrazioni
   fiscali trasferibili»… La prima casa che li usa è quella di borgo a
   Contovello.

   Registro lato sito, come content/annunciVideo.ts: chiave = codice di
   catalogo (TSV-PROP-…, `Property.id`), perché il CRM oggi non ha un campo
   per questi riquadri (verificato il 02/10 sulla vetrina di tsv-pg: nessuna
   colonna del genere). Il giorno che il CRM ne avrà uno, la scheda lo legge
   da lì e questo file si svuota.

   Le quattro lingue sono OBBLIGATORIE (il tipo lo impone: un riquadro senza
   lo sloveno non compila). Ogni voce:
     · `tipo`   — l'icona: rendita · fisco · chiave · info;
     · `cifra`  — opzionale, il numero da leggere per primo («32.600 €»),
                  già scritto nella forma della lingua;
     · `titolo` — una riga;
     · `testo`  — due o tre righe al massimo;
     · `nota`   — opzionale, il carattere piccolo (condizioni, fonte, «da
                  verificare col proprio commercialista»).
   Al massimo TRE riquadri per scheda: oltre, la scheda li taglia (un muro di
   riquadri non mette in evidenza niente).

   ⛔ Qui si scrive per il PUBBLICO: mai il nome interno dell'immobile, mai il
   nome di chi vende (regola ferrea, KB CLAUDE.md §3). Un dato economico
   (rendita, detrazioni) si pubblica solo se chi vende l'ha dichiarato e il
   numero è documentato. */

import type { Locale } from "@/i18n/routing";

export type Testi4 = Record<Locale, string>;

export type TipoRiquadro = "rendita" | "fisco" | "chiave" | "info";

export type Riquadro = {
  tipo: TipoRiquadro;
  cifra?: Testi4;
  titolo: Testi4;
  testo: Testi4;
  nota?: Testi4;
};

export const MAX_RIQUADRI = 3;

export const ANNUNCI_RIQUADRI: Readonly<Record<string, readonly Riquadro[]>> = {
  // ⏳ Casa di borgo a Contovello: struttura pronta, testi in arrivo da
  // Martino. Si toglie il commento e si riempiono le quattro lingue.
  // "TSV-PROP-CONTOVELLO-62": [
  //   {
  //     tipo: "rendita",
  //     cifra: { it: "32.600 €", en: "€32,600", de: "32.600 €", sl: "32.600 €" },
  //     titolo: { it: "…", en: "…", de: "…", sl: "…" },
  //     testo: { it: "…", en: "…", de: "…", sl: "…" },
  //     nota: { it: "…", en: "…", de: "…", sl: "…" },
  //   },
  //   {
  //     tipo: "fisco",
  //     titolo: { it: "…", en: "…", de: "…", sl: "…" },
  //     testo: { it: "…", en: "…", de: "…", sl: "…" },
  //   },
  // ],
};

/** Un riquadro nella lingua della pagina. */
export type RiquadroLocale = {
  tipo: TipoRiquadro;
  cifra: string | null;
  titolo: string;
  testo: string;
  nota: string | null;
};

const lingua = (locale: string): Locale =>
  locale === "en" || locale === "de" || locale === "sl" ? locale : "it";
const pieno = (s: string | undefined): string | null => (typeof s === "string" && s.trim() && s.trim() !== "…" ? s.trim() : null);

/** I riquadri di un immobile nella lingua della pagina (al massimo tre), o [].
 *  Un riquadro con titolo o testo vuoto in quella lingua si salta: meglio un
 *  riquadro in meno che uno a metà. La chiave è il codice di catalogo. */
export function riquadriAnnuncio(code: string | null | undefined, locale: string): RiquadroLocale[] {
  const k = code?.trim().toUpperCase();
  if (!k || !Object.prototype.hasOwnProperty.call(ANNUNCI_RIQUADRI, k)) return [];
  const l = lingua(locale);
  const out: RiquadroLocale[] = [];
  for (const r of ANNUNCI_RIQUADRI[k]) {
    const titolo = pieno(r.titolo[l]);
    const testo = pieno(r.testo[l]);
    if (!titolo || !testo) continue;
    out.push({ tipo: r.tipo, cifra: pieno(r.cifra?.[l]), titolo, testo, nota: pieno(r.nota?.[l]) });
    if (out.length >= MAX_RIQUADRI) break;
  }
  return out;
}
