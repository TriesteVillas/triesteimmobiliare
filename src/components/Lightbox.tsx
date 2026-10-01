"use client";

import { useCallback, useEffect, useState } from "react";
import { photoSrc, photoSrcSet } from "@/lib/photoSrc";
import { useSwipe } from "@/lib/useSwipe";
import PhotoImg from "./PhotoImg";

// Vedi PhotoGallery per il perché delle ladder. Qui la foto grande occupa 92vw:
// senza srcSet un telefono scaricava la versione da 2000 px per un riquadro da
// 360, cioè cinque volte i pixel che riesce a mostrare.
const GRID_WIDTHS = [400, 600, 800] as const;
const FULL_WIDTHS = [800, 1200, 1600, 2000] as const;
import { useLocale, useTranslations } from "next-intl";
import type { Photo } from "@/lib/properties";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { testiTrasparenza } from "@/lib/trasparenza";
import EtichettaAi from "./EtichettaAi";

export default function Lightbox({
  photos,
  start,
  onClose,
  closeLabel,
  startInGrid = false,
  gridLabel,
}: {
  photos: Photo[];
  start: number;
  onClose: () => void;
  closeLabel: string;
  // "Vedi tutte le N foto" apre qui: una griglia di tutte le miniature, così
  // il visitatore SCEGLIE da dove partire invece di scrollare dalla foto 1.
  startInGrid?: boolean;
  gridLabel?: string;
}) {
  const t = useTranslations("ui");
  const tx = testiTrasparenza(useLocale());
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const [i, setI] = useState(start);
  const [grid, setGrid] = useState(startInGrid);
  const step = useCallback(
    (d: number) => setI((x) => (x + d + photos.length) % photos.length),
    [photos.length],
  );
  // Trasparenza AI (01/10/2026, lib/trasparenza.ts). Solo se almeno una foto
  // porta dati: allora la vista singola diventa una <figure> con didascalia e
  // «vedi l'originale». Senza dati (e sempre per le planimetrie, che non li
  // hanno) il lightbox resta quello di prima, al pixel.
  const conTrasparenza = photos.some((p) => p.ai);
  // Quale foto mostra l'originale: legato all'indice, così passando alla foto
  // successiva si torna da soli alla versione pubblicata (e l'etichetta dice
  // sempre il vero su quello che si vede).
  const [origDi, setOrigDi] = useState<number | null>(null);
  const originale = grid ? null : (photos[i]?.ai?.originale ?? null);
  const vediOriginale = originale !== null && origDi === i;
  const scambia = useCallback(
    () => setOrigDi((x) => (x === i ? null : i)),
    [i],
  );

  // Trascinamento col dito: sul telefono è il gesto naturale, e le frecce sono
  // comunque lì per chi le cerca. Gli handler stanno sull'intero pannello, non
  // solo sulla foto: con object-contain una foto orizzontale su uno schermo
  // verticale occupa una fascia sottile al centro, e chiedere di partire da lì
  // vorrebbe dire farlo fallire quasi sempre.
  const swipe = useSwipe((d) => step(d));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      // «O» = vedi l'originale / torna alla pubblicata. Mai con un modificatore
      // (⌘O / Ctrl+O sono del browser).
      else if (
        (e.key === "o" || e.key === "O") &&
        originale &&
        !e.metaKey && !e.ctrlKey && !e.altKey
      ) {
        e.preventDefault();
        scambia();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step, originale, scambia]);

  // Chi apre il lightbox quasi sempre preme subito la freccia. Senza precarico
  // ogni passo è una richiesta che parte da zero — e la prima volta che una foto
  // viene chiesta il proxy deve ricodificarla, quindi si aspetta. Le due
  // adiacenti si scaricano mentre si guarda la corrente: al passo successivo
  // sono già nella cache del browser. Solo due, non tutte: una scheda con
  // quaranta foto non deve tirarne giù quaranta perché una è stata aperta.
  useEffect(() => {
    if (grid || photos.length < 2) return;
    for (const d of [1, -1]) {
      const p = photos[(i + d + photos.length) % photos.length];
      const img = new window.Image();
      // srcset e sizes vanno impostati come sul tag renderizzato, altrimenti il
      // browser sceglie una larghezza diversa e il precarico non serve a nulla.
      const set = photoSrcSet(p, FULL_WIDTHS);
      if (set) {
        img.sizes = "92vw";
        img.srcset = set;
      }
      img.src = photoSrc(p, 2000);
    }
  }, [i, grid, photos]);

  if (grid) {
    return (
      <div
        ref={panelRef}
        tabIndex={-1}
        className="lightbox-enter fixed inset-0 z-50 overflow-y-auto bg-black/95 outline-none backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-black/80 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-sm text-white/70">
            {gridLabel ?? ""} {gridLabel ? "· " : ""}
            {photos.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
          >
            ×
          </button>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
          {photos.map((p, idx) => (
            <button
              key={p.url}
              type="button"
              onClick={() => {
                setI(idx);
                setGrid(false);
              }}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-900"
            >
              <PhotoImg
                src={photoSrc(p, 600)}
                srcSet={photoSrcSet(p, GRID_WIDTHS)}
                sizes="(max-width: 640px) 50vw, 25vw"
                alt={p.alt}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                // Le prime dodici riempiono già la finestra: lazy le farebbe
                // arrivare a scatti mentre si scorre. Niente fetchPriority alto,
                // però: darlo a dodici immagini insieme non dà priorità a nessuna.
                loading={idx < 12 ? "eager" : "lazy"}
              />
              <span className="absolute bottom-1.5 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/85">
                {idx + 1}
              </span>
              {p.ai?.glifo && (
                <EtichettaAi testo={p.ai.glifo} aria={p.ai.aria} className="absolute right-1.5 top-1.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="lightbox-enter fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 outline-none backdrop-blur-sm"
      // Uno swipe che finisce sullo sfondo non deve chiudere la galleria.
      onClick={() => {
        if (swipe.eraUnTrascinamento()) return;
        onClose();
      }}
      {...swipe.handlers}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
      >
        ×
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setGrid(true);
        }}
        aria-label={gridLabel ?? "Grid"}
        title={gridLabel}
        className="absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label={t("prev")}
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
          >
            <span aria-hidden>‹</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label={t("next")}
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition-colors hover:bg-white/20"
          >
            <span aria-hidden>›</span>
          </button>
        </>
      )}
      {conTrasparenza ? (
        <FotoConTrasparenza
          photo={photos[i]}
          indice={i}
          vediOriginale={vediOriginale}
          onScambia={scambia}
          tx={tx}
          onFermaClick={(e) => {
            swipe.eraUnTrascinamento();
            e.stopPropagation();
          }}
        />
      ) : (
        <div
          className="relative h-[85vh] w-[92vw] max-w-6xl"
          onClick={(e) => {
            // Qui il click si ferma comunque (toccare la foto non chiude), ma il
            // flag va consumato lo stesso: altrimenti uno swipe finito sulla foto
            // lo lascerebbe alzato e si mangerebbe il click successivo.
            swipe.eraUnTrascinamento();
            e.stopPropagation();
          }}
        >
          <PhotoImg
            key={photos[i].url}
            src={photoSrc(photos[i], 2000)}
            srcSet={photoSrcSet(photos[i], FULL_WIDTHS)}
            sizes="92vw"
            alt={photos[i].alt}
            className="lightbox-photo object-contain"
            priority
          />
        </div>
      )}
      <p className="absolute bottom-4 text-sm text-white/70">
        {i + 1} / {photos.length}
      </p>
    </div>
  );
}

// Il riquadro della foto nella vista con la trasparenza: largo quanto basta
// perché la foto stia intera nello schermo (92vw, al massimo 72rem, e in
// altezza lo schermo meno lo spazio per didascalia, bottone e contatore),
// con le proporzioni VERE dell'immagine. Così il riquadro coincide con la
// foto e l'etichetta cade sul suo angolo, qualunque risoluzione arrivi.
// Senza misure note si ripiega sulla misura naturale dell'<img>.
const SPAZIO_SOTTO = "12rem";
function riquadro(w: number | null | undefined, h: number | null | undefined): React.CSSProperties | undefined {
  if (!w || !h) return undefined;
  const r = (w / h).toFixed(5);
  return {
    aspectRatio: `${w} / ${h}`,
    width: `min(92vw, 72rem, calc((100svh - ${SPAZIO_SOTTO}) * ${r}))`,
    height: "auto",
  };
}
function classeRiquadro(w: number | null | undefined, h: number | null | undefined): string {
  return w && h
    ? "block object-contain"
    : "block h-auto w-auto max-h-[calc(100svh-12rem)] max-w-[92vw] object-contain lg:max-w-6xl";
}

// ── La vista singola con la trasparenza AI ─────────────────────────────────
//
// Perché un'impaginazione diversa. Quella classica riempie un riquadro fisso
// (85vh × 92vw) con object-contain: l'immagine vera sta dentro a bande vuote,
// e un'etichetta «in alto a destra del riquadro» finirebbe sul nero, lontano
// dalla foto. Qui l'<img> ha la sua misura naturale, limitata dallo schermo, e
// il contenitore si stringe attorno: l'etichetta sta sull'angolo della FOTO.
// Sotto, la didascalia e il bottone; tutto in colonna, così c'è posto.
//
// «Vedi l'originale»: l'originale è montato insieme alla pubblicata e solo
// nascosto, quindi il browser lo scarica appena la foto si apre e lo scambio
// è immediato — niente attesa, niente animazione (l'animazione d'ingresso sta
// sul contenitore, che cambia solo cambiando foto). Arriva direttamente dalla
// vetrina del CRM (SPEC §5.6): non passa dal proxy /foto, che lo renderebbe
// immutabile per un anno.
function FotoConTrasparenza({
  photo,
  indice,
  vediOriginale,
  onScambia,
  tx,
  onFermaClick,
}: {
  photo: Photo;
  indice: number;
  vediOriginale: boolean;
  onScambia: () => void;
  tx: ReturnType<typeof testiTrasparenza>;
  onFermaClick: (e: React.MouseEvent) => void;
}) {
  const ai = photo.ai;
  const orig = ai?.originale ?? null;
  const etichetta = vediOriginale ? tx.originale : (ai?.etichetta ?? "");
  const aria = vediOriginale ? `${tx.originale} — ${tx.didascaliaOriginale}` : (ai?.aria ?? "");
  const didascalia = vediOriginale ? tx.didascaliaOriginale : (ai?.didascalia ?? null);

  return (
    <figure className="relative flex max-h-full max-w-full flex-col items-center" onClick={onFermaClick}>
      <div key={indice} className="lightbox-photo relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- come PhotoImg: niente ?dpl, cache CDN stabile. */}
        <img
          src={photoSrc(photo, 2000)}
          srcSet={photoSrcSet(photo, FULL_WIDTHS)}
          sizes="92vw"
          alt={photo.alt}
          width={photo.width ?? undefined}
          height={photo.height ?? undefined}
          draggable={false}
          decoding="async"
          fetchPriority="high"
          style={riquadro(photo.width, photo.height)}
          className={`${classeRiquadro(photo.width, photo.height)} [-webkit-user-drag:none] ${vediOriginale ? "hidden" : ""}`}
        />
        {orig && (
          // Dal tablet in su l'xl (2560) sugli schermi densi; sul telefono basta
          // l'm (1600 sul lato lungo), che sta già sopra i pixel che il riquadro
          // mostra — e l'originale si scarica comunque appena la foto si apre.
          <picture className="contents">
            <source media="(min-width: 1024px)" srcSet={`${orig.m} 1x, ${orig.xl} 2x`} />
            <img
              src={orig.m}
              alt={`${photo.alt} — ${tx.originale}`}
              width={orig.larghezza ?? undefined}
              height={orig.altezza ?? undefined}
              draggable={false}
              loading="eager"
              decoding="async"
              style={riquadro(orig.larghezza, orig.altezza)}
              className={`${classeRiquadro(orig.larghezza, orig.altezza)} [-webkit-user-drag:none] ${vediOriginale ? "" : "hidden"}`}
            />
          </picture>
        )}
        {etichetta && (
          <EtichettaAi
            testo={etichetta}
            aria={aria}
            forma="estesa"
            className="absolute right-2 top-2 sm:right-3 sm:top-3"
          />
        )}
      </div>
      {(didascalia || orig) && (
        <figcaption className="mt-3 flex max-w-3xl flex-col items-center gap-2 px-2 text-center text-sm leading-snug text-white/85">
          {didascalia && <span>{didascalia}</span>}
          {orig && (
            <button
              type="button"
              aria-pressed={vediOriginale}
              aria-keyshortcuts="O"
              onClick={(e) => {
                e.stopPropagation();
                onScambia();
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand ${
                vediOriginale
                  ? "bg-white text-ink ring-white"
                  : "bg-white/10 text-white ring-white/40 hover:bg-white/20"
              }`}
            >
              {tx.vediOriginale}
              <kbd
                aria-hidden="true"
                className={`rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold ${
                  vediOriginale ? "bg-ink/10 text-ink" : "bg-white/15 text-white/80"
                }`}
                title={tx.tasto}
              >
                O
              </kbd>
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}
