import type { RiquadroLocale, TipoRiquadro } from "@/content/annunciRiquadri";

// I riquadri in evidenza della scheda (content/annunciRiquadri.ts): in alto
// sul foglio del dossier, subito sotto l'hero con prezzo e titolo. Un fatto
// per riquadro — la cifra (se c'è) per prima, poi titolo, testo e la nota in
// piccolo. Stessa grammatica delle schede del foglio (bordo neutral-200,
// angoli xl, fondo bianco) con un filo di colore del marchio a sinistra, così
// si leggono come «da sapere» e non come un'altra riga di caratteristiche.
// Componente server, nessuno stato. Senza riquadri non rende niente.

function Icona({ tipo }: { tipo: TipoRiquadro }) {
  const comune = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (tipo) {
    case "rendita":
      // un grafico che sale
      return (
        <svg {...comune}>
          <path d="M3 3v18h18" />
          <path d="m7 15 4-4 3 3 5-6" />
          <path d="M15 8h4v4" />
        </svg>
      );
    case "fisco":
      // un documento con la percentuale
      return (
        <svg {...comune}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="m9 17 6-6" />
          <circle cx="9.5" cy="11.5" r="1" />
          <circle cx="14.5" cy="16.5" r="1" />
        </svg>
      );
    case "chiave":
      return (
        <svg {...comune}>
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="m10.7 12.3 9.3-9.3M16 7l3 3M14 9l2 2" />
        </svg>
      );
    default:
      return (
        <svg {...comune}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
  }
}

export default function RiquadriEvidenza({
  riquadri,
  etichetta,
}: {
  riquadri: RiquadroLocale[];
  /** Nome accessibile della sezione («Da sapere su questo immobile»). */
  etichetta: string;
}) {
  if (!riquadri.length) return null;
  const colonne = riquadri.length === 1 ? "" : riquadri.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section aria-label={etichetta} className="mt-6" data-reveal>
      <ul className={`grid gap-3 ${colonne}`}>
        {riquadri.map((r, i) => (
          <li
            key={i}
            className="relative flex gap-3 overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-brand"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
              <Icona tipo={r.tipo} />
            </span>
            <div className="min-w-0">
              {r.cifra && (
                <p className="text-2xl font-semibold tracking-tight text-brand-dark">{r.cifra}</p>
              )}
              <h3 className={`text-sm font-semibold text-neutral-900 ${r.cifra ? "mt-0.5" : ""}`}>{r.titolo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{r.testo}</p>
              {r.nota && <p className="mt-2 text-xs leading-snug text-neutral-500">{r.nota}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
