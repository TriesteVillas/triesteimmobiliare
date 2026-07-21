"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

// Pollice su/giù + nota opzionale per gli immobili della Private Collection.
// Filosofia: feedback a costo (quasi) zero per l'utente, segnale prezioso per
// il CRM — ogni click diventa un evento thumb_* in PC_ACCESS_LOG accanto alle
// view. Lo stato è ottimistico e vive in localStorage per slug: niente GET
// dedicato, il server logga solo la timeline (l'ultimo evento vince).
//
// Due varianti:
//  - "detail": sotto i facts della pagina immobile, con il copy di invito;
//  - "card":   overlay nell'angolo della card in griglia. La card è un <Link>,
//    quindi TUTTI i click dentro il widget fanno preventDefault+stopPropagation
//    per non far partire la navigazione.

type Vote = "up" | "down" | null;

const storageKey = (slug: string) => `tsi_pc_vote:${slug}`;

// Mini external-store su localStorage per useSyncExternalStore: snapshot
// server = null (SSR-safe, niente hydration mismatch) e le istanze del widget
// sulla stessa pagina restano in sync tra loro (griglia + eventuale dettaglio).
const listeners = new Set<() => void>();
function readVote(slug: string): Vote {
  try {
    const v = localStorage.getItem(storageKey(slug));
    return v === "up" || v === "down" ? v : null;
  } catch {
    return null; // storage bloccato: si riparte da zero, nessun dramma
  }
}
function writeVote(slug: string, v: Vote): void {
  try {
    if (v) localStorage.setItem(storageKey(slug), v);
    else localStorage.removeItem(storageKey(slug));
  } catch {
    /* best-effort */
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function post(slug: string, vote: Vote, note?: string): void {
  try {
    fetch("/api/private/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, vote, ...(note ? { note } : {}) }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* best-effort: il voto locale resta comunque */
  }
}

export default function VoteWidget({
  slug,
  variant = "detail",
}: {
  slug: string;
  variant?: "detail" | "card";
}) {
  const t = useTranslations("pc");
  const vote = useSyncExternalStore(subscribe, () => readVote(slug), () => null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [thanks, setThanks] = useState(false);

  const choose = (v: Exclude<Vote, null>) => {
    if (vote === v) {
      // Secondo click sullo stesso pollice = ritiro del voto.
      setNoteOpen(false);
      setThanks(false);
      writeVote(slug, null);
      post(slug, null);
      return;
    }
    setThanks(false);
    setNote("");
    setNoteOpen(true);
    writeVote(slug, v);
    // Il voto parte subito (anche se poi la nota non arriva mai);
    // la nota, se inviata, genera un secondo evento con lo stesso pollice.
    post(slug, v);
  };

  const sendNote = () => {
    if (!vote) return;
    const text = note.trim();
    if (text) post(slug, vote, text);
    setNoteOpen(false);
    setNote("");
    setThanks(true);
  };

  // Nella card (dentro un <Link>) nessun click deve navigare.
  const guard =
    variant === "card"
      ? (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }
      : undefined;

  const btn = (v: Exclude<Vote, null>) => {
    const active = vote === v;
    const size = variant === "card" ? "h-7 w-7" : "h-9 w-9";
    return (
      <button
        type="button"
        aria-pressed={active}
        aria-label={t(v === "up" ? "voteUp" : "voteDown")}
        title={t(v === "up" ? "voteUp" : "voteDown")}
        onClick={(e) => {
          guard?.(e);
          choose(v);
        }}
        className={`btn-press flex ${size} items-center justify-center rounded-full border transition-colors ${
          active
            ? "border-[#a9c8e0] bg-[#a9c8e0] text-[#05070c]"
            : "border-[#a9c8e0]/25 text-[#93a1ae] hover:border-[#a9c8e0] hover:text-[#a9c8e0]"
        }`}
      >
        <ThumbIcon down={v === "down"} className={variant === "card" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    );
  };

  const notePanel = noteOpen && (
    <div
      onClick={guard}
      className={
        variant === "card"
          ? "absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-[#a9c8e0]/25 bg-[#05070c]/90 p-2 backdrop-blur"
          : "flex w-full max-w-md items-center gap-2"
      }
    >
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
        className={`w-full rounded-lg border border-[#a9c8e0]/20 bg-white/[0.04] px-3 py-2 text-xs text-[#dfe9f3] placeholder:text-[#6d7c8a] outline-none transition-colors focus:border-[#a9c8e0]/60 ${
          variant === "card" ? "mb-1.5" : ""
        }`}
      />
      <button
        type="button"
        onClick={(e) => {
          guard?.(e);
          sendNote();
        }}
        className={`btn-press rounded-lg border border-[#a9c8e0]/40 px-3 py-1.5 text-xs font-medium text-[#a9c8e0] transition-colors hover:bg-[#a9c8e0] hover:text-[#05070c] ${
          variant === "card" ? "w-full" : "shrink-0"
        }`}
      >
        {t("voteSend")}
      </button>
    </div>
  );

  if (variant === "card") {
    return (
      <div className="relative z-[3] flex items-center gap-1.5" onClick={guard}>
        {notePanel}
        <div className="flex items-center gap-1.5 rounded-full bg-black/45 p-1 backdrop-blur">
          {btn("up")}
          {btn("down")}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#a9c8e0]/15 bg-white/[0.02] px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-sm text-[#93a1ae]">{t("voteHint")}</p>
        <div className="flex items-center gap-2">
          {btn("up")}
          {btn("down")}
        </div>
        {notePanel}
        {thanks && <p className="text-xs text-[#a9c8e0]">{t("voteThanks")}</p>}
      </div>
    </div>
  );
}

// Feather "thumbs-up" (MIT), ruotato per il pollice verso: stroke-only, così
// eredita il colore del bottone e resta coerente col look blu notte della PC.
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
