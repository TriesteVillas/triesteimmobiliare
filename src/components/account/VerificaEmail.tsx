"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// L'avviso in testa a /account finché l'email non è verificata (09/10/2026):
// cosa aspettiamo, perché le visite non ci sono ancora, e un link nuovo a un
// tocco. Il link lo firma e lo spedisce /api/account/verify ({resend:true}).
export default function VerificaEmail({ email }: { email: string }) {
  const t = useTranslations("accountVerifica");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resend: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; mail?: boolean; gia?: boolean; error?: string };
      if (data.ok && data.gia) {
        window.location.reload();
        return;
      }
      if (data.ok) setMsg({ ok: data.mail !== false, text: data.mail === false ? t("bannerNoMail") : t("bannerSent") });
      else setMsg({ ok: false, text: data.error === "rate" ? t("bannerRate") : t("errGeneric") });
    } catch {
      setMsg({ ok: false, text: t("errGeneric") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section role="status" className="mt-8 rounded-2xl border border-brand/30 bg-brand/5 px-5 py-4">
      <h2 className="text-sm font-semibold text-neutral-900">{t("bannerTitle")}</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-600">{t("bannerBody", { email })}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="btn-press rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {busy ? "…" : t("bannerResend")}
        </button>
        {msg && <p className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </section>
  );
}
