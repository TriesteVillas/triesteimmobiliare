import "server-only";
import { getVideoSito } from "./trasparenza-vetrina";
import { chiaveFile, chiaveYoutube, videoAi, type VideoAi } from "./trasparenza-video";

// Il registro dei video del CRM applicato ai video di QUESTO sito
// (trasparenza-video.ts per le regole, trasparenza-vetrina.ts per la lettura).

/**
 * Un file del sito: il percorso servito, «/video/<nome>.mp4» → chiave «tsi:<percorso>».
 * `ripiego` = l'etichetta che il codice scriveva a mano PRIMA del registro
 * (l'arredo virtuale della home): vale solo quando la riga non c'è — anche
 * col registro illeggibile e nessuna copia buona —, così passando al registro
 * non si perde niente. Con la riga, decide la riga, anche se dice «nessuna
 * etichetta».
 */
export async function videoDelSito(
  percorso: string,
  locale: string,
  ripiego: VideoAi | null = null,
): Promise<VideoAi | null> {
  const r = (await getVideoSito()).get(chiaveFile(percorso));
  return r ? videoAi(r, locale) : ripiego;
}

/** I video YouTube di una scheda, nell'ordine: id → vista localizzata o null. */
export async function videoYoutube(ids: string[], locale: string): Promise<(VideoAi | null)[]> {
  if (!ids.length) return [];
  const registro = await getVideoSito();
  return ids.map((id) => videoAi(registro.get(chiaveYoutube(id)), locale));
}
