import type { ApprofondimentoLocale } from "@/content/annunciApprofondimenti";

// L'approfondimento della scheda (content/annunciApprofondimenti.ts): ciò che
// sta intorno alla casa — il borgo, la storia, i sentieri — dopo la
// descrizione. Stessa grammatica dei riquadri in evidenza (bordo neutral-200,
// angoli xl, filo del marchio a sinistra) ma su fondo appena tinto, perché si
// legga come un racconto a parte e non come il seguito della descrizione.
// Il primo paragrafo resta sempre visibile; il resto si apre con un
// <details> nativo: niente JavaScript, e il testo intero è nell'HTML (lo
// leggono anche i motori di ricerca). Componente server, nessuno stato.

export default function ApprofondimentoAnnuncio({
  approfondimento,
  altro,
}: {
  approfondimento: ApprofondimentoLocale | null;
  /** «Continua a leggere». */
  altro: string;
}) {
  if (!approfondimento) return null;
  const [primo, ...resto] = approfondimento.paragrafi;
  return (
    <section
      id="approfondimento"
      className="relative mt-8 scroll-mt-32 overflow-hidden rounded-xl border border-neutral-200 bg-brand/5 p-5 pl-6 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-brand sm:p-6 sm:pl-7"
      data-reveal
    >
      <h2 className="text-lg font-semibold text-neutral-900">{approfondimento.titolo}</h2>
      <p className="mt-3 leading-relaxed text-neutral-700">{primo}</p>
      {resto.length > 0 && (
        <details className="group mt-1">
          <summary className="mt-3 inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline group-open:hidden [&::-webkit-details-marker]:hidden">
            {altro}
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-3 space-y-4 leading-relaxed text-neutral-700">
            {resto.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
