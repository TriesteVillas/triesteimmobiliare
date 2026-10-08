"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { attivo, oraRoma } from "./orari";

// ─────────────────────────────────────────────────────────────────────────────
// Pop-up «Ci trovate alla Barcolana» — stand 25, 7–11 ottobre 2026.
//
// Questo è solo il cancello: pesa poche righe su ogni pagina e decide SE aprire.
// Il pannello vero (testi, mappa, stili) arriva con un import dinamico solo
// quando serve, e dopo domenica 11 alle 20 non arriva più a nessuno: il
// calendario sta in ./orari.ts e si legge nel browser, non nel build.
//
// Regole:
//  · una volta al giorno: chi lo chiude non lo rivede fino a domani (la chiave
//    tiene la data di Roma, non un booleano, così giovedì riappare col giorno nuovo);
//  · mai nelle aree riservate (account, proprietari, Private Collection,
//    admin) né sulle tavole da stampare;
//  · dall'08/10 non si apre da solo sulle schede annuncio (SCHEDE, qui sotto);
//  · `?barcolana` nell'indirizzo lo riapre comunque, per farlo vedere a qualcuno.
//
// Lingua: italiano sulle pagine italiane, inglese per tutte le altre.
// ─────────────────────────────────────────────────────────────────────────────

const Pannello = dynamic(() => import("./BarcolanaStandDialog"), { ssr: false });

const CHIAVE = "tsv_barcolana58_chiuso";
const RISERVATE = /^\/(account|admin|area|owner|private|proprietario)(\/|$)|\/tavola(\/|$)/;
// Le schede annuncio: chi arriva da Google o da un portale su una casa precisa
// deve trovare la casa, non un invito a tutto schermo (audit del 07/10; unica
// correzione ammessa da Martino sulla campagna viva). Si apre da solo altrove;
// `?barcolana` lo riapre anche qui.
const SCHEDE = /^\/annuncio(\/|$)/;

function chiusoIl(): string | null {
  try {
    return localStorage.getItem(CHIAVE);
  } catch {
    return null;
  }
}

export default function BarcolanaStand({ locale }: { locale: string }) {
  const pathname = usePathname() ?? "/";
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    const ora = Date.now();
    if (!attivo(ora)) return;
    const percorso = pathname.replace(/^\/(it|en|de|sl)(?=\/|$)/, "") || "/";
    if (RISERVATE.test(percorso)) return;
    const forza = new URLSearchParams(window.location.search).has("barcolana");
    if (!forza && SCHEDE.test(percorso)) return;
    if (!forza && chiusoIl() === oraRoma(ora).data) return;
    // Un respiro dopo il caricamento: prima la pagina, poi l'invito.
    const t = window.setTimeout(() => setAperto(true), forza ? 200 : 1800);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const chiudi = useCallback(() => {
    try {
      localStorage.setItem(CHIAVE, oraRoma(Date.now()).data);
    } catch {
      /* storage bloccato: vale per questa visita */
    }
    setAperto(false);
  }, []);

  if (!aperto) return null;
  return <Pannello lingua={locale === "it" ? "it" : "en"} onChiudi={chiudi} />;
}
