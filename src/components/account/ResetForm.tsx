"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

// Conferma del reset password: nuovo valore + token dal link email.
export default function ResetForm({ token }: { token: string }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) return <p className="text-sm text-neutral-500">{t("resetNoToken")}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error === "token" ? t("resetBadToken") : data.error === "password" ? t("errPassword") : t("errGeneric"));
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/account"), 1200);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="text-sm text-emerald-600">{t("resetDone")}</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("phNewPassword")}
        autoComplete="new-password"
        required
        minLength={8}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-press w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "…" : t("ctaSetPassword")}
      </button>
    </form>
  );
}
