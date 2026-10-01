import { createHmac, randomUUID } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// LA BUSSATA ALLA PORTA DEL CRM (dal 12/08/2026) — e dal 01/10/2026 la porta
// risponde, e la sua risposta conta.
//
// Ogni submission dei moduli viene POSATA nel fondo `ingresso` di tsv-pg PRIMA
// di qualunque validazione — «prima si posa, poi si capisce» (PIANO-INGRESSO
// §3 del KB). Nata il 12/08 come ombra ACCANTO alla scrittura Airtable, per i
// moduli delle route /api/lead oggi è l'UNICO deposito: su TSV, TSI e TA dal
// 25/08 (`LEAD_SU_AIRTABLE=no`, la scrittura Airtable è spenta e il lead lo
// crea il CRM da qui), su LignanoVillas da sempre (il progetto Vercel non ha
// token Airtable). Chi riceve, nel CRM: web/lib/ingresso/moduli-siti.ts
// (moduli-ta.ts per TriesteAffitti).
//
// Tre proprietà, tutte deliberate:
//  · RESTITUISCE se la porta ha accettato (true = risposta 2xx) e non lancia
//    mai: decide il chiamante. Le route /api/lead rispondono 502 `save_failed`
//    quando la porta è il loro unico deposito e dice di no — il cliente legge
//    l'errore del modulo invece di «ricevuto». Chi scrive ancora Airtable per
//    conto suo (la richiesta Private Collection, l'iscrizione account) ignora
//    il valore: lì la porta resta un'ombra, e il CRM non ne esegue le righe
//    (tsv-pg web/lib/ingresso/motore.ts, provaEsecuzione);
//  · senza la env INGRESSO_HMAC non bussa: lo scrive in console e restituisce
//    false (accenderla = env sul progetto Vercel). Timeout 8 s — era 2,5
//    finché la porta era un'ombra e un'attesa lunga costava più di una riga
//    persa nel fondo; da deposito unico vale il contrario;
//  · firma HMAC-SHA256 del corpo grezzo, contratto della porta unica
//    POST /api/ingresso (x-porta + x-firma), idempotenza a carico del fondo.
//
// Perché restituisce (01/10/2026). Fino a quel giorno la funzione era
// fire-and-forget: una firma rifiutata, il CRM giù o un timeout erano una
// richiesta persa con il cliente convinto del contrario, e nessuno lo vedeva —
// né il cliente né noi. Prima su LignanoVillas (4cabbc7), lo stesso giorno
// sulle altre tre copie, che da allora tornano a essere uguali.
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

/** Posa una submission nel fondo del CRM. Non lancia mai. Restituisce true solo
 *  se la porta ha risposto 2xx — cioè se la richiesta è DAVVERO al sicuro. */
export async function bussaIngresso(
  modulo: string,
  contatto: { nome?: unknown; cognome?: unknown; email?: unknown; telefono?: unknown },
  dati: Record<string, unknown>,
): Promise<boolean> {
  if (!SEGRETO) {
    console.error(`[ingresso] porta ${PORTA}: INGRESSO_HMAC assente, la richiesta non va al CRM`);
    return false;
  }
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
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[ingresso] porta ${PORTA}: ${res.status} ${(await res.text()).slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[ingresso] porta ${PORTA} non raggiunta:`, e);
    return false;
  }
}
