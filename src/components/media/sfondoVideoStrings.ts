// Stringhe del video di testata della scheda (SfondoVideo.tsx), nelle quattro
// lingue. Pattern `*Strings.ts` + Record<Locale> (come su triestevillas-web):
// niente chiavi nuove in messages/*.json, e il typecheck obbliga il ramo
// sloveno.
//
// La frase AI è un obbligo, non un ornamento (AI Act art. 50 §4, protocollo
// spot-video-immobile del KB): il video è fatto di foto dell'immobile animate
// con un modello generativo, e chi guarda lo deve leggere sul video stesso.
// Due frasi, scelte dal registro (content/annunciVideo.ts), le STESSE di
// triestevillas.com:
//   · `aiLabel`: il video è generato con l'AI dalle foto dell'immobile — vera
//     sempre, non dice niente sulle foto di partenza;
//   · `aiLabelRitoccate` (voce con `fotoRitoccate: true`): le foto di partenza
//     erano già ritoccate con l'AI, e lo dice.
// Il testo del link alla pagina «Come usiamo l'AI» NON sta qui: arriva dalla
// pagina insieme all'URL (testiTrasparenza().linkAi + linkPaginaAi), che su
// questo sito è quella del gruppo su triestevillas.com e può mancare.
import type { Locale } from "@/i18n/routing";

export type SfondoVideoStrings = {
  /** La dichiarazione sul video. */
  aiLabel: string;
  /** La stessa, quando le foto di partenza erano già ritoccate con l'AI. */
  aiLabelRitoccate: string;
  /** Tasto di pausa (WCAG 2.2.2): etichetta d'AZIONE, cambia con lo stato. */
  pause: string;
  resume: string;
  /** Nome del gruppo dei comandi per i lettori di schermo: «Video: {titolo}». */
  group: string;
};

export const SFONDO_VIDEO_STRINGS: Record<Locale, SfondoVideoStrings> = {
  it: {
    aiLabel: "Video generato con l'AI dalle foto di questo immobile",
    aiLabelRitoccate: "Video dalle foto di questo immobile, ritoccate con AI e animate con AI",
    pause: "Metti in pausa il video",
    resume: "Riprendi il video",
    group: "Video",
  },
  en: {
    aiLabel: "Video generated with AI from photos of this property",
    aiLabelRitoccate: "Video from photos of this property, retouched with AI and animated with AI",
    pause: "Pause the video",
    resume: "Play the video",
    group: "Video",
  },
  de: {
    aiLabel: "Mit KI erzeugtes Video aus Fotos dieser Immobilie",
    aiLabelRitoccate: "Video aus Fotos dieser Immobilie, mit KI retuschiert und mit KI animiert",
    pause: "Video anhalten",
    resume: "Video fortsetzen",
    group: "Video",
  },
  sl: {
    aiLabel: "Video, ustvarjen z umetno inteligenco iz fotografij te nepremičnine",
    aiLabelRitoccate: "Video iz fotografij te nepremičnine, retuširanih in animiranih z umetno inteligenco",
    pause: "Ustavite video",
    resume: "Predvajajte video",
    group: "Video",
  },
};

export const tSfondoVideo = (locale: string): SfondoVideoStrings =>
  SFONDO_VIDEO_STRINGS[(locale in SFONDO_VIDEO_STRINGS ? locale : "it") as Locale];
