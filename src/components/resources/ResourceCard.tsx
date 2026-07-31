import { Link } from "@/i18n/navigation";
import { articleText, readingMinutes, type Article } from "@/lib/articles";

// Scheda tipografica delle Risorse. Niente fotografia per scelta: questi sono
// pezzi di riferimento, non annunci — la card vende la risposta, non la vista.
// Se c'è una cover_url diventa uno sfondo tenue; il testo resta il protagonista.
export default function ResourceCard({
  article,
  locale,
  minutesLabel,
  className = "",
}: {
  article: Article;
  locale: string;
  minutesLabel: string; // già localizzato, es. "6 min di lettura"
  className?: string;
}) {
  const title = articleText(article.title, locale);
  const abstract = articleText(article.abstract, locale);

  return (
    <Link
      href={`/risorse/${article.slug}`}
      className={`group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl border border-brand/15 bg-white p-6 shadow-[0_18px_50px_-38px_rgba(28,74,107,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 ${className}`}
    >
      {article.coverUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 transition-opacity duration-500 group-hover:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/60" />
        </>
      ) : null}
      <div className="relative">
        {article.categoria ? <p className="eyebrow text-xs">{article.categoria}</p> : null}
        <h3 className="mt-3 text-balance text-xl font-semibold leading-snug text-brand-dark transition-colors group-hover:text-brand">
          {title}
        </h3>
        {abstract ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">{abstract}</p>
        ) : null}
      </div>
      <div className="relative mt-6 flex items-center justify-between text-xs text-neutral-500">
        <span>{minutesLabel}</span>
        <span className="text-brand transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
