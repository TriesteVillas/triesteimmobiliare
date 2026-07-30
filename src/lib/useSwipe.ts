"use client";

import { useRef } from "react";

// Scorrere le foto col dito.
//
// Perché serve: su un telefono la prima cosa che si fa davanti a una galleria è
// trascinare, non cercare una freccia da 32 px. Senza questo, le foto si
// cambiano solo centrando un bersaglio piccolo — e su una card, dove il tocco
// "a vuoto" apre la scheda, un dito impreciso porta via dalla pagina invece di
// far scorrere la foto.
//
// Deliberatamente NON si fa preventDefault sul touchmove: la pagina sotto deve
// continuare a scorrere in verticale. Per questo la decisione si prende solo al
// rilascio, e solo se il movimento è prevalentemente orizzontale.

// Sotto questa distanza è un tocco, non un trascinamento. 45 px è più della
// tolleranza con cui il browser distingue tap da drag (~10 px) e meno di quanto
// serva a un pollice per un gesto intenzionale.
const SOGLIA_PX = 45;

export type SwipeHandlers = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

/**
 * @param onSwipe chiamata con +1 (trascinato verso sinistra → foto successiva)
 *                o -1 (verso destra → precedente).
 */
export function useSwipe(onSwipe: (direzione: 1 | -1) => void): {
  handlers: SwipeHandlers;
  /**
   * Da chiamare nell'onClick di un elemento che NAVIGA (la card che apre la
   * scheda, lo sfondo del lightbox che chiude): ritorna true se il gesto appena
   * concluso era un TRASCINAMENTO — in qualunque direzione — e in quel caso il
   * click va ignorato. Consuma il flag, quindi va chiamata una volta sola per
   * gesto.
   *
   * Vale anche per i trascinamenti VERTICALI, che non cambiano foto: scorrere
   * la pagina partendo da una card non deve aprire la scheda, e trascinare in
   * verticale dentro il lightbox non deve chiuderlo. In teoria il browser non
   * emette un click dopo un movimento oltre la sua tolleranza, ma "in teoria"
   * non basta quando il prezzo dell'errore è portare via il visitatore dalla
   * lista — misurato con un gesto sintetico, senza questa guardia la galleria
   * si chiudeva sul trascinamento verticale.
   */
  eraUnTrascinamento: () => boolean;
} {
  const partenza = useRef<{ x: number; y: number } | null>(null);
  const trascinato = useRef(false);

  return {
    handlers: {
      onTouchStart: (e) => {
        // Con due dita è un pinch-zoom, non uno scorrimento.
        if (e.touches.length !== 1) {
          partenza.current = null;
          return;
        }
        partenza.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        trascinato.current = false;
      },
      onTouchEnd: (e) => {
        const p = partenza.current;
        partenza.current = null;
        if (!p) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - p.x;
        const dy = t.clientY - p.y;
        if (Math.hypot(dx, dy) < SOGLIA_PX) return; // è un tocco, non un gesto
        // Oltre la soglia è un trascinamento: qualunque direzione, il click che
        // il browser potrebbe emettere dopo non va trattato come un tocco.
        trascinato.current = true;
        // Cambia foto solo se il movimento è prevalentemente orizzontale:
        // in verticale il visitatore sta scorrendo, non sfogliando.
        if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx < 0 ? 1 : -1);
      },
    },
    eraUnTrascinamento: () => {
      const s = trascinato.current;
      trascinato.current = false;
      return s;
    },
  };
}
