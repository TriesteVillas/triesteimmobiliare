import type { Photo } from "./properties";

// L'elenco canonico delle foto di un immobile: copertina, poi le curate, poi
// tutte le altre, senza doppioni.
//
// Serve una funzione sola perché `cover`, `foto_top8` e `foto` sono campi
// ATTACHMENT DIVERSI di Airtable: la stessa immagine caricata in due campi ha
// due id, quindi due url (vedi il commento in `properties.ts`, «so the gallery
// can de-dupe a photo that appears in more than one field»). Chi mette insieme
// quei tre campi confrontando le url ottiene doppioni; chi ne usa due elenchi
// diversi in due punti della stessa pagina ottiene due numerazioni che non
// combaciano — ed è esattamente il guasto trovato il 04/09/2026 sulla scheda,
// dove la miniatura cliccata apriva sempre la prima foto.
//
// Chiave: `filename`, con ripiego sull'url per i record che non ce l'hanno.
export function gallerySet(
  cover: Photo | null | undefined,
  topPhotos: Photo[] = [],
  allPhotos: Photo[] = [],
): Photo[] {
  const seen = new Set<string>();
  const out: Photo[] = [];
  for (const p of [cover, ...topPhotos, ...allPhotos]) {
    if (!p) continue;
    const key = p.filename ?? p.url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
