// Anzianità in collezione, per la bubble sulle card della Private Collection.
//
// pc_data_ingresso è scritta dal CRM quando l'immobile entra in collezione
// (pc_visibile_su da vuoto a valorizzato) e azzerata quando ne esce. Qui si
// contano i MESI DI CALENDARIO compiuti da quella data:
//   0        → "Nuovo"
//   1..11    → "N mesi"
//   >= 12    → la funzione ritorna il numero, ma la PAGINA non mostra la bubble
//              (oltre l'anno sparisce — regola di Martino; il cutoff sta lì)
//   no data  → null (nessuna bubble: meglio niente che un'età inventata)
//
// ⚠️ Copiato identico in triestevillas-web e triesteimmobiliare (modello
// lib/private): si aggiorna con cp, non si riscrive.
export function pcMonthsIn(pcSince: string | null, now: Date = new Date()): number | null {
  if (!pcSince) return null;
  const m = pcSince.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - mo);
  if (now.getUTCDate() < d) months -= 1; // mese compiuto solo a giorno raggiunto
  return months < 0 ? 0 : months;
}
