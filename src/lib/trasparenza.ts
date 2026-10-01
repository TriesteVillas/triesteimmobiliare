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
// impaginazione del lightbox. Ogni funzione qui sotto, su `null`, restituisce
// il suo ingresso tale e quale.
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
type ConEtichetta = Exclude<Trattamento, "tecnico">;

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

// ── I dati grezzi, come li attacca getProperties() ─────────────────────────

/** Ciò che il CRM dice di UNA foto pubblicata (o il ripiego generico). */
export type FotoTrasparenza = {
  trattamento: Trattamento;
  /** true = nessuna riga per questa foto, ma l'immobile ha righe AI che non
   *  combaciano più con nessuna foto mostrata: etichetta generica «AI». */
  generica: boolean;
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
    ai: number;
    bloccoDifetti: number;
    conOriginale: number;
  };
};

// ── La vista per il browser, già nella lingua del visitatore ──────────────

export type FotoAi = {
  trattamento: Trattamento;
  /** Etichetta estesa (vista singola, hero): «AI · modificata». "" se tecnico. */
  etichetta: string;
  /** Glifo compatto (miniature, card): «AI» o «Rendering». "" se tecnico. */
  glifo: string;
  /** Nome accessibile dell'etichetta: etichetta + didascalia. */
  aria: string;
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
// ═══════════════════════════════════════════════════════════════════════════

type Conteggi = TrasparenzaImmobile["conteggi"];

type TestiTrasparenza = {
  etichetta: Record<ConEtichetta, string>;
  /** Glifo compatto: «AI» per tutto ciò che è passato da un modello, il nome
   *  per il rendering fatto senza AI (scriverci «AI» sarebbe falso). */
  glifo: { ai: string; rendering: string };
  /** aria-label dell'etichetta «ai» generica (SPEC §9.3). */
  ariaGenerica: string;
  vediOriginale: string;
  /** Suggerimento del tasto, accanto al bottone. */
  tasto: string;
  originale: string;
  didascaliaOriginale: string;
  titolo: string;
  nav: string;
  riga: (c: Conteggi) => string;
  chiusura: string;
  linkAi: string;
};

const plSl = new Intl.PluralRules("sl");

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
    vediOriginale: "Vedi l'originale",
    tasto: "tasto O",
    originale: "Originale",
    didascaliaOriginale: "Foto originale, prima dell'intervento. Volti e dati personali sfocati.",
    titolo: "Come abbiamo usato l'AI in queste foto",
    nav: "AI nelle foto",
    riga: ({ pubblicate, ai, bloccoDifetti, conOriginale }) =>
      [
        `${ai} foto su ${pubblicate} ${ai === 1 ? "modificata" : "modificate"} con l'AI`,
        bloccoDifetti > 0 ? `${bloccoDifetti} con i difetti protetti` : null,
        conOriginale > 0
          ? conOriginale === ai && ai > 1
            ? "originale visibile su ognuna"
            : `originale visibile su ${conOriginale}`
          : null,
      ].filter(Boolean).join(" · "),
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
    vediOriginale: "See the original",
    tasto: "key O",
    originale: "Original",
    didascaliaOriginale: "Original photo, before editing. Faces and personal data blurred.",
    titolo: "How we used AI in these photos",
    nav: "AI in the photos",
    riga: ({ pubblicate, ai, bloccoDifetti, conOriginale }) =>
      [
        `${ai} of ${pubblicate} ${pubblicate === 1 ? "photo" : "photos"} edited with AI`,
        bloccoDifetti > 0 ? `${bloccoDifetti} with defects protected` : null,
        conOriginale > 0
          ? conOriginale === ai && ai > 1
            ? "original viewable on each"
            : `original viewable on ${conOriginale}`
          : null,
      ].filter(Boolean).join(" · "),
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
    vediOriginale: "Original ansehen",
    tasto: "Taste O",
    originale: "Original",
    didascaliaOriginale: "Originalfoto vor der Bearbeitung. Gesichter und persönliche Daten unkenntlich gemacht.",
    titolo: "Wie wir KI in diesen Fotos eingesetzt haben",
    nav: "KI in den Fotos",
    riga: ({ pubblicate, ai, bloccoDifetti, conOriginale }) =>
      [
        `${ai} von ${pubblicate} ${pubblicate === 1 ? "Foto" : "Fotos"} mit KI bearbeitet`,
        bloccoDifetti > 0 ? `${bloccoDifetti} mit geschützten Mängeln` : null,
        conOriginale > 0
          ? conOriginale === ai && ai > 1
            ? "Original bei jedem einsehbar"
            : `Original einsehbar bei ${conOriginale}`
          : null,
      ].filter(Boolean).join(" · "),
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
    vediOriginale: "Poglej izvirnik",
    tasto: "tipka O",
    originale: "Izvirnik",
    didascaliaOriginale: "Izvirna fotografija pred posegom. Obrazi in osebni podatki so zabrisani.",
    titolo: "Kako smo pri teh fotografijah uporabili umetno inteligenco",
    nav: "AI na fotografijah",
    // Zgradba z dvopičjem: število ne vpliva na ujemanje glagola. «od» zahteva
    // rodilnik: 1, 101 … fotografije; vse drugo fotografij (dvojina = množina).
    riga: ({ pubblicate, ai, bloccoDifetti, conOriginale }) =>
      [
        `Urejeno z umetno inteligenco: ${ai} od ${pubblicate} ${plSl.select(pubblicate) === "one" ? "fotografije" : "fotografij"}`,
        bloccoDifetti > 0 ? `z zaščitenimi pomanjkljivostmi: ${bloccoDifetti}` : null,
        conOriginale > 0
          ? conOriginale === ai && ai > 1
            ? "izvirnik na ogled pri vseh"
            : `izvirnik na ogled: ${conOriginale}`
          : null,
      ].filter(Boolean).join(" · "),
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
  conteggi: { ai_non_abbinate: number };
};

const chiave = (p: Photo) => p.filename ?? p.url;

/** La lista canonica della scheda (copertina, top 8, galleria, senza
 *  doppioni) — la stessa di photoSet.ts, ricopiata qui per non importare un
 *  modulo che importa a sua volta i tipi da qui. */
function listaSito(p: Property): Photo[] {
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

/**
 * Attacca a ogni immobile la sua trasparenza e a ogni foto la sua riga.
 * `perId` = airtable_id → trasparenza (solo gli immobili che ne hanno).
 * `baseOriginali` = `${VETRINA_BASE}/api/vetrina/foto` (SPEC §5.6).
 * Gli immobili senza dati escono con gli STESSI oggetti di prima.
 */
export function applicaTrasparenza(
  lista: Property[],
  perId: Map<string, TrasparenzaVetrina>,
  baseOriginali: string,
): Property[] {
  if (perId.size === 0) return lista;
  return lista.map((p) => {
    const t = perId.get(p.recId);
    return t ? conTrasparenza(p, t, baseOriginali) : p;
  });
}

function conTrasparenza(p: Property, t: TrasparenzaVetrina, base: string): Property {
  const righe = new Map(t.foto.map((f) => [f.filename, f]));
  const generiche = t.conteggi.ai_non_abbinate > 0;

  const datiDi = (ph: Photo): FotoTrasparenza | null => {
    const r = ph.filename ? righe.get(ph.filename) : undefined;
    if (r) {
      const o = r.originale;
      const radice = o ? `${base}/${encodeURIComponent(p.recId)}/${encodeURIComponent(o.id)}` : null;
      return {
        trattamento: r.trattamento,
        generica: false,
        bloccoDifetti: r.blocco_difetti,
        didascalia: r.didascalia,
        originale: o && radice
          ? { m: `${radice}/m`, xl: `${radice}/xl`, larghezza: o.larghezza, altezza: o.altezza }
          : null,
      };
    }
    // SPEC §0: righe AI che non combaciano più con nessuna foto ⇒ il sito
    // non sa quale foto fossero, quindi l'etichetta generica va su tutte
    // quelle senza riga. Meglio un'etichetta di troppo che una in meno.
    return generiche
      ? { trattamento: "ai", generica: true, bloccoDifetti: false, didascalia: null, originale: null }
      : null;
  };
  // Una foto può comparire in tre campi (copertina, top 8, galleria) con id
  // diversi: la riga si attacca a ciascuna copia, così ovunque la si mostri
  // porta la stessa etichetta.
  const marca = (ph: Photo): Photo => {
    const d = datiDi(ph);
    return d ? { ...ph, trasparenza: d } : ph;
  };

  let coverPhoto = p.coverPhoto ? marca(p.coverPhoto) : null;
  let topPhotos = p.topPhotos.map(marca);
  const photos = p.photos.map(marca);

  // ── l'ordine (SPEC §9.3): una simulazione non apre mai la galleria ──────
  const prima = { ...p, coverPhoto, topPhotos, photos };
  const tutte = listaSito(prima);
  if (tutte.length > 0 && eSimulazione(tutte[0].trasparenza?.trattamento)) {
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
  const conteggi = {
    pubblicate: mostrate.length,
    // «modificate con l'AI»: non il «tecnico» e non il «rendering», che in
    // v1.1 è l'immagine di progetto fatta SENZA AI (SPEC §9.3).
    ai: mostrate.filter(
      (ph) => ph.trasparenza && ph.trasparenza.trattamento !== "tecnico" && ph.trasparenza.trattamento !== "rendering",
    ).length,
    bloccoDifetti: mostrate.filter((ph) => ph.trasparenza?.bloccoDifetti).length,
    conOriginale: mostrate.filter((ph) => ph.trasparenza?.originale).length,
  };
  finale.trasparenza = { nota: t.nota, conteggi };
  return finale;
}

// ═══════════════════════════════════════════════════════════════════════════
// LA RESA NELLA LINGUA DEL VISITATORE (server → client)
// ═══════════════════════════════════════════════════════════════════════════

/** Da dati grezzi a vista localizzata. null se la foto non ha niente da dire. */
export function fotoAi(d: FotoTrasparenza | null | undefined, locale: string): FotoAi | null {
  if (!d) return null;
  const tx = testiTrasparenza(locale);
  const didascalia = nellaLingua(d.didascalia, locale);
  const etichetta = d.trattamento === "tecnico" ? "" : tx.etichetta[d.trattamento];
  const glifo =
    d.trattamento === "tecnico" ? "" : d.trattamento === "rendering" ? tx.glifo.rendering : tx.glifo.ai;
  const base = d.trattamento === "ai" ? tx.ariaGenerica : etichetta;
  const aria = didascalia ? (base ? `${base} — ${didascalia}` : didascalia) : base;
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

/** Toglie dalla descrizione i paragrafi che aprono con un attacco della nota.
 *  Si chiama SOLO quando la nota del CRM esiste: senza, quel paragrafo è
 *  l'unica dichiarazione che il visitatore legge e deve restare. */
export function senzaNotaAi(testo: string | null): string | null {
  if (!testo) return testo;
  const paragrafi = testo.split(/\n+/);
  const tenuti = paragrafi.filter((par) => {
    const n = normAttacco(par.trim());
    return !ATTACCHI.some((a) => n.startsWith(a));
  });
  if (tenuti.length === paragrafi.length) return testo;
  const out = tenuti.join("\n\n").trim();
  return out || null;
}
