"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { clearLocalFavs, getLocalFavs, refreshMe } from "./favstore";

// Lo spazio personale già pronto (09/10/2026): i due moduli di
// /account/benvenuto. Stesso aspetto e stesse regole di AuthPanel — password
// di almeno 8 caratteri, i due consensi FACOLTATIVI e non pre-spuntati, i cuori
// messi da anonimo che vengono con lui — più la casella dell'informativa, che
// qui si spunta: l'account non nasce da un modulo che la persona ha cercato,
// ma da un link nostro, e la presa visione la vogliamo dal suo gesto.
//
// Email e nome non si scrivono: li ha il CRM, e la rotta li rilegge dalla porta
// col gettone (del modulo non si fida). Il nome si chiede solo se il CRM non
// ne ha uno.

const input =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-brand";
const bottone =
  "btn-press w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";

/** L'email dell'invito, a vista e non modificabile. */
function EmailFissa({ email, nota }: { email: string; nota?: string }) {
  const t = useTranslations("account");
  return (
    <div>
      <label className="block">
        <span className="sr-only">{t("phEmail")}</span>
        <input type="email" value={email} readOnly aria-readonly="true" autoComplete="email" className={`${input} bg-neutral-50 text-neutral-600`} />
      </label>
      {nota && <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">{nota}</p>}
    </div>
  );
}

/** Il modulo dello spazio nuovo: password, informativa, consensi. */
export default function BenvenutoForm({ k, email, chiediNome }: { k: string; email: string; chiediNome: boolean }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [consMarketing, setConsMarketing] = useState(false);
  const [consProfilazione, setConsProfilazione] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!privacy) {
      setError(t("benvenuto.errPrivacy"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/benvenuto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          k,
          password,
          privacy,
          consMarketing,
          consProfilazione,
          lingua: locale,
          favs: getLocalFavs(),
          ...(chiediNome ? { nome } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        clearLocalFavs();
        refreshMe();
        setDone(true);
        setTimeout(() => router.push("/account"), 900);
        return;
      }
      const code = data.error ?? "";
      // Il link nel frattempo non vale più, o qualcuno ha appena aperto un
      // account con questa email: la pagina, ricaricata, mostra la strada
      // giusta (le pagine gentili, o l'accesso).
      if (code === "link" || code === "exists") {
        router.refresh();
        return;
      }
      setError(
        code === "password"
          ? t("errPassword")
          : code === "privacy"
            ? t("benvenuto.errPrivacy")
            : code === "name"
              ? t("errName")
              : code === "rate"
                ? t("errRate")
                : code === "porta" || code === "store" || code === "not_configured"
                  ? t("benvenuto.errPorta")
                  : t("errGeneric"),
      );
    } catch {
      setError(t("benvenuto.errPorta"));
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="text-sm text-emerald-600">{t("benvenuto.done")}</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <EmailFissa email={email} nota={t("benvenuto.emailNote")} />
      {chiediNome && (
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("phName")} autoComplete="name" required minLength={2} className={input} />
      )}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("phPassword")}
        autoComplete="new-password"
        required
        minLength={8}
        className={input}
      />

      <div className="space-y-2.5 pt-1">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required className="mt-0.5 accent-[#2c6b96]" />
          <span>
            {t.rich("benvenuto.privacyCheck", {
              link: (chunks) => (
                <Link href="/privacy" target="_blank" className="text-brand underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
          <input type="checkbox" checked={consMarketing} onChange={(e) => setConsMarketing(e.target.checked)} className="mt-0.5 accent-[#2c6b96]" />
          {t("consMarketing")}
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-600">
          <input type="checkbox" checked={consProfilazione} onChange={(e) => setConsProfilazione(e.target.checked)} className="mt-0.5 accent-[#2c6b96]" />
          {t("consProfilazione")}
        </label>
        <p className="text-[11px] leading-relaxed text-neutral-400">{t("benvenuto.consNote")}</p>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button type="submit" disabled={busy} className={bottone}>
        {busy ? "…" : t("benvenuto.cta")}
      </button>
    </form>
  );
}

/** Chi l'account ce l'ha già: si entra con la password, o la si reimposta.
 *  Le rotte sono quelle di sempre (/api/account/login e /reset), coi loro
 *  limiti; a login fatto si ricarica la pagina, che trova la persona dentro,
 *  lo dice al CRM e la porta nello spazio. */
export function BenvenutoAccesso({ email }: { email: string }) {
  const t = useTranslations("account");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const accedi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, favs: getLocalFavs() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        clearLocalFavs();
        refreshMe();
        // Ricarica vera, non router.refresh(): la pagina deve rifare la GET
        // con il cookie nuovo e rispondere col reindirizzamento allo spazio.
        window.location.reload();
        return;
      }
      const code = data.error ?? "";
      setError(
        code === "invalid"
          ? t("errInvalid")
          : code === "rate"
            ? t("errRate")
            : code === "blocked"
              ? t("errBlocked")
              : t("errGeneric"),
      );
    } catch {
      setError(t("errGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const dimenticata = async () => {
    if (busy) return;
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; mail?: boolean; error?: string };
      if (data.error === "rate") setError(t("errRate"));
      else setInfo(data.mail === false ? t("resetNoMail") : t("resetSent"));
    } catch {
      setError(t("errGeneric"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form onSubmit={accedi} className="space-y-3">
        <EmailFissa email={email} />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("phPassword")}
          autoComplete="current-password"
          required
          className={input}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {info && <p className="text-xs text-emerald-600">{info}</p>}
        <button type="submit" disabled={busy} className={bottone}>
          {busy ? "…" : t("ctaLogin")}
        </button>
      </form>
      <button
        type="button"
        onClick={dimenticata}
        disabled={busy}
        className="mt-3 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700 disabled:opacity-50"
      >
        {t("forgot")}
      </button>
    </div>
  );
}
