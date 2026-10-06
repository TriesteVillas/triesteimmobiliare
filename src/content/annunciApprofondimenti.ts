/* GLI APPROFONDIMENTI DELLE SCHEDE (06/10/2026) — un testo più lungo dei
   riquadri in evidenza (content/annunciRiquadri.ts) su ciò che sta INTORNO
   alla casa: il borgo, la sua storia, i sentieri, il paesaggio. Si legge dopo
   la descrizione, in un riquadro che si apre: il primo paragrafo è sempre
   visibile, il resto con «Continua a leggere». La prima casa che lo usa è
   quella di borgo a Contovello.

   Registro lato sito, come i riquadri: chiave = codice di catalogo
   (TSV-PROP-…, `Property.id`), perché il CRM oggi non ha un campo per questi
   testi. Il giorno che ce l'avrà, la scheda lo legge da lì e questo file si
   svuota.

   Le quattro lingue sono OBBLIGATORIE (il tipo lo impone). Ogni voce:
     · `voce`      — la parola della barra di navigazione («Il borgo»);
     · `titolo`    — il titolo del riquadro;
     · `paragrafi` — il testo, un paragrafo per elemento; il primo resta
                     visibile a riquadro chiuso, quindi deve reggersi da solo.

   ⛔ Qui si scrive per il PUBBLICO: mai il nome interno dell'immobile, mai il
   nome di chi vende (regola ferrea, KB CLAUDE.md §3). Un fatto storico si
   pubblica solo se ha una fonte; una tradizione si scrive come tradizione
   («si racconta»), mai come fatto. */

import type { Locale } from "@/i18n/routing";

export type Testi4 = Record<Locale, string>;
export type Paragrafi4 = Record<Locale, readonly string[]>;

export type Approfondimento = {
  voce: Testi4;
  titolo: Testi4;
  paragrafi: Paragrafi4;
};

export const ANNUNCI_APPROFONDIMENTI: Readonly<Record<string, Approfondimento>> = {
  // Il borgo di Contovello (06/10/2026). Testo di partenza: la nota inglese
  // girata da Martino il 06/10, scritta da chi il borgo lo abita. Verificato
  // prima di pubblicare (it.wikipedia «Contovello», en.wikipedia «Prosecco»,
  // sentieri.percorsiprovinciats.it «Cedas–Contovello–Miramare»):
  //   · 1413: nel luglio di quell'anno il Comune di Trieste fa acquisire terre
  //     per insediarvi contadini slavi del Carso — l'origine del borgo e dei
  //     viticoltori del Prosekar sono lo stesso fatto, e qui stanno insieme;
  //   · San Girolamo è la chiesa parrocchiale; quota 245 m («circa 250»);
  //   · il Prosekar dei villaggi di Contovello, Prosecco e Santa Croce è il
  //     vino da cui prende il nome il Prosecco;
  //   · dallo stagno del borgo il sentiero n. 9 scende a gradini a Miramare.
  // Corretto rispetto alla nota: «il laghetto di epoca romana» (nessuna fonte:
  // tolto), «le Dolomiti innevate» (da qui si vedono le Alpi Giulie e Carniche:
  // scritto «le Alpi»), «pendio interamente non costruito» (lo attraversano la
  // Costiera e la ferrovia: «quasi intatto»). L'etimologia «conta vele» e
  // l'osmiza dei trenta giorni sono della nota, scritte come racconto e come
  // testimonianza di chi ci vive.
  "TSV-PROP-CONTOVELLO-62": {
    voce: { it: "Il borgo", en: "The village", de: "Das Dorf", sl: "Vas" },
    titolo: {
      it: "Contovello, il borgo sopra il golfo",
      en: "Contovello, the village above the gulf",
      de: "Contovello, das Dorf über dem Golf",
      sl: "Kontovel, vas nad zalivom",
    },
    paragrafi: {
      it: [
        "Contovello nasce nel 1413, quando il Comune di Trieste destinò delle terre all'insediamento di contadini slavi venuti dai villaggi del Carso. Sono loro ad aver coltivato, sui pastini attorno alla chiesa di San Girolamo, il Prosekar: il vino da cui prende il nome il Prosecco. La vigna qui c'è ancora: nel borgo un piccolo produttore apre un'osmiza per una trentina di giorni l'anno e vende il vino delle uve che crescono a cento metri di distanza.",
        "L'origine del nome non è certa. Si racconta che venga dalle mogli dei pescatori, che da quassù contavano le vele della flotta al rientro per sapere che nessuno fosse rimasto in mare: conta, vele.",
        "Il borgo sta a circa 250 metri sul mare e guarda senza ostacoli il golfo di Trieste, l'Italia, la Slovenia e la Croazia; nelle giornate limpide d'inverno si vedono le Alpi innevate. Il pendio che scende al mare è rimasto quasi intatto: vigneti a terrazze, uliveti e bosco.",
        "Attorno vive molta fauna selvatica: rondoni, rondini e tanti altri uccelli, la puzzola, i cinghiali e, ogni tanto, lo sciacallo dorato.",
        "Per chi ama camminare, i sentieri partono quasi in ogni direzione. Dallo stagno del borgo, oggi oasi naturalistica, un sentiero a gradini scende fino al mare di Miramare e al suo castello; poco lontano corre la celebre Strada Napoleonica, da Prosecco a Opicina.",
      ],
      en: [
        "Contovello dates from 1413, when the city of Trieste set aside land for Slavic farmers from the villages of the Karst. On the terraces around the church of San Girolamo they grew Prosekar, the wine that gave Prosecco its name. Winemaking is still alive here: in the village a smallholder opens an osmiza for about thirty days a year, selling wine made from grapes grown just a hundred metres away.",
        "The origin of the name is not certain. Some say it goes back to the fishermen's wives, who watched from up here for the fleet to return, counting the sails to be sure their loved ones had not been lost at sea: conta, vele — count the sails.",
        "The village sits about 250 metres above the sea, with uninterrupted views over the Gulf of Trieste, Italy, Slovenia and Croatia; on clear winter days the snow-capped Alps come into view. The steep slope down to the sea has stayed almost untouched: terraced vineyards, olive groves and woodland.",
        "The area is home to plenty of wildlife: swifts, swallows and many other birds, polecats, wild boar and the occasional golden jackal.",
        "For walkers, trails lead off in almost every direction. From the village pond, now a nature reserve, a stepped path runs down to the sea at Miramare and its castle; close by is the famous Strada Napoleonica, from Prosecco to Opicina.",
      ],
      de: [
        "Contovello entstand 1413, als die Stadt Triest Land für die Ansiedlung slawischer Bauern aus den Dörfern des Karsts bereitstellte. Auf den Terrassen rund um die Kirche San Girolamo bauten sie den Prosekar an – den Wein, nach dem der Prosecco benannt ist. Der Weinbau lebt hier weiter: Im Dorf öffnet ein kleiner Erzeuger rund dreißig Tage im Jahr eine Osmiza und verkauft den Wein aus Trauben, die nur hundert Meter entfernt wachsen.",
        "Woher der Name kommt, ist nicht sicher. Man erzählt, er gehe auf die Frauen der Fischer zurück, die von hier oben die Segel der heimkehrenden Flotte zählten, um zu wissen, dass niemand auf See geblieben war: conta, vele – zähl die Segel.",
        "Das Dorf liegt rund 250 Meter über dem Meer, mit freiem Blick über den Golf von Triest, Italien, Slowenien und Kroatien; an klaren Wintertagen sieht man die verschneiten Alpen. Der Steilhang zum Meer ist nahezu unberührt geblieben: Weinterrassen, Olivenhaine und Wald.",
        "Rundherum lebt viel Wild: Mauersegler, Schwalben und viele andere Vögel, Iltisse, Wildschweine und hin und wieder ein Goldschakal.",
        "Wer gern wandert, findet Wege in fast jede Richtung. Vom Dorfteich, heute ein Naturschutzgebiet, führt ein Stufenweg hinunter ans Meer bei Miramare und zu seinem Schloss; ganz in der Nähe verläuft die berühmte Strada Napoleonica von Prosecco nach Opicina.",
      ],
      sl: [
        "Kontovel je nastal leta 1413, ko je tržaška občina namenila zemljo za naselitev slovanskih kmetov iz kraških vasi. Na terasah okoli cerkve sv. Jeronima so gojili prosekar, vino, po katerem je dobil ime prosecco. Vinogradništvo tu še živi: v vasi manjši pridelovalec za približno trideset dni na leto odpre osmico in prodaja vino iz grozdja, ki raste le sto metrov stran.",
        "Izvor imena ni gotov. Pripoveduje se, da izhaja od ribiških žena, ki so od tod gor štele jadra vračajoče se flote, da bi vedele, da ni nihče ostal na morju: conta, vele — preštej jadra.",
        "Vas leži približno 250 metrov nad morjem, z odprtim razgledom na Tržaški zaliv, Italijo, Slovenijo in Hrvaško; ob jasnih zimskih dneh se vidijo zasnežene Alpe. Strmo pobočje proti morju je ostalo skoraj nedotaknjeno: vinogradi na terasah, oljčni nasadi in gozd.",
        "Okoli živi veliko divjih živali: hudourniki, lastovke in mnoge druge ptice, dihurji, divji prašiči in občasno zlati šakal.",
        "Za ljubitelje pohodništva vodijo poti skoraj v vse smeri. Od vaškega kala, danes naravnega rezervata, se stopničasta pot spušča do morja pri Miramaru in njegovem gradu; nedaleč stran poteka znamenita Napoleonova cesta od Proseka do Opčin.",
      ],
    },
  },
};

/** Un approfondimento nella lingua della pagina. */
export type ApprofondimentoLocale = {
  voce: string;
  titolo: string;
  paragrafi: string[];
};

const lingua = (locale: string): Locale =>
  locale === "en" || locale === "de" || locale === "sl" ? locale : "it";

/** L'approfondimento di un immobile nella lingua della pagina, o null. Senza
 *  titolo o senza paragrafi in quella lingua non esce niente: meglio nessun
 *  riquadro che uno a metà. La chiave è il codice di catalogo. */
export function approfondimentoAnnuncio(
  code: string | null | undefined,
  locale: string,
): ApprofondimentoLocale | null {
  const k = code?.trim().toUpperCase();
  if (!k || !Object.prototype.hasOwnProperty.call(ANNUNCI_APPROFONDIMENTI, k)) return null;
  const a = ANNUNCI_APPROFONDIMENTI[k];
  const l = lingua(locale);
  const titolo = a.titolo[l]?.trim();
  const voce = a.voce[l]?.trim() || titolo;
  const paragrafi = (a.paragrafi[l] ?? []).map((p) => p.trim()).filter(Boolean);
  if (!titolo || !voce || !paragrafi.length) return null;
  return { voce, titolo, paragrafi };
}
