"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// view_item con l'immobile: il page_view della misurazione avanzata non porta
// l'item, e senza item non si capisce QUALE casa genera interesse.
//
// Dal 10/10/2026 (gemello di triestevillas-web, 28e6fe9) l'item porta anche nome
// pubblico, tipologia, zona, contratto e prezzo (quando il prezzo è pubblico): i
// rapporti «Articoli» di GA4 dicono così quali case, quali zone e quali fasce
// attirano, non solo quali codici.
// ⛔ Mai il nome interno (che qui non arriva) e mai un prezzo in trattativa
// riservata: si manda solo ciò che la pagina pubblica già mostra.
// ⛔ E l'id è il record opaco (`rec…`), MAI il codice TSV-PROP: è testo libero
// e a volte porta il cognome di chi vende (regola ferrea del gruppo). Il nome
// leggibile sta in `item_name`, che è il nome pubblico.
//
// ⚠️ DIFFERENZA VOLUTA DAL GEMELLO TSV: QUANDO parte. Qui lo script di GA4
// (anche `ga4-init`, quello che definisce `gtag`) è `lazyOnload`: next/script lo
// inietta dopo l'evento `load` e un requestIdleCallback, cioè DOPO l'effetto di
// questo componente, che gira all'idratazione. Chiamato subito, `track()` non
// trovava `gtag` e l'evento si perdeva proprio sulla visita che conta di più —
// chi atterra sulla scheda da Google o da un portale; restava solo chi ci
// arrivava navigando dentro il sito. Allora si aspetta che `gtag` esista (al
// massimo 30 secondi, poi si rinuncia: un blocker, GA spento) e che la pagina
// non sia in prerender. Il Consent Mode non si tocca: quando `gtag` esiste lo
// script d'avvio ha già dato `consent default` e `config`, nell'ordine suo.
export default function TrackViewItem({
  id, nome, tipologia, zona, contratto, prezzo,
}: {
  id: string;
  nome?: string | null;
  tipologia?: string | null;
  zona?: string | null;
  contratto?: string | null;
  /** Solo se la pagina lo mostra: null in trattativa riservata. */
  prezzo?: number | null;
}) {
  useEffect(() => {
    const item: Record<string, unknown> = { item_id: id, item_brand: "TriesteImmobiliare" };
    if (nome) item.item_name = nome.slice(0, 100);
    if (tipologia) item.item_category = tipologia.slice(0, 100);
    if (zona) item.item_category2 = zona.slice(0, 100);
    if (contratto) item.item_category3 = contratto.toLowerCase();
    const prezzoOk = typeof prezzo === "number" && Number.isFinite(prezzo) && prezzo > 0;
    if (prezzoOk) item.price = prezzo;
    const parametri = prezzoOk ? { currency: "EUR", value: prezzo, items: [item] } : { items: [item] };

    let fatto = false;
    const prova = (): boolean => {
      if (fatto) return true;
      if ((document as Document & { prerendering?: boolean }).prerendering) return false;
      if (typeof (window as unknown as { gtag?: unknown }).gtag !== "function") return false;
      fatto = true;
      track("view_item", parametri);
      return true;
    };
    if (prova()) return;
    const giro = window.setInterval(() => { if (prova()) window.clearInterval(giro); }, 500);
    const resa = window.setTimeout(() => window.clearInterval(giro), 30_000);
    return () => {
      fatto = true;
      window.clearInterval(giro);
      window.clearTimeout(resa);
    };
  }, [id, nome, tipologia, zona, contratto, prezzo]);
  return null;
}
