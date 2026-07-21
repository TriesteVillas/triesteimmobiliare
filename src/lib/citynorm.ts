// Normalizzazione della città di residenza, in scrittura.
//
// Perché in scrittura e non a colpo d'occhio: su questo campo ci gira un FILTRO.
// "trieste", "TRIESTE", "Trieste " e "Triest" sono la stessa città per un umano e
// quattro voci diverse in una tendina — un filtro che spezza il bacino in quattro
// è peggio di nessun filtro, perché mente sui numeri.
//
// Perché NON un campo `_norm` separato. In LEAD_ il pattern esiste già ed è fallito:
// `zona_interesse_norm` è valorizzato su 125 record su 4.403 (2,8%), ha UN solo
// riferimento nel codice del CRM, e il 34% dei suoi valori sta fuori dal vocabolario
// degli immobili. Un campo che nessuno mantiene diventa un campo che mente. Qui: un
// campo solo, normalizzato da chi scrive.
//
// Perché NON un select chiuso. Il dominio è mondiale — dai lead della collezione
// arrivano Austria, Ucraina, Norvegia, Stati Uniti, Cina — e su Airtable un select
// con `typecast:true` genera una choice nuova a ogni refuso: sarebbe testo libero
// travestito, con in più il rumore.

/** Esonimi ricondotti a una forma sola. Solo i bacini che questa agenzia serve
 *  davvero: Trieste sta su una frontiera linguistica, e lo stesso posto arriva
 *  scritto in tre lingue a seconda di chi compila il form (`lingua` nel payload).
 *  Chiave = forma normalizzata in minuscolo senza accenti; valore = forma canonica. */
const ALIAS: Record<string, string> = {
  // Trieste e il suo intorno
  triest: "Trieste", trst: "Trieste", ts: "Trieste", "trieste ts": "Trieste",
  muggia: "Muggia", milje: "Muggia",
  "duino aurisina": "Duino-Aurisina", devin: "Duino-Aurisina", nabrezina: "Duino-Aurisina",
  sistiana: "Sistiana", sesljan: "Sistiana",
  // Gorizia: attenzione, Gorizia e Nova Gorica sono DUE città in due Stati.
  // "Gorica" da solo è ambiguo: lo lasciamo com'è scritto invece di indovinare.
  gorz: "Gorizia", "gorizia go": "Gorizia",
  monfalcone: "Monfalcone", trzic: "Monfalcone",
  // Slovenia / Croazia
  ljubljana: "Lubiana", laibach: "Lubiana",
  koper: "Capodistria", capodistria: "Capodistria",
  portoroz: "Portorose", portoroe: "Portorose",
  piran: "Pirano", pirano: "Pirano",
  rijeka: "Fiume", fiume: "Fiume",
  pula: "Pola", pola: "Pola",
  zagreb: "Zagabria", agram: "Zagabria",
  // Austria / Germania / Svizzera
  wien: "Vienna", vienne: "Vienna",
  graz: "Graz",
  klagenfurt: "Klagenfurt", celovec: "Klagenfurt",
  villach: "Villaco", beljak: "Villaco", villaco: "Villaco",
  salzburg: "Salisburgo", salisburgo: "Salisburgo",
  munchen: "Monaco di Baviera", munich: "Monaco di Baviera", muenchen: "Monaco di Baviera",
  "monaco di baviera": "Monaco di Baviera",
  koln: "Colonia", cologne: "Colonia", koeln: "Colonia",
  frankfurt: "Francoforte", "frankfurt am main": "Francoforte",
  hamburg: "Amburgo", berlin: "Berlino",
  zurich: "Zurigo", zuerich: "Zurigo", zurigo: "Zurigo",
  genf: "Ginevra", geneva: "Ginevra", geneve: "Ginevra",
  basel: "Basilea", bale: "Basilea",
  // Italia, esonimi delle città che i clienti stranieri scrivono in lingua
  venice: "Venezia", venedig: "Venezia",
  milan: "Milano", mailand: "Milano",
  rome: "Roma", rom: "Roma",
  turin: "Torino", florence: "Firenze", florenz: "Firenze",
  naples: "Napoli", neapel: "Napoli",
  genoa: "Genova", genua: "Genova",
  padua: "Padova", bozen: "Bolzano", trient: "Trento",
  // Resto d'Europa e piazze ricorrenti
  london: "Londra", paris: "Parigi", prag: "Praga", prague: "Praga",
  warsaw: "Varsavia", warschau: "Varsavia",
  lisbon: "Lisbona", lissabon: "Lisbona",
  athens: "Atene", athen: "Atene",
  brussels: "Bruxelles", bruessel: "Bruxelles",
  singapur: "Singapore", hongkong: "Hong Kong",
};

/** Minuscolo, senza accenti, senza punteggiatura, spazi collassati. Solo per
 *  confrontare con ALIAS: NON è il valore che finisce su Airtable. */
function key(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "vIENNA " → "Vienna"; "duino-aurisina" → "Duino-Aurisina". Le particelle
 *  restano minuscole ("Monaco di Baviera", "Reggio nell'Emilia"). */
function titleCase(s: string): string {
  const minuscole = new Set(["di", "de", "del", "della", "dei", "da", "in", "su", "sul", "a", "al", "am", "an", "der", "auf", "e", "and", "of", "the", "sur", "les", "la", "le", "el",
    // particelle elise: lo split avviene sull'apostrofo, quindi "nell" arriva da solo
    "nell", "dell", "sull", "all", "dall", "l", "d"]);
  return s
    .split(/(\s+|-|')/)
    .map((tok, i) => {
      if (/^(\s+|-|')$/.test(tok)) return tok;
      const low = tok.toLowerCase();
      // La prima parola si maiuscola sempre, anche se è una particella ("La Spezia").
      if (i > 0 && minuscole.has(low)) return low;
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join("");
}

/**
 * Città dichiarata → forma canonica da scrivere su `PC_RICHIESTE.citta` e
 * `LEAD_.citta_residenza`. Stringa vuota se non c'è niente di utilizzabile:
 * meglio un campo vuoto — che l'operatore riconosce a colpo d'occhio — che una
 * voce spazzatura in una tendina, che invece sembra un dato.
 */
export function normCity(raw: string): string {
  const grezzo = (raw ?? "").trim().replace(/\s+/g, " ");
  if (grezzo.length < 2) return "";
  // Scarti tipici del campo libero: chi non vuole rispondere scrive un trattino
  // o un punto interrogativo, e quello NON deve diventare una città.
  if (!/[a-zA-Z\u00c0-\u024f]/.test(grezzo)) return "";
  const alias = ALIAS[key(grezzo)];
  if (alias) return alias;
  return titleCase(grezzo).slice(0, 80);
}
