import type { Locale } from "@/i18n/routing";
import type { Photo, Property } from "./properties";

// ═══════════════════════════════════════════════════════════════════════════
// LA TRASPARENZA AI SULLE FOTO — la parte PURA (01/10/2026).
//
// Il contratto è la SPEC del gruppo (`~/.tsv-work/ai-pledge/SPEC.md`, §5 e
// §9 v1.1, che prevale): ogni foto passata da un modello generativo porta
// un'etichetta VISIBILE in alto a destra; nella vista singola anche una
// didascalia e, quando c'è, «vedi l'originale»; in chiusura della scheda un
// riepilogo che finisce sempre con «La visita resta l'unico riferimento.».
//
// Il dato non lo inventa il sito: arriva dal CRM (tabelle native
// foto_trasparenza / foto_originale / immobile_nota_ai), letto con UNA
// seconda chiamata alla vetrina (`vista=trasparenza`, vedi
// trasparenza-vetrina.ts) e abbinato alle foto per `filename` — l'unica
// chiave che resta uguale fra copertina, top 8 e galleria (photoSet.ts).
//
// Qui dentro niente I/O e niente `server-only`: lo leggono sia la pagina
// (server) sia i componenti della galleria (client), che ne usano solo i
// testi. Le didascalie in quattro lingue NON arrivano al browser: la pagina
// le risolve nella lingua del visitatore (`localizzaFoto`) prima di passarle.
//
// ── v1.3 (02/10/2026, SPEC §11): lo SNELLIMENTO ──────────────────────────
// Martino, guardando i siti: «Bellissima… ma in certi punti mi sembra quasi
// troppo». La regola che ne discende: l'etichetta sulla foto si mette dove
// l'AI ha cambiato la SOSTANZA (cosa si vede), non lo STILE (luce, colore,
// inquadratura). `ai_luce` e `tecnico` non portano etichetta né didascalia da
// nessuna parte (`eStile`); lo stile si dichiara nel riepilogo in fondo alla
// scheda, che diventa corto (`rigaRiepilogo`) con il resto dentro un
// «Leggi come le abbiamo ritoccate». In HOME nessuna pillola: solo un segno
// discreto su ciò che mostra cose che non esistono (`segnoHome`,
// `segnoVideoHome`). La marcatura IPTC nel file resta su ogni foto passata da
// un modello, `ai_luce` compresa (`marcaXmp`): è invisibile ed è vera.
//
// ⛔ Additività. Un immobile senza dati di trasparenza esce IDENTICO a prima:
// nessuna etichetta, nessuna sezione, nessun cambio d'ordine, la stessa
// impaginazione del lightbox, gli stessi URL delle foto. Ogni funzione qui
// sotto, su `null`, restituisce il suo ingresso tale e quale.
// ═══════════════════════════════════════════════════════════════════════════

export const LINGUE = ["it", "en", "de", "sl"] as const satisfies readonly Locale[];
export type Testi = Record<Locale, string | null>;

/** I trattamenti che il sito sa mostrare (SPEC §1 + §9.3). */
export type Trattamento =
  | "tecnico"
  | "ai"
  | "ai_luce"
  | "ai_pulizia"
  | "ai_aggiunte"
  | "ai_rendering"
  | "rendering";
export type ConEtichetta = Exclude<Trattamento, "tecnico">;

const NOTI: readonly Trattamento[] = [
  "tecnico", "ai", "ai_luce", "ai_pulizia", "ai_aggiunte", "ai_rendering", "rendering",
];

/** Un valore che il sito non conosce (un trattamento aggiunto dopo) vale
 *  «ai»: meglio un'etichetta generica di troppo che una foto AI senza. */
export function normalizzaTrattamento(v: unknown): Trattamento {
  return typeof v === "string" && (NOTI as readonly string[]).includes(v) ? (v as Trattamento) : "ai";
}

/** SPEC §9.3: queste non sono mai la copertina né la prima della galleria. */
export function eSimulazione(t: Trattamento | null | undefined): boolean {
  return t === "ai_aggiunte" || t === "ai_rendering" || t === "rendering";
}

/** Passata da un modello generativo: tutto tranne «tecnico» (nessun modello)
 *  e «rendering» (da v1.1 il render di progetto fatto SENZA AI) — la stessa
 *  regola di TRATTAMENTI_AI nel CRM (lib/trasparenza-regole.mjs). */
export function eAi(t: Trattamento | null | undefined): boolean {
  return t === "ai" || t === "ai_luce" || t === "ai_pulizia" || t === "ai_aggiunte" || t === "ai_rendering";
}

/** SPEC v1.3 §11.1: lo STILE — luce, colore, inquadratura (`ai_luce`) o un
 *  ritocco senza modello (`tecnico`) — non porta etichetta né didascalia sulla
 *  foto, in nessuna superficie: si dichiara nel riepilogo della scheda. Resta
 *  il bottone «Vedi l'originale», se l'originale c'è.
 *  ⚠️ Vale perché il CRM assegna `ai_luce` solo DOPO il controllo foto per foto
 *  (§11.4): una `ai` generica, che potrebbe essere solo luce ma non lo
 *  sappiamo, tiene la sua etichetta. */
export function eStile(t: Trattamento | null | undefined): boolean {
  return t === "ai_luce" || t === "tecnico";
}

/** Il segno discreto della HOME (SPEC v1.3 §11.1): in home nessuna pillola;
 *  solo un'immagine che mostra cose che non esistono porta un testo piccolo.
 *  «simulazione» per `ai_aggiunte`/`ai_rendering`; «rendering» per il render
 *  di progetto (con o senza AI non lo sappiamo dire «AI», ma non è una
 *  fotografia, e in una card lo si deve capire). Tutto il resto: niente. */
export type SegnoHome = "simulazione" | "rendering";
export function segnoHome(t: Trattamento | null | undefined): SegnoHome | null {
  if (t === "ai_aggiunte" || t === "ai_rendering") return "simulazione";
  if (t === "rendering") return "rendering";
  return null;
}

/** Lo stesso per i video della home (registro dei video del CRM, §10.1):
 *  `ai_generato` (un video sintetico, l'arredo virtuale della mansarda) e
 *  `ai_animato` (una foto mossa dal modello) portano tutti e due «video AI».
 *  Fino al 02/10 mattina lo staging diceva «simulazione»: a 10 px, su un
 *  video, senza la parola «AI», non diceva da dove veniva — e la SPEC §11.1
 *  abbina «video AI» ai video («simulazione» alle immagini), come fa già
 *  FriuliVillas. Un montaggio di foto o la sola voce sintetica in home non
 *  hanno segno (la SPEC elenca solo i due trattamenti generativi); un
 *  trattamento che il sito non conosce (null) vale «video AI»: meglio un segno
 *  di troppo. */
export type SegnoVideoHome = "video";
export function segnoVideoHome(t: string | null | undefined): SegnoVideoHome | null {
  if (t === "ai_generato" || t === "ai_animato" || t === null) return "video";
  return null;
}

// ── La marcatura nei metadati (SPEC §5.7) ─────────────────────────────────
//
// La marcatura IPTC `DigitalSourceType` la scrive il proxy /foto nell'XMP del
// WebP (route.ts), e NON la copia dal file di partenza: le foto caricate su
// Airtable di norma non l'hanno, e quando un XMP c'è porta anche data,
// apparecchio e quota del drone. Si scrive un pacchetto minimo, costruito dal
// trattamento.
//
// La marca entra anche nell'URL (`/foto/<att>/<w>-ctam.webp`): il proxy serve
// le foto con cache immutabile di un anno, quindi un URL già servito senza
// marcatura resterebbe muto per sempre. Una foto senza riga nel CRM (o
// «tecnico», o «rendering») tiene l'URL di prima, al byte.
//
// «rendering» non si marca: per il CRM è `trainedAlgorithmicMedia` (eredità
// v1), ma da v1.1 è il render di progetto fatto SENZA AI e scriverlo nel file
// sarebbe falso. «tecnico» nemmeno: nessun modello generativo, niente da
// dichiarare, e niente URL nuovi per nulla.
export const IPTC_MARCA = {
  ctam: "compositeWithTrainedAlgorithmicMedia",
  tam: "trainedAlgorithmicMedia",
} as const;
export type MarcaXmp = keyof typeof IPTC_MARCA;

export function marcaXmp(t: Trattamento | null | undefined): MarcaXmp | null {
  if (t === "ai_rendering") return "tam";
  if (t === "ai" || t === "ai_luce" || t === "ai_pulizia" || t === "ai_aggiunte") return "ctam";
  return null;
}

/** Il pacchetto XMP minimo: solo `Iptc4xmpExt:DigitalSourceType`. */
export function pacchettoXmp(m: MarcaXmp): string {
  return (
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">' +
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/">' +
    `<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/${IPTC_MARCA[m]}</Iptc4xmpExt:DigitalSourceType>` +
    "</rdf:Description></rdf:RDF></x:xmpmeta>" +
    '<?xpacket end="r"?>'
  );
}

// ── I dati grezzi, come li attacca getProperties() ─────────────────────────

/** Ciò che il CRM dice di UNA foto pubblicata (o il ripiego generico). */
export type FotoTrasparenza = {
  trattamento: Trattamento;
  /** Da dove viene l'etichetta:
   *  · "crm" — una riga di foto_trasparenza per questo filename;
   *  · "nome" — nessuna riga, ma il nome del file è quello di un generatore
   *    (`hf_<data>_<ora>_<uuid>`, «…_Nano_Banana_…», «…-decluttering-AI») o di
   *    un render: la stessa regola della sentinella del CRM (sembraGenerata);
   *  · "precauzione" — nessuna riga e un nome qualunque, ma il CRM ha righe AI
   *    di questo immobile che non trovano più la loro foto (file rinominato o
   *    ricaricato): nel dubbio, «AI».
   *  Solo "crm" entra nel conteggio delle foto modificate; le altre due si
   *  dichiarano a parte («in ricontrollo»). */
  fonte: "crm" | "nome" | "precauzione";
  bloccoDifetti: boolean;
  didascalia: Testi | null;
  /** URL già pronti: la vetrina serve l'originale da sé (cache NON immutabile,
   *  SPEC §9.1), il proxy /foto del sito non lo tocca. */
  originale: { m: string; xl: string; larghezza: number | null; altezza: number | null } | null;
};

/** Il riepilogo di un immobile: la nota e i conteggi calcolati sulle foto
 *  che il sito mostra davvero (stessa lista del lightbox). */
export type TrasparenzaImmobile = {
  nota: Testi | null;
  conteggi: {
    pubblicate: number;
    /** foto con una riga del CRM e un trattamento AI */
    ai: number;
    /** foto SENZA riga del CRM con un'etichetta (dal nome del file o
     *  precauzionale): decide, con `ai`, se il riepilogo compare */
    ricontrollo: number;
    // ── i gruppi della riga del riepilogo (v1.3 §11.2, rivista il 02/10) ──
    // Ogni foto etichettata sta in UN gruppo solo, e ogni gruppo dice il vero
    // di sé: lo stile non è «modificata», una generica non è «con le modifiche
    // indicate», un render non è una «foto ritoccata».
    /** riga del CRM `ai_luce`: lo stile, senza etichetta sulla foto */
    luce: number;
    /** riga del CRM `ai_pulizia`: oggetti tolti, indicati sulla foto */
    pulizia: number;
    /** riga del CRM `ai_aggiunte`: simulazioni, indicate sulla foto */
    aggiunte: number;
    /** `ai` dal CRM o dal nome di un generatore: passata da un modello, cosa
     *  è cambiato non lo sappiamo ancora (SPEC §11.4) */
    generiche: number;
    /** «AI» precauzionale: non sappiamo nemmeno se è passata da un modello */
    precauzione: number;
    /** riga del CRM `ai_rendering`: immagine generata per intero, non una foto */
    aiRendering: number;
    /** `rendering` dal CRM (render di progetto, senza AI) o dal nome del file
     *  (render, come sia stato prodotto è in verifica): non una foto */
    rendering: number;
    /** di `rendering`, quelli riconosciuti dal solo nome del file */
    renderingDalNome: number;
    bloccoDifetti: number;
    conOriginale: number;
  };
  /** Le foto con una riga del CRM, per trattamento (solo i tipi presenti):
   *  è il «conteggio per tipo» dentro il dettaglio del riepilogo (v1.3 §11.2). */
  perTipo: Partial<Record<Trattamento, number>>;
};

// ── La vista per il browser, già nella lingua del visitatore ──────────────

export type FotoAi = {
  trattamento: Trattamento;
  /** Etichetta estesa (vista singola, hero): «AI · modificata». "" se tecnico. */
  etichetta: string;
  /** Glifo compatto (miniature, card): «AI» o «Rendering». "" se tecnico. */
  glifo: string;
  /** Nome accessibile dell'etichetta: etichetta + didascalia del CRM. */
  aria: string;
  /** La didascalia del CRM o, per l'etichetta «AI» senza didascalia, la frase
   *  di ripiego che dice perché c'è. */
  didascalia: string | null;
  /** m = lato lungo 1600, xl = lato lungo 2560 (SPEC §1, `dati_m`/`dati_xl`). */
  originale: {
    m: string;
    xl: string;
    larghezza: number | null;
    altezza: number | null;
  } | null;
};

// ═══════════════════════════════════════════════════════════════════════════
// I TESTI — dizionario inline tipizzato: `satisfies Record<Locale, …>` rende
// obbligatorio il ramo di OGNI lingua di routing.ts (lo sloveno compreso). Le
// etichette sono quelle della SPEC §5.1 e §9.3, lettera per lettera.
// ⚠️ Le frasi slovene nuove (riga del riepilogo, tipi, segni, ripieghi) vanno fatte
// rileggere a un madrelingua, come il resto dello sloveno del sito.
// ═══════════════════════════════════════════════════════════════════════════

type TestiTrasparenza = {
  etichetta: Record<ConEtichetta, string>;
  /** Glifo compatto: «AI» per tutto ciò che è passato da un modello, il nome
   *  per il rendering fatto senza AI (scriverci «AI» sarebbe falso). */
  glifo: { ai: string; rendering: string };
  /** aria-label dell'etichetta «ai» generica (SPEC §9.3). */
  ariaGenerica: string;
  /** Didascalia visibile di una riga `ai` del CRM che non ne ha una sua. */
  didascaliaAi: string;
  /** Didascalia visibile dell'etichetta precauzionale (foto senza riga). */
  didascaliaGenerica: string;
  /** Un render riconosciuto dal solo nome del file: non si sa ancora se è il
   *  progetto dell'architetto (senza AI) o un'immagine generata. */
  ariaRenderNome: string;
  didascaliaRenderNome: string;
  vediOriginale: string;
  /** Suggerimento del tasto, accanto al bottone. */
  tasto: string;
  originale: string;
  didascaliaOriginale: string;
  titolo: string;
  /** Il comando che apre il resto del riepilogo (v1.3 §11.2), chiuso di default. */
  dettaglio: string;
  /** Lo stesso comando quando nell'annuncio non c'è nessuna FOTO passata da
   *  un modello, solo immagini che non sono fotografie (i render): «come le
   *  abbiamo ritoccate» lì sarebbe falso. È la stringa di prima della v1.3. */
  dettaglioNota: string;
  /** …e quando non c'è nemmeno la nota: il dettaglio ha solo i conteggi. */
  dettaglioBreve: string;
  /** Dentro il dettaglio: il titoletto dei conteggi per tipo. */
  tipiTitolo: string;
  /** Una riga per tipo nel dettaglio: cosa vuol dire, accanto al numero. */
  tipi: Record<RigaDettaglio["chiave"], string>;
  chiusura: string;
  linkAi: string;
  /** Il segno DISCRETO della home (v1.3 §11.1): testo piccolo, non la pillola. */
  segno: Record<SegnoHome | SegnoVideoHome, string>;
};

export const TESTI_TRASPARENZA = {
  it: {
    etichetta: {
      ai: "AI",
      ai_luce: "AI · luce",
      ai_pulizia: "AI · modificata",
      ai_aggiunte: "AI · simulazione",
      ai_rendering: "AI · rendering",
      rendering: "Rendering",
    },
    glifo: { ai: "AI", rendering: "Rendering" },
    ariaGenerica: "Foto modificata con AI, in ricontrollo",
    didascaliaAi: "Foto passata da un modello generativo.",
    didascaliaGenerica:
      "Etichetta precauzionale: stiamo ricontrollando quali foto di questo annuncio sono passate da un modello generativo, e nel dubbio l'etichetta resta.",
    ariaRenderNome: "Rendering, non una fotografia: in ricontrollo",
    didascaliaRenderNome:
      "Rendering: non è una fotografia. Stiamo ricontrollando come è stato prodotto, e se è passato da un modello generativo.",
    vediOriginale: "Vedi l'originale",
    tasto: "tasto O",
    originale: "Originale",
    didascaliaOriginale: "Foto originale, prima dell'intervento. Volti e dati personali sfocati.",
    titolo: "Come abbiamo usato l'AI in queste foto",
    dettaglio: "Leggi come le abbiamo ritoccate",
    dettaglioNota: "Leggi la nota completa",
    dettaglioBreve: "Dettagli",
    tipiTitolo: "Le immagini, per tipo di intervento",
    tipi: {
      pubblicate: "in tutto, nell'annuncio",
      ai_luce: "solo luce e colori: senza etichetta sulla foto",
      tecnico: "ritocco tecnico senza AI: senza etichetta",
      ai_pulizia: "oggetti tolti, le parti nascoste ricostruite dal modello",
      ai_aggiunte: "elementi aggiunti o ricostruiti: simulazioni",
      ai_rendering: "immagini generate per intero con l'AI",
      ai: "passate da un modello generativo, dettagli in ricontrollo",
      rendering: "immagini di progetto, senza AI",
      renderingDalNome: "rendering, non fotografie: come sono stati prodotti è in verifica",
      ricontrollo: "etichetta «AI» precauzionale, in attesa di verifica",
      conOriginale: "con l'originale a un clic",
      bloccoDifetti: "con i difetti lasciati visibili",
    },
    chiusura: "La visita resta l'unico riferimento.",
    linkAi: "Come usiamo l'AI",
    segno: { simulazione: "simulazione", rendering: "rendering", video: "video AI" },
  },
  en: {
    etichetta: {
      ai: "AI",
      ai_luce: "AI · light",
      ai_pulizia: "AI · edited",
      ai_aggiunte: "AI · simulated",
      ai_rendering: "AI · rendering",
      rendering: "Rendering",
    },
    glifo: { ai: "AI", rendering: "Rendering" },
    ariaGenerica: "Photo edited with AI, under review",
    didascaliaAi: "This photo was processed by a generative model.",
    didascaliaGenerica:
      "Precautionary label: we are re-checking which photos in this listing went through a generative model, and until we are sure the label stays.",
    ariaRenderNome: "Rendering, not a photograph: under review",
    didascaliaRenderNome:
      "Rendering: this is not a photograph. We are re-checking how it was made, and whether it went through a generative model.",
    vediOriginale: "See the original",
    tasto: "key O",
    originale: "Original",
    didascaliaOriginale: "Original photo, before editing. Faces and personal data blurred.",
    titolo: "How we used AI in these photos",
    dettaglio: "How we edited them",
    dettaglioNota: "Read the full note",
    dettaglioBreve: "Details",
    tipiTitolo: "The images, by type of edit",
    tipi: {
      pubblicate: "in total, in this listing",
      ai_luce: "light and colour only: no label on the photo",
      tecnico: "technical retouch without AI: no label",
      ai_pulizia: "objects removed, hidden areas filled in by the model",
      ai_aggiunte: "elements added or rebuilt: simulations",
      ai_rendering: "images generated entirely with AI",
      ai: "processed by a generative model, details being re-checked",
      rendering: "design visualisations, no AI",
      renderingDalNome: "renderings, not photographs: how they were made is being checked",
      ricontrollo: "precautionary “AI” label, pending review",
      conOriginale: "original one click away",
      bloccoDifetti: "defects left visible",
    },
    chiusura: "The viewing remains the only reference.",
    linkAi: "How we use AI",
    segno: { simulazione: "simulation", rendering: "rendering", video: "AI video" },
  },
  de: {
    etichetta: {
      ai: "AI",
      ai_luce: "AI · Licht",
      ai_pulizia: "AI · bearbeitet",
      ai_aggiunte: "AI · simuliert",
      ai_rendering: "AI · Rendering",
      rendering: "Rendering",
    },
    glifo: { ai: "AI", rendering: "Rendering" },
    ariaGenerica: "Mit KI bearbeitetes Foto, wird erneut geprüft",
    didascaliaAi: "Dieses Foto wurde von einem generativen Modell bearbeitet.",
    didascaliaGenerica:
      "Vorsorgliche Kennzeichnung: Wir prüfen gerade, welche Fotos dieses Inserats ein generatives Modell durchlaufen haben; bis dahin bleibt die Kennzeichnung.",
    ariaRenderNome: "Rendering, kein Foto: wird erneut geprüft",
    didascaliaRenderNome:
      "Rendering: kein Foto. Wir prüfen gerade, wie es entstanden ist und ob es ein generatives Modell durchlaufen hat.",
    vediOriginale: "Original ansehen",
    tasto: "Taste O",
    originale: "Original",
    didascaliaOriginale: "Originalfoto vor der Bearbeitung. Gesichter und persönliche Daten unkenntlich gemacht.",
    titolo: "Wie wir KI in diesen Fotos eingesetzt haben",
    dettaglio: "Wie wir sie bearbeitet haben",
    dettaglioNota: "Vollständigen Hinweis lesen",
    dettaglioBreve: "Details",
    tipiTitolo: "Die Bilder nach Art der Bearbeitung",
    tipi: {
      pubblicate: "insgesamt im Inserat",
      ai_luce: "nur Licht und Farben: ohne Kennzeichnung auf dem Foto",
      tecnico: "technische Nachbearbeitung ohne KI: ohne Kennzeichnung",
      ai_pulizia: "Gegenstände entfernt, verdeckte Stellen vom Modell ergänzt",
      ai_aggiunte: "Elemente hinzugefügt oder rekonstruiert: Simulationen",
      ai_rendering: "vollständig mit KI erzeugte Bilder",
      ai: "von einem generativen Modell bearbeitet, Details in Prüfung",
      rendering: "Projektvisualisierungen, ohne KI",
      renderingDalNome: "Renderings, keine Fotos: Wie sie entstanden sind, wird geprüft",
      ricontrollo: "vorsorgliche Kennzeichnung „AI“, die Prüfung läuft",
      conOriginale: "Original mit einem Klick",
      bloccoDifetti: "Mängel sichtbar belassen",
    },
    chiusura: "Die Besichtigung bleibt der einzige Maßstab.",
    linkAi: "Wie wir KI einsetzen",
    segno: { simulazione: "Simulation", rendering: "Rendering", video: "AI-Video" },
  },
  sl: {
    etichetta: {
      ai: "AI",
      ai_luce: "AI · svetloba",
      ai_pulizia: "AI · urejeno",
      ai_aggiunte: "AI · simulacija",
      ai_rendering: "AI · vizualizacija",
      rendering: "Vizualizacija",
    },
    glifo: { ai: "AI", rendering: "Vizualizacija" },
    ariaGenerica: "Fotografija, urejena z umetno inteligenco, v ponovnem pregledu",
    didascaliaAi: "Fotografijo je obdelal generativni model.",
    didascaliaGenerica:
      "Previdnostna oznaka: preverjamo, katere fotografije v tem oglasu je obdelal generativni model; do takrat oznaka ostane.",
    ariaRenderNome: "Vizualizacija, ne fotografija: v ponovnem pregledu",
    didascaliaRenderNome:
      "Vizualizacija: to ni fotografija. Preverjamo, kako je nastala in ali jo je obdelal generativni model.",
    vediOriginale: "Poglej izvirnik",
    tasto: "tipka O",
    originale: "Izvirnik",
    didascaliaOriginale: "Izvirna fotografija pred posegom. Obrazi in osebni podatki so zabrisani.",
    titolo: "Kako smo pri teh fotografijah uporabili umetno inteligenco",
    dettaglio: "Kako smo jih uredili",
    dettaglioNota: "Preberite celotno opombo",
    dettaglioBreve: "Podrobnosti",
    tipiTitolo: "Slike po vrsti posega",
    // Število stoji ločeno pred opisom, zato se opis ne sklanja.
    tipi: {
      pubblicate: "skupaj v oglasu",
      ai_luce: "le svetloba in barve: brez oznake na fotografiji",
      tecnico: "tehnična obdelava brez umetne inteligence: brez oznake",
      ai_pulizia: "predmeti odstranjeni, zakrite dele je dopolnil model",
      ai_aggiunte: "dodani ali rekonstruirani elementi: simulacije",
      ai_rendering: "slike, v celoti ustvarjene z umetno inteligenco",
      ai: "obdelal jih je generativni model, podrobnosti v ponovnem pregledu",
      rendering: "projektne vizualizacije, brez umetne inteligence",
      renderingDalNome: "vizualizacije, ne fotografije: kako so nastale, še preverjamo",
      ricontrollo: "previdnostna oznaka »AI«, čaka na preverjanje",
      conOriginale: "izvirnik na en klik",
      bloccoDifetti: "pomanjkljivosti ostale vidne",
    },
    chiusura: "Ogled ostaja edino merilo.",
    linkAi: "Kako uporabljamo umetno inteligenco",
    segno: { simulazione: "simulacija", rendering: "vizualizacija", video: "AI video" },
  },
} as const satisfies Record<Locale, TestiTrasparenza>;

export function testiTrasparenza(locale: string): TestiTrasparenza {
  return (TESTI_TRASPARENZA as Record<string, TestiTrasparenza>)[locale] ?? TESTI_TRASPARENZA.it;
}

/** Ripiego lingua → en → it (SPEC §5.2), come le descrizioni della scheda. */
export function nellaLingua(t: Testi | null | undefined, locale: string): string | null {
  if (!t) return null;
  return t[locale as Locale] ?? t.en ?? t.it ?? null;
}

// La pagina /ai («AI a carte scoperte», SPEC §6) su questo sito NON esiste
// ancora: il riepilogo linka quella del gruppo su triestevillas.com, solo
// nelle lingue in cui risponde 200 (lib/pagina-ai.ts, server-only: qui
// dentro niente I/O). Quando arriverà la pagina di TriesteImmobiliare — la
// SPEC §9.2 la tiene in anteprima finché il legale non la rilegge — il link
// si sposta lì.

// ═══════════════════════════════════════════════════════════════════════════
// L'ABBINAMENTO — i dati del CRM sulle foto del sito.
// ═══════════════════════════════════════════════════════════════════════════

/** La forma che arriva dalla vetrina, già validata da trasparenza-vetrina.ts. */
export type TrasparenzaVetrina = {
  nota: Testi | null;
  foto: {
    filename: string;
    trattamento: Trattamento;
    blocco_difetti: boolean;
    didascalia: Testi | null;
    originale: { id: string; larghezza: number | null; altezza: number | null } | null;
  }[];
  /** `ai` e `foto_pubblicate` del CRM servono solo a scrivere nel log quando
   *  il conto del sito non torna col suo (due copie del catalogo non allineate). */
  conteggi: { ai_non_abbinate: number; ai: number | null; foto_pubblicate: number | null };
};

const chiave = (p: Photo) => p.filename ?? p.url;

/** La lista canonica della scheda (copertina, top 8, galleria, senza
 *  doppioni) — la stessa di photoSet.ts, ricopiata qui per non importare un
 *  modulo che importa a sua volta i tipi da qui. */
function listaSito(p: Pick<Property, "coverPhoto" | "topPhotos" | "photos">): Photo[] {
  const seen = new Set<string>();
  const out: Photo[] = [];
  for (const ph of [p.coverPhoto, ...p.topPhotos, ...p.photos]) {
    if (!ph) continue;
    const k = chiave(ph);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(ph);
  }
  return out;
}

// ── IL NOME DEL FILE CHE TRADISCE UN GENERATORE ────────────────────────────
//
// La STESSA regola della sentinella del CRM (tsv-pg, lib/trasparenza-regole.mjs
// → sembraGenerata, misurata il 01/10 sulle 2.128 foto pubblicate: 861
// riconosciute su 861, zero falsi positivi sulle altre 1.267). Il censimento di
// quel giorno ha trovato 133 foto così su TriesteImmobiliare, in 7 annunci,
// senza nessuna etichetta: finché il CRM non ha la loro riga, l'etichetta la
// mette il sito — e la mette ANCHE quando il CRM è giù, che è proprio quando
// le righe non arrivano. Un nome da generatore vale «AI» (generica); un nome
// da render vale «Rendering», che dice «non è una fotografia» senza affermare
// né negare l'AI: il CRM stesso lascia la scelta fra `rendering` e
// `ai_rendering` a chi guarda da dove viene l'immagine.
// ⚠️ Chi cambia la regola nel CRM, la cambia anche qui (e su triestevillas-web).
const siglaAi = (f: string): boolean => {
  const base = f.replace(/\.[a-z0-9]{2,5}$/i, "");
  if (!/(^|[_\s.-])AI([_\s.-]|$)/.test(base)) return false;
  // In un nome tutto maiuscolo «AI» è anche la preposizione («VISTA AI
  // GIARDINI.jpg»): lì vale solo come ULTIMA parola.
  if (/[a-zà-ÿ]/.test(base)) return true;
  return /(^|[_\s.-])AI[_\s.\d-]*$/.test(base);
};
const NOMI_DA_GENERATORE: readonly (readonly ["ai" | "rendering", (f: string) => boolean])[] = [
  ["ai", (f) => /^hf_\d{8}_\d{6}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(f)],
  [
    "ai",
    (f) =>
      /(^|[_\s.-])(nano[_\s-]?banana|seedream|imagegen|gpt[_\s-]?image|dall[_·-]e|midjourney|firefly|ideogram)([_\s.-]|$)/i.test(f),
  ],
  ["ai", (f) => /chatgpt[_\s-]?image|gemini[_\s-]generated[_\s-]image/i.test(f)],
  ["ai", siglaAi],
  ["rendering", (f) => /(^|[_\s.-])render(ing)?([_\s.\d-]|$)/i.test(f)],
];

/** Il nome del file dice che è uscito da un generatore («ai») o che è un
 *  render («rendering»)? null = nome qualunque. */
export function trattamentoDalNome(filename: string | null | undefined): "ai" | "rendering" | null {
  if (!filename) return null;
  for (const [t, prova] of NOMI_DA_GENERATORE) if (prova(filename)) return t;
  return null;
}

/**
 * Attacca a ogni immobile la sua trasparenza e a ogni foto la sua riga.
 * `perId` = airtable_id → trasparenza (solo gli immobili che ne hanno).
 * `baseOriginali` = `${VETRINA_BASE}/api/vetrina/foto` (SPEC §5.6).
 * Un immobile senza dati del CRM e senza nomi da generatore esce con lo
 * STESSO oggetto di prima.
 */
export function applicaTrasparenza(
  lista: Property[],
  perId: Map<string, TrasparenzaVetrina>,
  baseOriginali: string,
): Property[] {
  return lista.map((p) => {
    const t = perId.get(p.recId);
    return t ? conTrasparenza(p, t, baseOriginali) : conNomiDaGeneratore(p);
  });
}

const dalNome = (ph: Photo): FotoTrasparenza | null => {
  const t = trattamentoDalNome(ph.filename);
  return t ? { trattamento: t, fonte: "nome", bloccoDifetti: false, didascalia: null, originale: null } : null;
};

/** Nessun dato del CRM: solo l'etichetta generica sui nomi da generatore.
 *  Niente riepilogo, niente cambi d'ordine — non sappiamo abbastanza. */
function conNomiDaGeneratore(p: Property): Property {
  let tocca = false;
  const marca = (ph: Photo): Photo => {
    const d = dalNome(ph);
    if (!d) return ph;
    tocca = true;
    return { ...ph, trasparenza: d };
  };
  const coverPhoto = p.coverPhoto ? marca(p.coverPhoto) : null;
  const topPhotos = p.topPhotos.map(marca);
  const photos = p.photos.map(marca);
  return tocca ? { ...p, coverPhoto, topPhotos, photos } : p;
}

function conTrasparenza(p: Property, t: TrasparenzaVetrina, base: string): Property {
  const righe = new Map(t.foto.map((f) => [f.filename, f]));
  // L'etichetta PRECAUZIONALE («AI» su ogni foto senza riga e con un nome
  // qualunque) scatta solo se c'è la prova che una riga AI ha perso la sua
  // foto: lo dice il CRM (`ai_non_abbinate`, contato sulla sua copia del
  // catalogo) o lo vede il sito (una riga AI il cui filename non è fra le foto
  // che QUESTA pagina mostra — il sito può leggere Airtable dal vivo mentre la
  // copia del CRM è indietro di ore, e un file rinominato lì combacia ancora).
  // NON scatta solo perché l'annuncio ha foto AI: i carichi di «sola
  // etichetta» (le 861 foto del censimento) danno una riga alle sole foto da
  // generatore, e la regola letterale della SPEC §0 metterebbe «AI» sulle
  // fotografie vere accanto — 26 su 29 a Gorizia 36. Le foto AI senza riga e
  // col nome di un generatore le copre `dalNome`.
  const nomiMostrati = new Set(listaSito(p).map((ph) => ph.filename).filter((f): f is string => !!f));
  const perseDalSito = t.foto.filter((f) => eAi(f.trattamento) && !nomiMostrati.has(f.filename)).length;
  const precauzione = t.conteggi.ai_non_abbinate > 0 || perseDalSito > 0;

  const datiDi = (ph: Photo): FotoTrasparenza | null => {
    const r = ph.filename ? righe.get(ph.filename) : undefined;
    if (r) {
      const o = r.originale;
      const radice = o ? `${base}/${encodeURIComponent(p.recId)}/${encodeURIComponent(o.id)}` : null;
      return {
        trattamento: r.trattamento,
        fonte: "crm",
        bloccoDifetti: r.blocco_difetti,
        didascalia: r.didascalia,
        originale: o && radice
          ? { m: `${radice}/m`, xl: `${radice}/xl`, larghezza: o.larghezza, altezza: o.altezza }
          : null,
      };
    }
    return (
      dalNome(ph) ??
      (precauzione
        ? { trattamento: "ai", fonte: "precauzione", bloccoDifetti: false, didascalia: null, originale: null }
        : null)
    );
  };
  // Una foto può comparire in tre campi (copertina, top 8, galleria) con id
  // diversi: la riga si attacca a ciascuna copia, così ovunque la si mostri
  // porta la stessa etichetta. La marca XMP va solo sulle righe VERE: su una
  // foto senza riga il sito non sa cosa dichiarare nel file.
  const marca = (ph: Photo): Photo => {
    const d = datiDi(ph);
    if (!d) return ph;
    const xmp = d.fonte === "crm" ? marcaXmp(d.trattamento) : null;
    return xmp ? { ...ph, trasparenza: d, xmp } : { ...ph, trasparenza: d };
  };

  let coverPhoto = p.coverPhoto ? marca(p.coverPhoto) : null;
  let topPhotos = p.topPhotos.map(marca);
  const photos = p.photos.map(marca);

  // ── l'ordine (SPEC §9.3): una simulazione non apre mai la galleria ──────
  // Solo quando lo dice una riga del CRM: su un nome di file non si sposta
  // la copertina.
  const tutte = listaSito({ coverPhoto, topPhotos, photos });
  const prima = tutte[0]?.trasparenza;
  if (prima?.fonte === "crm" && eSimulazione(prima.trattamento)) {
    const vera = tutte.find((ph) => !eSimulazione(ph.trasparenza?.trattamento));
    // Se sono tutte simulazioni, l'ordine resta: l'etichetta basta.
    if (vera) {
      // La vecchia copertina non si perde: passa in testa ai top 8, così
      // subito dopo la prima foto reale, nell'ordine in cui stava.
      const vecchia = tutte[0];
      coverPhoto = vera;
      topPhotos = [vecchia, ...topPhotos];
    }
  }

  const finale: Property = { ...p, coverPhoto, topPhotos, photos };
  const mostrate = listaSito(finale);
  const dalCrm = (ph: Photo) => ph.trasparenza?.fonte === "crm";
  // Il conteggio per tipo (dettaglio del riepilogo, v1.3 §11.2): solo le righe
  // del CRM. Le etichette dal nome del file e quelle precauzionali stanno a
  // parte (`ricontrollo`): un render riconosciuto dal nome non è un «render di
  // progetto senza AI», e di quello non lo sappiamo.
  const perTipo: Partial<Record<Trattamento, number>> = {};
  for (const ph of mostrate) {
    const d = ph.trasparenza;
    if (d?.fonte === "crm") perTipo[d.trattamento] = (perTipo[d.trattamento] ?? 0) + 1;
  }
  const conteggi = {
    pubblicate: mostrate.length,
    // «modificate con l'AI» = solo le foto per cui il CRM LO DICE. Le
    // generiche no: sono un'etichetta su foto di cui non sappiamo abbastanza,
    // contarle farebbe dire «3 foto su 3 modificate» a un annuncio che ne ha
    // una. Si dichiarano a parte («in ricontrollo»).
    ai: mostrate.filter((ph) => dalCrm(ph) && eAi(ph.trasparenza!.trattamento)).length,
    ricontrollo: mostrate.filter((ph) => ph.trasparenza && !dalCrm(ph) && ph.trasparenza.trattamento !== "tecnico")
      .length,
    luce: perTipo.ai_luce ?? 0,
    pulizia: perTipo.ai_pulizia ?? 0,
    aggiunte: perTipo.ai_aggiunte ?? 0,
    generiche: mostrate.filter(
      (ph) => ph.trasparenza?.trattamento === "ai" && (ph.trasparenza.fonte === "crm" || ph.trasparenza.fonte === "nome"),
    ).length,
    precauzione: mostrate.filter((ph) => ph.trasparenza?.fonte === "precauzione").length,
    aiRendering: perTipo.ai_rendering ?? 0,
    rendering: mostrate.filter((ph) => ph.trasparenza?.trattamento === "rendering").length,
    renderingDalNome: mostrate.filter(
      (ph) => ph.trasparenza?.trattamento === "rendering" && ph.trasparenza.fonte !== "crm",
    ).length,
    bloccoDifetti: mostrate.filter((ph) => dalCrm(ph) && ph.trasparenza!.bloccoDifetti).length,
    conOriginale: mostrate.filter((ph) => dalCrm(ph) && ph.trasparenza!.originale).length,
  };
  // Il conto del sito e quello del CRM seguono la stessa regola (foto mostrate,
  // TRATTAMENTI_AI); se divergono, le due copie del catalogo non sono allineate.
  // Si scrive nel log, non in pagina: in pagina vale ciò che il visitatore vede.
  if (t.conteggi.ai !== null && t.conteggi.ai !== conteggi.ai) {
    console.warn(
      `[trasparenza] ${p.recId}: ${conteggi.ai} foto AI contate dal sito, ${t.conteggi.ai} dal CRM (foto ${conteggi.pubblicate}/${t.conteggi.foto_pubblicate ?? "?"})`,
    );
  }
  finale.trasparenza = { nota: t.nota, conteggi, perTipo };
  return finale;
}

/**
 * La foto dell'anteprima social (og:image). Le anteprime di WhatsApp e
 * Facebook non portano etichette: lì va la prima foto, nell'ordine della
 * scheda, che non ne porterebbe una sul sito (niente AI di sostanza, niente
 * render, niente etichetta precauzionale). Se ce l'hanno tutte, null: resta
 * l'immagine del sito. Senza nessuna etichetta: la copertina, come prima.
 * Dalla v1.3 (§11.1) una foto di sola luce (`ai_luce`, `tecnico`) è una foto
 * normale anche qui: non porta etichetta sul sito, e va bene come anteprima.
 */
export function fotoPerAnteprima(p: Property): Photo | null {
  const lista = listaSito(p);
  const etichettata = (ph: Photo) => !!ph.trasparenza && !eStile(ph.trasparenza.trattamento);
  if (!lista.some(etichettata)) return p.coverPhoto;
  return lista.find((ph) => !etichettata(ph)) ?? null;
}


// ═══════════════════════════════════════════════════════════════════════════
// LA RESA NELLA LINGUA DEL VISITATORE (server → client)
// ═══════════════════════════════════════════════════════════════════════════

/** Da dati grezzi a vista localizzata. null se la foto non ha niente da dire. */
export function fotoAi(d: FotoTrasparenza | null | undefined, locale: string): FotoAi | null {
  if (!d) return null;
  // v1.3 §11.1: lo stile non si dichiara sulla foto — niente etichetta, niente
  // glifo, niente didascalia, da nessuna parte. Resta solo l'originale, se il
  // CRM ce l'ha: il bottone «Vedi l'originale» non è rumore, è una prova.
  if (eStile(d.trattamento)) {
    return d.originale
      ? { trattamento: d.trattamento, etichetta: "", glifo: "", aria: "", didascalia: null, originale: d.originale }
      : null;
  }
  const tx = testiTrasparenza(locale);
  const propria = nellaLingua(d.didascalia, locale);
  // Qui `tecnico` non arriva più (è stile, sopra): ogni trattamento ha la sua etichetta.
  const etichetta = tx.etichetta[d.trattamento as ConEtichetta];
  const glifo = d.trattamento === "rendering" ? tx.glifo.rendering : tx.glifo.ai;
  const renderDalNome = d.fonte === "nome" && d.trattamento === "rendering";
  const base = d.trattamento === "ai" ? tx.ariaGenerica : renderDalNome ? tx.ariaRenderNome : etichetta;
  const aria = propria ? (base ? `${base} — ${propria}` : propria) : base;
  // L'etichetta «AI» (o un render riconosciuto dal nome) senza didascalia,
  // nella vista singola, da sola non spiega niente: una frase di ripiego dice
  // perché c'è. Il nome del file da generatore è una prova («passata da un
  // modello generativo»); l'etichetta precauzionale no, e lo dice.
  const didascalia =
    propria ??
    (renderDalNome
      ? tx.didascaliaRenderNome
      : d.trattamento === "ai"
        ? d.fonte === "precauzione"
          ? tx.didascaliaGenerica
          : tx.didascaliaAi
        : null);
  return {
    trattamento: d.trattamento,
    etichetta,
    glifo,
    aria,
    didascalia,
    originale: d.originale,
  };
}

/** Ciò che una foto porta in una CARD (home, /immobili, simili, preferiti):
 *  fuori dalla home il glifo compatto, in HOME solo il segno discreto su ciò
 *  che mostra cose che non esistono (SPEC v1.3 §11.1) — mai tutti e due. La
 *  regola sta qui, nella parte pura, perché il cancello del prebuild la esegua
 *  davvero (scripts/check-etichette-ai.mjs); propertyView.ts la chiama e basta. */
export function etichettaCard(
  d: FotoTrasparenza | null | undefined,
  locale: string,
  home: boolean,
): { ai?: { glifo: string; aria: string }; segno?: { testo: string; aria: string } } {
  const ai = fotoAi(d, locale);
  if (home) {
    const s = segnoHome(d?.trattamento);
    if (!s) return {};
    const testo = testiTrasparenza(locale).segno[s];
    return { segno: { testo, aria: ai?.aria ? `${testo} — ${ai.aria}` : testo } };
  }
  return ai?.glifo ? { ai: { glifo: ai.glifo, aria: ai.aria } } : {};
}

/** La foto pronta per il browser: la vista localizzata al posto dei dati
 *  grezzi (le altre tre lingue non viaggiano). Senza dati: la foto com'è. */
export function localizzaFoto(ph: Photo, locale: string): Photo {
  if (!ph.trasparenza) return ph;
  const { trasparenza, ...resto } = ph;
  const ai = fotoAi(trasparenza, locale);
  return ai ? { ...resto, ai } : resto;
}

// ═══════════════════════════════════════════════════════════════════════════
// LA NOTA NEL RIEPILOGO
// ═══════════════════════════════════════════════════════════════════════════

// Frasi: punto, spazio, maiuscola (anche Č Š Ž) — così «10.200,00» o «ecc.»
// non spezzano. Stessa idea di toParagraphs() nella pagina.
function frasi(testo: string): string[] {
  return testo
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-ÞČŠŽĆĐ0-9«"„“(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * La nota del CRM pronta per il dettaglio del riepilogo: intera, senza la
 * prima frase quando è l'attacco standard («Nota sull'uso dell'intelligenza
 * artificiale nelle fotografie.»), che ripeterebbe il titolo della sezione.
 * Dalla v1.3 (§11.2) la nota sta TUTTA dentro «Leggi come le abbiamo
 * ritoccate», chiuso di default: non serve più tagliarla in attacco e resto.
 */
export function notaSenzaAttacco(nota: string): string {
  const f = frasi(nota);
  if (f.length > 1 && f[0].length <= 120 && ATTACCHI.some((a) => normAttacco(f[0]).startsWith(a))) {
    return f.slice(1).join(" ");
  }
  return nota.trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// LA RIGA DEL RIEPILOGO (v1.3 §11.2) — calcolata dai conteggi, mai a mano
// ═══════════════════════════════════════════════════════════════════════════
//
// Ogni foto etichettata sta in UN gruppo, e ogni gruppo dice di sé solo ciò
// che sappiamo (review del 02/10: la prima versione chiamava «foto ritoccate,
// con le modifiche indicate sulla foto» anche le `ai` generiche — di cui non
// sappiamo cosa è cambiato — e i render generati per intero, che non sono
// fotografie: falso in 15 annunci TSI su 16).
//   1. le foto CLASSIFICATE (luce, pulizia, aggiunte) — le forme della SPEC:
//      · solo luce: «Foto ritoccate con l'AI solo nella luce e nei colori:
//        niente è stato aggiunto o tolto.» («N foto su M» se non sono tutte);
//      · misto: «N foto su M ritoccate con l'AI: L solo nella luce e nei
//        colori, S con modifiche indicate sulla foto.» + «K sono simulazioni.»;
//      · senza luce: «S foto su M ritoccate con l'AI, con le modifiche indicate
//        sulla foto.» + «K sono simulazioni.»;
//      · solo simulazioni: «K foto su M sono simulazioni create con l'AI,
//        indicate sulla foto.»;
//   2. le GENERICHE (`ai`, §11.4): «G foto su M sono passate da un modello
//      generativo: cosa è cambiato, foto per foto, è in verifica.» — «Altre G…»
//      dopo il gruppo 1;
//   3. le IMMAGINI che non sono fotografie (render, con o senza AI): «Nessuna
//      immagine è una fotografia: R immagini generate per intero con l'AI e P
//      rendering di progetto.», o «…: non sono fotografie.» se ce ne sono altre;
//   4. «I difetti sono lasciati visibili.» e l'«AI» precauzionale.
// M conta le FOTO (le pubblicate meno i render). La chiusura («La visita resta
// l'unico riferimento.») la stampa la pagina, sempre. null = niente da dire.
// I plurali sloveni passano da Intl.PluralRules (one/two/few/other).

type ConteggiRiga = Pick<
  TrasparenzaImmobile["conteggi"],
  | "pubblicate"
  | "luce"
  | "pulizia"
  | "aggiunte"
  | "generiche"
  | "precauzione"
  | "aiRendering"
  | "rendering"
  | "bloccoDifetti"
>;

type Frasi = {
  soloLuce: (n: number, m: number) => string;
  sostanza: (s: number, m: number) => string;
  misto: (n: number, m: number, l: number, s: number) => string;
  simulazioni: (k: number) => string;
  soloSimulazioni: (k: number, m: number) => string;
  generiche: (g: number, m: number) => string;
  genericheAltre: (g: number) => string;
  /** r = generate per intero con l'AI, p = render di progetto; `tutte` = non
   *  c'è nessuna fotografia nell'annuncio. */
  immagini: (r: number, p: number, tutte: boolean) => string;
  difetti: string;
  precauzione: (r: number) => string;
};

const PLURALE_SL = new Intl.PluralRules("sl");
const sl = (n: number, forme: Record<"one" | "two" | "few" | "other", string>) =>
  forme[PLURALE_SL.select(n) as keyof typeof forme] ?? forme.other;
// Il genitivo dopo «od M» e il locativo dopo «pri N»: singolare con 1 (e 101…),
// plurale con tutto il resto (il duale ha le stesse forme del plurale).
const fotografijGen = (m: number) => (PLURALE_SL.select(m) === "one" ? "fotografije" : "fotografij");
const fotografijLoc = (m: number) => (PLURALE_SL.select(m) === "one" ? "fotografiji" : "fotografijah");
const unite = (pezzi: (string | false)[], e: string) => pezzi.filter((x): x is string => !!x).join(e);

const FRASI = {
  it: {
    soloLuce: (n, m) =>
      n === m
        ? "Foto ritoccate con l'AI solo nella luce e nei colori: niente è stato aggiunto o tolto."
        : `${n} foto su ${m} ${n === 1 ? "ritoccata" : "ritoccate"} con l'AI solo nella luce e nei colori: niente è stato aggiunto o tolto.`,
    sostanza: (s, m) =>
      `${s} foto su ${m} ${s === 1 ? "ritoccata" : "ritoccate"} con l'AI, con le modifiche indicate sulla foto.`,
    misto: (n, m, l, s) =>
      `${n} foto su ${m} ritoccate con l'AI: ${l} solo nella luce e nei colori, ${s} con modifiche indicate sulla foto.`,
    simulazioni: (k) => (k === 1 ? "1 è una simulazione." : `${k} sono simulazioni.`),
    soloSimulazioni: (k, m) =>
      k === 1
        ? `1 foto su ${m} è una simulazione creata con l'AI, indicata sulla foto.`
        : `${k} foto su ${m} sono simulazioni create con l'AI, indicate sulla foto.`,
    generiche: (g, m) =>
      g === m && m > 1
        ? "Tutte le foto sono passate da un modello generativo: cosa è cambiato, foto per foto, è in verifica."
        : g === 1
          ? `1 foto su ${m} è passata da un modello generativo: cosa è cambiato è in verifica.`
          : `${g} foto su ${m} sono passate da un modello generativo: cosa è cambiato, foto per foto, è in verifica.`,
    genericheAltre: (g) =>
      g === 1
        ? "Un'altra è passata da un modello generativo: cosa è cambiato è in verifica."
        : `Altre ${g} sono passate da un modello generativo: cosa è cambiato è in verifica.`,
    immagini: (r, p, tutte) => {
      const pezzi = unite(
        [
          r > 0 && (r === 1 ? "1 immagine generata per intero con l'AI" : `${r} immagini generate per intero con l'AI`),
          p > 0 && `${p} rendering di progetto`,
        ],
        " e ",
      );
      return tutte
        ? `Nessuna immagine è una fotografia: ${pezzi}.`
        : `${pezzi}: ${r + p === 1 ? "non è una fotografia" : "non sono fotografie"}.`;
    },
    difetti: "I difetti sono lasciati visibili.",
    precauzione: (r) => `Su ${r} foto l'etichetta «AI» è precauzionale, in attesa di verifica.`,
  },
  en: {
    soloLuce: (n, m) =>
      n === m
        ? "Photos edited with AI in light and colour only: nothing was added or removed."
        : `${n} of ${m} ${m === 1 ? "photo" : "photos"} edited with AI in light and colour only: nothing was added or removed.`,
    sostanza: (s, m) =>
      `${s} of ${m} ${m === 1 ? "photo" : "photos"} edited with AI, with the changes marked on the photo.`,
    misto: (n, m, l, s) =>
      `${n} of ${m} photos edited with AI: ${l} in light and colour only, ${s} with changes marked on the photo.`,
    simulazioni: (k) => (k === 1 ? "1 is a simulation." : `${k} are simulations.`),
    soloSimulazioni: (k, m) =>
      `${k} of ${m} ${m === 1 ? "photo" : "photos"} ${k === 1 ? "is a simulation" : "are simulations"} created with AI, marked on the photo.`,
    generiche: (g, m) =>
      g === m && m > 1
        ? "All the photos have been through a generative model: what changed is being checked photo by photo."
        : `${g} of ${m} ${m === 1 ? "photo" : "photos"} ${g === 1 ? "has" : "have"} been through a generative model: what changed is being checked${g > 1 ? " photo by photo" : ""}.`,
    genericheAltre: (g) =>
      g === 1
        ? "One more has been through a generative model: what changed is being checked."
        : `Another ${g} have been through a generative model: what changed is being checked.`,
    immagini: (r, p, tutte) => {
      const pezzi = unite(
        [
          r > 0 && (r === 1 ? "1 image generated entirely with AI" : `${r} images generated entirely with AI`),
          p > 0 && (p === 1 ? "1 design rendering" : `${p} design renderings`),
        ],
        " and ",
      );
      return tutte
        ? `None of the images is a photograph: ${pezzi}.`
        : `${pezzi}: ${r + p === 1 ? "not a photograph" : "not photographs"}.`;
    },
    difetti: "Defects have been left visible.",
    precauzione: (r) => `On ${r} ${r === 1 ? "photo" : "photos"} the “AI” label is precautionary, pending review.`,
  },
  de: {
    soloLuce: (n, m) =>
      n === m
        ? "Fotos mit KI nur bei Licht und Farben bearbeitet: Nichts wurde hinzugefügt oder entfernt."
        : `${n} von ${m} ${m === 1 ? "Foto" : "Fotos"} mit KI nur bei Licht und Farben bearbeitet: Nichts wurde hinzugefügt oder entfernt.`,
    sostanza: (s, m) =>
      `${s} von ${m} ${m === 1 ? "Foto" : "Fotos"} mit KI bearbeitet, die Änderungen sind auf dem Foto gekennzeichnet.`,
    misto: (n, m, l, s) =>
      `${n} von ${m} Fotos mit KI bearbeitet: ${l} nur bei Licht und Farben, ${s} mit auf dem Foto gekennzeichneten Änderungen.`,
    simulazioni: (k) => (k === 1 ? "1 davon ist eine Simulation." : `${k} davon sind Simulationen.`),
    soloSimulazioni: (k, m) =>
      k === 1
        ? `1 von ${m} ${m === 1 ? "Foto" : "Fotos"} ist eine mit KI erstellte Simulation, auf dem Foto gekennzeichnet.`
        : `${k} von ${m} Fotos sind mit KI erstellte Simulationen, auf dem Foto gekennzeichnet.`,
    generiche: (g, m) =>
      g === m && m > 1
        ? "Alle Fotos wurden von einem generativen Modell bearbeitet: Was sich geändert hat, wird Foto für Foto geprüft."
        : `${g} von ${m} ${m === 1 ? "Foto" : "Fotos"} ${g === 1 ? "wurde" : "wurden"} von einem generativen Modell bearbeitet: Was sich geändert hat, wird${g > 1 ? " Foto für Foto" : ""} geprüft.`,
    genericheAltre: (g) =>
      g === 1
        ? "Ein weiteres wurde von einem generativen Modell bearbeitet: Was sich geändert hat, wird geprüft."
        : `Weitere ${g} wurden von einem generativen Modell bearbeitet: Was sich geändert hat, wird geprüft.`,
    immagini: (r, p, tutte) => {
      const pezzi = unite(
        [
          r > 0 && (r === 1 ? "1 vollständig mit KI erzeugtes Bild" : `${r} vollständig mit KI erzeugte Bilder`),
          p > 0 && (p === 1 ? "1 Projektvisualisierung" : `${p} Projektvisualisierungen`),
        ],
        " und ",
      );
      return tutte
        ? `Keines der Bilder ist ein Foto: ${pezzi}.`
        : `${pezzi}: ${r + p === 1 ? "kein Foto" : "keine Fotos"}.`;
    },
    difetti: "Mängel wurden sichtbar belassen.",
    precauzione: (r) => `Bei ${r} ${r === 1 ? "Foto" : "Fotos"} ist die Kennzeichnung „AI“ vorsorglich, die Prüfung läuft.`,
  },
  // ⚠️ Lo sloveno di questo blocco va riletto da un madrelingua.
  sl: {
    soloLuce: (n, m) =>
      n === m
        ? "Pri fotografijah smo z umetno inteligenco popravili le svetlobo in barve: nič ni bilo dodano ali odstranjeno."
        : `Pri ${n} od ${m} ${fotografijGen(m)} smo z umetno inteligenco popravili le svetlobo in barve: nič ni bilo dodano ali odstranjeno.`,
    sostanza: (s, m) =>
      `Z umetno inteligenco smo uredili ${s} od ${m} ${fotografijGen(m)}, spremembe so označene na fotografiji.`,
    misto: (n, m, l, s) =>
      `Z umetno inteligenco smo uredili ${n} od ${m} ${fotografijGen(m)}: pri ${l} le svetlobo in barve, pri ${s} so spremembe označene na fotografiji.`,
    simulazioni: (k) =>
      sl(k, {
        one: `Med njimi je ${k} simulacija.`,
        two: `Med njimi sta ${k} simulaciji.`,
        few: `Med njimi so ${k} simulacije.`,
        other: `Med njimi je ${k} simulacij.`,
      }),
    soloSimulazioni: (k, m) =>
      `${k === 1 ? "Simulacija, ustvarjena z umetno inteligenco in označena" : "Simulacije, ustvarjene z umetno inteligenco in označene"} na fotografiji: ${k} od ${m} ${fotografijGen(m)}.`,
    generiche: (g, m) =>
      g === m && m > 1
        ? "Generativni model je obdelal vse fotografije: kaj se je spremenilo, preverjamo za vsako posebej."
        : `Generativni model je obdelal ${g} od ${m} ${fotografijGen(m)}: kaj se je spremenilo, ${g > 1 ? "preverjamo za vsako posebej" : "še preverjamo"}.`,
    genericheAltre: (g) =>
      `Generativni model je obdelal še ${sl(g, {
        one: `${g} fotografijo`,
        two: `${g} fotografiji`,
        few: `${g} fotografije`,
        other: `${g} fotografij`,
      })}: kaj se je spremenilo, še preverjamo.`,
    immagini: (r, p, tutte) => {
      const pezzi = unite(
        [
          r > 0 &&
            sl(r, {
              one: `${r} slika, v celoti ustvarjena z umetno inteligenco`,
              two: `${r} sliki, v celoti ustvarjeni z umetno inteligenco`,
              few: `${r} slike, v celoti ustvarjene z umetno inteligenco`,
              other: `${r} slik, v celoti ustvarjenih z umetno inteligenco`,
            }),
          p > 0 &&
            sl(p, {
              one: `${p} projektna vizualizacija`,
              two: `${p} projektni vizualizaciji`,
              few: `${p} projektne vizualizacije`,
              other: `${p} projektnih vizualizacij`,
            }),
        ],
        ", in ",
      );
      return tutte
        ? `Nobena slika v oglasu ni fotografija: ${pezzi}.`
        : `${pezzi}: ${r + p === 1 ? "to ni fotografija" : "to niso fotografije"}.`;
    },
    difetti: "Pomanjkljivosti so ostale vidne.",
    precauzione: (r) => `Pri ${r} ${fotografijLoc(r)} je oznaka »AI« previdnostna, čaka na preverjanje.`,
  },
} as const satisfies Record<Locale, Frasi>;

/** Quante FOTO dell'annuncio sono passate (o forse passate) da un modello:
 *  classificate, generiche, precauzionali. 0 = ci sono solo render. */
const fotoDaModello = (c: ConteggiRiga) => c.luce + c.pulizia + c.aggiunte + c.generiche + c.precauzione;
/** Nessuna immagine dell'annuncio è una fotografia: sono tutte render (un
 *  edificio in costruzione, i cantieri di Duino). */
const soloImmagini = (c: ConteggiRiga) =>
  fotoDaModello(c) === 0 && c.aiRendering + c.rendering > 0 && c.aiRendering + c.rendering >= c.pubblicate;

/** La riga visibile del riepilogo, nella lingua della pagina (v1.3 §11.2). */
export function rigaRiepilogo(c: ConteggiRiga, locale: string): string | null {
  const f: Frasi = (FRASI as Record<string, Frasi>)[locale] ?? FRASI.it;
  const immagini = c.aiRendering + c.rendering;
  const tutteLeFoto = fotoDaModello(c);
  // M = le FOTO dell'annuncio: un render non è una foto, e non si conta fra le
  // foto «su M». Mai meno delle foto che si stanno dichiarando.
  const m = Math.max(c.pubblicate - immagini, tutteLeFoto);
  const s = c.pulizia + c.aggiunte;
  const n = c.luce + s;
  const parti: string[] = [];
  if (n > 0) {
    if (s === 0) parti.push(f.soloLuce(n, m));
    else if (c.luce === 0 && c.pulizia === 0) parti.push(f.soloSimulazioni(c.aggiunte, m));
    else {
      parti.push(c.luce === 0 ? f.sostanza(s, m) : f.misto(n, m, c.luce, s));
      if (c.aggiunte > 0) parti.push(f.simulazioni(c.aggiunte));
    }
  }
  if (c.generiche > 0) parti.push(n > 0 ? f.genericheAltre(c.generiche) : f.generiche(c.generiche, m));
  if (immagini > 0) parti.push(f.immagini(c.aiRendering, c.rendering, soloImmagini(c)));
  if (n + c.generiche > 0 && c.bloccoDifetti > 0) parti.push(f.difetti);
  if (c.precauzione > 0) parti.push(f.precauzione(c.precauzione));
  return parti.length ? parti.join(" ") : null;
}

/** Il comando che apre il dettaglio: «Leggi come le abbiamo ritoccate» se
 *  almeno una FOTO è passata da un modello; altrimenti (solo render, solo
 *  l'«AI» precauzionale) «ritoccate» sarebbe falso: «Leggi la nota completa»
 *  se il CRM ha la nota, «Dettagli» se il dettaglio ha solo i conteggi. */
export function comandoDettaglio(c: ConteggiRiga, locale: string, conNota: boolean): string {
  const tx = testiTrasparenza(locale);
  if (c.luce + c.pulizia + c.aggiunte + c.generiche > 0) return tx.dettaglio;
  return conNota ? tx.dettaglioNota : tx.dettaglioBreve;
}

/** «La visita resta l'unico riferimento.» — sempre (SPEC §5.3, §11.2), tranne
 *  quando nessuna immagine è una fotografia: un edificio in costruzione non si
 *  visita, e lì la riga dice già «Nessuna immagine è una fotografia» (review
 *  del 02/10). null = niente chiusura. */
export function chiusuraRiepilogo(c: ConteggiRiga, locale: string): string | null {
  return soloImmagini(c) ? null : testiTrasparenza(locale).chiusura;
}

/** Una riga dei conteggi per tipo, dentro il dettaglio (v1.3 §11.2). */
export type RigaDettaglio = {
  chiave:
    | "pubblicate"
    | Trattamento
    | "renderingDalNome"
    | "ricontrollo"
    | "conOriginale"
    | "bloccoDifetti";
  n: number;
  /** L'etichetta come la si vede sulla foto, accanto al numero: spiega le
   *  pillole della galleria. null = quel tipo non ne porta (lo stile, i totali). */
  pillola: string | null;
  testo: string;
};

/** I conteggi per tipo, nella lingua della pagina: gli stessi gruppi della
 *  riga, dallo stile alla sostanza, poi le immagini che non sono foto. Solo i
 *  tipi presenti. */
export function righeDettaglio(t: TrasparenzaImmobile, locale: string): RigaDettaglio[] {
  const tx = testiTrasparenza(locale);
  const c = t.conteggi;
  const righe: [RigaDettaglio["chiave"], number, string | null][] = [
    ["pubblicate", c.pubblicate, null],
    ["ai_luce", c.luce, null],
    ["tecnico", t.perTipo.tecnico ?? 0, null],
    ["ai_pulizia", c.pulizia, tx.etichetta.ai_pulizia],
    ["ai_aggiunte", c.aggiunte, tx.etichetta.ai_aggiunte],
    ["ai", c.generiche, tx.etichetta.ai],
    ["ricontrollo", c.precauzione, tx.etichetta.ai],
    ["ai_rendering", c.aiRendering, tx.etichetta.ai_rendering],
    ["rendering", c.rendering - c.renderingDalNome, tx.etichetta.rendering],
    ["renderingDalNome", c.renderingDalNome, tx.etichetta.rendering],
    ["conOriginale", c.conOriginale, null],
    ["bloccoDifetti", c.bloccoDifetti, null],
  ];
  return righe
    .filter(([, n]) => n > 0)
    .map(([chiave, n, pillola]) => ({ chiave, n, pillola, testo: tx.tipi[chiave] }));
}

// ═══════════════════════════════════════════════════════════════════════════
// I DOPPIONI NELLA DESCRIZIONE (SPEC §5.4)
// ═══════════════════════════════════════════════════════════════════════════

// Gli attacchi standard della nota (nuovi e vecchi). Un paragrafo che inizia
// così è la nota scritta a mano nel testo: quando la nota arriva dal CRM, la
// si mostra una volta sola, nel riepilogo.
//
// I nuovi nominano l'AI da soli. I vecchi («Nota sulle fotografie») no: sono
// la nota AI solo se il testo che aprono parla di modifiche o di AI — «Nota
// sulle fotografie: la vista dal terrazzo è reale.» è un'informazione vera
// sull'immobile, e la toglieva (review del 01/10).
const ATTACCHI_AI = [
  "Nota sull'uso dell'intelligenza artificiale",
  "Note on the use of artificial intelligence",
  "Hinweis zum Einsatz künstlicher Intelligenz",
  "Opomba o uporabi umetne inteligence",
].map((s) => normAttacco(s));
const ATTACCHI_FOTO = [
  "Nota sulle fotografie",
  "A note on the photographs",
  "Note on the images",
  "Hinweis zu den Fotos",
  "Hinweis zu den Fotografien",
  "Opomba o fotografijah",
].map((s) => normAttacco(s));
const ATTACCHI = [...ATTACCHI_AI, ...ATTACCHI_FOTO];

function normAttacco(s: string): string {
  return s
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/^[\s*_#>«"“„-]+/, "")
    .toLowerCase();
}

const apre = (s: string, attacchi: readonly string[]) => {
  const n = normAttacco(s.trim());
  return attacchi.some((a) => n.startsWith(a));
};

// Il lessico della nota, nelle quattro lingue. Le sigle sono a parte e
// sensibili alle maiuscole: «ai» minuscolo è una preposizione italiana.
const SIGLE_AI = /(?<![\p{L}\p{N}])(?:AI|KI|UI)(?![\p{L}\p{N}])/u;
const PAROLE_AI =
  /intelligenza artificiale|artificial intelligence|künstliche\w* intelligenz|umetn\w* inteligenc|generativ|nano banana|higgsfield|ritocc|retouch|nachbearbeit/i;
// Modifiche alla foto: valgono solo dove si sa già che si parla di foto (un
// paragrafo aperto da «Nota sulle fotografie», o che nomina le foto).
const MODIFICHE =
  /elaborat|modificat|modified|edited|processed|bearbeit|veränder|urejen|obdelan|spremenjen|simula|rendering|ricostrui|reconstruct|rekonstru/i;
const TOLTO = /\b(?:tolt|rimoss|removed|entfernt|odstranj)/i;
const FOTO = /\b(?:foto|immagin|photo|image|picture|bild|aufnahme|slik|posnet)/i;
const RICHIESTA = /su richiesta|on request|upon request|auf anfrage|na zahtevo/i;
const VISITA = /visita resta|viewing remains|visit remains|besichtigung bleibt|ogled ostaja/i;

const parlaDiAi = (s: string) => SIGLE_AI.test(s) || PAROLE_AI.test(s);

/** Un testo aperto da un attacco è la nota AI? Sempre, se l'attacco è uno
 *  dei nuovi; con un attacco vecchio, solo se il testo parla di AI o di
 *  modifiche (la foto c'è già, nell'attacco). */
function eNotaAi(s: string): boolean {
  if (apre(s, ATTACCHI_AI)) return true;
  return apre(s, ATTACCHI_FOTO) && (parlaDiAi(s) || MODIFICHE.test(s) || TOLTO.test(s));
}

/** Un paragrafo che, subito dopo la nota, ne è il seguito: il corpo in più
 *  paragrafi («Sono stati tolti: …», «Gli originali sono disponibili su
 *  richiesta.»). Prudente: un paragrafo che parla d'altro chiude la nota. */
function seguitoNota(p: string): boolean {
  if (apre(p, ATTACCHI)) return false; // un'altra nota: la decide il giro principale
  return (
    parlaDiAi(p) ||
    TOLTO.test(p) ||
    VISITA.test(p) ||
    (FOTO.test(p) && (MODIFICHE.test(p) || RICHIESTA.test(p)))
  );
}

// Titolo = corto e senza punteggiatura interna: «Nota sulle fotografie»,
// «Nota sull'uso dell'intelligenza artificiale nelle fotografie.»
const eTitolo = (p: string) => p.length <= 90 && /^[^.:;!?]*[.:]?$/.test(p);

/**
 * Toglie dalla descrizione la nota scritta a mano. Tre forme:
 *  · un paragrafo che apre con un attacco («Nota sulle fotografie di questo
 *    annuncio. Le immagini…»): via il paragrafo;
 *  · un titolo da solo sulla sua riga («Nota sulle fotografie»): via il
 *    titolo E il paragrafo che lo segue, che è il corpo della nota;
 *  · la nota attaccata in coda a un paragrafo («… Classe energetica E. Nota
 *    sulle fotografie …»): il paragrafo si tronca lì.
 * Dopo la nota, nelle prime due forme, se ne vanno anche i paragrafi che ne
 * sono il seguito (`seguitoNota`): un corpo in due paragrafi lasciava orfano
 * il secondo. Con un attacco vecchio, la nota è tale solo se parla di AI o di
 * modifiche (`eNotaAi`): altrimenti è testo dell'annuncio, e resta.
 * Si chiama SOLO quando il riepilogo mostra la nota del CRM nella lingua
 * della descrizione: senza, quel testo è l'unica dichiarazione che il
 * visitatore legge nella sua lingua, e deve restare.
 */
export function senzaNotaAi(testo: string | null): string | null {
  if (!testo) return testo;
  const paragrafi = testo
    .split(/\n+/)
    .map((par) => ({ par, p: par.trim() }))
    .filter((x) => x.p);
  const tenuti: string[] = [];
  let toccato = false;
  for (let i = 0; i < paragrafi.length; i++) {
    const { par, p } = paragrafi[i];
    if (apre(p, ATTACCHI)) {
      // Un titolo si giudica col suo corpo: «Nota sulle fotografie» sopra
      // «La vista dal terrazzo è reale.» non è la nota AI.
      const corpo = eTitolo(p) ? paragrafi[i + 1]?.p : undefined;
      const nota = corpo !== undefined ? eNotaAi(`${p} ${corpo}`) : eNotaAi(p);
      if (nota) {
        toccato = true;
        if (corpo !== undefined) i++;
        while (i + 1 < paragrafi.length && seguitoNota(paragrafi[i + 1].p)) i++;
        continue;
      }
      tenuti.push(par);
      continue;
    }
    const coda = codaNota(p);
    if (coda !== null) {
      toccato = true;
      if (coda) tenuti.push(coda);
      continue;
    }
    tenuti.push(par);
  }
  if (!toccato) return testo;
  const out = tenuti.join("\n\n").trim();
  return out || null;
}

/** La parte del paragrafo PRIMA di una nota AI attaccata in coda, o null. */
function codaNota(p: string): string | null {
  for (const m of p.matchAll(/[.!?]\s+/g)) {
    const dopo = p.slice(m.index + m[0].length);
    if (apre(dopo, ATTACCHI) && eNotaAi(dopo)) return p.slice(0, m.index + 1).trim();
  }
  return null;
}

/** La descrizione contiene una nota scritta a mano? */
export function haNotaAi(testo: string | null): boolean {
  return testo != null && senzaNotaAi(testo) !== testo;
}
