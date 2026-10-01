import { LINGUE, nellaLingua, type Testi } from "./trasparenza";

// ═══════════════════════════════════════════════════════════════════════════
// LA TRASPARENZA AI SUI VIDEO — la parte PURA (SPEC v1.2 §10.1, 01/10/2026).
//
// Il dato viene dal registro dei video del CRM (`video_trasparenza`), servito
// nella stessa vista delle foto (`vista=trasparenza`, chiave `video`) e letto
// da trasparenza-vetrina.ts. Una riga = UN video, indicizzato per `chiave`:
//   · `youtube:<id di 11 caratteri>` — i video YouTube delle schede;
//   · `tsi:<percorso servito>`       — i file del sito (`tsi:/video/x.mp4`).
//
// Regole del sito:
//   · il video con una riga che porta un'etichetta la mostra in alto a destra,
//     per tutta la riproduzione e sul poster, con l'aria-label che dice anche
//     la didascalia; la didascalia sta accanto al player dove c'è spazio;
//   · un video SENZA riga non porta nessuna etichetta (il prebuild lo elenca
//     come avviso: scripts/check-video-registro.mjs);
//   · una riga `reale` senza voce sintetica non ha etichetta, ma la sua
//     didascalia, se c'è, esce lo stesso (SPEC §10.1).
//
// Qui niente I/O: lo leggono la pagina (server) e i componenti client.
// ═══════════════════════════════════════════════════════════════════════════

export const TRATTAMENTI_VIDEO = ["reale", "ai_montaggio", "ai_animato", "ai_generato"] as const;
export type TrattamentoVideo = (typeof TRATTAMENTI_VIDEO)[number];

/** Una riga del registro, già validata (trasparenza-vetrina.ts). */
export type VideoRegistro = {
  chiave: string;
  /** null = un trattamento che il sito non conosce (aggiunto dopo nel CRM). */
  trattamento: TrattamentoVideo | null;
  fotoAi: boolean;
  voceSintetica: boolean;
  /** Pronta dalla vista (regola unica `etichettaVideo()` del CRM), o null. */
  etichetta: Testi | null;
  didascalia: Testi | null;
};

/** La vista per il browser, già nella lingua del visitatore. */
export type VideoAi = {
  /** «AI · video animato», «Video · foto AI · voce AI», «Voce AI»… "" = nessuna. */
  etichetta: string;
  /** Nome accessibile dell'etichetta: etichetta + didascalia. */
  aria: string;
  didascalia: string | null;
};

/** Il prefisso dei file di QUESTO sito nel registro (SPEC §10.1). */
export const PREFISSO_FILE = "tsi";

export const chiaveYoutube = (id: string) => `youtube:${id}`;
export const chiaveFile = (percorso: string) => `${PREFISSO_FILE}:${percorso}`;

/** Le chiavi che il sito sa abbinare: le altre righe (i file degli altri siti,
 *  che la vista comunque non manda) si scartano in lettura. */
export const CHIAVE_VIDEO = /^(?:youtube:[\w-]{11}|tsi:\/\S+)$/;

export function normalizzaTrattamentoVideo(v: unknown): TrattamentoVideo | null {
  return typeof v === "string" && (TRATTAMENTI_VIDEO as readonly string[]).includes(v) ? (v as TrattamentoVideo) : null;
}

// ── L'etichetta: la STESSA regola del CRM ──────────────────────────────────
// `etichettaVideo()` di tsv-pg (web/lib/trasparenza-regole.mjs). La vista la
// manda già pronta: qui serve solo se una riga arriva senza (una lingua
// trattenuta, una vista di un CRM più vecchio) — e un video AI senza
// etichetta è proprio ciò che non deve succedere.
// ⚠️ Chi cambia la regola nel CRM, la cambia anche qui.
const ET_VIDEO = {
  ai_animato: { it: "AI · video animato", en: "AI · animated video", de: "AI · animiertes Video", sl: "AI · animiran video" },
  ai_generato: { it: "AI · video generato", en: "AI · generated video", de: "AI · generiertes Video", sl: "AI · generiran video" },
  foto_ai: { it: "Video · foto AI", en: "Video · AI photos", de: "Video · AI-Fotos", sl: "Video · AI-fotografije" },
} as const;
const ET_VOCE_CODA = { it: "voce AI", en: "AI voice", de: "AI-Stimme", sl: "AI-glas" } as const;
const ET_VOCE_SOLA = { it: "Voce AI", en: "AI voice", de: "AI-Stimme", sl: "AI-glas" } as const;
/** Un trattamento che il sito non conosce: meglio un'etichetta generica di
 *  troppo che un video AI senza (come `normalizzaTrattamento` delle foto). */
const ET_GENERICA = { it: "AI · video", en: "AI · video", de: "AI · Video", sl: "AI · video" } as const;

export function etichettaVideo(
  trattamento: TrattamentoVideo | null,
  fotoAi: boolean,
  voce: boolean,
): Testi | null {
  const base =
    trattamento === null
      ? ET_GENERICA
      : trattamento === "ai_animato" || trattamento === "ai_generato"
        ? ET_VIDEO[trattamento]
        : trattamento === "ai_montaggio" && fotoAi
          ? ET_VIDEO.foto_ai
          : null;
  if (base) {
    return Object.fromEntries(LINGUE.map((l) => [l, voce ? `${base[l]} · ${ET_VOCE_CODA[l]}` : base[l]])) as Testi;
  }
  if (voce) return { ...ET_VOCE_SOLA };
  return null;
}

/** Da riga del registro a vista localizzata. null = niente da mostrare. */
export function videoAi(r: VideoRegistro | null | undefined, locale: string): VideoAi | null {
  if (!r) return null;
  const etichetta =
    nellaLingua(r.etichetta, locale) ??
    nellaLingua(etichettaVideo(r.trattamento, r.fotoAi, r.voceSintetica), locale) ??
    "";
  const didascalia = nellaLingua(r.didascalia, locale);
  if (!etichetta && !didascalia) return null;
  return {
    etichetta,
    aria: etichetta && didascalia ? `${etichetta} — ${didascalia}` : etichetta || didascalia || "",
    didascalia,
  };
}
