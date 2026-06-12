"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const MOTIVI = [
  { value: "Richiedere maggiori informazioni", key: "info" },
  { value: "Richiedere più foto", key: "foto" },
  { value: "Richiedere disponibilità", key: "disp" },
  { value: "Altro", key: "altro" },
] as const;

type Status = "idle" | "sending" | "ok" | "error";
type Mode = null | "info" | "amico";

export default function LeadForm({
  rif,
  immobileNome,
  url,
  sito,
  lingua,
}: {
  rif: string;
  immobileNome: string;
  url: string;
  sito: string;
  lingua: string;
}) {
  const t = useTranslations("lead");

  const [mode, setMode] = useState<Mode>(null);
  const [motivo, setMotivo] = useState<string>(MOTIVI[0].value);
  const [messaggio, setMessaggio] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const [emailAmico, setEmailAmico] = useState("");
  const [friendPrivacy, setFriendPrivacy] = useState(false);
  const [friendStatus, setFriendStatus] = useState<Status>("idle");

  const base = { rif, immobileNome, url, sito, lingua };

  async function submit(payload: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, ...payload }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const ok = await submit({ tipo: "info", motivo, messaggio, nome, email, telefono, privacyOk: privacy });
    setStatus(ok ? "ok" : "error");
  }

  async function onSendFriend(e: React.FormEvent) {
    e.preventDefault();
    setFriendStatus("sending");
    const ok = await submit({ tipo: "amico", emailAmico, email, messaggio, privacyOk: friendPrivacy });
    setFriendStatus(ok ? "ok" : "error");
  }

  const field =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand";

  const privacyLabel = (
    <span className="text-neutral-600">
      {t("privacyPre")}{" "}
      <Link href="/privacy" className="text-brand underline underline-offset-2">
        {t("privacyLink")}
      </Link>
    </span>
  );

  return (
    <section id="contatto" className="mt-10 scroll-mt-32 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      {/* Two compact CTAs — reveal the matching form on click. */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("info")}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
            mode === "info"
              ? "bg-brand-dark text-white"
              : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          {t("submit")}
        </button>
        <button
          type="button"
          onClick={() => setMode("amico")}
          className={`rounded-full border border-brand px-5 py-3 text-sm font-semibold transition-colors ${
            mode === "amico" ? "bg-brand text-white" : "text-brand hover:bg-brand hover:text-white"
          }`}
        >
          {t("friendToggle")}
        </button>
      </div>

      {mode === "info" &&
        (status === "ok" ? (
          <p className="mt-4 rounded-lg bg-brand/10 p-4 text-sm text-brand-dark">{t("thanks")}</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-neutral-700">{t("reason")}</span>
              <select className={field} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVI.map((m) => (
                  <option key={m.key} value={m.value}>
                    {t(`motivo.${m.key}`)}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className={`${field} sm:col-span-2`}
              rows={4}
              placeholder={t("messagePlaceholder")}
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
            />
            <input className={field} placeholder={t("name")} value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input className={field} type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={`${field} sm:col-span-2`} placeholder={t("phone")} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
              {privacyLabel}
            </label>
            {status === "error" && <p className="text-sm text-red-600 sm:col-span-2">{t("error")}</p>}
            <button
              type="submit"
              disabled={status === "sending" || !privacy}
              className="w-full btn-press rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:col-span-2"
            >
              {status === "sending" ? t("sending") : t("send")}
            </button>
            <p className="text-center text-xs text-neutral-500 sm:col-span-2">{t("brochureNote")}</p>
          </form>
        ))}

      {mode === "amico" &&
        (friendStatus === "ok" ? (
          <p className="mt-4 rounded-lg bg-brand/10 p-4 text-sm text-brand-dark">{t("friendThanks")}</p>
        ) : (
          <form onSubmit={onSendFriend} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="text-xs text-neutral-500 sm:col-span-2">{t("friendNote")}</p>
            <input className={field} type="email" placeholder={t("friendEmail")} value={emailAmico} onChange={(e) => setEmailAmico(e.target.value)} required />
            <input className={field} type="email" placeholder={t("yourEmail")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={friendPrivacy} onChange={(e) => setFriendPrivacy(e.target.checked)} required />
              {privacyLabel}
            </label>
            {friendStatus === "error" && <p className="text-sm text-red-600 sm:col-span-2">{t("error")}</p>}
            <button
              type="submit"
              disabled={friendStatus === "sending" || !friendPrivacy}
              className="w-full btn-press rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:col-span-2"
            >
              {friendStatus === "sending" ? t("sending") : t("friendSend")}
            </button>
          </form>
        ))}
    </section>
  );
}
