"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const SLOTS = ["Qualsiasi", "9-12", "12-14", "14-17", "17-20"] as const;
const LOCALES: Record<string, string> = { it: "it-IT", en: "en-GB", de: "de-DE" };

type DayOpt = { iso: string; wd: string; day: number; mon: string };
type Status = "idle" | "sending" | "ok" | "error";

export default function VisitForm({
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
  const loc = LOCALES[lingua] ?? "it-IT";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [days, setDays] = useState<DayOpt[]>([]);
  const [selDays, setSelDays] = useState<string[]>([]); // iso or "asap"
  const [selSlots, setSelSlots] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  // Build the next 15 days on the client (avoids SSR/CSR time mismatch).
  useEffect(() => {
    const base = new Date();
    const arr: DayOpt[] = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      arr.push({
        iso,
        wd: d.toLocaleDateString(loc, { weekday: "short" }),
        day: d.getDate(),
        mon: d.toLocaleDateString(loc, { month: "short" }),
      });
    }
    setDays(arr);
  }, [loc]);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const dayLabel = (iso: string) => {
    if (iso === "asap") return t("visitAsap");
    const d = days.find((x) => x.iso === iso);
    return d ? `${d.wd} ${d.day} ${d.mon}` : iso;
  };

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const dateStr = selDays.map((d) => (d === "asap" ? "Prima possibile" : d)).join(", ");
    const slotStr = selSlots.length ? selSlots.join(", ") : "Qualsiasi";
    const disponibilita = `Disponibilità: ${dateStr || "—"}\nFasce orarie: ${slotStr}`;
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "visita",
          motivo: "Richiedere disponibilità",
          messaggio: "Visita di persona",
          disponibilita,
          nome,
          email,
          telefono,
          privacyOk: privacy,
          rif,
          immobileNome,
          url,
          sito,
          lingua,
        }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand";
  const chip = (active: boolean) =>
    `shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
      active ? "border-brand bg-brand text-white" : "border-neutral-300 text-neutral-700 hover:border-brand"
    }`;

  return (
    <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("visitTitle")}</h2>
          {!open && <p className="mt-0.5 text-sm text-neutral-500">{t("visitSubtitle")}</p>}
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            {t("visitCta")}
          </button>
        )}
      </div>

      {open && status === "ok" && (
        <p className="mt-4 rounded-lg bg-brand/10 p-4 text-sm text-brand-dark">{t("visitThanks")}</p>
      )}

      {open && status !== "ok" && step === 1 && (
        <div className="mt-4 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">{t("visitHow")}</p>
            <span className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
              {t("visitInPerson")}
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">{t("visitAvail")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setSelDays((s) => toggle(s, "asap"))} className={chip(selDays.includes("asap"))}>
                {t("visitAsap")}
              </button>
              {days.map((d) => (
                <button key={d.iso} type="button" onClick={() => setSelDays((s) => toggle(s, d.iso))} className={chip(selDays.includes(d.iso))}>
                  <span className="block text-center leading-tight">
                    <span className="block text-xs capitalize">{d.wd}</span>
                    <span className="block text-base font-semibold">{d.day}</span>
                    <span className="block text-xs capitalize">{d.mon}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">{t("visitSlots")}</p>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setSelSlots((cur) => (s === "Qualsiasi" ? (cur.includes("Qualsiasi") ? [] : ["Qualsiasi"]) : toggle(cur.filter((x) => x !== "Qualsiasi"), s)))
                  }
                  className={chip(selSlots.includes(s))}
                >
                  {s === "Qualsiasi" ? t("slotAny") : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-brand/5 p-3 text-sm text-neutral-600">
            <span aria-hidden>ℹ️</span>
            <span>{t("visitDisclaimer")}</span>
          </div>

          <button
            type="button"
            disabled={selDays.length === 0}
            onClick={() => setStep(2)}
            className="w-full btn-press rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {t("visitNext")}
          </button>
        </div>
      )}

      {open && status !== "ok" && step === 2 && (
        <form onSubmit={onSend} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 sm:col-span-2">
            <p><span className="font-medium text-neutral-800">{t("visitRecapDates")}:</span> {selDays.map(dayLabel).join(", ") || "—"}</p>
            <p className="mt-0.5"><span className="font-medium text-neutral-800">{t("visitRecapSlots")}:</span> {selSlots.length ? selSlots.map((s) => (s === "Qualsiasi" ? t("slotAny") : s)).join(", ") : t("slotAny")}</p>
          </div>
          <input className={field} placeholder={t("name")} value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input className={field} type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={`${field} sm:col-span-2`} placeholder={t("phone")} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
            <span className="text-neutral-600">
              {t("privacyPre")}{" "}
              <Link href="/privacy" className="text-brand underline underline-offset-2">{t("privacyLink")}</Link>
            </span>
          </label>
          {status === "error" && <p className="text-sm text-red-600 sm:col-span-2">{t("error")}</p>}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-neutral-500 hover:text-neutral-800">
              ← {t("visitBack")}
            </button>
            <button
              type="submit"
              disabled={status === "sending" || !privacy}
              className="flex-1 btn-press rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {status === "sending" ? t("sending") : t("visitSend")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
