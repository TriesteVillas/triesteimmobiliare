"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// L'unico pezzo client della scena Elegie: rende null. Delega in capture-phase su
// document i click su a[data-eld-cta] (chip in hero, CTA della scena, hint
// planimetrie) e manda un view_promotion la prima volta che la scena attraversa la
// fascia centrale della finestra. ⚠️ NON threshold 0.5 sulla sezione: su un
// telefono la scena è alta 2-3 finestre e il 50% non è mai visibile insieme, quindi
// l'impression non partiva mai mentre i click sì (revisione del 10/09). Con
// rootMargin -40%/-40% conta la fascia centrale del 20% del viewport, qualunque
// sia l'altezza della scena — la stessa logica di Scene.tsx.
// Non tocca TrackContacts (che intercetta solo tel/mailto/wa.me).
export default function ElegieDuinoTrack({
  propId, title, locale, sito,
}: { propId: string; title: string; locale: string; sito: string }) {
  useEffect(() => {
    const base = {
      promotion_id: "elegie-duino",
      promotion_name: "Elegie Duino — sito dedicato",
      creative_name: "scheda-scena",
      location_id: sito,
      lingua: locale,
      items: [{ item_id: propId, item_name: title, item_category: "DUINO" }],
    };
    const onClick = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a[data-eld-cta]") as HTMLElement | null;
      if (a) track("select_promotion", { ...base, creative_slot: a.dataset.eldCta });
    };
    document.addEventListener("click", onClick, true);

    const root = document.getElementById("elegie");
    let io: IntersectionObserver | null = null;
    if (root && "IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        if (entries.some((x) => x.isIntersecting)) {
          track("view_promotion", base);
          io?.disconnect();
        }
      }, { threshold: 0, rootMargin: "-40% 0px -40% 0px" });
      io.observe(root);
    }
    return () => {
      document.removeEventListener("click", onClick, true);
      io?.disconnect();
    };
  }, [propId, title, locale, sito]);
  return null;
}
