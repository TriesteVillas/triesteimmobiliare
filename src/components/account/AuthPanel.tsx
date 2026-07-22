"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getLocalFavs, clearLocalFavs, refreshMe } from "./favstore";

// Pannello accesso/registrazione dell'area clienti (modello OwnerAuth, ridotto
// all'osso: meno opzioni possibile). Google in testa quando configurato; sotto,
// email+password. Le due checkbox GDPR sono FACOLTATIVE e non pre-spuntate —
// requisito del Garante: il consenso non si bundla con la registrazione.
export default function AuthPanel({ ssoEnabled }: { ssoEnabled: boolean }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consMarketing, setConsMarketing] = useState(false);
  const [consProfilazione, setConsProfilazione] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/account/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; mail?: boolean };
        setInfo(data.mail === false ? t("resetNoMail") : t("resetSent"));
        return;
      }
      const favs = getLocalFavs();
      const payload =
        mode === "login"
          ? { email, password, favs }
          : { nome, email, password, telefono, lingua: locale, consMarketing, consProfilazione, favs };
      const res = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        const code = data.error ?? "error";
        setError(
          code === "exists"
            ? t("errExists")
            : code === "invalid"
              ? t("errInvalid")
              : code === "password"
                ? t("errPassword")
                : code === "email"
                  ? t("errEmail")
                  : code === "name"
                    ? t("errName")
                    : code === "rate"
                      ? t("errRate")
                      : code === "blocked"
                        ? t("errBlocked")
                        : t("errGeneric"),
        );
        return;
      }
      clearLocalFavs();
      refreshMe();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand";

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex gap-2 rounded-full border border-neutral-200 bg-neutral-100 p-1 text-sm">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
              setInfo("");
            }}
            className={`flex-1 rounded-full px-4 py-2 font-medium transition-colors ${
              mode === m || (mode === "forgot" && m === "login")
                ? "bg-brand text-white"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {t(m === "login" ? "tabLogin" : "tabRegister")}
          </button>
        ))}
      </div>

      {ssoEnabled && mode !== "forgot" && (
        <>
          <a
            href="/api/account/google/start"
            className="btn-press flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90"
          >
            <GoogleIcon className="h-4.5 w-4.5" />
            {t("google")}
          </a>
          <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-100" />
            {t("orEmail")}
            <span className="h-px flex-1 bg-neutral-100" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("phName")} autoComplete="name" required minLength={2} className={input} />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={t("phPhone")} autoComplete="tel" inputMode="tel" className={input} />
          </>
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("phEmail")} autoComplete="email" required className={input} />
        {mode !== "forgot" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("phPassword")}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : 1}
            className={input}
          />
        )}

        {mode === "register" && (
          <div className="space-y-2.5 pt-1">
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
              <input type="checkbox" checked={consMarketing} onChange={(e) => setConsMarketing(e.target.checked)} className="mt-0.5 accent-[#2c6b96]" />
              {t("consMarketing")}
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
              <input type="checkbox" checked={consProfilazione} onChange={(e) => setConsProfilazione(e.target.checked)} className="mt-0.5 accent-[#2c6b96]" />
              {t("consProfilazione")}
            </label>
            <p className="text-[11px] leading-relaxed text-neutral-400">{t("privacyNote")}</p>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        {info && <p className="text-xs text-emerald-600">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-press w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : t(mode === "login" ? "ctaLogin" : mode === "register" ? "ctaRegister" : "ctaReset")}
        </button>
      </form>

      {mode === "login" && (
        <button type="button" onClick={() => setMode("forgot")} className="mt-3 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700">
          {t("forgot")}
        </button>
      )}
      {mode === "forgot" && (
        <button type="button" onClick={() => setMode("login")} className="mt-3 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700">
          {t("backToLogin")}
        </button>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.56-5.18 3.56-8.86z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  );
}
