"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BUDGET_BANDS, bandLabel, type BudgetBand } from "@/lib/private/bands";
import { CITY_LIST_ID, citySuggestions } from "@/lib/private/cities";
import { introIsRich } from "@/lib/private/intro";

// Credential-request form for the Private Collection. Posts to
// /api/private/request, which creates a tagged LEAD_ + a PC_RICHIESTE row.
const ZONES = [
  "CENTRO", "SEMICENTRO", "COSTIERA", "BARCOLA", "BARCOLA-MIRAMARE",
  "ALTE", "MUGGIA", "SISTIANA-DUINO", "FVG",
] as const;

export default function RequestForm({ triggerId }: { triggerId: string }) {
  const t = useTranslations("pc");
  const tz = useTranslations("zones");
  const locale = useLocale();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [citta, setCitta] = useState("");
  const [intro, setIntro] = useState("");
  const [zone, setZone] = useState<string[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [err, setErr] = useState("");

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/private/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, cognome, email, telefono, citta, intro,
          zone, bands, immobileTrigger: triggerId, privacyOk, lingua: locale,
        }),
      });
      if (res.ok) { setState("ok"); return; }
      // Il `required` del browser copre il campo vuoto, non un valore di una sola
      // lettera che il server rifiuta: senza questo ramo l'utente leggeva
      // "qualcosa è andato storto" e non aveva modo di capire cosa correggere.
      const why = await res.json().catch(() => ({}));
      setErr(why?.error === "city_required" ? t("err_city") : t("error"));
      setState("error");
    } catch {
      setErr(t("error"));
      setState("error");
    }
  };

  if (state === "ok") {
    return (
      <div className="pc-card px-6 py-12 text-center">
        <p className="pc-title text-3xl text-[#a9c8e0]">✓</p>
        <h2 className="mt-4 text-xl font-semibold text-[#dfe9f3]">{t("okTitle")}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#aebcc9]">{t("okText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="pc-card p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={INPUT} placeholder={t("firstName")} value={nome}
          onChange={(e) => setNome(e.target.value)} autoComplete="given-name" required />
        <input className={INPUT} placeholder={t("lastName")} value={cognome}
          onChange={(e) => setCognome(e.target.value)} autoComplete="family-name" required />
        <input className={INPUT} placeholder={t("email")} value={email} type="email"
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <input className={INPUT} placeholder={t("phone")} value={telefono} type="tel"
          onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" required />
        {/* Città di residenza: campo LIBERO con suggerimenti. La datalist aiuta a
            digitare e riduce la spazzatura ("qui", "-"), ma non chiude la scelta:
            chi vive fuori dall'elenco scrive e passa. `address-level2` fa proporre
            al browser la città che l'utente ha già salvato — l'autocompletamento
            più affidabile che ci sia, senza API né consensi. Occupa entrambe le
            colonne perché la domanda è più lunga delle altre etichette. */}
        <input className={`${INPUT} sm:col-span-2`} placeholder={t("city")} value={citta}
          onChange={(e) => setCitta(e.target.value)} autoComplete="address-level2"
          list={CITY_LIST_ID} required minLength={2} />
        <datalist id={CITY_LIST_ID}>
          {citySuggestions(locale).map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      <textarea className={`${INPUT} mt-3 resize-none`} rows={3} placeholder={t("intro")}
        value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={500} />
      {/* L'incentivo sta SOTTO il campo, non dentro come placeholder: un placeholder
          sparisce appena si inizia a scrivere, cioè nel momento esatto in cui la
          promessa dovrebbe restare visibile. Superata la soglia il testo conferma
          che il bonus è acquisito — vedi lib/private/intro.ts per la soglia. */}
      <p className={`mt-1.5 text-xs ${introIsRich(intro) ? "text-[#a9c8e0]" : "text-[#7c8b99]"}`}>
        {introIsRich(intro) ? t("introBonusOk") : t("introBonus")}
      </p>

      <p className="mt-6 text-sm font-medium text-[#c3d0dd]">{t("zonesLabel")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ZONES.map((z) => (
          <button key={z} type="button" onClick={() => toggle(zone, setZone, z)}
            aria-pressed={zone.includes(z)} className={CHIP(zone.includes(z))}>
            {tz(z)}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm font-medium text-[#c3d0dd]">{t("budgetLabel")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {BUDGET_BANDS.map((b) => (
          <button key={b} type="button" onClick={() => toggle(bands, setBands, b)}
            aria-pressed={bands.includes(b)} className={CHIP(bands.includes(b))}>
            {bandLabel(b as BudgetBand)}
          </button>
        ))}
      </div>

      <label className="mt-7 flex items-start gap-2.5 text-xs text-[#93a1ae]">
        <input type="checkbox" checked={privacyOk} required
          onChange={(e) => setPrivacyOk(e.target.checked)} className="mt-0.5 accent-[#a9c8e0]" />
        <span>{t("privacy")}</span>
      </label>

      {state === "error" && <p className="mt-3 text-sm text-red-300">{err || t("error")}</p>}

      <button type="submit" disabled={state === "sending"} className="pc-btn mt-6 w-full">
        {state === "sending" ? t("sending") : t("requestCta")}
      </button>
      <p className="mt-4 text-center text-xs text-[#6d7c8a]">{t("reviewNote")}</p>
    </form>
  );
}

const INPUT =
  "w-full rounded-xl border border-[#a9c8e0]/20 bg-white/[0.03] px-4 py-2.5 text-sm text-[#dfe9f3] placeholder:text-[#6d7c8a] outline-none transition-colors focus:border-[#a9c8e0]/60 focus:bg-white/[0.05]";

const CHIP = (active: boolean): string =>
  `btn-press rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-[#a9c8e0] text-black"
      : "border border-[#a9c8e0]/25 text-[#c3d0dd] hover:border-[#a9c8e0] hover:text-[#a9c8e0]"
  }`;
