import { marked } from "marked";

// Markdown → HTML lato server per gli articoli delle Risorse. La fonte è di
// prima mano (la scriviamo noi, passa dalla revisione nel CRM prima di
// stato=Pubblicato) — resta però la regola: nessun HTML grezzo può diventare
// markup vivo su una pagina pubblica. Basta neutralizzare "<": nessun tag può
// aprirsi. La sintassi Markdown non ne soffre — le citazioni usano ">" a inizio
// riga, che resta intatto.
export default function ArticleBody({ markdown }: { markdown: string }) {
  const html = marked.parse(markdown.replace(/</g, "&lt;"), { async: false }) as string;
  return (
    <div
      className="prose-lib"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
