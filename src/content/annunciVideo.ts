/* Il video di testata delle schede (02/10/2026): un filmato muto in loop,
   servito da public/, che fa da sfondo all'hero della scheda al posto della
   copertina ferma. Stesso registro e stesso formato di triestevillas.com e
   triesteaffitti.com (src/content/annunciVideo.ts di quei repo): una voce
   copiata da là vale qui, cambiando solo la cartella dei file.

   Registro lato sito, chiave = codice di catalogo (TSV-PROP-…, il campo
   `tsv_prop_id` che arriva in `Property.id` da entrambe le sorgenti, vetrina
   Postgres e Airtable — es. "TSV-PROP-CAPODISTRIA-41"): il CRM non ha un campo
   per il video di testata, e i file vivono in questo repo. Una voce qui non
   può rompere una pagina: se un file manca o il filmato non parte, resta la
   copertina (components/media/SfondoVideo.tsx è fail-safe). Una voce per un
   codice che non è nel catalogo non fa niente. Registro vuoto = ogni scheda
   identica a com'era.

   DOVE VANNO I FILE — una cartella per immobile, col codice in minuscolo:
     public/media/annunci/<codice-minuscolo>/hero-<hash8>-1080.mp4        → `mp4`
     public/media/annunci/<codice-minuscolo>/hero-<hash8>-720.mp4         → `mp4Sm`
     public/media/annunci/<codice-minuscolo>/hero-<hash8>-poster.webp     → `poster`
     public/media/annunci/<codice-minuscolo>/hero-<hash8>-poster-sm.webp  → `posterSm`
   (es. public/media/annunci/tsv-prop-capodistria-41/…). `<hash8>` = i primi 8
   caratteri dell'hash del montaggio: un video rifatto cambia nome, così nessun
   browser tiene la versione vecchia. Nel registro i percorsi si scrivono come
   li serve il sito, senza `public/` («/media/annunci/…»).

   OGNI VIDEO VA REGISTRATO ANCHE NEL CRM — il registro dei video
   (`video_trasparenza`), che dà l'etichetta AI sul video («AI · video
   animato») e la didascalia: in tsv-pg `node scripts/trasparenza-video-carica.mjs`,
   chiave `tsi:<percorso del 1080>` (es. `tsi:/media/annunci/tsv-prop-…/hero-…-1080.mp4`;
   il 720 è lo stesso filmato e non ha una riga sua), sito
   `triesteimmobiliare.com`. Senza riga il video esce senza l'etichetta del
   registro (resta solo la frase scritta qui sotto con `ai`): il prebuild lo
   dice ad alta voce (scripts/check-video-registro.mjs).

   Con un video registrato l'hero della scheda usa QUESTO; gli eventuali YouTube
   del campo youtube_urls restano nella sezione #video, come prima.

   `ai: true` = filmato generato con l'AI a partire dalle foto dell'immobile:
   sul video compare la frase di trasparenza (art. 50 Reg. UE 2024/1689, AI
   Act) nelle quattro lingue (components/media/sfondoVideoStrings.ts). Un video
   girato davvero si registra con `ai: false`. `fotoRitoccate: true` quando le
   foto di partenza erano a loro volta ritoccate con l'AI: la frase lo dice
   («ritoccate con AI e animate con AI»). Senza, dice solo che il video è
   generato con l'AI dalle foto dell'immobile — vera in tutti e due i casi;
   non si scrive `fotoRitoccate` a caso.

   Codifica: H.264 yuv420p, `+faststart`, senza traccia audio. `mp4` 1080p per
   gli schermi larghi, `mp4Sm` 720p sotto i 640 px; `poster` un fotogramma in
   WebP (1920×1080), `posterSm` lo stesso a 960×540. Il poster oggi la scheda
   non lo scarica (sotto il video c'è già la copertina): sta nel registro per
   parità col formato degli altri due siti. */

export type VideoAnnuncio = {
  /** 1080p, per gli schermi larghi. */
  mp4: string;
  /** 720p, sotto i 640 px di larghezza. Senza, si usa `mp4` ovunque. */
  mp4Sm?: string;
  /** Un fotogramma del filmato (WebP). */
  poster?: string;
  /** Lo stesso fotogramma, più leggero, sotto i 640 px. */
  posterSm?: string;
  /** Generato con l'AI: mostra la frase di trasparenza sul video. */
  ai: boolean;
  /** Le foto di partenza erano già ritoccate con l'AI (cambia la frase). */
  fotoRitoccate?: boolean;
};

export const ANNUNCI_VIDEO: Readonly<Record<string, VideoAnnuncio>> = {
  // Via Capodistria 41 (/annuncio/bilocale-al-quinto-piano-con-due-poggioli-41),
  // 02/10/2026: 12 clip Kling 3.0 dalle foto della galleria (28 su 30 ritoccate
  // con AI), primi 2,6 s di ognuna con dissolvenze da 0,6 s: loop di 24,6 s,
  // muto. Riga nel registro dei video del CRM: ai_animato, foto_ai.
  "TSV-PROP-CAPODISTRIA-41": {
    mp4: "/media/annunci/tsv-prop-capodistria-41/hero-d9b75ed9-1080.mp4",
    mp4Sm: "/media/annunci/tsv-prop-capodistria-41/hero-d9b75ed9-720.mp4",
    poster: "/media/annunci/tsv-prop-capodistria-41/hero-d9b75ed9-poster.webp",
    posterSm: "/media/annunci/tsv-prop-capodistria-41/hero-d9b75ed9-poster-sm.webp",
    ai: true,
    fotoRitoccate: true,
  },
  // Casa di borgo a Contovello, 05/10/2026: 12 clip Kling 3.0 (solo carrello in
  // avanti) dalle foto finali ritoccate con l'AI — 11 della galleria più una
  // veduta aerea del borgo tenuta per il solo video — primi 2,6 s di ognuna con
  // dissolvenze da 0,6 s: loop di 24,6 s, muto. Riga nel registro dei video del
  // CRM: ai_animato, foto_ai.
  "TSV-PROP-CONTOVELLO-62": {
    mp4: "/media/annunci/tsv-prop-contovello-62/hero-8d15d444-1080.mp4",
    mp4Sm: "/media/annunci/tsv-prop-contovello-62/hero-8d15d444-720.mp4",
    poster: "/media/annunci/tsv-prop-contovello-62/hero-8d15d444-poster.webp",
    posterSm: "/media/annunci/tsv-prop-contovello-62/hero-8d15d444-poster-sm.webp",
    ai: true,
    fotoRitoccate: true,
  },
  // Bilocale con terrazza sul tetto e vista sul golfo, Muggia (Largo Amulia 6, Muggia), 05/10/2026: clip Kling 3.0 (solo carrello in avanti)
  // dalle foto finali ritoccate con l'AI, primi 2,6 s con dissolvenze da 0,6 s, loop muto.
  // Riga nel registro dei video del CRM: ai_animato, foto_ai.
  "TSV-PROP-0181": {
    mp4: "/media/annunci/tsv-prop-0181/hero-6b3c6412-1080.mp4",
    mp4Sm: "/media/annunci/tsv-prop-0181/hero-6b3c6412-720.mp4",
    poster: "/media/annunci/tsv-prop-0181/hero-6b3c6412-poster.webp",
    posterSm: "/media/annunci/tsv-prop-0181/hero-6b3c6412-poster-sm.webp",
    ai: true,
    fotoRitoccate: true,
  },
  // Monolocale affacciato sul Mandracchio di Muggia (Largo Amulia 6, Muggia), 05/10/2026: clip Kling 3.0 (solo carrello in avanti)
  // dalle foto finali ritoccate con l'AI, primi 2,6 s con dissolvenze da 0,6 s, loop muto.
  // Riga nel registro dei video del CRM: ai_animato, foto_ai.
  "TSV-PROP-0186": {
    mp4: "/media/annunci/tsv-prop-0186/hero-6fdf42fc-1080.mp4",
    mp4Sm: "/media/annunci/tsv-prop-0186/hero-6fdf42fc-720.mp4",
    poster: "/media/annunci/tsv-prop-0186/hero-6fdf42fc-poster.webp",
    posterSm: "/media/annunci/tsv-prop-0186/hero-6fdf42fc-poster-sm.webp",
    ai: true,
    fotoRitoccate: true,
  },
};

const MEDIA = "/media/annunci/";
const file = (v: unknown, est: RegExp) => typeof v === "string" && v.startsWith(MEDIA) && est.test(v);

/** Una voce è usabile solo se i file stanno sotto /media/annunci/ e hanno
 *  l'estensione giusta: un refuso nel registro non deve mettere un URL esterno
 *  nell'hero (stessa guardia degli altri due siti). */
function valida(v: VideoAnnuncio | undefined): v is VideoAnnuncio {
  return (
    !!v &&
    file(v.mp4, /\.mp4$/) &&
    (v.mp4Sm === undefined || file(v.mp4Sm, /\.mp4$/)) &&
    (v.poster === undefined || file(v.poster, /\.(webp|jpe?g|avif)$/)) &&
    (v.posterSm === undefined || file(v.posterSm, /\.(webp|jpe?g|avif)$/)) &&
    typeof v.ai === "boolean" &&
    (v.fotoRitoccate === undefined || typeof v.fotoRitoccate === "boolean")
  );
}

/** Il video di testata di un immobile, o null (la scheda resta com'era).
 *  La chiave è il codice di catalogo (TSV-PROP-…), mai l'id del record. */
export function videoAnnuncio(code: string | null | undefined): VideoAnnuncio | null {
  const k = code?.trim().toUpperCase();
  if (!k || !Object.prototype.hasOwnProperty.call(ANNUNCI_VIDEO, k)) return null;
  const v = ANNUNCI_VIDEO[k];
  return valida(v) ? v : null;
}
