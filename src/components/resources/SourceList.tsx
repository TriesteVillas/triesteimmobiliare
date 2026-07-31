// Fonti di un articolo delle Risorse — lista ordinata, cliccabile, SENZA URL in
// chiaro (stessa disposizione presa su TriesteVillas il 2026-07-23: "AGENZIA
// ENTRATE: Imposte sull'acquisto…", non un muro di link).
//
// Il campo Airtable `fonti` è testo libero, una fonte per riga. Formati accettati:
//   1. preferito:  Etichetta leggibile | URL | nota breve
//   2. legacy:     URL — nota
//   3. riga senza URL: resa come testo semplice
// Quando l'etichetta manca si deriva dal dominio (agenziaentrate.gov.it →
// AGENZIAENTRATE): mai mostrare l'URL grezzo, che resta solo nell'href.

type Source = { label: string; url: string | null; note: string };

const URL_RE = /https?:\/\/[^\s|]+/;

function publisherFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    const core = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    return core.toUpperCase();
  } catch {
    return "FONTE";
  }
}

const trimSep = (s: string) => s.replace(/^[\s—–\-·:,;()]+|[\s—–\-·:,;()]+$/g, "").trim();

function parseLine(line: string): Source | null {
  const text = line.trim();
  if (!text) return null;
  if (text.includes("|")) {
    const [a = "", b = "", ...rest] = text.split("|").map((p) => p.trim());
    const url = b.match(URL_RE)?.[0] ?? a.match(URL_RE)?.[0] ?? null;
    const label = trimSep(a.replace(URL_RE, "")) || (url ? publisherFromUrl(url) : "");
    return { label: label || text, url, note: trimSep(rest.join(" · ")) };
  }
  const url = text.match(URL_RE)?.[0] ?? null;
  if (!url) return { label: text, url: null, note: "" };
  const idx = text.indexOf(url);
  const before = trimSep(text.slice(0, idx));
  const after = trimSep(text.slice(idx + url.length));
  return { label: before || publisherFromUrl(url), url, note: after };
}

export default function SourceList({ fonti }: { fonti: string }) {
  const sources = fonti
    .split("\n")
    .map(parseLine)
    .filter((s): s is Source => s !== null);
  if (!sources.length) return null;

  return (
    <ol className="mt-3 space-y-2.5 pl-5 text-sm leading-relaxed" style={{ listStyle: "decimal" }}>
      {sources.map((s, i) => (
        <li key={i} className="text-neutral-500 marker:text-brand/60">
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-dark underline decoration-brand/40 underline-offset-4 transition-colors hover:text-brand"
            >
              {s.label}
            </a>
          ) : (
            <span className="text-neutral-700">{s.label}</span>
          )}
          {s.note ? <span className="text-neutral-500"> — {s.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
