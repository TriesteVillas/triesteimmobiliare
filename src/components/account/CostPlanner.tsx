"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";

// La tabella dei costi dei preferiti: quanto costa DAVVERO entrare in ciascuna
// casa salvata. Prezzo + imposte (scenario prima/seconda casa, dai campi
// stimati a DB — mai matematica inventata qui) + agenzia 4% + IVA 22% +
// il campo libero "lavori/arredo" dell'utente, che entra nell'aritmetica e
// si salva su WEB_PREFERITI.budget_lavori. Tutte le cifre sono ≈ stime.
export type CostRow = {
  slug: string;
  title: string;
  url: string;
  price: number | null;
  impostePrima: number | null;
  imposteSeconda: number | null;
  condoAnnuo: number | null;
  iliaAnnua: number | null;
  lavori: number | null;
};

const LS_MODE = "tsi_costmode";
const FEE_RATE = 0.04;
const VAT = 1.22;

export default function CostPlanner({
  rows,
  initialMode,
}: {
  rows: CostRow[];
  initialMode?: "prima" | "seconda";
}) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [mode, setMode] = useState<"prima" | "seconda">(initialMode ?? "prima");
  const [lavori, setLavori] = useState<Record<string, number | null>>(
    Object.fromEntries(rows.map((r) => [r.slug, r.lavori])),
  );
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Lo scenario scelto sopravvive alla sessione (localStorage), ma il default
  // iniziale arriva dalle preferenze strutturate dell'account.
  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_MODE);
      if (v === "prima" || v === "seconda") setMode(v);
    } catch {
      /* storage bloccato */
    }
  }, []);
  const pickMode = (m: "prima" | "seconda") => {
    setMode(m);
    try {
      localStorage.setItem(LS_MODE, m);
    } catch {
      /* best-effort */
    }
  };

  const setLav = (slug: string, raw: string) => {
    const n = raw.trim() === "" ? null : Math.max(0, Math.min(10_000_000, Math.round(Number(raw) || 0)));
    setLavori((prev) => ({ ...prev, [slug]: n }));
    clearTimeout(timers.current[slug]);
    timers.current[slug] = setTimeout(() => {
      fetch("/api/account/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, budgetLavori: n }),
        keepalive: true,
      }).catch(() => {});
    }, 800);
  };

  const fmt = (n: number | null) => (n == null ? "—" : `≈ ${formatPrice(n, locale)}`);
  const imposta = (r: CostRow) => (mode === "prima" ? r.impostePrima : r.imposteSeconda);
  const fee = (r: CostRow) => (r.price != null ? r.price * FEE_RATE * VAT : null);
  const gestione = (r: CostRow) => {
    const parts = [r.condoAnnuo, mode === "prima" ? null : r.iliaAnnua].filter((x): x is number => x != null);
    return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
  };
  const totale = (r: CostRow) => {
    if (r.price == null) return null;
    return r.price + (imposta(r) ?? 0) + (fee(r) ?? 0) + (lavori[r.slug] ?? 0);
  };
  const grand = rows.reduce((acc, r) => acc + (totale(r) ?? 0), 0);
  const visible = rows.filter((r) => r.price != null);
  if (!visible.length) return null;

  const th = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400 whitespace-nowrap";
  const td = "px-3 py-3 text-sm text-neutral-800 whitespace-nowrap";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t("costModeLabel")}</span>
        {(["prima", "seconda"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickMode(m)}
            aria-pressed={mode === m}
            className={`btn-press rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              mode === m ? "bg-brand text-white" : "border border-neutral-300 text-neutral-600 hover:border-brand hover:text-brand"
            }`}
          >
            {m === "prima" ? t("costPrima") : t("costSeconda")}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className={th}>{t("costColHome")}</th>
              <th className={th}>{t("costColPrice")}</th>
              <th className={th}>{mode === "prima" ? t("costColTaxPrima") : t("costColTaxSeconda")}</th>
              <th className={th}>{t("costColFee")}</th>
              <th className={th}>{t("costColWorks")}</th>
              <th className={`${th} text-right`}>{t("costColTotal")}</th>
              <th className={`${th} text-right`}>{t("costColYearly")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.slug} className="border-b border-neutral-100 last:border-0">
                <td className={`${td} max-w-[220px] overflow-hidden text-ellipsis`}>
                  <a href={r.url} className="font-medium text-neutral-900 underline-offset-2 hover:text-brand hover:underline">
                    {r.title}
                  </a>
                </td>
                <td className={td}>{fmt(r.price)}</td>
                <td className={td}>{fmt(imposta(r))}</td>
                <td className={td}>{fmt(fee(r))}</td>
                <td className={td}>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400">€</span>
                    <input
                      inputMode="numeric"
                      value={lavori[r.slug] ?? ""}
                      onChange={(e) => setLav(r.slug, e.target.value)}
                      placeholder="0"
                      aria-label={t("costColWorks")}
                      className="w-24 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-right text-sm text-neutral-900 outline-none transition-colors focus:border-brand"
                    />
                  </div>
                </td>
                <td className={`${td} text-right font-semibold text-brand-dark`}>{fmt(totale(r))}</td>
                <td className={`${td} text-right text-neutral-500`}>{gestione(r) != null ? `${fmt(gestione(r))}` : "—"}</td>
              </tr>
            ))}
          </tbody>
          {visible.length > 1 && (
            <tfoot>
              <tr className="border-t border-neutral-300">
                <td className={`${td} font-semibold text-neutral-900`}>{t("costTotalRow")}</td>
                <td className={td} colSpan={4} />
                <td className={`${td} text-right text-base font-bold text-brand-dark`}>{fmt(grand)}</td>
                <td className={td} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("costFootnote")}</p>
    </div>
  );
}
