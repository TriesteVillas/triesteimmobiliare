import { createHmac, randomUUID } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// LA BUSSATA ALLA PORTA DEL CRM v4 — fase ombra del parallelo (dal 12/08/2026).
//
// Ogni submission dei moduli viene POSATA nel fondo `ingresso` di tsv-pg PRIMA
// di qualunque validazione — «prima si posa, poi si capisce» (PIANO-INGRESSO
// §3 del KB). ACCANTO alla scrittura Airtable, non al suo posto: finché il v1
// è la fonte, i lead continuano a nascere da lì; questo rende finalmente
// visibile la differenza fra «nessuno ha compilato» e «la porta è rotta».
//
// Tre proprietà, tutte deliberate:
//  · nasce SPENTA: senza la env INGRESSO_HMAC questa funzione non fa niente
//    (accenderla = env sul progetto Vercel; spegnerla = toglierla);
//  · mai bloccante: timeout 2,5 s, errori solo in console — un fondo giù non
//    deve MAI costare una richiesta di un cliente;
//  · firma HMAC-SHA256 del corpo grezzo, contratto della porta unica
//    POST /api/ingresso (x-porta + x-firma), idempotenza a carico del fondo.
//
// ⚠️ QUESTO FILE ESISTE IN 4 COPIE, una per repo dei siti (triestevillas-web
// — che copre anche la richiesta Private Collection —, triesteimmobiliare,
// triesteaffitti, lignanovillas): cambiano solo PORTA e SITO qui sotto. Chi lo
// corregge, lo corregge in tutte e quattro. E ~/dev/tsv-reference NON è un
// quinto repo: è un secondo clone di triestevillas-web (verificato 12/08).
// ─────────────────────────────────────────────────────────────────────────────

const URL_PORTA = process.env.INGRESSO_URL ?? "https://tsv-pg.vercel.app/api/ingresso";
const SEGRETO = process.env.INGRESSO_HMAC ?? "";
const PORTA = "sito-tsi";
const SITO = "tsi";

const s = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Posa una submission nel fondo del v4. Non lancia mai. */
export async function bussaIngresso(
  modulo: string,
  contatto: { nome?: unknown; cognome?: unknown; email?: unknown; telefono?: unknown },
  dati: Record<string, unknown>,
): Promise<void> {
  if (!SEGRETO) return;
  try {
    const slug = modulo.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24) || "info";
    const corpo = JSON.stringify({
      canale: "modulo",
      origine: `sito:${SITO}/${slug}`,
      elementi: [{
        chiave: randomUUID(),
        payload: {
          modulo: slug,
          contatto: {
            nome: s(contatto.nome, 120), cognome: s(contatto.cognome, 120),
            email: s(contatto.email, 160), telefono: s(contatto.telefono, 40),
          },
          dati,
        },
      }],
    });
    const firma = createHmac("sha256", SEGRETO).update(corpo, "utf8").digest("hex");
    const res = await fetch(URL_PORTA, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-porta": PORTA, "x-firma": firma },
      body: corpo,
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) {
      console.error(`[ingresso] porta ${PORTA}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
  } catch (e) {
    console.error(`[ingresso] porta ${PORTA} non raggiunta:`, e);
  }
}
