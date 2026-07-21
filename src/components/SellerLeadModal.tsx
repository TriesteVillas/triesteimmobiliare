"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { CITY_LIST_ID, citySuggestions } from "@/lib/cities";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Richiedi una valutazione riservata" — seller intake popup on /vendi.
// Agile like the buyer form: privacy + one contact suffice; everything
// else is optional. Lands in LEAD_ via /api/lead (tipo: "valutazione").

// Canonical values stored in Airtable; chip labels come from i18n.
const TIPOLOGIE = ["Appartamento", "Attico", "Villa", "Casa con giardino", "Terreno", "Altro"] as const;
const TAGLIE = ["< 80 mq", "80 – 150 mq", "150 – 250 mq", "250+ mq"] as const;
const STATI = ["Ottimo / ristrutturato", "Buono / abitabile", "Da ristrutturare"] as const;
const TEMPI = ["Il prima possibile", "Entro 6 mesi", "Solo esplorativo"] as const;
const HASTOBUY = ["Sì, vendo e ricompro", "No, solo vendita", "Non ancora deciso"] as const;

export default function SellerLeadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("sellerForm");
  const locale = useLocale();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [citta, setCitta] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [tipologia, setTipologia] = useState("");
  const [taglia, setTaglia] = useState("");
  const [stato, setStato] = useState("");
  const [tempi, setTempi] = useState("");
  const [hasToBuy, setHasToBuy] = useState("");
  const [note, setNote] = useState("");
  const [privacyOk, setPrivacyOk] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errKey, setErrKey] = useState<"error" | "errorContact">("error");
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRe.test(email) && telefono.trim().length < 6) {
      setErrKey("errorContact");
      setState("error");
      return;
    }
    setErrKey("error");
    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "valutazione",
          nome,
          cognome,
          telefono,
          citta,
          email,
          indirizzo,
          tipologia,
          taglia,
          statoImmobile: stato,
          tempistiche: tempi,
          messaggio: [note, hasToBuy && `Vendo e ricompro: ${hasToBuy}`]
            .filter(Boolean)
            .join(" · "),
          privacyOk,
          lingua: locale,
        }),
      });
      setState(res.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  };

  const chip = (active: boolean) =>
    `btn-press rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-brand text-white"
        : "border border-neutral-300 text-neutral-600 hover:border-brand hover:text-brand"
    }`;
  const input =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand";

  const chipRow = (
    label: string,
    options: readonly string[],
    value: string,
    set: (v: string) => void,
    i18nKey: string,
  ) => (
    <>
      <p className="mt-5 text-sm font-medium text-neutral-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => set(value === o ? "" : o)}
            aria-pressed={value === o}
            className={chip(value === o)}
          >
            {t(`${i18nKey}.${i}`)}
          </button>
        ))}
      </div>
    </>
  );

  return createPortal(
    <div
      className="lightbox-enter fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="buyer-panel relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:max-h-[92dvh] sm:rounded-[2rem] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xl text-neutral-500 transition-colors hover:bg-neutral-200"
        >
          ×
        </button>

        {state === "ok" ? (
          <div className="py-14 text-center">
            <p className="display-chapter text-brand">✓</p>
            <h2 className="mt-3 text-xl font-semibold text-neutral-900">{t("okTitle")}</h2>
            <p className="mt-2 text-neutral-600">{t("okText")}</p>
            <button
              type="button"
              onClick={onClose}
              className="btn-hero mt-8 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={input} placeholder={t("firstName")} value={nome}
                onChange={(e) => setNome(e.target.value)} autoComplete="given-name" />
              <input className={input} placeholder={t("lastName")} value={cognome}
                onChange={(e) => setCognome(e.target.value)} autoComplete="family-name" />
              <input className={input} placeholder={t("phone")} value={telefono}
                onChange={(e) => setTelefono(e.target.value)} type="tel" autoComplete="tel" />
              <input className={input} placeholder={t("email")} value={email}
                onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
              {/* Città di residenza, FACOLTATIVA: qui non si chiede a nessuno di
                  presentarsi, si raccoglie un contatto — un campo obbligatorio in più
                  su un form di conversione costa richieste. Stessi suggerimenti del
                  form della Private Collection, e il browser propone da sé la città
                  che l'utente ha già salvato. */}
              <input className={`${input} sm:col-span-2`} placeholder={t("city")} value={citta}
                onChange={(e) => setCitta(e.target.value)} autoComplete="address-level2"
                list={CITY_LIST_ID} />
              <datalist id={CITY_LIST_ID}>
                {citySuggestions(locale).map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <p className="mt-5 text-sm font-medium text-neutral-700">{t("address")}</p>
            <input className={`${input} mt-2`} placeholder={t("addressPlaceholder")}
              value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />

            {chipRow(t("type"), TIPOLOGIE, tipologia, setTipologia, "typeOptions")}
            {chipRow(t("size"), TAGLIE, taglia, setTaglia, "sizeOptions")}
            {chipRow(t("condition"), STATI, stato, setStato, "conditionOptions")}
            {chipRow(t("timing"), TEMPI, tempi, setTempi, "timingOptions")}
            {chipRow(t("hasToBuy"), HASTOBUY, hasToBuy, setHasToBuy, "hasToBuyOptions")}

            <p className="mt-5 text-sm font-medium text-neutral-700">{t("notes")}</p>
            <textarea className={`${input} mt-2 min-h-20 resize-y`} value={note}
              placeholder={t("notesPlaceholder")} onChange={(e) => setNote(e.target.value)} />

            <label className="mt-6 flex items-start gap-2.5 text-xs text-neutral-500">
              <input type="checkbox" checked={privacyOk}
                onChange={(e) => setPrivacyOk(e.target.checked)}
                className="mt-0.5 accent-brand" required />
              <span>{t("privacy")}</span>
            </label>

            {state === "error" && (
              <p className="mt-3 text-sm text-red-600">{t(errKey)}</p>
            )}

            <button type="submit" disabled={state === "sending"}
              className="btn-hero mt-6 w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {state === "sending" ? t("sending") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
