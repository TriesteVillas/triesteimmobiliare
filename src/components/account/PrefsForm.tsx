"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Preferenze dell'account, precompilate dal server (pagina /account, dinamica).
// Salva su /api/account/prefs; la cancellazione chiede conferma esplicita.
export default function PrefsForm(props: {
  nome: string;
  telefono: string;
  criteri: string;
  digest: string;
  consMarketing: boolean;
  consProfilazione: boolean;
}) {
  const t = useTranslations("account");
  const [nome, setNome] = useState(props.nome);
  const [telefono, setTelefono] = useState(props.telefono);
  const [criteri, setCriteri] = useState(props.criteri);
  const [digest, setDigest] = useState(props.digest || "Mai");
  const [consMarketing, setConsMarketing] = useState(props.consMarketing);
  const [consProfilazione, setConsProfilazione] = useState(props.consProfilazione);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/account/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefono, criteri, digest, consMarketing, consProfilazione }),
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

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("phName")} className={input} />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={t("phPhone")} inputMode="tel" className={input} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
          {t("criteriLabel")}
        </label>
        <textarea
          value={criteri}
          onChange={(e) => setCriteri(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={t("criteriPh")}
          className={`${input} resize-y`}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
          {t("digestLabel")}
        </label>
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
