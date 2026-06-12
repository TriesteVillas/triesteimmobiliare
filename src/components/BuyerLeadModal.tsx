"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import RangeDual from "./RangeDual";

// Buyer-profile popup behind the three buyer CTAs. Every field except
// privacy + one contact is optional (agile by design); data lands in the
// unified Airtable LEAD_ table via /api/lead (tipo: "buyer").

const ZONES = [
  "CENTRO", "SEMICENTRO", "BARCOLA", "MIRAMARE", "GRIGNANO", "COSTIERA",
  "SISTIANA-DUINO", "PORTOPICCOLO", "MUGGIA", "ALTE", "FVG",
] as const;
const ZONE_LABELS: Record<string, string> = {
  CENTRO: "Centro", SEMICENTRO: "Semicentro", BARCOLA: "Barcola",
  MIRAMARE: "Miramare", GRIGNANO: "Grignano", COSTIERA: "Costiera",
  "SISTIANA-DUINO": "Sistiana-Duino", PORTOPICCOLO: "Portopiccolo",
  MUGGIA: "Muggia", ALTE: "Carso", FVG: "FVG",
};
// Canonical Airtable values; display labels come from i18n.
const SCOPI = ["Abitazione principale", "Investimento / rendita", "Casa vacanze"] as const;
const CONDIZIONI = [
  "Primo ingresso", "Abitabile da subito", "Anche da ristrutturare", "Indifferente",
] as const;

// Mid-market ranges (the flagship site goes up to 3M; here 1.5M+ is the cap).
const BUDGET = { min: 50_000, max: 1_500_000, step: 25_000 };
const MQ = { min: 30, max: 300, step: 10 };

const fmtEur = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("it-IT")} M€` : `${n / 1000}k €`;

export default function BuyerLeadModal({
  open,
  onClose,
  fonteCta,
}: {
  open: boolean;
  onClose: () => void;
  fonteCta: string;
}) {
  const t = useTranslations("buyerForm");
  const locale = useLocale();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState<string[]>([]);
  const [budget, setBudget] = useState<[number, number]>([BUDGET.min, BUDGET.max]);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [mq, setMq] = useState<[number, number]>([MQ.min, MQ.max]);
  const [mqTouched, setMqTouched] = useState(false);
  const [scopo, setScopo] = useState("");
  const [condizioni, setCondizioni] = useState("");
  const [privacyOk, setPrivacyOk] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

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

  // The CTAs live inside transformed ancestors (Magnetic, parallax scenes),
  // which would hijack position:fixed — render the overlay in a body portal.
  if (!open || typeof document === "undefined") return null;

  const toggleZone = (z: string) =>
    setZone((cur) => (cur.includes(z) ? cur.filter((x) => x !== z) : [...cur, z]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "buyer",
          fonteCta,
          nome,
          cognome,
          telefono,
          email,
          zone,
          ...(budgetTouched ? { budgetMin: budget[0], budgetMax: budget[1] } : {}),
          ...(mqTouched ? { mqMin: mq[0], mqMax: mq[1] } : {}),
          scopo,
          condizioni,
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

  return createPortal(
    <div
      className="lightbox-enter fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      {/* The panel scrolls internally: with items-end, letting the wrapper
          scroll makes anything taller than the viewport unreachable at the
          top on mobile. dvh tracks the real visible height under mobile
          browser bars; extra bottom padding covers the iOS home indicator. */}
      <div
        className="buyer-panel relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-h-[92dvh] sm:rounded-[2rem] sm:p-8"
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
            <p className="eyebrow">{fonteCta}</p>
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

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">{t("budget")}</p>
                <RangeDual {...BUDGET} value={budget} maxLabel="3 M€ +"
                  format={fmtEur}
                  onChange={(v) => { setBudget(v); setBudgetTouched(true); }} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">{t("size")}</p>
                <RangeDual {...MQ} value={mq} maxLabel="300+ mq"
                  format={(n) => `${n} mq`}
                  onChange={(v) => { setMq(v); setMqTouched(true); }} />
              </div>
            </div>

            <p className="mt-6 text-sm font-medium text-neutral-700">{t("purpose")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SCOPI.map((s, i) => (
                <button key={s} type="button" onClick={() => setScopo(scopo === s ? "" : s)}
                  aria-pressed={scopo === s} className={chip(scopo === s)}>
                  {t(`purposeOptions.${i}`)}
                </button>
              ))}
            </div>

            <p className="mt-5 text-sm font-medium text-neutral-700">{t("condition")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONDIZIONI.map((c, i) => (
                <button key={c} type="button"
                  onClick={() => setCondizioni(condizioni === c ? "" : c)}
                  aria-pressed={condizioni === c} className={chip(condizioni === c)}>
                  {t(`conditionOptions.${i}`)}
                </button>
              ))}
            </div>

            <label className="mt-6 flex items-start gap-2.5 text-xs text-neutral-500">
              <input type="checkbox" checked={privacyOk}
                onChange={(e) => setPrivacyOk(e.target.checked)}
                className="mt-0.5 accent-brand" required />
              <span>{t("privacy")}</span>
            </label>

            {state === "error" && (
              <p className="mt-3 text-sm text-red-600">{t("error")}</p>
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
