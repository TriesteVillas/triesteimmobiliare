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
    /** foto senza riga con l'etichetta generica precauzionale */
    ricontrollo: number;
    bloccoDifetti: number;
    conOriginale: number;
  };
  /** Le etichette che compaiono sulle foto di questo annuncio, per la legenda. */
  etichette: ConEtichetta[];
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
// ⚠️ Le frasi slovene nuove (tessere, legenda, ripieghi) vanno fatte
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
  eyebrow: string;
  titolo: string;
  nav: string;
  tessere: { pubblicate: string; ai: string; ricontrollo: string; conOriginale: string; bloccoDifetti: string };
  legendaTitolo: string;
  legenda: Record<ConEtichetta, string>;
  dettaglio: string;
  chiusura: string;
  linkAi: string;
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
    didascaliaAi: "Foto passata da un modello generativo. La descrizione di cosa è cambiato è in preparazione.",
    didascaliaGenerica:
      "Etichetta precauzionale: stiamo ricontrollando quali foto di questo annuncio sono passate da un modello generativo, e nel dubbio l'etichetta resta.",
    ariaRenderNome: "Rendering, non una fotografia: in ricontrollo",
    didascaliaRenderNome:
      "Rendering: non è una fotografia. Stiamo ricontrollando come è stato prodotto, e se è passato da un modello generativo.",
    vediOriginale: "Vedi l'originale",
    tasto: "tasto O",
    originale: "Originale",
    didascaliaOriginale: "Foto originale, prima dell'intervento. Volti e dati personali sfocati.",
    eyebrow: "Trasparenza",
    titolo: "Come abbiamo usato l'AI in queste foto",
    nav: "AI nelle foto",
    tessere: {
      pubblicate: "Foto pubblicate",
      ai: "Modificate con l'AI",
      ricontrollo: "In ricontrollo",
      conOriginale: "Con l'originale a un clic",
      bloccoDifetti: "Con i difetti lasciati visibili",
    },
    legendaTitolo: "Le etichette sulle foto",
    legenda: {
      ai: "modello generativo, dettagli in ricontrollo",
      ai_luce: "solo luce e colore",
      ai_pulizia: "oggetti tolti, le parti nascoste ricostruite dal modello",
      ai_aggiunte: "elementi aggiunti o ricostruiti: è una simulazione",
      ai_rendering: "immagine generata per intero con l'AI",
      rendering: "immagine di progetto, senza AI",
    },
    dettaglio: "Leggi la nota completa",
    chiusura: "La visita resta l'unico riferimento.",
    linkAi: "Come usiamo l'AI",
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
    didascaliaAi: "This photo was processed by a generative model. A description of what changed is being prepared.",
    didascaliaGenerica:
      "Precautionary label: we are re-checking which photos in this listing went through a generative model, and until we are sure the label stays.",
    ariaRenderNome: "Rendering, not a photograph: under review",
    didascaliaRenderNome:
      "Rendering: this is not a photograph. We are re-checking how it was made, and whether it went through a generative model.",
    vediOriginale: "See the original",
    tasto: "key O",
    originale: "Original",
    didascaliaOriginale: "Original photo, before editing. Faces and personal data blurred.",
    eyebrow: "Transparency",
    titolo: "How we used AI in these photos",
    nav: "AI in the photos",
    tessere: {
      pubblicate: "Photos published",
      ai: "Edited with AI",
      ricontrollo: "Being re-checked",
      conOriginale: "Original one click away",
      bloccoDifetti: "With defects left visible",
    },
    legendaTitolo: "The labels on the photos",
    legenda: {
      ai: "generative model, details being re-checked",
      ai_luce: "light and colour only",
      ai_pulizia: "objects removed, hidden areas filled in by the model",
      ai_aggiunte: "elements added or rebuilt: a simulation",
      ai_rendering: "image generated entirely with AI",
      rendering: "design visualisation, no AI",
    },
    dettaglio: "Read the full note",
    chiusura: "The viewing remains the only reference.",
    linkAi: "How we use AI",
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
    didascaliaAi: "Dieses Foto wurde von einem generativen Modell bearbeitet. Eine Beschreibung der Änderungen folgt.",
    didascaliaGenerica:
      "Vorsorgliche Kennzeichnung: Wir prüfen gerade, welche Fotos dieses Inserats ein generatives Modell durchlaufen haben; bis dahin bleibt die Kennzeichnung.",
    ariaRenderNome: "Rendering, kein Foto: wird erneut geprüft",
    didascaliaRenderNome:
      "Rendering: kein Foto. Wir prüfen gerade, wie es entstanden ist und ob es ein generatives Modell durchlaufen hat.",
    vediOriginale: "Original ansehen",
    tasto: "Taste O",
    originale: "Original",
    didascaliaOriginale: "Originalfoto vor der Bearbeitung. Gesichter und persönliche Daten unkenntlich gemacht.",
    eyebrow: "Transparenz",
    titolo: "Wie wir KI in diesen Fotos eingesetzt haben",
    nav: "KI in den Fotos",
    tessere: {
      pubblicate: "Veröffentlichte Fotos",
      ai: "Mit KI bearbeitet",
      ricontrollo: "In Prüfung",
      conOriginale: "Original mit einem Klick",
      bloccoDifetti: "Mängel sichtbar belassen",
    },
    legendaTitolo: "Die Kennzeichnungen auf den Fotos",
    legenda: {
      ai: "generatives Modell, Details in Prüfung",
      ai_luce: "nur Licht und Farbe",
      ai_pulizia: "Gegenstände entfernt, verdeckte Stellen vom Modell ergänzt",
      ai_aggiunte: "Elemente hinzugefügt oder rekonstruiert: eine Simulation",
      ai_rendering: "vollständig mit KI erzeugtes Bild",
      rendering: "Projektvisualisierung, ohne KI",
    },
    dettaglio: "Vollständigen Hinweis lesen",
    chiusura: "Die Besichtigung bleibt der einzige Maßstab.",
    linkAi: "Wie wir KI einsetzen",
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
    didascaliaAi: "Fotografijo je obdelal generativni model. Opis sprememb je v pripravi.",
    didascaliaGenerica:
      "Previdnostna oznaka: preverjamo, katere fotografije v tem oglasu je obdelal generativni model; do takrat oznaka ostane.",
    ariaRenderNome: "Vizualizacija, ne fotografija: v ponovnem pregledu",
    didascaliaRenderNome:
      "Vizualizacija: to ni fotografija. Preverjamo, kako je nastala in ali jo je obdelal generativni model.",
    vediOriginale: "Poglej izvirnik",
    tasto: "tipka O",
    originale: "Izvirnik",
    didascaliaOriginale: "Izvirna fotografija pred posegom. Obrazi in osebni podatki so zabrisani.",
    eyebrow: "Preglednost",
    titolo: "Kako smo pri teh fotografijah uporabili umetno inteligenco",
    nav: "AI na fotografijah",
    // Naslovi ploščic: število stoji ločeno, zato se ne sklanja.
    tessere: {
      pubblicate: "Objavljene fotografije",
      ai: "Urejene z umetno inteligenco",
      ricontrollo: "V ponovnem pregledu",
      conOriginale: "Izvirnik na en klik",
      bloccoDifetti: "Pomanjkljivosti ostale vidne",
    },
    legendaTitolo: "Oznake na fotografijah",
    legenda: {
      ai: "generativni model, podrobnosti v ponovnem pregledu",
      ai_luce: "le svetloba in barve",
      ai_pulizia: "predmeti odstranjeni, zakrite dele je dopolnil model",
      ai_aggiunte: "dodani ali rekonstruirani elementi: simulacija",
      ai_rendering: "slika, v celoti ustvarjena z umetno inteligenco",
      rendering: "projektna vizualizacija, brez umetne inteligence",
    },
    dettaglio: "Preberite celotno opombo",
    chiusura: "Ogled ostaja edino merilo.",
    linkAi: "Kako uporabljamo umetno inteligenco",
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

/**
 * La pagina /ai («AI a carte scoperte», SPEC §6) su questo sito NON esiste
 * ancora: finché non c'è, il riepilogo non la linka (un link morto proprio nel
 * riquadro della trasparenza toglierebbe fiducia). Quando la pagina arriva —
 * e la SPEC §9.2 la tiene in anteprima finché il legale non la rilegge —
 * basta mettere `true` qui.
 */
export const PAGINA_AI_PRONTA = false;

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

const ORDINE_ETICHETTE: readonly ConEtichetta[] = [
  "ai_luce", "ai_pulizia", "ai_aggiunte", "ai_rendering", "ai", "rendering",
];

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
  const presenti = new Set<ConEtichetta>();
  for (const ph of mostrate) {
    const d = ph.trasparenza;
    if (!d || d.trattamento === "tecnico") continue;
    // La legenda spiega le etichette del CRM, più la «AI» generica. Un render
    // riconosciuto dal nome no: la voce «Rendering» dice «senza AI», e di
    // quello non lo sappiamo (lo spiega la sua didascalia).
    if (d.fonte === "crm" || d.trattamento === "ai") presenti.add(d.trattamento);
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
  finale.trasparenza = {
    nota: t.nota,
    conteggi,
    etichette: ORDINE_ETICHETTE.filter((e) => presenti.has(e)),
  };
  return finale;
}

/**
 * La foto dell'anteprima social (og:image). Le anteprime di WhatsApp e
 * Facebook non portano etichette: lì va la prima foto, nell'ordine della
 * scheda, che non ne porterebbe una sul sito (niente AI, niente render, niente
 * etichetta precauzionale). Se ce l'hanno tutte, null: resta l'immagine del
 * sito. Senza nessuna etichetta: la copertina, come prima.
 */
export function fotoPerAnteprima(p: Property): Photo | null {
  const lista = listaSito(p);
  if (!lista.some((ph) => ph.trasparenza)) return p.coverPhoto;
  return lista.find((ph) => !ph.trasparenza || ph.trasparenza.trattamento === "tecnico") ?? null;
}


// ═══════════════════════════════════════════════════════════════════════════
// LA RESA NELLA LINGUA DEL VISITATORE (server → client)
// ═══════════════════════════════════════════════════════════════════════════

/** Da dati grezzi a vista localizzata. null se la foto non ha niente da dire. */
export function fotoAi(d: FotoTrasparenza | null | undefined, locale: string): FotoAi | null {
  if (!d) return null;
  const tx = testiTrasparenza(locale);
  const propria = nellaLingua(d.didascalia, locale);
  const etichetta = d.trattamento === "tecnico" ? "" : tx.etichetta[d.trattamento];
  const glifo =
    d.trattamento === "tecnico" ? "" : d.trattamento === "rendering" ? tx.glifo.rendering : tx.glifo.ai;
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
  // Una foto «tecnico» senza didascalia né originale non ha niente da mostrare.
  if (!etichetta && !didascalia && !d.originale) return null;
  return {
    trattamento: d.trattamento,
    etichetta,
    glifo,
    aria,
    didascalia,
    originale: d.originale,
  };
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
 * La nota del CRM pronta per il riepilogo: senza la prima frase quando è
 * l'attacco standard («Nota sull'uso dell'intelligenza artificiale nelle
 * fotografie.»), che ripeterebbe il titolo della sezione; poi divisa in un
 * attacco breve, sempre visibile, e il resto, che si apre a richiesta — le
 * note vere sono lunghe 2.300-3.600 caratteri.
 */
export function notaPerRiepilogo(nota: string): { attacco: string; resto: string | null } {
  let f = frasi(nota);
  if (f.length > 1 && f[0].length <= 120 && ATTACCHI.some((a) => normAttacco(f[0]).startsWith(a))) f = f.slice(1);
  const attacco: string[] = [];
  let lung = 0;
  while (f.length && (attacco.length === 0 || lung < 260)) {
    const s = f.shift()!;
    attacco.push(s);
    lung += s.length + 1;
  }
  const resto = f.join(" ");
  // Un resto cortissimo non vale un «leggi tutto»: si mostra tutto.
  if (resto && resto.length < 200) return { attacco: [...attacco, resto].join(" "), resto: null };
  return { attacco: attacco.join(" "), resto: resto || null };
}

// ═══════════════════════════════════════════════════════════════════════════
// I DOPPIONI NELLA DESCRIZIONE (SPEC §5.4)
// ═══════════════════════════════════════════════════════════════════════════

// Gli attacchi standard della nota (nuovi e vecchi). Un paragrafo che inizia
// così è la nota scritta a mano nel testo: quando la nota arriva dal CRM, la
// si mostra una volta sola, nel riepilogo.
const ATTACCHI = [
  "Nota sull'uso dell'intelligenza artificiale",
  "Note on the use of artificial intelligence",
  "Hinweis zum Einsatz künstlicher Intelligenz",
  "Opomba o uporabi umetne inteligence",
  "Nota sulle fotografie",
  "A note on the photographs",
  "Note on the images",
  "Hinweis zu den Fotos",
  "Hinweis zu den Fotografien",
  "Opomba o fotografijah",
].map((s) => normAttacco(s));

function normAttacco(s: string): string {
  return s
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/^[\s*_#>«"“„-]+/, "")
    .toLowerCase();
}

const apreNota = (s: string) => {
  const n = normAttacco(s.trim());
  return ATTACCHI.some((a) => n.startsWith(a));
};

/**
 * Toglie dalla descrizione la nota scritta a mano. Tre forme:
 *  · un paragrafo che apre con un attacco («Nota sulle fotografie di questo
 *    annuncio. Le immagini…»): via il paragrafo;
 *  · un titolo da solo sulla sua riga («Nota sulle fotografie»): via il
 *    titolo E il paragrafo che lo segue, che è il corpo della nota;
 *  · la nota attaccata in coda a un paragrafo («… Classe energetica E. Nota
 *    sulle fotografie …»): il paragrafo si tronca lì.
 * Si chiama SOLO quando il riepilogo mostra la nota del CRM nella lingua
 * della descrizione: senza, quel testo è l'unica dichiarazione che il
 * visitatore legge nella sua lingua, e deve restare.
 */
export function senzaNotaAi(testo: string | null): string | null {
  if (!testo) return testo;
  const paragrafi = testo.split(/\n+/);
  const tenuti: string[] = [];
  let toccato = false;
  let saltaCorpo = false;
  for (const par of paragrafi) {
    const p = par.trim();
    if (!p) continue;
    if (saltaCorpo) {
      saltaCorpo = false;
      toccato = true;
      continue;
    }
    if (apreNota(p)) {
      toccato = true;
      // Titolo = corto e senza punteggiatura interna: «Nota sulle fotografie»,
      // «Nota sull'uso dell'intelligenza artificiale nelle fotografie.»
      if (p.length <= 90 && /^[^.:;!?]*[.:]?$/.test(p)) saltaCorpo = true;
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

/** La parte del paragrafo PRIMA di una nota attaccata in coda, o null. */
function codaNota(p: string): string | null {
  for (const m of p.matchAll(/[.!?]\s+/g)) {
    const dopo = p.slice(m.index + m[0].length);
    if (apreNota(dopo)) return p.slice(0, m.index + 1).trim();
  }
  return null;
}

/** La descrizione contiene una nota scritta a mano? */
export function haNotaAi(testo: string | null): boolean {
  return testo != null && senzaNotaAi(testo) !== testo;
}
