"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { subscribe, getSnapshot, getServerSnapshot, toggleFav, toggleAlert, setVote } from "./favstore";

// Il cluster di azioni della scheda immobile, nel hero accanto al prezzo.
// UN solo linguaggio di feedback (prima convivevano il cuore in alto e i
// pollici su/giù in fondo pagina, che si ignoravano a vicenda):
//  - cuore  = "mi interessa, salvala" (il like esplicito non esiste più:
//             un cuore È un like — il motore lo pesa già così);
//  - campana = avviso di prezzo (solo loggati: serve un'email da avvisare);
//  - "non fa per me" = dislike con motivo facoltativo — il segnale negativo
//             che insegna al motore cosa NON proporre. Spegne cuore e campana.
export default function PropertyActions({ slug }: { slug: string }) {
  const t = useTranslations("account");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const fav = s.favs.has(slug);
  const alert = s.alerts.has(slug);
  const down = (s.votes[slug] ?? null) === "down";
  const [prompt, setPrompt] = useState<null | "alert" | "vote">(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [thanks, setThanks] = useState(false);

  const needAuth = (kind: "alert" | "vote") => {
    setPrompt(kind);
    setTimeout(() => setPrompt(null), 9000);
  };

  const onHeart = () => {
    const now = toggleFav(slug);
    if (now && down) setVote(slug, null); // salvarla smentisce il "non fa per me"
  };

  const onBell = () => {
    if (!s.authed) return needAuth("alert");
    toggleAlert(slug);
  };

  const onNotForMe = () => {
    if (!s.authed) return needAuth("vote");
    if (down) {
      setVote(slug, null);
      setNoteOpen(false);
      setThanks(false);
      return;
    }
    setVote(slug, "down");
    if (fav) toggleFav(slug); // scartarla smentisce cuore…
    if (alert) toggleAlert(slug); // …e avviso di prezzo
    setNote("");
    setThanks(false);
    setNoteOpen(true);
  };

  const sendNote = () => {
    const text = note.trim();
    if (text) setVote(slug, "down", text);
    setNoteOpen(false);
    setNote("");
    setThanks(true);
    setTimeout(() => setThanks(false), 5000);
  };

  const pill = (active: boolean, activeCls: string) =>
    `btn-press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active ? activeCls : "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
    }`;

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onHeart} aria-pressed={fav} className={pill(fav, "border-red-400/60 bg-red-500/15 text-red-300")}>
          <HeartIcon filled={fav} className="h-4.5 w-4.5" />
          {fav ? t("saved") : t("save")}
        </button>
        <button type="button" onClick={onBell} aria-pressed={alert} className={pill(alert, "border-amber-300/60 bg-amber-400/15 text-amber-200")}>
          <BellIcon filled={alert} className="h-4.5 w-4.5" />
          {alert ? t("alertOnShort") : t("alertCta")}
        </button>
        <button type="button" onClick={onNotForMe} aria-pressed={down} className={pill(down, "border-white/50 bg-white/15 text-white")}>
          <ThumbDownIcon className="h-4 w-4" />
          {down ? t("notForMeActive") : t("notForMe")}
        </button>
      </div>

      {alert && !noteOpen && (
        <p className="mt-2 text-xs text-white/55">{t("alertActiveHint")}</p>
      )}

      {noteOpen && (
        <div className="mt-3 flex w-full max-w-md items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendNote();
              }
            }}
            maxLength={300}
            placeholder={t("votePlaceholder")}
            className="w-full rounded-lg border border-white/25 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/40 outline-none backdrop-blur transition-colors focus:border-white/60"
          />
          <button
            type="button"
            onClick={sendNote}
            className="btn-press shrink-0 rounded-lg border border-white/40 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white hover:text-neutral-900"
          >
            {t("voteSend")}
          </button>
        </div>
      )}
      {thanks && <p className="mt-2 text-xs text-emerald-300">{t("voteThanks")}</p>}

      {prompt && (
        <div className="absolute left-0 top-full z-[5] mt-2 w-72 rounded-xl border border-white/15 bg-ink/95 p-3 shadow-xl backdrop-blur">
          <p className="text-xs leading-relaxed text-white/80">
            {prompt === "alert" ? t("alertAnon") : t("voteAnon")}
          </p>
          <Link href="/account" className="mt-2 inline-block text-xs font-semibold text-sand underline underline-offset-2">
            {t("anonSavedCta")}
          </Link>
        </div>
      )}
    </div>
  );
}

function HeartIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BellIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ transform: "rotate(180deg)" }} aria-hidden="true">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
