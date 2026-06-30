"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import RangeDual from "./RangeDual";
import { useFocusTrap } from "@/lib/useFocusTrap";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Profilo investitore" popup behind the /investimenti CTAs. The off-market
// "portfolio a reddito" is never published — this form profiles the investor so
// the team can tell those stories 1:1. Lands in the unified Airtable LEADS table
// via /api/lead (tipo: "investitore"). Agile: privacy + one contact suffice.

const ZONES = [
  "CENTRO", "SEMICENTRO", "BARCOLA", "MIRAMARE", "COSTIERA",
  "SISTIANA-DUINO", "MUGGIA", "ALTE", "FVG",
] as const;
const ZONE_LABELS: Record<string, string> = {
  CENTRO: "Centro", SEMICENTRO: "Semicentro", BARCOLA: "Barcola",
  MIRAMARE: "Miramare", COSTIERA: "Costiera", "SISTIANA-DUINO": "Sistiana-Duino",
  MUGGIA: "Muggia", ALTE: "Carso", FVG: "FVG",
};
// Canonical Airtable values (must match the API's INVEST_* sets); labels via i18n
// (roiOptions / horizonOptions / purposeOptions), aligned by index.
const ROI = ["Conservativo (basta che tenga)", "≈ 4–5%", "≈ 5–7%", "Massimizzare"] as const;
const ORIZZONTI = [
  "Lungo termine (reddito)", "Medio (3–5 anni)", "Rivendita rapida", "Da valutare",
] as const;
const OBIETTIVI = [
  "Messa a reddito", "Rivalutazione", "Diversificazione", "Uso + reddito",
] as const;

const BUDGET = { min: 100_000, max: 600_000, step: 25_000 };
const fmtEur = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("it-IT")} M€` : `${n / 1000}k €`;

export default function InvestorLeadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("investorForm");
  const locale = useLocale();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([BUDGET.min, BUDGET.max]);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [roi, setRoi] = useState("");
  const [orizzonte, setOrizzonte] = useState("");
  const [obiettivo, setObiettivo] = useState("");
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

  const toggleZone = (z: string) =>
    setZone((cur) => (cur.includes(z) ? cur.filter((x) => x !== z) : [...cur, z]));

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
          tipo: "investitore",
          nome,
          cognome,
          telefono,
          email,
          zone,
          ...(budgetTouched ? { budgetMin: budget[0], budgetMax: budget[1] } : {}),
          roi,
          orizzonte,
          obiettivo,
          messaggio: note,
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
            </div>

            <p className="mt-6 text-sm font-medium text-neutral-700">{t("zones")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button key={z} type="button" onClick={() => toggleZone(z)}
                  aria-pressed={zone.includes(z)} className={chip(zone.includes(z))}>
                  {ZONE_LABELS[z]}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-neutral-700">{t("budget")}</p>
              <RangeDual {...BUDGET} value={budget} maxLabel="600k €"
                format={fmtEur}
                onChange={(v) => { setBudget(v); setBudgetTouched(true); }} />
            </div>

            {chipRow(t("roi"), ROI, roi, setRoi, "roiOptions")}
            {chipRow(t("horizon"), ORIZZONTI, orizzonte, setOrizzonte, "horizonOptions")}
            {chipRow(t("purpose"), OBIETTIVI, obiettivo, setObiettivo, "purposeOptions")}

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
