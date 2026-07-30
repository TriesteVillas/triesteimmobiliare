"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ChatRichText from "./ChatRichText";

// Concierge AI pubblico del Buyer Hub — la barra "semplice quanto Google" che
// apre una conversazione vera. Stessa filosofia del Concierge Private
// Collection: il widget è stupido di proposito, tutta l'intelligenza (prompt,
// tool su articoli e immobili, guardrail, registro conversazioni) vive nel CRM
// dietro /api/concierge/chat. Qui: UI, storia locale, gate identità, stato
// blocked.
//
// Differenze deliberate rispetto al widget PC:
//  - il gate identità compare solo quando lo chiede il CRM;
//  - l'ingresso è una search bar, non un bottone flottante — la domanda scritta
//    lì diventa il primo turno della conversazione;
//  - su "blocked" non c'è nessun logout da eseguire: si chiude la sessione di
//    chat e basta (l'input resta disabilitato finché vive il sessionStorage);
//  - il sid è generato qui e serve a: bucket rate-limit, firma dei turni,
//    id sessione nel registro CRM. Ruotarlo non compra nulla (vedi proxy).

type Msg = { role: "user" | "assistant"; content: string; sig?: string };
type Stored = {
  sid: string;
  msgs: Msg[];
  blocked: boolean;
  gate: boolean;
  identificato: boolean;
  gateMessages: Msg[] | null;
};
type GateErrors = { name: boolean; contact: boolean; consent: boolean };

const STORAGE_KEY = "tsi_web_chat";

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
        const identificato = d.identificato === true;
        // Senza i messaggi esatti da rimandare il gate sarebbe una porta murata: si autoripara chiudendosi.
        const gate = d.gate === true && !identificato && Array.isArray(d.gateMessages);
        return {
          sid: d.sid,
          msgs: Array.isArray(d.msgs) ? (d.msgs as Msg[]) : [],
          blocked: d.blocked === true,
          gate,
          identificato,
          gateMessages: gate ? (d.gateMessages as Msg[]) : null,
        };
      }
    }
  } catch {
    /* storage bloccato: chat effimera */
  }
  return {
    sid: freshSid(),
    msgs: [],
    blocked: false,
    gate: false,
    identificato: false,
    gateMessages: null,
  };
}

function saveStored(s: Stored): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* best-effort */
  }
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
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [sid, setSid] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [gate, setGate] = useState(false);
  const [identificato, setIdentificato] = useState(false);
  const [gateMessages, setGateMessages] = useState<Msg[] | null>(null);
  const [bar, setBar] = useState("");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(false);
  const [gateName, setGateName] = useState("");
  const [gateEmail, setGateEmail] = useState("");
  const [gatePhone, setGatePhone] = useState("");
  const [gateConsent, setGateConsent] = useState(false);
  const [gateSending, setGateSending] = useState(false);
  const [gateFailed, setGateFailed] = useState(false);
  const [gateErrors, setGateErrors] = useState<GateErrors>({
    name: false,
    contact: false,
    consent: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Idratazione solo al mount (sessionStorage non esiste sul server).
  useEffect(() => {
    const s = loadStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- idratazione client da sessionStorage
    setSid(s.sid);
    setMsgs(s.msgs);
    setBlocked(s.blocked);
    setGate(s.gate);
    setIdentificato(s.identificato);
    setGateMessages(s.gateMessages);
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, msgs, typing, gate]);

  useEffect(() => {
    if (open && !blocked && !gate) inputRef.current?.focus();
  }, [open, blocked, gate]);

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
    if (!q || typing || blocked || gate || !sid) return;
    setError(false);
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(history);
    saveStored({ sid, msgs: history, blocked, gate, identificato, gateMessages });
    setTyping(true);
    try {
      const res = await fetch("/api/concierge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid,
          messages: history,
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
        identificato?: boolean;
      };
      if (!res.ok || !d.ok) {
        setError(true);
        return;
      }
      const next: Msg[] = d.text ? [...history, { role: "assistant", content: d.text, sig: d.sig }] : history;
      const isBlocked = d.blocked === true;
      const isIdentificato = identificato || d.identificato === true;
      const isGate = d.gate === true && !isIdentificato;
      const nextGateMessages = isGate ? history : null;
      setMsgs(next);
      setBlocked(isBlocked);
      setGate(isGate);
      setIdentificato(isIdentificato);
      setGateMessages(nextGateMessages);
      saveStored({
        sid,
        msgs: next,
        blocked: isBlocked,
        gate: isGate,
        identificato: isIdentificato,
        gateMessages: nextGateMessages,
      });
    } catch {
      setError(true);
    } finally {
      setTyping(false);
    }
  };

  // Altri pezzi della pagina (es. il percorso "Your route") possono aprire il
  // Concierge senza conoscerlo: window event, con eventuale domanda di apertura.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (typeof q === "string" && q.trim()) void send(q);
    };
    window.addEventListener("tsv:concierge", onOpen);
    return () => window.removeEventListener("tsv:concierge", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, msgs, blocked, typing, gate, identificato, gateMessages]);

  const submitGate = async () => {
    const nome = gateName.trim();
    const email = gateEmail.trim();
    const telefono = gatePhone.trim();
    const nextErrors: GateErrors = {
      name: nome.length < 2,
      contact: !email && !telefono,
      consent: !gateConsent,
    };
    setGateErrors(nextErrors);
    if (nextErrors.name || nextErrors.contact || nextErrors.consent) return;
    if (!gateMessages || gateSending || !sid) {
      setGateFailed(true);
      return;
    }

    setGateFailed(false);
    setGateSending(true);
    try {
      const res = await fetch("/api/concierge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid,
          messages: gateMessages,
          locale,
          origin: window.location.pathname,
          ...(context ? { slug: context.slug } : {}),
          identita: { nome, email, telefono, consenso: true },
        }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        text?: string;
        blocked?: boolean;
        sig?: string;
        gate?: boolean;
        identificato?: boolean;
      };
      if (!res.ok || !d.ok || d.gate === true || d.identificato !== true || !d.text) {
        setGateFailed(true);
        return;
      }

      const next: Msg[] = [...msgs, { role: "assistant", content: d.text, sig: d.sig }];
      const isBlocked = d.blocked === true;
      setMsgs(next);
      setBlocked(isBlocked);
      setGate(false);
      setIdentificato(true);
      setGateMessages(null);
      saveStored({
        sid,
        msgs: next,
        blocked: isBlocked,
        gate: false,
        identificato: true,
        gateMessages: null,
      });
    } catch {
      setGateFailed(true);
    } finally {
      setGateSending(false);
    }
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
  const emptyLine = context ? t("listingEmpty", { title: context.title }) : t("empty");
  const gateField =
    "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-sand/60";

  return (
    <>
      {/* La barra — l'ingresso a zero frizione. Il placeholder È l'invito. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openWith(bar);
        }}
        className="group relative mx-auto flex w-full max-w-2xl items-center"
        data-reveal
      >
        <SparkIcon className="pointer-events-none absolute left-5 h-5 w-5 text-sand/80" />
        <input
          value={bar}
          onChange={(e) => setBar(e.target.value)}
          onFocus={() => {
            if (msgs.length > 0) setOpen(true);
          }}
          maxLength={2000}
          placeholder={barPlaceholder}
          aria-label={barPlaceholder}
          className="w-full rounded-full border border-white/15 bg-white/[0.05] py-4 pl-13 pr-32 text-base text-white placeholder:text-white/40 shadow-[0_18px_50px_-20px_rgba(207,183,149,0.25)] outline-none backdrop-blur transition-colors focus:border-sand/60 sm:pl-14"
        />
        <button
          type="submit"
          className="btn-press absolute right-2 rounded-full bg-sand px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#e0cba8]"
        >
          {t("barCta")}
        </button>
      </form>
      <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-white/40" data-reveal>
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
                  className="btn-press flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/45">{t("disclaimer")}</p>
            </div>

            {/* Storia */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {msgs.length === 0 && !typing && (
                <div className="mt-4">
                  <p className="text-center text-sm text-white/45">{emptyLine}</p>
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
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-sand text-ink"
                        : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85"
                    }`}
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
              {gate && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitGate();
                  }}
                  noValidate
                  className="rounded-xl border border-white/15 bg-white/[0.04] p-3.5"
                >
                  <p className="text-sm font-semibold text-white">{t("gateTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{t("gateIntro")}</p>

                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-medium text-white/65">{t("gateName")}</span>
                      <input
                        value={gateName}
                        onChange={(e) => {
                          setGateName(e.target.value);
                          setGateErrors((current) => ({ ...current, name: false }));
                        }}
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={120}
                        aria-invalid={gateErrors.name}
                        className={gateField}
                      />
                      {gateErrors.name && (
                        <span className="mt-1 block text-[11px] text-red-300">{t("gateErrName")}</span>
                      )}
                    </label>

                    <label>
                      <span className="mb-1 block text-[11px] font-medium text-white/65">{t("gateEmail")}</span>
                      <input
                        type="email"
                        value={gateEmail}
                        onChange={(e) => {
                          setGateEmail(e.target.value);
                          setGateErrors((current) => ({ ...current, contact: false }));
                        }}
                        autoComplete="email"
                        maxLength={320}
                        aria-invalid={gateErrors.contact}
                        className={gateField}
                      />
                    </label>

                    <label>
                      <span className="mb-1 block text-[11px] font-medium text-white/65">{t("gatePhone")}</span>
                      <input
                        type="tel"
                        value={gatePhone}
                        onChange={(e) => {
                          setGatePhone(e.target.value);
                          setGateErrors((current) => ({ ...current, contact: false }));
                        }}
                        autoComplete="tel"
                        maxLength={50}
                        aria-invalid={gateErrors.contact}
                        className={gateField}
                      />
                    </label>
                  </div>
                  <p className={`mt-1.5 text-[11px] ${gateErrors.contact ? "text-red-300" : "text-white/40"}`}>
                    {gateErrors.contact ? t("gateErrContact") : t("gateEitherHint")}
                  </p>

                  <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/60">
                    <input
                      type="checkbox"
                      checked={gateConsent}
                      onChange={(e) => {
                        setGateConsent(e.target.checked);
                        setGateErrors((current) => ({ ...current, consent: false }));
                      }}
                      required
                      aria-invalid={gateErrors.consent}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#cfb795]"
                    />
                    <span>
                      {t("gateConsentPre")}{" "}
                      <Link href="/privacy" className="font-medium text-sand underline underline-offset-2 hover:text-white">
                        {t("gateConsentLink")}
                      </Link>
                    </span>
                  </label>
                  {gateErrors.consent && (
                    <p className="mt-1 text-[11px] text-red-300">{t("gateErrConsent")}</p>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-white/40">{t("gatePrivacyNote")}</p>

                  {gateFailed && (
                    <p role="alert" className="mt-2 text-xs text-red-300">
                      {t("gateError")}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={gateSending}
                    className="btn-press mt-3 w-full rounded-xl bg-sand px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#e0cba8] disabled:opacity-50"
                  >
                    {gateSending ? t("gateSending") : t("gateSubmit")}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-white/45">
                    {t("gateAccountPre")}{" "}
                    <Link href="/account" className="font-medium text-sand hover:text-white">
                      {t("gateAccountLink")}
                    </Link>
                  </p>
                </form>
              )}
            </div>

            {/* Handoff umano: sempre a un tap, mai nascosto dietro la chat. */}
            <div className="flex items-center justify-center gap-4 border-t border-white/10 px-5 py-2 text-[11px] text-white/40">
              <span>{t("humanLine")}</span>
              <a
                href="https://wa.me/393318940822"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sand/90 transition-colors hover:text-sand"
              >
                WhatsApp
              </a>
              <a href="mailto:info@triesteimmobiliare.com" className="font-medium text-sand/90 transition-colors hover:text-sand">
                Email
              </a>
            </div>

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
                disabled={blocked || gate}
                maxLength={2000}
                placeholder={gate ? t("gatePlaceholder") : blocked ? t("closed") : t("placeholder")}
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-sand/60 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={blocked || gate || typing || !input.trim()}
                aria-label={t("send")}
                className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-ink transition-colors hover:bg-[#e0cba8] disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
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
