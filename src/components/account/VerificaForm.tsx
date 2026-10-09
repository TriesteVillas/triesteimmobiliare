"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { refreshMe } from "./favstore";

// Il clic sul link di verifica dell'email. Al primo giro prova senza password:
// basta se in questo browser c'è la sessione dell'account. Altrimenti chiede la
// password — il link da solo non verifica (lib/account/verifica.ts).
type Fase = "prova" | "password" | "fatto" | "gia" | "token";

export default function VerificaForm({ token }: { token: string }) {
  const t = useTranslations("accountVerifica");
  const router = useRouter();
  const [fase, setFase] = useState<Fase>(token ? "prova" : "token");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const avviato = useRef(false);

  const invia = async (pw: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pw ? { token, password: pw } : { token }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; gia?: boolean; error?: string };
      if (data.ok) {
        setFase(data.gia ? "gia" : "fatto");
        if (!data.gia) {
          refreshMe();
          setTimeout(() => router.push("/account"), 1200);
        }
        return;
      }
      if (data.error === "token") setFase("token");
      else {
        setFase("password");
        if (data.error === "invalid") setError(t("badPassword"));
        else if (data.error === "rate") setError(t("errRate"));
        else if (data.error !== "password_needed") setError(t("errGeneric"));
      }
    } catch {
      setFase("password");
      setError(t("errGeneric"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token || avviato.current) return;
    avviato.current = true;
    void invia("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (fase === "token") return <p className="text-sm text-neutral-500">{token ? t("badToken") : t("noToken")}</p>;
  if (fase === "prova") return <p className="text-sm text-neutral-500">{t("checking")}</p>;
  if (fase === "fatto") return <p className="text-sm text-emerald-600">{t("done")}</p>;
  if (fase === "gia")
    return (
      <p className="text-sm text-neutral-500">
        {t("already")}{" "}
        <Link href="/account" className="font-medium text-brand-dark underline underline-offset-2">
          {t("goAccount")}
        </Link>
      </p>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void invia(password);
      }}
      className="space-y-3"
    >
      <p className="text-sm leading-relaxed text-neutral-600">{t("needPassword")}</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("phPassword")}
        autoComplete="current-password"
        required
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-press w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "…" : t("cta")}
      </button>
      <p className="text-xs leading-relaxed text-neutral-500">{t("forgot")}</p>
    </form>
  );
}
