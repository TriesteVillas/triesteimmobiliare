"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Password entry for the Private Collection. Posts the credential to
// /api/private/access; on success the httpOnly cookie is set and we go to the
// (now authorized) area. Auto-submits when arriving via an email link
// (?c=CODE prefilled). `compact` renders just a small "already have access"
// box (used under the request form); `successHref` overrides where to land.
export default function AccessGate({
  prefill,
  expired,
  compact = false,
  successHref,
}: {
  prefill: string;
  expired: boolean;
  compact?: boolean;
  successHref?: string;
}) {
  const t = useTranslations("pc");
  const [code, setCode] = useState(prefill);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [err, setErr] = useState("");
  const autoTried = useRef(false);

  const run = async (value: string) => {
    setState("sending");
    setErr("");
    try {
      const res = await fetch("/api/private/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      if (res.ok) {
        window.location.assign(successHref ?? window.location.pathname);
        return;
      }
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(errLabel(t, d.error));
      setState("error");
    } catch {
      setErr(errLabel(t));
      setState("error");
    }
  };

  useEffect(() => {
    if (prefill && !autoTried.current) {
      autoTried.current = true;
      run(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) run(code.trim());
  };

  const formEl = (
    <form onSubmit={submit} className="pc-card mt-6 p-6">
      <input
        className="w-full rounded-xl border border-[#a9c8e0]/25 bg-white/[0.03] px-4 py-3 text-center text-lg tracking-[0.3em] text-[#dfe9f3] placeholder:tracking-normal placeholder:text-[#6d7c8a] outline-none focus:border-[#a9c8e0]/60"
        placeholder={t("codePlaceholder")}
        value={code}
        autoFocus={!compact}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      {err && <p className="mt-3 text-center text-sm text-red-300">{err}</p>}
      <button type="submit" disabled={state === "sending"} className="pc-btn mt-4 w-full">
        {state === "sending" ? t("checking") : t("enter")}
      </button>
    </form>
  );

  if (compact) {
    return (
      <div className="mx-auto max-w-md">
        <p className="pc-eyebrow text-center">{t("haveCredentials")}</p>
        {formEl}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="text-center">
        {/* Il wordmark del brand, non la dicitura generica: qui header e footer non
            ci sono, e questa riga e' l'unica cosa che dice all'ospite dove si trova. */}
        <p className="pc-eyebrow">{t("brandWordmark")}</p>
        <h1 className="pc-title mt-3 text-3xl">{t("gateTitle")}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-[#aebcc9]">{t("gateIntro")}</p>
      </header>

      {expired && (
        <p className="mt-6 rounded-lg border border-[#a9c8e0]/25 bg-[#a9c8e0]/5 px-4 py-3 text-center text-sm text-[#a9c8e0]">
          {t("expiredNote")}
        </p>
      )}

      {formEl}

      {/* Novità pollici: spiegata QUI nel login (richiesta esplicita), così chi
          entra sa subito cosa può fare dentro. Niente Concierge AI su questo
          brand: il bridge TSI non ha il segreto, risponderebbe 503. */}
      <p className="mt-6 rounded-xl border border-[#a9c8e0]/20 bg-[#a9c8e0]/5 px-4 py-3 text-center text-sm leading-relaxed text-[#a9c8e0]">
        {t("newsThumbs")}
      </p>

      <p className="mt-6 text-center text-sm text-[#93a1ae]">
        {t("noAccess")}{" "}
        <Link href="/private/richiedi" className="text-[#a9c8e0] underline-offset-2 hover:underline">
          {t("requestCta")}
        </Link>
      </p>
    </div>
  );
}

function errLabel(t: (k: string) => string, code?: string): string {
  switch (code) {
    case "expired":
      return t("err_expired");
    case "review":
      return t("err_review");
    case "rate":
      return t("err_rate");
    case "not_configured":
      return t("err_config");
    default:
      return t("err_invalid");
  }
}
