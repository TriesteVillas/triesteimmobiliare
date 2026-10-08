// Gli indirizzi dei siti del gruppo, per lingua — UNA tabella, letta dal piè
// di pagina e da /gruppo (08/10/2026). Prima erano due copie a mano, con la
// barra finale e l'host sbagliato: www.triestevillas.com (308 verso l'apex),
// friulivillas.com/en/ e lignanovillas.com/it/ (308), e la radice italiana di
// TriesteAffitti e FriuliVillas anche per chi legge in inglese, tedesco o
// sloveno — il commento diceva che /sl c'era solo su triestevillas.com, e dal
// 06/10 non era più vero. Ogni indirizzo qui risponde 200 senza rimandi
// (verificato con curl l'08/10/2026); la tabella giusta era quella del piè di
// pagina di FriuliVillas, rifatta il 06/10.
//
// Host canonico di ognuno: triestevillas.com e friulivillas.com senza www;
// triesteaffitti.com e lignanovillas.com col www. LignanoVillas ha l'inglese
// alla radice. SloveniaVillas e SappadaVillas hanno le loro tabelle
// (lib/sloveniavillas.ts, lib/sappadavillas.ts).

export type SitoGruppo = "tsv" | "affitti" | "friuli" | "lignano";
type Lingua = "it" | "en" | "de" | "sl";

const SITI: Record<Lingua, Record<SitoGruppo, string>> = {
  it: {
    tsv: "https://triestevillas.com",
    affitti: "https://www.triesteaffitti.com",
    friuli: "https://friulivillas.com",
    lignano: "https://www.lignanovillas.com/it",
  },
  en: {
    tsv: "https://triestevillas.com/en",
    affitti: "https://www.triesteaffitti.com/en",
    friuli: "https://friulivillas.com/en",
    lignano: "https://www.lignanovillas.com",
  },
  de: {
    tsv: "https://triestevillas.com/de",
    affitti: "https://www.triesteaffitti.com/de",
    friuli: "https://friulivillas.com/de",
    lignano: "https://www.lignanovillas.com/de",
  },
  sl: {
    tsv: "https://triestevillas.com/sl",
    affitti: "https://www.triesteaffitti.com/sl",
    friuli: "https://friulivillas.com/sl",
    lignano: "https://www.lignanovillas.com/sl",
  },
};

/** I quattro indirizzi nella lingua della pagina (italiano come ripiego). */
export function sitiGruppo(locale: string): Record<SitoGruppo, string> {
  return SITI[(locale as Lingua) in SITI ? (locale as Lingua) : "it"];
}
