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
  // Casa di borgo a Contovello (02/10/2026). Fonti: la rendita 2025 è il
  // dato dichiarato da chi vende e confermato da Martino («dichiarato, tutto
  // in regola, pubblicabile»); le detrazioni da Martino, con la regola dell'art.
  // 16-bis c. 8 TUIR (le quote residue passano a chi compra salvo diverso
  // accordo; la quota dell'anno spetta a chi possiede la casa al 31/12) e il
  // limite dell'IRPEF dovuta in Italia (guida Agenzia delle Entrate). Airbnb
  // non trasferisce annunci né recensioni fra account (Help Center): qui non
  // lo si promette.
  "TSV-PROP-CONTOVELLO-62": [
    {
      tipo: "rendita",
      cifra: { it: "32.600 €", en: "€32,600", de: "32.600 €", sl: "32.600 €" },
      titolo: {
        it: "Incassati in affitto breve nel 2025",
        en: "Earned from short lets in 2025",
        de: "Einnahmen aus Kurzzeitvermietung 2025",
        sl: "Prihodki od kratkoročnega najema v letu 2025",
      },
      testo: {
        it: "Da anni è una casa vacanze molto amata: 4,86 su 5 su Airbnb con 85 recensioni, 9,5 su 10 su Booking. Ricavi dichiarati e attività in regola.",
        en: "A much-loved holiday home for years: 4.86 out of 5 on Airbnb from 85 reviews, 9.5 out of 10 on Booking. Declared income, fully compliant.",
        de: "Seit Jahren ein sehr beliebtes Ferienhaus: 4,86 von 5 bei Airbnb aus 85 Bewertungen, 9,5 von 10 bei Booking. Erklärte Einnahmen, alles ordnungsgemäß.",
        sl: "Že leta zelo priljubljena počitniška hiša: 4,86 od 5 na Airbnbju (85 ocen) in 9,5 od 10 na Bookingu. Prijavljeni prihodki, dejavnost v skladu s predpisi.",
      },
      nota: {
        it: "Ricavi lordi, prima di spese e imposte.",
        en: "Gross revenue, before costs and taxes.",
        de: "Bruttoeinnahmen, vor Kosten und Steuern.",
        sl: "Bruto prihodki, pred stroški in davki.",
      },
    },
    {
      tipo: "fisco",
      cifra: { it: "≈ 4.500 € l'anno", en: "≈ €4,500 a year", de: "≈ 4.500 € pro Jahr", sl: "≈ 4.500 € na leto" },
      titolo: {
        it: "Detrazioni fiscali che passano a chi compra",
        en: "Tax deductions that pass to the buyer",
        de: "Steuerabzüge, die auf den Käufer übergehen",
        sl: "Davčne olajšave, ki preidejo na kupca",
      },
      testo: {
        it: "I lavori di recupero danno diritto a una detrazione in dieci anni: restano quattro annualità, di circa 4.500 € ciascuna. I dettagli li diamo di persona.",
        en: "The renovation qualifies for a ten-year tax deduction: four yearly instalments remain, of about €4,500 each. We share the details in person.",
        de: "Die Sanierung berechtigt zu einem auf zehn Jahre verteilten Steuerabzug: Es bleiben vier Jahresraten von je rund 4.500 €. Die Einzelheiten besprechen wir persönlich.",
        sl: "Obnova daje pravico do davčne olajšave, razdeljene na deset let: ostajajo štirje letni obroki, vsak približno 4.500 €. Podrobnosti povemo osebno.",
      },
      nota: {
        it: "Per chi paga l'IRPEF in Italia, entro l'imposta dovuta. Le quattro annualità valgono con rogito entro il 31/12/2026.",
        en: "For buyers who pay income tax (IRPEF) in Italy, up to the tax due. Four instalments apply if completion is by 31/12/2026.",
        de: "Für Käufer, die in Italien Einkommensteuer (IRPEF) zahlen, bis zur Höhe der geschuldeten Steuer. Vier Raten bei Beurkundung bis 31.12.2026.",
        sl: "Za kupce, ki plačujejo dohodnino (IRPEF) v Italiji, do višine dolgovanega davka. Štirje obroki veljajo ob podpisu pogodbe do 31. 12. 2026.",
      },
    },
    {
      tipo: "chiave",
      titolo: {
        it: "Se la vivi solo una parte dell'anno",
        en: "If you live here only part of the year",
        de: "Wenn Sie nur einen Teil des Jahres hier sind",
        sl: "Če boste tu živeli le del leta",
      },
      testo: {
        it: "Ti aiutiamo a portare avanti l'affitto breve nei mesi in cui non ci sei: la casa arriva con un'attività avviata, ospiti soddisfatti e una reputazione costruita in questi anni.",
        en: "We help you keep the short lets going in the months you are away: the house comes with an established business, happy guests and a reputation built over the years.",
        de: "Wir helfen Ihnen, die Kurzzeitvermietung in den Monaten Ihrer Abwesenheit weiterzuführen: Das Haus kommt mit einem eingespielten Betrieb, zufriedenen Gästen und einem über Jahre aufgebauten Ruf.",
        sl: "Pomagamo vam nadaljevati kratkoročni najem v mesecih, ko vas ni: hiša prihaja z utečeno dejavnostjo, zadovoljnimi gosti in ugledom, zgrajenim v teh letih.",
      },
      nota: {
        it: "Chi compra registra l'attività a proprio nome (CIN compreso).",
        en: "The buyer registers the business in their own name (including the CIN).",
        de: "Der Käufer meldet die Tätigkeit auf eigenen Namen an (einschließlich CIN).",
        sl: "Kupec dejavnost registrira na svoje ime (vključno s CIN).",
      },
    },
  ],
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
