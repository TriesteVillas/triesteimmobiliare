"use client";

// Store client dell'area account: sessione (chi sono), cuori e voti, con
// supporto anonimo. Un solo fetch di /api/account/me per caricamento pagina,
// condiviso da tutte le istanze (header, cuori sulle card, widget voto).
//
// Perché esiste: l'header e le card vivono su pagine STATICHE (SSG/ISR) — il
// server non può leggere il cookie lì senza rendere dinamico tutto il sito.
// Quindi lo stato di login in UI arriva sempre da qui, client-side.
//
// Anonimi: i cuori vanno in localStorage (pattern Baymard: il login-wall sul
// primo salvataggio uccide l'azione) e vengono MIGRATI al primo login/signup —
// sia passandoli alle route login/register, sia qui in ensureInit per il
// ritorno da Google SSO (dove non c'è una POST nostra in mezzo).

const LS_FAVS = "tsi_favs";

export type FavSnapshot = {
  ready: boolean;
  authed: boolean;
  nome: string;
  favs: ReadonlySet<string>;
  votes: Readonly<Record<string, "up" | "down">>;
  // Avvisi di prezzo attivi (slug). Solo loggati: un avviso senza email non
  // può avvisare nessuno, quindi niente ramo localStorage.
  alerts: ReadonlySet<string>;
};

const EMPTY: FavSnapshot = { ready: false, authed: false, nome: "", favs: new Set(), votes: {}, alerts: new Set() };

let snapshot: FavSnapshot = EMPTY;
const listeners = new Set<() => void>();
let initStarted = false;

function emit(next: Partial<FavSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  ensureInit();
  return () => listeners.delete(l);
}

export const getSnapshot = (): FavSnapshot => snapshot;
export const getServerSnapshot = (): FavSnapshot => EMPTY;

function readLocalFavs(): string[] {
  try {
    const raw = localStorage.getItem(LS_FAVS);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.map(String).slice(0, 50) : [];
  } catch {
    return [];
  }
}

function writeLocalFavs(favs: Iterable<string>) {
  try {
    localStorage.setItem(LS_FAVS, JSON.stringify([...favs]));
  } catch {
    /* storage bloccato: pazienza */
  }
}

export function getLocalFavs(): string[] {
  return readLocalFavs();
}

export function clearLocalFavs() {
  try {
    localStorage.removeItem(LS_FAVS);
  } catch {
    /* best-effort */
  }
}

export function ensureInit(): void {
  if (initStarted || typeof window === "undefined") return;
  initStarted = true;
  // Prima i cuori locali (sincrono): la UI anonima è subito giusta.
  emit({ ready: true, favs: new Set(readLocalFavs()) });
  fetch("/api/account/me", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return; // anonimo: si resta sui cuori locali
      const me = (await res.json()) as {
        nome?: string;
        favs?: string[];
        alerts?: string[];
        votes?: Record<string, "up" | "down">;
      };
      const serverFavs = new Set((me.favs ?? []).map(String));
      // Migrazione post-SSO: cuori locali non ancora sul server.
      const local = readLocalFavs().filter((s) => !serverFavs.has(s));
      emit({
        authed: true,
        nome: me.nome ?? "",
        favs: new Set([...serverFavs, ...local]),
        votes: me.votes ?? {},
        alerts: new Set((me.alerts ?? []).map(String)),
      });
      if (local.length) {
        Promise.allSettled(
          local.map((slug) =>
            fetch("/api/account/favorite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, on: true }),
            }),
          ),
        ).then(() => clearLocalFavs());
      } else {
        clearLocalFavs();
      }
    })
    .catch(() => {});
}

// Toggle del cuore. Ritorna il nuovo stato. Ottimistico in entrambe le modalità.
export function toggleFav(slug: string): boolean {
  const on = !snapshot.favs.has(slug);
  const favs = new Set(snapshot.favs);
  if (on) favs.add(slug);
  else favs.delete(slug);
  emit({ favs });
  if (snapshot.authed) {
    fetch("/api/account/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, on }),
      keepalive: true,
    }).catch(() => {});
  } else {
    writeLocalFavs(favs);
  }
  return on;
}

// Avviso di prezzo (solo loggati — il chiamante mostra il prompt anonimo).
// Ritorna il nuovo stato. Ottimistico.
export function toggleAlert(slug: string): boolean {
  const on = !snapshot.alerts.has(slug);
  const alerts = new Set(snapshot.alerts);
  if (on) alerts.add(slug);
  else alerts.delete(slug);
  emit({ alerts });
  fetch("/api/account/alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, on }),
    keepalive: true,
  }).catch(() => {});
  return on;
}

// Voto like/dislike (solo loggati — il chiamante gestisce il prompt anonimo).
export function setVote(slug: string, vote: "up" | "down" | null, note?: string): void {
  const votes = { ...snapshot.votes } as Record<string, "up" | "down">;
  if (vote) votes[slug] = vote;
  else delete votes[slug];
  emit({ votes });
  fetch("/api/account/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, vote, ...(note ? { note } : {}) }),
    keepalive: true,
  }).catch(() => {});
}

// La pagina account, dopo login/registrazione riusciti, forza il refresh dello
// stato senza aspettare un reload completo.
export function refreshMe(): void {
  initStarted = false;
  ensureInit();
}
