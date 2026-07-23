"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  PREF_ZONES,
  PREF_BUDGETS,
  PREF_TIPOLOGIE,
  PREF_MUST,
  type CriteriJson,
} from "@/lib/account/prefopts";

// Preferenze dell'account, precompilate dal server (pagina /account, dinamica).
// "Cosa cerchi" non è più un campo di testo alla cieca: zone, budget,
// tipologia, camere e irrinunciabili si CLICCANO — le stesse categorie del
// database case e del CRM. Il testo libero resta solo per le sfumature.
// Salva su /api/account/prefs; la cancellazione chiede conferma esplicita.
export default function PrefsForm(props: {
  nome: string;
  telefono: string;
  criteri: CriteriJson;
  digest: string;
  consMarketing: boolean;
  consProfilazione: boolean;
}) {
  const t = useTranslations("account");
  const tZones = useTranslations("zones");
  const [nome, setNome] = useState(props.nome);
  const [telefono, setTelefono] = useState(props.telefono);
  const [c, setC] = useState<CriteriJson>(props.criteri);
  const [digest, setDigest] = useState(props.digest || "Mai");
  const [consMarketing, setConsMarketing] = useState(props.consMarketing);
  const [consProfilazione, setConsProfilazione] = useState(props.consProfilazione);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleIn = (key: "zones" | "tipologie" | "must", value: string) =>
    setC((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
      };
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/account/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefono, criteriJson: c, digest, consMarketing, consProfilazione }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    await fetch("/api/account/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ del: true }),
    }).catch(() => {});
    window.location.assign("/");
  };

  const input =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand";
  const label = "mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500";
  const chip = (active: boolean) =>
    `btn-press rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-brand bg-brand text-white"
        : "border-neutral-300 text-neutral-600 hover:border-brand hover:text-brand"
    }`;

  const zoneLabel = (z: string) => {
    try {
      return tZones(z);
    } catch {
      return z;
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("phName")} className={input} />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={t("phPhone")} inputMode="tel" className={input} />
      </div>

      <div>
        <span className={label}>{t("prefZones")}</span>
        <div className="flex flex-wrap gap-2">
          {PREF_ZONES.map((z) => (
            <button key={z} type="button" onClick={() => toggleIn("zones", z)} aria-pressed={c.zones.includes(z)} className={chip(c.zones.includes(z))}>
              {zoneLabel(z)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>{t("prefBudget")}</span>
        <div className="flex flex-wrap gap-2">
          {PREF_BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setC((prev) => ({ ...prev, budget: prev.budget === b ? "" : b }))}
              aria-pressed={c.budget === b}
              className={chip(c.budget === b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>{t("prefTipologia")}</span>
        <div className="flex flex-wrap gap-2">
          {PREF_TIPOLOGIE.map((tp) => (
            <button key={tp} type="button" onClick={() => toggleIn("tipologie", tp)} aria-pressed={c.tipologie.includes(tp)} className={chip(c.tipologie.includes(tp))}>
              {t(`tip.${tp}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <span className={label}>{t("prefCamere")}</span>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setC((prev) => ({ ...prev, camereMin: prev.camereMin === n ? null : n }))}
                aria-pressed={c.camereMin === n}
                className={chip(c.camereMin === n)}
              >
                {n}+
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className={label}>{t("prefAcquisto")}</span>
          <div className="flex flex-wrap gap-2">
            {(["prima", "seconda"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setC((prev) => ({ ...prev, acquisto: prev.acquisto === a ? "" : a }))}
                aria-pressed={c.acquisto === a}
                className={chip(c.acquisto === a)}
              >
                {a === "prima" ? t("costPrima") : t("costSeconda")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <span className={label}>{t("prefMust")}</span>
        <div className="flex flex-wrap gap-2">
          {PREF_MUST.map((m) => (
            <button key={m} type="button" onClick={() => toggleIn("must", m)} aria-pressed={c.must.includes(m)} className={chip(c.must.includes(m))}>
              {t(`must.${m.replace(" ", "_")}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>{t("prefNote")}</label>
        <textarea
          value={c.note}
          onChange={(e) => setC((prev) => ({ ...prev, note: e.target.value }))}
          rows={2}
          maxLength={600}
          placeholder={t("criteriPh")}
          className={`${input} resize-y`}
        />
      </div>

      <div>
        <label className={label}>{t("digestLabel")}</label>
        <select value={digest} onChange={(e) => setDigest(e.target.value)} className={input}>
          <option value="Settimanale">{t("digestWeekly")}</option>
          <option value="Mensile">{t("digestMonthly")}</option>
          <option value="Mai">{t("digestNever")}</option>
        </select>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
        <input type="checkbox" checked={consMarketing} onChange={(e) => setConsMarketing(e.target.checked)} className="mt-0.5 accent-[#2c6b96]" />
        {t("consMarketing")}
      </label>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
        <input type="checkbox" checked={consProfilazione} onChange={(e) => setConsProfilazione(e.target.checked)} className="mt-0.5 accent-[#2c6b96]" />
        {t("consProfilazione")}
      </label>
      <div className="flex items-center gap-4 pt-1">
        <button type="submit" disabled={busy} className="btn-press rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
          {busy ? "…" : t("savePrefs")}
        </button>
        {saved && <span className="text-xs text-emerald-600">{t("savedOk")}</span>}
      </div>
      <div className="border-t border-neutral-200 pt-4">
        <button type="button" onClick={del} className="text-xs text-red-600/80 underline underline-offset-2 hover:text-red-600">
          {t("deleteAccount")}
        </button>
      </div>
    </form>
  );
}
