// Barcolana 58 — lo stand TriesteVillas × Metroarea al Villaggio (7–11/10/2026).
//
// Tutto il calendario dell'invito sta qui, in ora di Roma, ed è la sola fonte
// per il pop-up: quando si accende, quando si spegne da solo, che cosa dice
// oggi. Il componente è identico sui tre siti (TSV, TSI, TA): si copia la
// cartella intera, non si adatta.
//
// Le pagine dei siti sono quasi tutte statiche e restano in CDN per ore: un
// controllo della data fatto sul server resterebbe cotto nell'HTML anche dopo
// domenica. Per questo l'orologio si legge SOLO nel browser.

/** Mercoledì 7/10 00:00 a Roma (CEST = UTC+2). */
export const INIZIO = Date.UTC(2026, 9, 6, 22, 0);
/** Domenica 11/10 20:00 a Roma: chiude lo stand, il pop-up sparisce da solo. */
export const FINE = Date.UTC(2026, 9, 11, 18, 0);
/** Il brindisi di mercoledì 7: dalle 18 alle 20. */
export const BRINDISI = { data: "2026-10-07", da: 18 * 60, a: 20 * 60 };

export type Giorno = { data: string; it: string; en: string; apre: number; chiude: number };

export const GIORNI: Giorno[] = [
  { data: "2026-10-07", it: "Mer 7", en: "Wed 7", apre: 15, chiude: 21 },
  { data: "2026-10-08", it: "Gio 8", en: "Thu 8", apre: 10, chiude: 22 },
  { data: "2026-10-09", it: "Ven 9", en: "Fri 9", apre: 10, chiude: 24 },
  { data: "2026-10-10", it: "Sab 10", en: "Sat 10", apre: 10, chiude: 24 },
  { data: "2026-10-11", it: "Dom 11", en: "Sun 11", apre: 9, chiude: 20 },
];

export const attivo = (ms: number) => ms >= INIZIO && ms < FINE;

const FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Data (AAAA-MM-GG) e minuti dalla mezzanotte, a Roma — qualunque sia il fuso del visitatore. */
export function oraRoma(ms: number): { data: string; minuti: number } {
  const p = Object.fromEntries(FMT.formatToParts(ms).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, minuti: Number(p.hour) * 60 + Number(p.minute) };
}

export type Stato =
  | { tipo: "aperto"; chiude: number }
  | { tipo: "apre"; apre: number }
  | { tipo: "domani"; apre: number }
  | null;

/** A che punto è lo stand adesso: aperto, apre più tardi, riapre domani. */
export function statoStand(ms: number): Stato {
  const { data, minuti } = oraRoma(ms);
  const i = GIORNI.findIndex((g) => g.data === data);
  if (i < 0) return null;
  const g = GIORNI[i];
  if (minuti < g.apre * 60) return { tipo: "apre", apre: g.apre };
  if (minuti < g.chiude * 60) return { tipo: "aperto", chiude: g.chiude };
  const dopo = GIORNI[i + 1];
  return dopo ? { tipo: "domani", apre: dopo.apre } : null;
}

/** Il brindisi di oggi: «prima» delle 18, «adesso» fra le 18 e le 20, poi niente. */
export function brindisi(ms: number): "prima" | "adesso" | null {
  const { data, minuti } = oraRoma(ms);
  if (data !== BRINDISI.data || minuti >= BRINDISI.a) return null;
  return minuti >= BRINDISI.da ? "adesso" : "prima";
}
