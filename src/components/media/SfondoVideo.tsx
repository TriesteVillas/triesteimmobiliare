"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { VideoAnnuncio } from "@/content/annunciVideo";
import type { VideoAi } from "@/lib/trasparenza-video";
import EtichettaVideo from "@/components/EtichettaVideo";
import { tSfondoVideo } from "./sfondoVideoStrings";

// IL VIDEO DI TESTATA DELLA SCHEDA (02/10/2026) — filmato muto in loop servito
// da public/, registrato in src/content/annunciVideo.ts (mp4 1080 / mp4Sm 720,
// `ai`). Porta su triesteimmobiliare.com lo SfondoVideo di triestevillas.com
// (src/components/media/SfondoVideo.tsx di quel repo, 01/10/2026), che a sua
// volta veniva da triesteaffitti.com: stesso motore, stesse garanzie. Le
// differenze, tutte e sole:
//   · i colori sono quelli di questo sito (ink, sand, white: qui non ci sono
//     ink-0 / hi / sand-300), con i contrasti rifatti sotto ogni costante;
//   · l'etichetta del registro dei video del CRM è quella di TSI
//     (components/EtichettaVideo.tsx, dato `VideoAi` da lib/video-sito.ts);
//   · il link della frase AI va alla pagina «Come usiamo l'AI» del GRUPPO su
//     triestevillas.com (lib/pagina-ai.ts: questo sito una /ai non ce l'ha) e
//     arriva dalla pagina con il suo testo; se oggi non risponde, la frase
//     resta senza link;
//   · `bloccato()` NON si ferma sulla rete «3g» (vedi la funzione).
//
// Le garanzie, tutte:
// 1. La COPERTINA non si tocca e resta sempre opaca sotto: è l'LCP e lo
//    snapshot del morph `prop-<slug>`. Il video è un layer che SALE sopra
//    (opacity 0→1), prima dei veli della pagina, con lo stesso `par-zoom`
//    della copertina (foto e video alla stessa scala durante la dissolvenza).
// 2. NESSUNA dissolvenza senza fotogrammi: il layer si alza solo all'evento
//    `playing`. Autoplay rifiutato (iOS in risparmio energetico), file assente
//    o illeggibile, o 10 s di riproduzione chiesta senza `playing` → il
//    componente si spegne e resta la foto (fail-safe). Una voce del registro
//    che punta a file non ancora caricati è quindi innocua.
// 3. CLIENT-ONLY e dopo tutto il resto: null sul server e al primo render; i
//    <video> entrano dopo `load` + 200 ms, fuori dal prerender delle
//    SpeculationRules, solo quando l'hero è VICINO allo schermo (250 px) e
//    girano solo quando ne è in vista almeno il 20%. Mai con
//    prefers-reduced-motion, Save-Data o rete 2g: per loro la foto.
// 4. Loop senza stacco: due copie; nell'ultimo secondo la riserva riparte da
//    zero e si dissolve SOPRA quella in scena (z-index scambiato a ogni giro).
// 5. `fascia`: sotto i 640 px il 16:9 non va in cover (ne mostrerebbe un
//    terzo) ma sta in una FASCIA 16:9 in testa all'hero (top-36): la pagina le
//    fa posto già dal server (padding del blocco di testo), niente salto di
//    layout. Sotto i 640 px il file 720p.
// 6. Pausa/Riprendi (WCAG 2.2.2: moto oltre 5 s), alto 44 px; la pausa
//    abbassa il layer e torna la FOTO vera. Fuori vista e a scheda del browser
//    nascosta il video si ferma da sé.
// 7. `ai: true` → la frase di trasparenza sta SUL video, leggibile, con il
//    link alla pagina /ai del gruppo quando risponde, nelle quattro lingue (AI
//    Act art. 50 §4), finché si vede il video. Un video girato davvero
//    (`ai: false`) non la porta.
// 7b. Il REGISTRO dei video del CRM (SPEC §10.1): se il file ha una riga, la
//    sua etichetta («AI · video animato») compare in alto a destra SUL video,
//    nel posto dell'etichetta della copertina — la stessa pillola delle foto,
//    con la didascalia del registro nell'aria-label e al passaggio del mouse.
//    La frase scritta a mano qui sopra resta com'è (è il secondo livello): il
//    registro aggiunge, non toglie. Senza riga, la frase è l'unica
//    dichiarazione.
// 8. L'etichetta AI della COPERTINA (in page.tsx, fratello SUCCESSIVO di
//    questo componente nell'hero) sparisce mentre si vede il video: il root
//    porta `data-video-visibile` e la pagina la nasconde con
//    `[[data-video-visibile]~&]:hidden`. Un posto solo nell'angolo: mai
//    un'etichetta che descrive una foto che non si vede, mai due etichette
//    impilate. In pausa torna la foto, e con lei la sua etichetta.
// 9. `velo`: un velo scuro sotto il blocco di testo dell'hero, che sale
//    INSIEME al video e scende con lui. Un fotogramma chiaro (facciata bianca,
//    cielo) sotto il titolo, con il solo velo della pagina, lasciava il testo
//    bianco sotto 2:1 (collaudo 1440×900 di triestevillas.com, 01/10). Sta
//    sopra il video e sotto il velo e il testo della pagina; non c'è quando si
//    vede la copertina (pausa, video spento o rifiutato), così la foto resta
//    com'è in ogni altra scheda, e non c'è nella fascia del telefono, dove il
//    testo sta sulla copertina e non sul video.

const FADE_S = 1;
const SOGLIA_VISTA = 0.2;
const MARGINE_CARICO = "250px 0px";
const TIMEOUT_MS = 10_000;

// Le guardie di triestevillas.com e triesteaffitti.com, MENO una: la rete
// stimata «3g». Su questo sito restano bloccanti prefers-reduced-motion,
// Save-Data e `2g`/`slow-2g`; `3g` no. Misurato il 02/10/2026: il browser
// integrato dell'app desktop (e Chrome su certe reti) stima «3g» su una rete
// normale — `effectiveType` è una stima dal tempo di andata e ritorno, non la
// rete vera — e con quella guardia il video non partiva MAI. I file pesano
// 2–4,5 MB, e il player è già fail-safe: se `playing` non arriva in 10 s
// (TIMEOUT_MS) si smonta e resta la foto, che è comunque già caricata sotto.
function bloccato(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const rete = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (rete?.saveData) return true;
  return typeof rete?.effectiveType === "string" && /^(slow-)?2g$/.test(rete.effectiveType);
}

// Vero solo sul client dopo l'idratazione: niente che dipenda da matchMedia o
// connection può creare un mismatch.
const nessunaSottoscrizione = () => () => {};
function useMontato(): boolean {
  return useSyncExternalStore(nessunaSottoscrizione, () => true, () => false);
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Il tasto sta sopra il video, che può essere un cielo chiaro: fondo ink/75
// PROPRIO, mai trasparente, e testo bianco (bianco su ink/75 sopra il bianco
// puro ≈ 6,8:1; il sand di questo sito lì farebbe 3,9:1 e non basta).
const PILL =
  "btn-press pointer-events-auto inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/50 bg-ink/75 px-3 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

// La frase sul video, coi colori dell'etichetta delle foto di questo sito
// (EtichettaAi: fondo ink/85 e testo bianco, ≈ 9,6:1 anche su un fotogramma
// bianco; il link in sand ≈ 5,5:1), piatta come lei (v1.3). È una frase con un
// link, quindi va a capo (20rem, 26rem da 1024 px) invece di stare su una riga.
const ETICHETTA =
  "pointer-events-auto max-w-[20rem] lg:max-w-[26rem] rounded-md bg-ink/85 px-3 py-1.5 text-right text-xs leading-snug text-white [print-color-adjust:exact]";

/** I comandi dell'hero: sulla RIGA del «← Torna» (top-24), allineati a destra
 *  della colonna del contenuto (max-w-5xl, px-6) come l'etichetta della
 *  copertina. In fila e non in colonna: quella riga è la sola fascia che il
 *  blocco di testo non raggiunge mai. z-10: sopra la fascia del telefono. */
const COMANDI = "absolute inset-x-0 top-24 z-10 mx-auto flex max-w-5xl items-start justify-end gap-2 px-6";

/** Il velo del testo (punto 9): l'ink di questo sito (#0f2737) al 78% sul
 *  fondo, 74% a 30rem, trasparente a 42rem — il disegno di triestevillas.com,
 *  stessa altezza d'hero (82vh), col colore di qui. Su un fotogramma bianco
 *  il titolo bianco resta ≥ 6,5:1 già col solo velo. */
const VELO =
  "bg-[linear-gradient(to_top,rgb(15_39_55/0.78)_0,rgb(15_39_55/0.74)_30rem,rgb(15_39_55/0)_42rem)]";

export default function SfondoVideo({
  video,
  locale,
  title,
  fascia = false,
  velo = false,
  layerClassName = "",
  etichetta = null,
  etichettaClassName = "right-6 top-[9.25rem]",
  linkAi = null,
}: {
  video: VideoAnnuncio;
  locale: string;
  /** Il nome dell'immobile, per il gruppo dei comandi («Video: …»). */
  title: string;
  /** Sotto i 640 px il video in una fascia 16:9 in testa all'hero. */
  fascia?: boolean;
  /** Il velo sotto il testo dell'hero, insieme al video (punto 9). */
  velo?: boolean;
  /** Classi in più sul layer (es. `par-zoom`, la parallasse della copertina). */
  layerClassName?: string;
  /** L'etichetta del registro dei video per questo file (punto 7b), o null. */
  etichetta?: VideoAi | null;
  /** Classi di posizione dell'etichetta del registro: le stesse di quella
   *  della copertina, così una prende il posto dell'altra. */
  etichettaClassName?: string;
  /** La pagina «Come usiamo l'AI» del gruppo, se oggi risponde (punto 7). */
  linkAi?: { href: string; testo: string } | null;
}) {
  const S = tSfondoVideo(locale);
  const montato = useMontato();
  const stretto = useMedia("(max-width: 639px)");
  const inFascia = fascia && stretto;
  const sorgente = stretto && video.mp4Sm ? video.mp4Sm : video.mp4;

  const rootRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  // La copia in scena e quella di riserva: si scambiano a ogni giro.
  const scena = useRef<{ active: HTMLVideoElement | null; standby: HTMLVideoElement | null }>({
    active: null,
    standby: null,
  });
  const suonataRef = useRef("");

  const [spento, setSpento] = useState(false);
  // Guardie passate, load + 200 ms, fuori dal prerender.
  const [pronto, setPronto] = useState(false);
  // A 250 px dallo schermo: si montano i <video> (solo i metadati).
  const [vicino, setVicino] = useState(false);
  const [inView, setInView] = useState(false);
  // Una pagina aperta in una tab in secondo piano non fa girare niente.
  const [nascosta, setNascosta] = useState(() => typeof document !== "undefined" && document.visibilityState === "hidden");
  const [pausa, setPausa] = useState(false);
  // La sorgente che ha dichiarato `playing` almeno una volta: da lì layer,
  // tasto ed etichetta. Cambia sorgente (rotazione del telefono) = si riparte.
  const [suonata, setSuonata] = useState("");
  const avviato = pronto && vicino;

  // load + 200 ms, guardie, prerender (la pagina può essere prerenderizzata da
  // un hover su una card: un autoplay invisibile non deve partire).
  useEffect(() => {
    if (!montato) return;
    let t = 0;
    const doc = document as Document & { prerendering?: boolean };
    const via = () => setPronto(true);
    const dopoLoad = () => {
      t = window.setTimeout(() => {
        if (bloccato()) setSpento(true);
        else if (doc.prerendering) document.addEventListener("prerenderingchange", via, { once: true });
        else via();
      }, 200);
    };
    if (document.readyState === "complete") dopoLoad();
    else window.addEventListener("load", dopoLoad, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", dopoLoad);
      document.removeEventListener("prerenderingchange", via);
    };
  }, [montato]);

  // Vicino (si montano i video) e in vista (girano): il root è inset-0
  // dell'hero, quindi ne ha il rettangolo.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || spento || !pronto) return;
    const carico = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVicino(true);
      },
      { rootMargin: MARGINE_CARICO },
    );
    const vista = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting && e.intersectionRatio >= SOGLIA_VISTA),
      { threshold: [0, SOGLIA_VISTA] },
    );
    carico.observe(el);
    vista.observe(el);
    return () => {
      carico.disconnect();
      vista.disconnect();
    };
  }, [montato, spento, pronto]);

  useEffect(() => {
    const onVis = () => setNascosta(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Le due copie appena montate (o rimontate col cambio di sorgente).
  useEffect(() => {
    if (!avviato) return;
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;
    for (const v of [a, b]) {
      v.muted = true;
      v.defaultMuted = true;
    }
    a.style.opacity = "1";
    a.style.zIndex = "1";
    b.style.opacity = "0";
    b.style.zIndex = "0";
    scena.current = { active: a, standby: b };
    const onPlaying = () => {
      suonataRef.current = sorgente;
      setSuonata(sorgente);
      // Una clip più corta di due dissolvenze non ha spazio per l'incrocio:
      // gira col loop nativo (la riserva resta ferma).
      if (Number.isFinite(a.duration) && a.duration <= FADE_S * 2) a.loop = true;
      // La riserva parte da preload="none": la si carica quando la prima suona,
      // con i byte già in cache, senza contendere la banda alla copertina.
      b.preload = "auto";
      b.load();
    };
    // File assente (404) o illeggibile prima del primo fotogramma: resta la foto.
    const onError = () => {
      if (suonataRef.current !== sorgente) setSpento(true);
    };
    a.addEventListener("playing", onPlaying, { once: true });
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("error", onError);
    };
  }, [avviato, sorgente]);

  // Un solo punto decide se il loop gira: in vista, scheda del browser a
  // vista, nessuna pausa chiesta. Fuori da lì le due copie stanno ferme e il
  // rAF non gira.
  const gira = avviato && inView && !nascosta && !pausa;
  useEffect(() => {
    if (!avviato) return;
    const { active, standby } = scena.current;
    if (!active || !standby) return;
    if (!gira) {
      active.pause();
      standby.pause();
      return;
    }
    const mai = suonataRef.current !== sorgente;
    const rifiuto = (e: unknown) => {
      // NotAllowedError = autoplay negato (risparmio energetico, policy);
      // NotSupportedError = file illeggibile o assente. AbortError (una pausa
      // arrivata prima del play) non è un guasto.
      const nome = (e as { name?: string } | null)?.name;
      if (mai && (nome === "NotAllowedError" || nome === "NotSupportedError")) setSpento(true);
    };
    active.play().catch(rifiuto);
    if (Number(standby.style.opacity) > 0) standby.play().catch(() => {});
    // Il timeout guarda se `playing` è arrivato NEL FRATTEMPO (ref, non stato):
    // un video che sta già suonando non va smontato.
    const timeout = mai
      ? window.setTimeout(() => {
          if (suonataRef.current !== sorgente) setSpento(true);
        }, TIMEOUT_MS)
      : 0;

    let raf = 0;
    const tick = () => {
      const s = scena.current;
      const att = s.active;
      const ris = s.standby;
      if (att && ris) {
        const d = att.duration;
        if (Number.isFinite(d) && d > FADE_S * 2 && att.currentTime >= d - FADE_S) {
          if (ris.paused) {
            ris.style.zIndex = "2";
            att.style.zIndex = "1";
            try {
              ris.currentTime = 0;
            } catch {
              /* non ancora scorribile: si riprova al frame dopo */
            }
            ris.play().catch(() => {});
          }
          const k = att.ended ? 1 : Math.min((att.currentTime - (d - FADE_S)) / FADE_S, 1);
          ris.style.opacity = k.toFixed(3);
          if (k >= 1) {
            att.pause();
            att.style.opacity = "0";
            att.style.zIndex = "0";
            ris.style.zIndex = "1";
            scena.current = { active: ris, standby: att };
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [avviato, gira, sorgente]);

  // Video non montato (server, primo render) o spento: resta la copertina, e
  // con lei la sua etichetta (che sta in page.tsx).
  if (!montato || spento) return null;

  const primoPlay = suonata !== "" && suonata === sorgente;
  const visibile = primoPlay && !pausa;
  const etichettaAi = video.ai && visibile;
  const testoAi = video.fotoRitoccate ? S.aiLabelRitoccate : S.aiLabel;
  const VIDEO = "absolute inset-0 h-full w-full object-cover";

  // La frase AI, con il link alla pagina del gruppo quando c'è: un altro sito,
  // si apre accanto e la scheda resta (come il link del riepilogo #foto-ai).
  const fraseAi = (classeLink: string) => (
    <>
      {testoAi}
      {linkAi && (
        <>
          {" · "}
          <a href={linkAi.href} target="_blank" rel="noopener" className={classeLink}>
            {linkAi.testo} ↗
          </a>
        </>
      )}
    </>
  );

  const videos = avviato && (
    <>
      <video
        key={`a:${sorgente}`}
        ref={aRef}
        src={sorgente}
        className={VIDEO}
        muted
        playsInline
        disablePictureInPicture
        // Montato a 250 px dallo schermo: solo i metadati finché non suona.
        preload="metadata"
        aria-hidden
        tabIndex={-1}
      />
      <video
        key={`b:${sorgente}`}
        ref={bRef}
        src={sorgente}
        className={VIDEO}
        style={{ opacity: 0 }}
        muted
        playsInline
        disablePictureInPicture
        preload="none"
        aria-hidden
        tabIndex={-1}
      />
    </>
  );

  // `isolate`: le due copie portano uno z-index in linea (1/2, scambiato a ogni
  // giro); un contesto di impilamento proprio le tiene SOTTO il velo della
  // pagina anche dove il layer non ha una trasformazione (la fascia).
  const layer = "isolate transition-opacity duration-[1200ms] ease-[var(--ease-lux)]";

  return (
    // data-video-visibile: lo legge l'etichetta di trasparenza della copertina
    // (fratello successivo nell'hero) per sparire mentre si vede il video.
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0"
      data-video-visibile={visibile ? "" : undefined}
    >
      {inFascia ? (
        // La fascia sta SOPRA il velo della pagina (z-[5]): è un riquadro 16:9
        // pulito, e sotto c'è la stessa copertina di sempre. Il posto glielo
        // riserva la pagina (padding del blocco di testo).
        <div className="absolute inset-x-0 top-36 z-[5] aspect-video w-full overflow-hidden">
          <div className={`absolute inset-0 bg-ink ${layer}`} style={{ opacity: visibile ? 1 : 0 }}>
            {videos}
          </div>
          {etichettaAi && (
            <p className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent px-4 pb-2 pt-7 text-[11px] leading-snug text-white [print-color-adjust:exact]">
              {fraseAi("font-medium text-sand underline underline-offset-2")}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className={`absolute inset-0 overflow-hidden ${layer} ${layerClassName}`} style={{ opacity: visibile ? 1 : 0 }}>
            {videos}
          </div>
          {velo && (
            <div aria-hidden className={`absolute inset-0 ${VELO} ${layer}`} style={{ opacity: visibile ? 1 : 0 }} />
          )}
        </>
      )}

      {/* L'etichetta del registro (punto 7b): finché si vede il video. Dentro
          un piano a z-[6]: la pillola da sola (z-[1]) finirebbe sotto la
          fascia del telefono, che sta a z-[5]. */}
      {visibile && etichetta?.etichetta && (
        <div className="pointer-events-none absolute inset-0 z-[6]">
          <EtichettaVideo ai={etichetta} className={etichettaClassName} />
        </div>
      )}
      {/* Comandi: compaiono solo dopo il primo `playing` (prima non c'è niente
          da fermare). Etichetta d'AZIONE che cambia con lo stato, senza
          aria-pressed; sotto i 1024 px solo l'icona (il testo resta ai lettori
          di schermo), così fra 640 e 1024 px frase e tasto stanno sulla riga
          accanto al «← Torna». La frase AI sta PRIMA del tasto, a sinistra. */}
      {primoPlay && (
        <div className={COMANDI}>
          <div role="group" aria-label={`${S.group}: ${title}`} className="flex items-start justify-end gap-2">
            {!inFascia && etichettaAi && (
              <p className={ETICHETTA}>
                {fraseAi("font-medium text-sand underline-offset-2 hover:underline focus-visible:underline")}
              </p>
            )}
            <button type="button" onClick={() => setPausa((p) => !p)} className={`${PILL} shrink-0`}>
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
                {pausa ? (
                  <path d="M7 4.5a1 1 0 0 1 1.53-.85l11 7.5a1 1 0 0 1 0 1.7l-11 7.5A1 1 0 0 1 7 19.5v-15Z" />
                ) : (
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                )}
              </svg>
              <span className="sr-only lg:not-sr-only">{pausa ? S.resume : S.pause}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
