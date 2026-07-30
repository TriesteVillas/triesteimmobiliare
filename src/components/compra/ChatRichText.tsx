import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Testo del Concierge AI — markdown minimo + link automatici (2026-07-30).
//
// Il modello scrive in markdown per natura ("**Via Gorizia 36, a Trieste**") e
// il widget lo stampava alla lettera, asterischi inclusi. Qui si rende quel poco
// che serve: grassetto, corsivo, link markdown, URL / email / telefoni nudi, e
// gli INDIRIZZI — che diventano una ricerca su Google Maps, cioè esattamente ciò
// che l'ospite farebbe a mano dopo aver letto la risposta.
//
// Nessuna dipendenza e soprattutto nessun dangerouslySetInnerHTML: si costruisce
// un albero di nodi React. Il testo esce da un LLM che ha in pancia il testo
// dell'ospite (input non fidato): un renderer HTML qui sarebbe una via
// d'iniezione, un albero di nodi no. Gli href passano comunque da un filtro di
// schema (http/https/mailto/tel): javascript: e data: non diventano mai link.
//
// Le regole si applicano IN ORDINE e ognuna ricorre sul proprio contenuto con le
// regole SUCCESSIVE. Da qui l'ordine scelto:
//  · il link markdown per primo, così l'URL fra parentesi non viene linkificato
//    due volte e restano fuori le quadre;
//  · il grassetto PRIMA di URL e indirizzi, altrimenti un URL dentro `**…**`
//    verrebbe consumato per conto suo e lascerebbe gli asterischi orfani;
//  · l'indirizzo per ultimo: è la regola più euristica, deve vedere solo testo
//    che nessun'altra regola ha rivendicato.
// ─────────────────────────────────────────────────────────────────────────────

type Ctx = { city?: string };
type Inner = (text: string) => ReactNode[];
type Rule = { re: RegExp; node: (m: RegExpExecArray, key: string, inner: Inner, ctx: Ctx) => ReactNode };

// Solo schemi che aprono una pagina o un'app di contatto. Tutto il resto torna
// testo semplice: un link non renderizzato è un fastidio, un href arbitrario no.
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:)/i;

function A({ href, children }: { href: string; children: ReactNode }) {
  if (!SAFE_HREF.test(href)) return <>{children}</>;
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      // Niente font-weight qui: il peso si eredita. Un indirizzo in grassetto è
      // insieme <strong> e <a>, e un `font-medium` sul link se lo mangerebbe.
      className="text-sand underline decoration-sand/40 underline-offset-2 transition-colors hover:decoration-sand"
    >
      {children}
    </a>
  );
}

const maps = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// ── Indirizzo italiano ───────────────────────────────────────────────────────
// Tipo di via + da 1 a 4 parole che iniziano per MAIUSCOLA (o cifra: il civico
// senza "n."), con i connettivi minuscoli ammessi in mezzo ("Piazza dell'Unità
// d'Italia", "Riva Tre Novembre"). È l'iniziale maiuscola a fare il grosso del
// lavoro contro i falsi positivi: "via libera", "corso di laurea" e simili non
// agganciano. In coda, opzionale, il comune quando la frase lo dice subito dopo
// ("…36, a Trieste"): entra nel testo del link e nella query, così la ricerca
// non è ambigua.
const VIE =
  "Via|Viale|V\\.le|Piazza|Piazzetta|Piazzale|P\\.zza|P\\.za|Largo|Corso|C\\.so|Strada|Salita|Androna|Riva|Molo|Vicolo|Passeggio|Galleria|Rotonda|Borgo|Localit[àa]|Frazione";
const NESSO = "(?:[a-zà-öø-ÿ]{1,5}(?:['’]\\s*|\\s+))?"; // dell', della, di, tre…
const PAROLA = "[A-ZÀ-ÖØ-Þ0-9][\\p{L}\\p{N}'’.\\-]*";
const INDIRIZZO = new RegExp(
  `\\b(?:${VIE})\\s+${NESSO}${PAROLA}(?:\\s+${NESSO}${PAROLA}){0,3}` +
    `(?:,?\\s*(?:n\\.?\\s*)?\\d{1,4})?` +
    // interno/esponente staccato ("4/A", "12 - B"): il civico può già essere
    // finito fra le parole, quindi la coda si aggancia da sola. Deve contenere
    // una cifra o essere una lettera sola, altrimenti "Strada Costiera 22 - la
    // vista" si porterebbe dentro mezza frase.
    `(?:\\s*[/-]\\s*(?:\\d{1,3}[A-Za-z]?|[A-Za-z])(?![\\p{L}\\p{N}]))?` +
    `(?:,\\s*(?:a\\s+)?([A-ZÀ-ÖØ-Þ][\\p{L}'’\\-]+(?:\\s+[A-ZÀ-ÖØ-Þ][\\p{L}'’\\-]+){0,2}))?`,
  "gu",
);

const RULES: Rule[] = [
  // [testo](url)
  {
    re: /\[([^\]\n]{1,160})\]\((https?:\/\/[^\s)]{4,400}|mailto:[^\s)]{3,200}|tel:[^\s)]{3,40})\)/g,
    node: (m, key) => (
      <A key={key} href={m[2]}>
        {m[1]}
      </A>
    ),
  },
  // **grassetto** — ricorre dentro: un indirizzo in grassetto resta grassetto E diventa link
  {
    re: /\*\*([^*\n]{1,500})\*\*/g,
    node: (m, key, inner) => (
      <strong key={key} className="font-semibold text-white">
        {inner(m[1])}
      </strong>
    ),
  },
  // *corsivo* — dopo il grassetto, quindi gli asterischi rimasti sono singoli.
  // L'apertura non può stare attaccata a una parola e il contenuto non può
  // iniziare/finire con uno spazio: senza questo, "3*4 e 5*6" diventava un
  // corsivo lungo mezza frase. Il carattere che precede è dentro il match (niente
  // lookbehind: rompe Safari vecchi) e si ri-emette com'è.
  // Il `[^*\n]` non attraversa le righe: un elenco puntato con "* voce" non aggancia.
  {
    re: /(^|[^\w*])\*([^\s*][^*\n]{0,298}[^\s*]|[^\s*])\*(?![\w*])/g,
    node: (m, key, inner) => (
      <span key={key}>
        {m[1]}
        <em className="italic">{inner(m[2])}</em>
      </span>
    ),
  },
  // URL nudo — il prompt del CRM chiede al bot di citare l'URL completo proprio
  // perché il widget non rendeva il markdown: quei link ora si aprono.
  // La coda non può essere punteggiatura: "…/mutui." linka senza il punto.
  {
    re: /https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]]/g,
    node: (m, key) => (
      <A key={key} href={m[0]}>
        {m[0].replace(/^https?:\/\//, "")}
      </A>
    ),
  },
  // email
  {
    re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
    node: (m, key) => (
      <A key={key} href={`mailto:${m[0]}`}>
        {m[0]}
      </A>
    ),
  },
  // telefono — solo col prefisso +39 esplicito: senza, si linkificherebbero
  // metrature, prezzi e rendite catastali.
  {
    re: /\+39[\s.]?\d[\d\s.]{7,12}\d/g,
    node: (m, key) => (
      <A key={key} href={`tel:${m[0].replace(/[\s.]/g, "")}`}>
        {m[0]}
      </A>
    ),
  },
  // indirizzo → Google Maps
  {
    re: INDIRIZZO,
    node: (m, key, _inner, ctx) => {
      // Comune: quello scritto nella frase se c'è, altrimenti quello della scheda
      // su cui vive il widget. Se non c'è né l'uno né l'altro non si inventa una
      // città — meglio una ricerca vaga che una precisa e sbagliata.
      const city = m[1] ? "" : ctx.city ? `, ${ctx.city}` : "";
      return (
        <A key={key} href={maps(`${m[0]}${city}`)}>
          {m[0]}
        </A>
      );
    },
  },
];

function render(text: string, from: number, ctx: Ctx): ReactNode[] {
  if (from >= RULES.length || !text) return text ? [text] : [];
  const rule = RULES[from];
  const re = new RegExp(rule.re.source, rule.re.flags); // istanza propria: lastIndex non condiviso
  const out: ReactNode[] = [];
  const inner: Inner = (t) => render(t, from + 1, ctx);
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0] === "") {
      re.lastIndex++; // paracadute: una regola che matcha il vuoto non deve girare all'infinito
      continue;
    }
    if (m.index > last) out.push(...render(text.slice(last, m.index), from + 1, ctx));
    out.push(rule.node(m, `${from}:${m.index}`, inner, ctx));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...render(text.slice(last), from + 1, ctx));
  return out;
}

/** Rende il testo di UNA risposta del concierge. Da usare solo sui turni del
 *  bot: il testo dell'ospite si mostra com'è, senza interpretarne i simboli. */
export default function ChatRichText({ text, city }: { text: string; city?: string }) {
  return <>{render(text, 0, { city })}</>;
}
