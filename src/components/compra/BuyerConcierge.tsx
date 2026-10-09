"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ChatRichText from "./ChatRichText";
import { track } from "@/lib/track";

// Concierge AI pubblico del Buyer Hub — la barra "semplice quanto Google" che
// apre una conversazione vera. Stessa filosofia del Concierge Private
// Collection: il widget è stupido di proposito, tutta l'intelligenza (prompt,
// tool su articoli e immobili, guardrail, registro conversazioni) vive nel CRM
// dietro /api/concierge/chat. Qui: UI, storia locale, il passaggio a una
// persona, stato blocked.
//
// IL PASSAGGIO (09/10/2026, richiesta di Martino: «dopo 2-3 risposte invita
// super cortesemente a scriverci direttamente per aprire un filo di dialogo»).
// Fino a quel giorno, alla quarta domanda, il CRM chiedeva nome e recapito per
// CONTINUARE A PARLARE COL BOT. Ora:
//  - in fondo al pannello, i segni delle domande che restano al concierge
//    (RISPOSTE_LIBERE, tre come TURNI_LIBERI del bridge);
//  - dopo la penultima risposta, l'invito a scrivere a una persona;
//  - dopo l'ultima, il campo sparisce e nella conversazione si apre la LETTERA
//    AL TEAM (domande fatte, due righe, cerco/ho una casa, nome, recapito,
//    consenso), che va a /api/concierge/lettera → porta unica dei moduli del
//    CRM, e NON al bot. In alternativa WhatsApp ed email già scritti con le
//    domande. La lettera si apre anche prima, da «Scrivete a una persona»;
//  - il bridge non riceve più identità: il suo cancello resta solo un freno
//    (alla quarta domanda non chiama il modello) — vedi il proxy.
// Lo stesso giro di sloveniavillas.com. Gemello in triestevillas-web.
//
// Differenze deliberate rispetto al widget PC:
//  - la lettera la apre il widget contando le risposte (il bridge non lo dice);
//  - l'ingresso è una search bar, non un bottone flottante — la domanda scritta
//    lì diventa il primo turno della conversazione;
//  - su "blocked" non c'è nessun logout da eseguire: si chiude la sessione di
//    chat e basta (l'input resta disabilitato finché vive il sessionStorage);
//  - il sid è generato qui e serve a: bucket rate-limit, firma dei turni,
//    id sessione nel registro CRM. Ruotarlo non compra nulla (vedi proxy).

/** `servizio`: un testo che non è una risposta del concierge (il grazie della
 *  lettera, il freno del bridge): non conta fra le risposte e non viaggia al bridge. */
type Msg = { role: "user" | "assistant"; content: string; sig?: string; servizio?: boolean };
type Stored = {
  sid: string;
  msgs: Msg[];
  blocked: boolean;
  passaggio: boolean;
  consegnato: boolean;
};
type LetteraErrors = { name: boolean; contact: boolean; consent: boolean };

const STORAGE_KEY = "tsi_web_chat";
/** Le risposte del concierge per conversazione, poi la lettera. ⚠️ Rispecchia
 *  TURNI_LIBERI del bridge (vecchio impianto, src/lib/conciergegate.ts): se lì
 *  si alza, qui si alza, o il widget chiude prima del bridge. */
const RISPOSTE_LIBERE = 3;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function freshSid(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return "web_" + Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

function loadStored(): Stored {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<Stored>;
      if (typeof d.sid === "string" && /^web_[a-z0-9]{10,32}$/.test(d.sid)) {
        const vecchio = d as Partial<Stored> & { identificato?: unknown; gate?: unknown };
        const msgs = Array.isArray(d.msgs) ? (d.msgs as Msg[]) : [];
        // Una conversazione salvata dal widget di prima: `identificato` era il
        // modulo già passato (vale come lettera consegnata), `gate` il punto in
        // cui ora si apre la lettera.
        const consegnato = d.consegnato === true || vecchio.identificato === true;
        return {
          sid: d.sid,
          msgs,
          blocked: d.blocked === true,
          passaggio: d.passaggio === true || vecchio.gate === true || consegnato || risposteDate(msgs) >= RISPOSTE_LIBERE,
          consegnato,
        };
      }
    }
  } catch {
    /* storage bloccato: chat effimera */
  }
  return { sid: freshSid(), msgs: [], blocked: false, passaggio: false, consegnato: false };
}

/** Le risposte vere del concierge già date (non i testi di servizio). */
function risposteDate(msgs: Msg[]): number {
  return msgs.filter((m) => m.role === "assistant" && !m.servizio).length;
}

function saveStored(s: Stored): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* best-effort */
  }
}

/**
 * Il placeholder si scrive da solo, una domanda alla volta.
 *
 * Nasce da due problemi veri della barra vecchia: la frase unica lunga veniva
 * TAGLIATA (il bottone occupa la coda del campo, e su telefono restavano tre
 * parole e mezza), e un campo fermo somiglia a una ricerca qualunque — nessuno
 * capiva di poter chiedere. Le domande di partenza sono corte, vere e già
 * tradotte: farle scrivere una alla volta risolve il taglio e dice cosa si può
 * chiedere, senza aggiungere una riga di testo alla pagina.
 *
 * Si ferma da sé quando l'ospite scrive (il placeholder non si vede più) e
 * quando il sistema chiede meno animazioni (prefers-reduced-motion): in quel
 * caso resta la prima domanda, ferma.
 */
function usePlaceholderVivo(frasi: string[], attivo: boolean, fermo: string): string {
  const chiave = frasi.join("|");
  const [testo, setTesto] = useState(fermo);

  useEffect(() => {
    const lista = chiave ? chiave.split("|") : [];
    if (!attivo || lista.length === 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setTesto(lista[0]);
      return;
    }
    let i = 0, n = 0, cancella = false;
    let timer = window.setTimeout(function passo() {
      const f = lista[i % lista.length];
      n += cancella ? -1 : 1;
      setTesto(f.slice(0, Math.max(0, n)));
      let attesa = cancella ? 18 : 38;
      if (!cancella && n >= f.length) { cancella = true; attesa = 2600; }
      else if (cancella && n <= 0) { cancella = false; i++; attesa = 260; }
      timer = window.setTimeout(passo, attesa);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [chiave, attivo]);

  // Quando l'ospite comincia a scrivere il ciclo si ferma: si torna alla frase
  // ferma, così se cancella tutto non resta mezza parola nel campo.
  useEffect(() => {
    if (!attivo) setTesto(fermo);
  }, [attivo, fermo]);

  return testo;
}

export default function BuyerConcierge({
  context,
}: {
  // Quando il widget vive su una scheda immobile, il contesto dice al CRM QUALE
  // casa l'utente sta guardando: "questa casa" nelle domande smette di essere
  // ambiguo (era il bug: "quanto pagherei di imposte su questa casa?" riceveva
  // la richiesta generica di prezzo e dati). slug → dossier immobile nel prompt.
  // `city` non viaggia mai al CRM: serve solo qui, per disambiguare la ricerca su
  // Google Maps quando il bot cita la via senza ripetere il comune.
  context?: { slug: string; title: string; city?: string };
} = {}) {
  const t = useTranslations("concierge");
  const tl = useTranslations("conciergeLettera");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [sid, setSid] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [passaggio, setPassaggio] = useState(false);
  const [consegnato, setConsegnato] = useState(false);
  /** La lettera aperta a mano, prima che le risposte finiscano (non si salva). */
  const [aMano, setAMano] = useState(false);
  const [bar, setBar] = useState("");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(false);
  // La lettera. I dati personali NON vanno nel sessionStorage: stanno qui e basta.
  const [nota, setNota] = useState("");
  const [intento, setIntento] = useState<"" | "buyer" | "valutazione">("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [letteraInvio, setLetteraInvio] = useState(false);
  const [letteraErrore, setLetteraErrore] = useState(false);
  const [errori, setErrori] = useState<LetteraErrors>({ name: false, contact: false, consent: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const letteraRef = useRef<HTMLFormElement>(null);
  const ultimaRef = useRef<HTMLDivElement>(null);

  const letteraAperta = !blocked && !consegnato && (passaggio || aMano);
  const fermo = blocked || passaggio || consegnato || aMano;

  // Idratazione solo al mount (sessionStorage non esiste sul server).
  useEffect(() => {
    const s = loadStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- idratazione client da sessionStorage
    setSid(s.sid);
    setMsgs(s.msgs);
    setBlocked(s.blocked);
    setPassaggio(s.passaggio);
    setConsegnato(s.consegnato);
  }, []);

  // Lo scorrimento: in fondo, tranne quando si apre la lettera dopo una
  // risposta — allora all'INIZIO di quella risposta, che si legge dall'alto; la
  // lettera viene dopo. In fondo l'ultima risposta finirebbe fuori vista.
  useEffect(() => {
    const el = scrollRef.current;
    if (!open || !el) return;
    const u = ultimaRef.current;
    if (letteraAperta && u && msgs[msgs.length - 1]?.role === "assistant") el.scrollTop = Math.max(0, u.offsetTop - 12);
    else el.scrollTop = el.scrollHeight;
  }, [open, msgs, typing, letteraAperta]);

  useEffect(() => {
    if (!open) return;
    if (letteraAperta) letteraRef.current?.focus({ preventScroll: true });
    else if (!fermo) inputRef.current?.focus();
  }, [open, fermo, letteraAperta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing || fermo || !sid) return;
    setError(false);
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(history);
    saveStored({ sid, msgs: history, blocked, passaggio, consegnato });
    setTyping(true);
    try {
      const res = await fetch("/api/concierge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid,
          // I testi di servizio (il grazie della lettera) non sono turni del bot.
          messages: history.filter((m) => !m.servizio).map(({ role, content, sig }) => ({ role, content, sig })),
          locale,
          origin: window.location.pathname,
          ...(context ? { slug: context.slug } : {}),
        }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        text?: string;
        blocked?: boolean;
        sig?: string;
        gate?: boolean;
      };
      if (!res.ok || !d.ok) {
        setError(true);
        return;
      }
      // `gate`: il bridge non risponde più (le risposte libere sono finite, o il
      // conto qui era indietro). Il suo testo chiedeva i dati per continuare:
      // non si mostra, si apre la lettera.
      const next: Msg[] = d.gate || !d.text ? history : [...history, { role: "assistant", content: d.text, sig: d.sig }];
      const isBlocked = d.blocked === true;
      const isPassaggio = d.gate === true || risposteDate(next) >= RISPOSTE_LIBERE;
      setMsgs(next);
      setBlocked(isBlocked);
      setPassaggio(isPassaggio);
      saveStored({ sid, msgs: next, blocked: isBlocked, passaggio: isPassaggio, consegnato });
    } catch {
      setError(true);
    } finally {
      setTyping(false);
    }
  };

  // Altri pezzi della pagina (es. il percorso "Your route") possono aprire il
  // Concierge senza conoscerlo: window event, con eventuale domanda di apertura.
  // Se il concierge non risponde più, la domanda diventa l'inizio della lettera.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (typeof q !== "string" || !q.trim()) return;
      if (fermo && !blocked && !consegnato) {
        setNota((n) => (n.includes(q.trim()) ? n : n.trim() ? `${n.trim()}\n${q.trim()}` : q.trim()));
        return;
      }
      void send(q);
    };
    window.addEventListener("tsv:concierge", onOpen);
    return () => window.removeEventListener("tsv:concierge", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, msgs, blocked, typing, passaggio, consegnato, aMano]);

  const domandeFatte = msgs.filter((m) => m.role === "user").map((m) => m.content);

  const inviaLettera = async () => {
    const n = nome.trim();
    const em = email.trim();
    const tel = telefono.trim();
    const nextErrori: LetteraErrors = {
      name: n.replace(/[^\p{L}]/gu, "").length < 2,
      contact: !(RE_EMAIL.test(em) || tel.replace(/\D/g, "").length >= 6),
      consent: !consenso,
    };
    setErrori(nextErrori);
    if (nextErrori.name || nextErrori.contact || nextErrori.consent || letteraInvio || !sid) return;
    setLetteraErrore(false);
    setLetteraInvio(true);
    try {
      const res = await fetch("/api/concierge/lettera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid,
          locale,
          origin: window.location.pathname,
          domande: domandeFatte,
          nota: nota.trim(),
          ...(intento ? { intento } : {}),
          identita: { nome: n, email: RE_EMAIL.test(em) ? em : "", telefono: tel, consenso: true },
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || d.ok !== true) {
        setLetteraErrore(true);
        return;
      }
      // generate_lead quando la lettera al team è arrivata (09/10/2026): dal
      // CRM ne nasce un lead (modulo «chat»), quindi è una richiesta vera.
      track("generate_lead", { form: "concierge_lettera" });
      const next: Msg[] = [...msgs, { role: "assistant", content: tl("grazie", { nome: n.split(/\s+/)[0] }), servizio: true }];
      setMsgs(next);
      setConsegnato(true);
      setPassaggio(true);
      setAMano(false);
      saveStored({ sid, msgs: next, blocked, passaggio: true, consegnato: true });
    } catch {
      setLetteraErrore(true);
    } finally {
      setLetteraInvio(false);
    }
  };

  const ricomincia = () => {
    const s = { sid: freshSid(), msgs: [] as Msg[], blocked: false, passaggio: false, consegnato: false };
    setSid(s.sid);
    setMsgs([]);
    setBlocked(false);
    setPassaggio(false);
    setConsegnato(false);
    setAMano(false);
    setNota("");
    setError(false);
    setLetteraErrore(false);
    saveStored(s);
  };

  const openWith = (q?: string) => {
    setOpen(true);
    if (q && q.trim()) {
      setBar("");
      void send(q);
    }
  };

  // Sulla scheda immobile la CTA si allarga: questa casa, altre case, il
  // processo d'acquisto. Altrove restano i testi del Buyer Hub.
  const starters = t.raw(context ? "listingStarters" : "starters") as string[];
  const barPlaceholder = context ? t("listingPlaceholder") : t("barPlaceholder");
  const barHint = context ? t("listingHint") : t("barHint");
  // Esempi CORTI, scritti apposta per il campo: i suggerimenti del pannello
  // (`starters`) sono domande intere e nel campo verrebbero tagliate a metà —
  // che è il difetto da cui è nata questa riscrittura.
  // L'array arriva nuovo a ogni render (t.raw lo ricrea): il ciclo NON si
  // riavvia perché l'effetto dentro l'hook dipende dalle frasi unite in
  // stringa, non dall'identità dell'array.
  const esempi = (t.raw(context ? "listingExamples" : "barExamples") as string[]) ?? [];
  const placeholderVivo = usePlaceholderVivo(esempi, !bar && !open, esempi[0] ?? barPlaceholder);
  const emptyLine = context ? t("listingEmpty", { title: context.title }) : t("empty");
  const campo =
    "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-sand/60";

  // I segni delle domande e la loro frase.
  const date = risposteDate(msgs);
  const conto = passaggio || consegnato
    ? tl("contoFinito")
    : date === 0 ? tl("conto", { n: RISPOSTE_LIBERE }) : tl("contoRestano", { n: Math.max(RISPOSTE_LIBERE - date, 0) });

  // WhatsApp ed email già scritti con le domande, per chi non vuole lasciare dati in un modulo.
  const elenco = domandeFatte.slice(-6).map((d) => `- ${d.replace(/\s+/g, " ").slice(0, 200)}`).join("\n");
  const testoContatto = domandeFatte.length ? `${tl("testoContatto")}\n${tl("domandeContatto")}\n${elenco}` : tl("testoContatto");
  const waHref = `https://wa.me/393318940822?text=${encodeURIComponent(testoContatto.slice(0, 1200))}`;
  const mailHref = `mailto:info@triesteimmobiliare.com?subject=${encodeURIComponent(tl("oggettoEmail"))}&body=${encodeURIComponent(testoContatto.slice(0, 1500))}`;

  return (
    <>
      {/* La barra — l'ingresso a zero frizione, e deve FARSI NOTARE: se sembra
          un campo di ricerca qualunque nessuno ci chiede niente. Da qui
          l'anello che gira, l'alone che respira e la domanda che si scrive da
          sola. La pelle (colori, ombre) sta in globals.css: questo componente è
          gemello su TriesteVillas e TriesteImmobiliare, che hanno due temi
          opposti — le classi Tailwind di colore qui dentro renderebbero il box
          bianco su bianco su uno dei due. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openWith(bar);
        }}
        className="ai-bar group mx-auto w-full max-w-2xl"
        data-reveal
      >
        <div className="ai-bar__inner relative flex items-center">
          <SparkIcon className="ai-bar__spark pointer-events-none absolute left-4 h-5 w-5 sm:left-5" />
          <input
            value={bar}
            onChange={(e) => setBar(e.target.value)}
            onFocus={() => {
              if (msgs.length > 0) setOpen(true);
            }}
            maxLength={2000}
            placeholder={placeholderVivo}
            aria-label={barPlaceholder}
            className="ai-bar__input w-full rounded-full bg-transparent py-4 pl-12 pr-16 text-base outline-none sm:pl-14 sm:pr-32"
          />
          <button
            type="submit"
            aria-label={t("barCta")}
            className="ai-bar__cta btn-press absolute right-1.5 flex h-11 items-center justify-center rounded-full px-3.5 text-sm font-semibold sm:right-2 sm:px-5"
          >
            <span className="hidden sm:inline">{t("barCta")}</span>
            {/* Su telefono il testo del bottone mangiava metà campo: resta la freccia. */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:hidden" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </form>
      <p className="ai-bar__hint mx-auto mt-3 max-w-2xl text-center text-xs" data-reveal>
        {barHint}
      </p>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-label={t("title")}
            className="flex h-[92dvh] w-full flex-col overflow-hidden border border-white/12 bg-ink-2/98 shadow-2xl backdrop-blur sm:h-[640px] sm:max-h-[85dvh] sm:w-[520px] sm:rounded-3xl"
          >
            {/* Testata + disclaimer fisso: chi parla, e che è un'AI, si legge SEMPRE. */}
            <div className="border-b border-white/10 px-5 pb-3.5 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SparkIcon className="h-4 w-4 text-sand" />
                  <p className="eyebrow !text-xs">{t("title")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("close")}
                  className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition-colors hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/55">{t("disclaimer")}</p>
            </div>

            {/* Storia */}
            <div ref={scrollRef} className="relative flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
              {msgs.length === 0 && !typing && !letteraAperta && (
                <div className="mt-4">
                  <p className="text-center text-sm text-white/55">{emptyLine}</p>
                  <div className="mt-5 flex flex-col items-stretch gap-2">
                    {starters.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/75 transition-colors hover:border-sand/50 hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} ref={i === msgs.length - 1 ? ultimaRef : undefined} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-sand text-ink"
                        : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85"
                    } ${m.role === "assistant" && i === msgs.length - 1 ? "concierge-svela" : ""}`}
                  >
                    {/* Solo i turni del BOT passano dal renderer: il testo dell'ospite
                        si mostra com'è, senza interpretarne i simboli. */}
                    {m.role === "assistant" ? (
                      <ChatRichText text={m.content} city={context?.city} />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3">
                    <Dot delay="0ms" />
                    <Dot delay="160ms" />
                    <Dot delay="320ms" />
                  </div>
                </div>
              )}
              {error && <p className="text-center text-xs text-red-300">{t("error")}</p>}
              {blocked && (
                <p className="rounded-lg border border-sand/25 bg-sand/5 px-3 py-2 text-center text-xs text-sand">
                  {t("closed")}
                </p>
              )}

              {/* L'invito dopo la penultima risposta: una volta, sotto la risposta. */}
              {!fermo && !typing && risposteDate(msgs) === RISPOSTE_LIBERE - 1 && msgs[msgs.length - 1]?.role === "assistant" && (
                <div className="rounded-xl border border-dashed border-sand/35 px-4 py-3 text-xs leading-relaxed text-white/55">
                  <p>{tl("invito")}</p>
                  <button
                    type="button"
                    onClick={() => setAMano(true)}
                    className="btn-press mt-2 rounded-full border border-sand/60 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sand/10"
                  >
                    {tl("scrivi")}
                  </button>
                </div>
              )}

              {/* LA LETTERA AL TEAM — carta chiara nella notte del pannello. */}
              {letteraAperta && (
                <form
                  ref={letteraRef}
                  tabIndex={-1}
                  aria-labelledby="concierge-lettera-titolo"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void inviaLettera();
                  }}
                  noValidate
                  className="concierge-lettera rounded-2xl border border-sand/35 bg-gradient-to-b from-sand/[0.09] to-white/[0.03] p-4 outline-none"
                >
                  <p className="eyebrow !text-[11px] !text-sand">✉ {tl("occhiello")}</p>
                  <p id="concierge-lettera-titolo" className="mt-1.5 font-display text-lg leading-snug text-white">{tl("titolo")}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/55">{domandeFatte.length ? tl("intro") : tl("introSubito")}</p>

                  {domandeFatte.length > 0 && (
                    <div className="mt-3 rounded-r-lg border-l-2 border-sand bg-black/15 px-3 py-2">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sand">{tl("domande")}</p>
                      <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-xs leading-relaxed text-white/85">
                        {domandeFatte.slice(-6).map((d, i) => <li key={i}>{d}</li>)}
                      </ol>
                    </div>
                  )}

                  <label className="mt-3 block">
                    <span className="mb-1 block text-[11px] font-medium text-white/55">{tl("nota")}</span>
                    <textarea
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      rows={3}
                      maxLength={1500}
                      placeholder={context ? tl("notaSegnapostoScheda") : tl("notaSegnaposto")}
                      className={`${campo} resize-y`}
                    />
                  </label>

                  <fieldset className="mt-2.5 flex flex-wrap items-center gap-2">
                    <legend className="float-left mr-1 text-[11px] font-medium text-white/55">{tl("intento")}</legend>
                    {(["buyer", "valutazione"] as const).map((v) => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="concierge-intento" value={v} checked={intento === v} onChange={() => setIntento(v)} className="peer sr-only" />
                        <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 px-3 text-xs text-white/85 transition-colors peer-checked:border-sand peer-checked:bg-sand/15 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-sand">
                          {v === "buyer" ? tl("intentoCompro") : tl("intentoHo")}
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-medium text-white/55">{tl("nome")}</span>
                      <input
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value);
                          setErrori((c) => ({ ...c, name: false }));
                        }}
                        autoComplete="name"
                        maxLength={80}
                        aria-invalid={errori.name}
                        className={campo}
                      />
                      {errori.name && <span className="mt-1 block text-[11px] text-red-300">{tl("errNome")}</span>}
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-medium text-white/55">{tl("email")}</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrori((c) => ({ ...c, contact: false }));
                        }}
                        autoComplete="email"
                        inputMode="email"
                        maxLength={160}
                        aria-invalid={errori.contact}
                        className={campo}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-medium text-white/55">{tl("telefono")}</span>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => {
                          setTelefono(e.target.value);
                          setErrori((c) => ({ ...c, contact: false }));
                        }}
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={40}
                        aria-invalid={errori.contact}
                        className={campo}
                      />
                    </label>
                  </div>
                  <p className={`mt-1.5 text-[11px] ${errori.contact ? "text-red-300" : "text-white/55"}`}>
                    {errori.contact ? tl("errRecapito") : tl("unoDeiDue")}
                  </p>

                  <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/55">
                    <input
                      type="checkbox"
                      checked={consenso}
                      onChange={(e) => {
                        setConsenso(e.target.checked);
                        setErrori((c) => ({ ...c, consent: false }));
                      }}
                      aria-invalid={errori.consent}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#cfb795]"
                    />
                    <span>
                      {tl("consensoPre")}
                      <Link href="/privacy" className="font-medium text-sand underline underline-offset-2 hover:text-white">
                        {tl("consensoLink")}
                      </Link>
                      {tl("consensoDopo")}
                    </span>
                  </label>
                  {errori.consent && <p className="mt-1 text-[11px] text-red-300">{tl("errConsenso")}</p>}
                  <p className="mt-2 text-[11px] leading-relaxed text-white/55">{tl("riservatezza")}</p>

                  {letteraErrore && (
                    <p role="alert" className="mt-2 text-xs text-red-300">{tl("errore")}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="submit"
                      disabled={letteraInvio}
                      className="btn-press rounded-xl bg-sand px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#e0cba8] disabled:opacity-50"
                    >
                      {letteraInvio ? tl("inCorso") : tl("invia")}
                    </button>
                    {!passaggio && (
                      <button type="button" onClick={() => setAMano(false)} className="text-xs font-medium text-white/55 underline underline-offset-2 hover:text-white">
                        {tl("chiudi")}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-white/55">
                    <span>{tl("oppure")}</span>
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-medium text-sand/90 transition-colors hover:text-sand">
                      WhatsApp
                    </a>
                    <a href={mailHref} className="font-medium text-sand/90 transition-colors hover:text-sand">
                      Email
                    </a>
                  </div>
                </form>
              )}

              {consegnato && (
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sand">
                  <SparkIcon className="h-3.5 w-3.5" />
                  <span>{tl("consegnata")}</span>
                  <button type="button" onClick={ricomincia} className="ml-auto normal-case tracking-normal font-medium text-white/55 underline underline-offset-2 hover:text-white">
                    {tl("nuova")}
                  </button>
                </div>
              )}
            </div>

            {/* I segni delle domande che restano al concierge, e la persona sempre a un tap. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 px-5 py-2 text-[11px] text-white/55">
              <span className="inline-flex gap-1.5" aria-hidden="true">
                {Array.from({ length: RISPOSTE_LIBERE }, (_, i) => (
                  <i key={i} className={`h-1.5 w-1.5 rotate-45 border border-sand ${i < Math.min(risposteDate(msgs), RISPOSTE_LIBERE) || passaggio || consegnato ? "bg-sand" : ""}`} />
                ))}
              </span>
              <span>{conto}</span>
              {!letteraAperta && !consegnato && !blocked ? (
                <button type="button" onClick={() => setAMano(true)} className="ml-auto font-medium text-sand/90 underline underline-offset-2 transition-colors hover:text-sand">
                  {tl("scrivi")}
                </button>
              ) : consegnato || blocked ? (
                <span className="ml-auto flex gap-3">
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-medium text-sand/90 transition-colors hover:text-sand">WhatsApp</a>
                  <a href={mailHref} className="font-medium text-sand/90 transition-colors hover:text-sand">Email</a>
                </span>
              ) : null}
            </div>

            {(!fermo || blocked) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = input;
                  setInput("");
                  void send(v);
                }}
                className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={blocked}
                  maxLength={2000}
                  placeholder={blocked ? t("closed") : t("placeholder")}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-sand/60 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={blocked || typing || !input.trim()}
                  aria-label={t("send")}
                  className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-ink transition-colors hover:bg-[#e0cba8] disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sand" style={{ animationDelay: delay }} />;
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}
