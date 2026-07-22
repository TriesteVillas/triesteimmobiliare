"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { subscribe, getSnapshot, getServerSnapshot, setVote } from "./favstore";

// Mi piace / non mi piace con motivazione sulla scheda immobile pubblica —
// stesso spirito del VoteWidget della Private Collection, ma legato all'account
// (lo stato vive in WEB_PREFERITI, idratato via favstore, non in localStorage).
// Da anonimi i pollici mostrano l'invito a creare l'account: il voto è un
// segnale di profilo e senza identità non insegna niente al motore.
//
// Palette NEUTRA (grigi) di proposito: vive nella zona "paper" chiara della
// scheda e il file si copia identico sull'altro brand.
export default function AccountVote({ slug }: { slug: string }) {
  const t = useTranslations("account");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const vote = s.votes[slug] ?? null;
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [thanks, setThanks] = useState(false);
  const [anonPrompt, setAnonPrompt] = useState(false);

  const choose = (v: "up" | "down") => {
    if (!s.authed) {
      setAnonPrompt(true);
      return;
    }
    if (vote === v) {
      setNoteOpen(false);
      setThanks(false);
      setVote(slug, null);
      return;
    }
    setThanks(false);
    setNote("");
    setNoteOpen(true);
    setVote(slug, v);
  };

  const sendNote = () => {
    if (!vote) return;
    const text = note.trim();
    if (text) setVote(slug, vote, text);
    setNoteOpen(false);
    setNote("");
    setThanks(true);
  };

  const btn = (v: "up" | "down") => {
    const active = vote === v;
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={t(v === "up" ? "voteUp" : "voteDown")}
        title={t(v === "up" ? "voteUp" : "voteDown")}
        onClick={() => choose(v)}
        className={`btn-press flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          active
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900"
        }`}
      >
        <ThumbIcon down={v === "down"} className="h-4 w-4" />
      </button>
    );
  };

  return (
    <div className="mt-8 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-sm text-neutral-600">{t("voteHint")}</p>
        <div className="flex items-center gap-2">
          {btn("up")}
          {btn("down")}
        </div>
        {noteOpen && (
          <div className="flex w-full max-w-md items-center gap-2">
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
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900"
            />
            <button
              type="button"
              onClick={sendNote}
              className="btn-press shrink-0 rounded-lg border border-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              {t("voteSend")}
            </button>
          </div>
        )}
        {thanks && <p className="text-xs text-emerald-600">{t("voteThanks")}</p>}
        {anonPrompt && (
          <p className="w-full text-xs text-neutral-600">
            {t("voteAnon")}{" "}
            <Link href="/account" className="font-semibold text-neutral-900 underline underline-offset-2">
              {t("anonSavedCta")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function ThumbIcon({ down, className }: { down?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={down ? { transform: "rotate(180deg)" } : undefined}
      aria-hidden="true"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
