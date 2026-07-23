"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { subscribe, getSnapshot, getServerSnapshot, toggleFav, toggleAlert } from "./favstore";

// Il corredo di ogni preferito nell'area riservata: appunti privati, avviso di
// prezzo, condivisione, rimozione. Avvolge la PropertyCard (server-rendered)
// così "rimuovi" può nascondere l'intero blocco senza ricaricare la pagina.
export default function FavExtras({
  slug,
  title,
  url,
  initialNota,
  children,
}: {
  slug: string;
  title: string;
  url: string; // URL assoluto della scheda, già localizzato
  initialNota: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("account");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [removed, setRemoved] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [nota, setNota] = useState(initialNota);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const alertOn = s.alerts.has(slug);

  if (removed) return null;

  const saveNota = async () => {
    setSaved(false);
    try {
      const res = await fetch("/api/account/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, nota }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      /* best-effort */
    }
  };

  const share = async () => {
    const data = { title, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      /* annullato: si passa alla copia */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
    }
  };

  const remove = () => {
    if (s.favs.has(slug)) toggleFav(slug);
    setRemoved(true);
  };

  const chip =
    "btn-press inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:border-brand hover:text-brand";

  return (
    <div>
      {children}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 px-1">
        <button type="button" onClick={() => setNoteOpen((v) => !v)} className={chip} aria-expanded={noteOpen}>
          <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          {nota.trim() ? t("notesEdit") : t("notesAdd")}
        </button>
        <button
          type="button"
          onClick={() => toggleAlert(slug)}
          aria-pressed={alertOn}
          className={`${chip} ${alertOn ? "border-amber-500/70 !text-amber-600" : ""}`}
        >
          <Icon d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          {alertOn ? t("alertOnShort") : t("alertCta")}
        </button>
        <button type="button" onClick={share} className={chip}>
          <Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
          {copied ? t("shareCopied") : t("share")}
        </button>
        <button type="button" onClick={remove} className={`${chip} hover:border-red-500/60 hover:!text-red-600`}>
          <Icon d="M18 6 6 18M6 6l12 12" />
          {t("removeFav")}
        </button>
      </div>
      {noteOpen && (
        <div className="mt-2 px-1">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t("notesPh")}
            className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand"
          />
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={saveNota}
              className="btn-press rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("notesSave")}
            </button>
            {saved && <span className="text-xs text-emerald-600">{t("savedOk")}</span>}
            <span className="text-[11px] text-neutral-400">{t("notesPrivacy")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
