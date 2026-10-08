// Traduzioni dei VALORI dei campi a elenco (tipologia, stato, cucina,
// riscaldamento, giardino, piano) e delle chip dei tag, in codice — copiate
// dal gemello triestevillas-web (src/lib/listingI18n.ts, 08/10/2026), dove
// sono verificate e servono da agosto. Fino all'08/10 TSI non le aveva: su /en
// le card dicevano «Appartamento» e «Villetta a schiera» (23 card su 23), e la
// scheda mostrava i tag grezzi del CRM («parz arredato», «non adatto anziani»).
//
// Sloveno: terminologia della guida di stile del gruppo — «stanovanje» mai
// «apartma» (= unità turistica), «penthouse» mai «atika», «garaža» mai «box»,
// «dvigalo» mai «lift», «spalnica» per la camera da letto.

type L = { en: string; de: string; sl: string };

// IT option value → English / German / Slovene.
const ENUM: Record<string, L> = {
  // tipologia
  "Appartamento": { en: "Apartment", de: "Wohnung", sl: "Stanovanje" },
  "Attico - Mansarda": { en: "Penthouse / Attic", de: "Penthouse / Dachgeschoss", sl: "Penthouse / Mansarda" },
  "Villa": { en: "Villa", de: "Villa", sl: "Vila" },
  "Villetta a schiera": { en: "Townhouse", de: "Reihenhaus", sl: "Vrstna hiša" },
  "Casa indipendente": { en: "Detached house", de: "Einfamilienhaus", sl: "Samostojna hiša" },
  "Loft": { en: "Loft", de: "Loft", sl: "Loft" },
  "Rustico - Casale": { en: "Farmhouse", de: "Bauernhaus", sl: "Kmečka hiša" },
  "Garage - Box": { en: "Garage", de: "Garage", sl: "Garaža" },
  "Magazzino - Deposito": { en: "Warehouse / Storage", de: "Lager / Depot", sl: "Skladišče" },
  "Capannone": { en: "Industrial shed", de: "Lagerhalle", sl: "Industrijska hala" },
  "Terreno": { en: "Land", de: "Grundstück", sl: "Zemljišče" },
  "Palazzo - Edificio": { en: "Building", de: "Gebäude", sl: "Stavba" },
  "Negozio - Locale commerciale": { en: "Shop / Retail unit", de: "Geschäft / Ladenlokal", sl: "Trgovina / Poslovni prostor" },
  "Ufficio - Coworking": { en: "Office / Coworking", de: "Büro / Coworking", sl: "Pisarna / Coworking" },
  "Attività commerciale": { en: "Business", de: "Gewerbe", sl: "Poslovna dejavnost" },
  "Posto Auto/Moto": { en: "Parking space", de: "Stellplatz", sl: "Parkirno mesto" },
  "Castello": { en: "Castle", de: "Schloss", sl: "Grad" },
  "Struttura Ricettiva": { en: "Hospitality property", de: "Beherbergungsbetrieb", sl: "Nastanitveni obrat" },
  "Hotel": { en: "Hotel", de: "Hotel", sl: "Hotel" },
  // stato
  "Ottimo / Ristrutturato": { en: "Excellent / Renovated", de: "Ausgezeichnet / Renoviert", sl: "Odlično / Prenovljeno" },
  "Buono / Abitabile": { en: "Good / Habitable", de: "Gut / Bewohnbar", sl: "Dobro / Vseljivo" },
  "Nuovo / In costruzione": { en: "New / Under construction", de: "Neu / Im Bau", sl: "Novo / V gradnji" },
  "Da ristrutturare": { en: "To renovate", de: "Renovierungsbedürftig", sl: "Potrebno prenove" },
  // cucina
  "Abitabile": { en: "Eat-in", de: "Wohnküche", sl: "Kuhinja z jedilnico" },
  "A vista": { en: "Open-plan", de: "Offene Küche", sl: "Odprta kuhinja" },
  "Angolo cottura": { en: "Kitchenette", de: "Kochnische", sl: "Kuhinjska niša" },
  "Semi abitabile": { en: "Semi eat-in", de: "Halb-Wohnküche", sl: "Manjša bivalna kuhinja" },
  "Cucinotto": { en: "Small kitchen", de: "Kleine Küche", sl: "Majhna kuhinja" },
  // riscaldamento
  "Autonomo": { en: "Independent", de: "Autonom", sl: "Etažno (lastno)" },
  "Centralizzato": { en: "Centralised", de: "Zentral", sl: "Centralno" },
  // giardino
  "Nessuno": { en: "None", de: "Keiner", sl: "Brez" },
  "Privato": { en: "Private", de: "Privat", sl: "Zasebni" },
  "Condominiale": { en: "Shared", de: "Gemeinschaftlich", sl: "Skupni" },
  "Privato e condominiale": { en: "Private & shared", de: "Privat & gemeinschaftlich", sl: "Zasebni in skupni" },
  // piano — il campo Airtable è testo libero ma con un vocabolario di base
  // stabile (censimento 2026-08-11 su 781 record: «piano terra» ×84, «su più
  // livelli» ×25, «piano rialzato» ×7, «Primo piano» ×6, «ammezzato» ×3…).
  // Le combinazioni lunghe di data-entry cadono sul fallback (valore raw).
  "Piano terra": { en: "Ground floor", de: "Erdgeschoss", sl: "Pritličje" },
  "Piano rialzato": { en: "Raised ground floor", de: "Hochparterre", sl: "Visoko pritličje" },
  "Su più livelli": { en: "On multiple levels", de: "Auf mehreren Ebenen", sl: "Na več ravneh" },
  "Ammezzato": { en: "Mezzanine", de: "Mezzanin", sl: "Medetaža" },
  "Primo piano": { en: "First floor", de: "1. Obergeschoss", sl: "1. nadstropje" },
  "Secondo piano": { en: "Second floor", de: "2. Obergeschoss", sl: "2. nadstropje" },
  "Terra": { en: "Ground floor", de: "Erdgeschoss", sl: "Pritličje" },
  "T": { en: "Ground floor", de: "Erdgeschoss", sl: "Pritličje" },
  "Ultimo": { en: "Top floor", de: "Oberstes Geschoss", sl: "Zadnje nadstropje" },
  "Piano giardino": { en: "Garden level", de: "Gartengeschoss", sl: "Vrtna etaža" },
  "Interrato (-1)": { en: "Basement (-1)", de: "Untergeschoss (-1)", sl: "Klet (-1)" },
};

// I campi a testo libero (il piano) portano varianti di maiuscole dello stesso
// valore («piano terra» / «Piano terra»): indice minuscolo per il ripiego
// case-insensitive del lookup. Nessuna chiave di ENUM collide in minuscolo.
const ENUM_CI: Record<string, L> = Object.fromEntries(
  Object.entries(ENUM).map(([k, v]) => [k.toLowerCase(), v]),
);

// Resa IT dei valori grezzi da portale: «Attico - Mansarda» è la categoria di
// immobiliare.it col suo trattino da export.
const IT_DISPLAY: Record<string, string> = {
  "Attico - Mansarda": "Attico / Mansarda",
};

function pick(m: L, locale: string): string {
  return locale === "de" ? m.de : locale === "sl" ? m.sl : m.en;
}

/** Un valore a elenco nella lingua della pagina; sconosciuto → com'è (meglio
 *  una parola italiana che un vuoto). */
export function localizeValue(value: string | null, locale: string): string | null {
  if (!value) return value;
  if (locale === "it") return IT_DISPLAY[value.trim()] ?? value;
  const key = value.trim();
  const m = ENUM[key] ?? ENUM_CI[key.toLowerCase()];
  if (!m) return value;
  return pick(m, locale);
}

// LE CHIP DEI TAG — LISTA BIANCA. Si mostra solo un tag che sta qui, con la sua
// etichetta pubblica; tutto il resto tace. Fuori di proposito: i tag solo
// interni o di valutazione («NON_ADATTO_ANZIANI»), quelli che promettono un uso
// o una fascia senza una verifica dietro (USO_*, LUSSO, D_AUTORE,
// PISCINA_PROGETTABILE) e quelli degli affitti brevi. Un tag nuovo del CRM non
// esce finché qualcuno non lo scrive qui nelle quattro lingue.
// (en/de/sl dal gemello TSV; l'italiano scritto qui.)
const TAG_PUBBLICI: Record<string, { it: string; en: string; de: string; sl: string }> = {
  PISCINA: { it: "Piscina", en: "Pool", de: "Pool", sl: "Bazen" },
  GIARDINO: { it: "Giardino", en: "Garden", de: "Garten", sl: "Vrt" },
  TERRAZZA: { it: "Terrazza", en: "Terrace", de: "Terrasse", sl: "Terasa" },
  BALCONE: { it: "Balcone", en: "Balcony", de: "Balkon", sl: "Balkon" },
  BOX_AUTO: { it: "Box auto", en: "Garage", de: "Garage", sl: "Garaža" },
  POSTO_AUTO: { it: "Posto auto", en: "Parking space", de: "Stellplatz", sl: "Parkirno mesto" },
  CANTINA: { it: "Cantina", en: "Cellar", de: "Keller", sl: "Klet" },
  ASCENSORE: { it: "Ascensore", en: "Elevator", de: "Aufzug", sl: "Dvigalo" },
  ARIA_CONDIZIONATA: { it: "Aria condizionata", en: "Air conditioning", de: "Klimaanlage", sl: "Klimatska naprava" },
  CAMINO: { it: "Camino", en: "Fireplace", de: "Kamin", sl: "Kamin" },
  SAUNA: { it: "Sauna", en: "Sauna", de: "Sauna", sl: "Savna" },
  JACUZZI: { it: "Idromassaggio", en: "Jacuzzi", de: "Whirlpool", sl: "Masažna kad" },
  BARBECUE: { it: "Barbecue", en: "Barbecue", de: "Grill", sl: "Žar" },
  FIBRA_OTTICA: { it: "Fibra ottica", en: "Fibre optic", de: "Glasfaser", sl: "Optično omrežje" },
  ALLARME: { it: "Impianto d'allarme", en: "Alarm system", de: "Alarmanlage", sl: "Alarmni sistem" },
  VIDEOSORVEGLIANZA: { it: "Videosorveglianza", en: "Video surveillance", de: "Videoüberwachung", sl: "Videonadzor" },
  DOMOTICA: { it: "Domotica", en: "Home automation", de: "Smart Home", sl: "Pametna hiša" },
  VISTA_MARE: { it: "Vista mare", en: "Sea view", de: "Meerblick", sl: "Pogled na morje" },
  VISTA_PANORAMICA: { it: "Vista panoramica", en: "Panoramic view", de: "Panoramablick", sl: "Panoramski razgled" },
  VISTA_VERDE: { it: "Vista sul verde", en: "Greenery view", de: "Grünblick", sl: "Pogled na zelenje" },
  "VISTA_CITTÀ": { it: "Vista sulla città", en: "City view", de: "Stadtblick", sl: "Pogled na mesto" },
  FRONTE_MARE: { it: "Fronte mare", en: "Seafront", de: "Direkt am Meer", sl: "Neposredno ob morju" },
  FRONTE_PARCO: { it: "Di fronte al parco", en: "Park-facing", de: "Am Park", sl: "Ob parku" },
  NUOVA_COSTRUZIONE: { it: "Nuova costruzione", en: "New build", de: "Neubau", sl: "Novogradnja" },
  RISTRUTTURATO: { it: "Ristrutturato", en: "Renovated", de: "Renoviert", sl: "Prenovljeno" },
  PARI_AL_NUOVO: { it: "Pari al nuovo", en: "As new", de: "Wie neu", sl: "Kot novo" },
  DA_RISTRUTTURARE: { it: "Da ristrutturare", en: "To renovate", de: "Renovierungsbedürftig", sl: "Potrebno prenove" },
  EPOCA: { it: "D'epoca", en: "Period property", de: "Altbau", sl: "Zgodovinska stavba" },
  PIANO_NOBILE: { it: "Piano nobile", en: "Piano nobile", de: "Beletage", sl: "Piano nobile" },
  ATTICO: { it: "Attico", en: "Penthouse", de: "Penthouse", sl: "Penthouse" },
  MANSARDA: { it: "Mansarda", en: "Attic", de: "Dachgeschoss", sl: "Mansarda" },
  LOFT: { it: "Loft", en: "Loft", de: "Loft", sl: "Loft" },
  DUPLEX: { it: "Duplex", en: "Duplex", de: "Maisonette", sl: "Dvonivojsko" },
  BIFAMILIARE: { it: "Bifamiliare", en: "Semi-detached", de: "Zweifamilienhaus", sl: "Dvojček" },
  INDIPENDENTE: { it: "Indipendente", en: "Detached", de: "Freistehend", sl: "Samostojna hiša" },
  ULTIMO_PIANO: { it: "Ultimo piano", en: "Top floor", de: "Oberstes Geschoss", sl: "Zadnje nadstropje" },
  DOPPIO_AFFACCIO: { it: "Doppio affaccio", en: "Dual aspect", de: "Zwei Ausrichtungen", sl: "Okna na dve strani" },
  OPEN_SPACE: { it: "Open space", en: "Open space", de: "Open Space", sl: "Odprt tloris" },
  ZONA_TRANQUILLA: { it: "Zona tranquilla", en: "Quiet area", de: "Ruhige Lage", sl: "Mirna lega" },
  ZONA_RESIDENZIALE: { it: "Zona residenziale", en: "Residential area", de: "Wohngegend", sl: "Stanovanjska soseska" },
  VICINO_CENTRO: { it: "Vicino al centro", en: "Near the centre", de: "Zentrumsnah", sl: "Blizu središča" },
  VICINO_MARE: { it: "Vicino al mare", en: "Near the sea", de: "Nahe am Meer", sl: "Blizu morja" },
  IN_COLLINA: { it: "In collina", en: "On the hill", de: "In Hügellage", sl: "Na griču" },
  ZONA_PEDONALE: { it: "Zona pedonale", en: "Pedestrian zone", de: "Fußgängerzone", sl: "Cona za pešce" },
  ARREDATO: { it: "Arredato", en: "Furnished", de: "Möbliert", sl: "Opremljeno" },
  NON_ARREDATO: { it: "Non arredato", en: "Unfurnished", de: "Unmöbliert", sl: "Neopremljeno" },
  PARZ_ARREDATO: { it: "Parzialmente arredato", en: "Partly furnished", de: "Teilmöbliert", sl: "Delno opremljeno" },
  SUL_MARE: { it: "Sul mare", en: "Waterfront", de: "Am Meer", sl: "Ob morju" },
  VICINO_AL_MARE: { it: "Vicino al mare", en: "Near the sea", de: "Nahe am Meer", sl: "Blizu morja" },
  MOLO_PRIVATO: { it: "Molo privato", en: "Private pier", de: "Privater Steg", sl: "Zasebni pomol" },
  ACCESSO_PRIVATO_AL_MARE: { it: "Accesso privato al mare", en: "Private sea access", de: "Privater Meerzugang", sl: "Zasebni dostop do morja" },
  SCALE_A_SPIAGGIA: { it: "Scala privata alla spiaggia", en: "Steps to the beach", de: "Treppe zum Strand", sl: "Stopnice do plaže" },
  PRIMA_FILA_SUL_MARE: { it: "Prima fila sul mare", en: "Front row on the sea", de: "Erste Reihe am Meer", sl: "Prva vrsta ob morju" },
  PISCINA_RISCALDATA: { it: "Piscina riscaldata", en: "Heated pool", de: "Beheizter Pool", sl: "Ogrevan bazen" },
  PISCINA_CONDOMINIALE: { it: "Piscina condominiale", en: "Shared pool", de: "Gemeinschaftspool", sl: "Skupni bazen" },
  MAX_2MIN_CENTRO: { it: "2 minuti dal centro", en: "2 min to centre", de: "2 Min. ins Zentrum", sl: "2 min do središča" },
  MAX_5MIN_CENTRO: { it: "5 minuti dal centro", en: "5 min to centre", de: "5 Min. ins Zentrum", sl: "5 min do središča" },
  MAX_5MIN_MARE: { it: "5 minuti dal mare", en: "5 min to the sea", de: "5 Min. zum Meer", sl: "5 min do morja" },
  IN_CENTRO_STORICO: { it: "Nel centro storico", en: "Old town", de: "Altstadt", sl: "Staro mestno jedro" },
  ACCESSIBILE_DISABILI: { it: "Accessibile a persone con disabilità", en: "Wheelchair accessible", de: "Barrierefrei", sl: "Dostopno gibalno oviranim" },
  NO_ASCENSORE: { it: "Senza ascensore", en: "No elevator", de: "Kein Aufzug", sl: "Brez dvigala" },
  PIANO_TERRA: { it: "Piano terra", en: "Ground floor", de: "Erdgeschoss", sl: "Pritličje" },
  MOLTE_SCALE_INTERNE: { it: "Scale interne", en: "Internal stairs", de: "Innentreppen", sl: "Notranje stopnice" },
};

/** L'etichetta pubblica di un tag nella lingua della pagina, o null se il tag
 *  non è nella lista bianca (e allora non si mostra). */
export function etichettaTag(tag: string, locale: string): string | null {
  const m = TAG_PUBBLICI[tag.toUpperCase().trim()];
  if (!m) return null;
  return locale === "it" ? m.it : pick(m, locale);
}
