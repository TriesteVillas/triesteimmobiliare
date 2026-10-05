// ─────────────────────────────────────────────────────────────────────────────
// «NELLO STESSO PALAZZO» — le altre unità in vendita dello stesso edificio.
//
// Nato il 05/10/2026 per Largo Amulia 6 a Muggia: sette appartamenti dello
// stesso palazzo venduti uno per uno, e Martino vuole che ogni scheda rimandi
// a tutte le altre. I «simili» non lo possono fare, e non devono: tengono al
// massimo UNA unità per edificio di proposito (lib/simili.ts, le 7 di Palazzo
// Haggi che si rubavano le card a vicenda). Qui è il contrario: le si mostra
// tutte, in una sezione a sé, e le si toglie dai simili.
//
// Decide SOLO il campo `progetto` (singleSelect di Airtable), come per Elegie
// Duino: due unità sono «stesso palazzo» se hanno lo stesso progetto. Elegie ha
// già la sua scena-ponte e resta com'è (la pagina non chiama questa funzione).
//
// Filtri duri, gli stessi dei simili perché la card non menta: stesso
// contratto, stato ACTIVE (o vuoto), copertina presente.
// ─────────────────────────────────────────────────────────────────────────────

type Unita = {
  slug: string;
  progetto: string | null;
  contratto: string | null;
  statusCommerciale: string | null;
  coverPhoto?: unknown;
  floor: string | null;
  priceSale: number | null;
  priceRent: number | null;
};

const norm = (s: string | null | undefined) => (s ?? "").trim().toUpperCase();

// «1», «2», «su più livelli»… → numero per l'ordine; il resto in coda.
function pianoNum(f: string | null): number {
  const m = (f ?? "").match(/\d+/);
  return m ? Number(m[0]) : 99;
}

/** Le altre unità dello stesso progetto, dal piano più basso al più alto e,
 *  a parità di piano, dalla più economica. Vuoto se la scheda non ha progetto. */
export function stessoPalazzo<T extends Unita>(corrente: T, tutte: T[]): T[] {
  const p = norm(corrente.progetto);
  if (!p) return [];
  return tutte
    .filter(
      (c) =>
        c.slug !== corrente.slug &&
        norm(c.progetto) === p &&
        norm(c.contratto) === norm(corrente.contratto) &&
        (!c.statusCommerciale || norm(c.statusCommerciale) === "ACTIVE") &&
        Boolean(c.coverPhoto),
    )
    .sort(
      (a, b) =>
        pianoNum(a.floor) - pianoNum(b.floor) ||
        (a.priceSale ?? a.priceRent ?? 0) - (b.priceSale ?? b.priceRent ?? 0) ||
        (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
    );
}
