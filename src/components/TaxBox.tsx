"use client";

import { useState } from "react";
import TaxInfo from "./TaxInfo";

type Pop = {
  title: string;
  body: string[];
  criteria?: string | null;
  criteriaLabel?: string;
  link?: { href: string; label: string };
};

export type TaxBoxData = {
  // Pre-formatted strings (locale-aware, already prefixed with ≈ where numeric).
  primaImposta: string | null; // registration tax / VAT as first home
  secondaImposta: string | null; // as second home
  commission: string | null; // TSV fee, net
  condo: string | null; // annual condo (ordinary only)
  ilia: string | null; // second-home ILIA estimate; null when no cadastral income
  // Estimated net floor area (calpestabile ≈ 80% of the commercial sqm) used as
  // the legal TARI base; null hides the (interactive) TARI card.
  mqCalp: number | null;
};

export type TaxBoxLabels = {
  title: string;
  groupAcquisto: string;
  groupGestione: string;
  primaCasa: string;
  secondaCasa: string;
  firstHome: string;
  secondHome: string;
  commission: string;
  plusVat: string;
  condo: string;
  ilia: string;
  tari: string;
  iliaEsente: string;
  perYear: string;
  occupants: string;
  footnote: string;
  infoAria: string;
  acquistoPop: Pop;
  condoPop: Pop;
  iliaPop: Pop;
  tariPop: Pop;
};

// Official Comune di Trieste 2026 household TARI tariffs (Delibera Consiliare
// n.18/2026, Tabella 9). Index 0 = 1 occupant … 5 = "6+". Verified first-hand.
const TARI_FIXED = [0.9, 1.06, 1.18, 1.28, 1.39, 1.46]; // €/sqm/yr
const TARI_VAR = [56.92, 132.82, 170.76, 208.71, 275.12, 322.55]; // €/yr
const TARI_TEFA = 1.04; // provincial surcharge TEFA 4% (FVG)

const LOCALE_TAG: Record<string, string> = { it: "it-IT", en: "en-GB", de: "de-DE" };

// Tax & costs box with a "prima casa / seconda casa" toggle (default prima
// casa). The toggle swaps the acquisition tax (first- vs second-home) and the
// ILIA line (first home = exempt). The TSV fee, condo and TARI do not depend on
// residency, so they stay constant. The TARI card is interactive: a household
// selector (2→6+) recomputes the estimate live from the official tariffs.
export default function TaxBox({
  data,
  labels,
  locale,
}: {
  data: TaxBoxData;
  labels: TaxBoxLabels;
  locale: string;
}) {
  const [mode, setMode] = useState<"prima" | "seconda">("prima");

  const imposta = mode === "prima" ? data.primaImposta : data.secondaImposta;
  const impostaLabel = mode === "prima" ? labels.firstHome : labels.secondHome;

  const seg = (active: boolean) =>
    `rounded-full px-3 py-1 transition-colors ${
      active ? "bg-brand text-white shadow-sm" : "text-neutral-500 hover:text-neutral-800"
    }`;

  const Info = (pop: Pop) => (
    <TaxInfo
      ariaLabel={labels.infoAria}
      title={pop.title}
      body={pop.body}
      criteria={pop.criteria}
      criteriaLabel={pop.criteriaLabel}
      link={pop.link}
    />
  );

  const Card = ({
    label,
    value,
    suffix,
    info,
    children,
  }: {
    label: string;
    value: string;
    suffix?: string;
    info?: Pop;
    children?: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
        {info && Info(info)}
      </div>
      <p className="mt-1 text-lg font-semibold text-neutral-900">
        {value}
        {suffix && <span className="ml-1 text-xs font-normal text-neutral-400">{suffix}</span>}
      </p>
      {children}
    </div>
  );

  const hasOwnership = data.condo || data.ilia || data.mqCalp != null;

  return (
    <section className="mt-8" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{labels.title}</h2>
        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-medium">
          <button type="button" onClick={() => setMode("prima")} className={seg(mode === "prima")} aria-pressed={mode === "prima"}>
            {labels.primaCasa}
          </button>
          <button type="button" onClick={() => setMode("seconda")} className={seg(mode === "seconda")} aria-pressed={mode === "seconda"}>
            {labels.secondaCasa}
          </button>
        </div>
      </div>

      {(imposta || data.commission) && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{labels.groupAcquisto}</h3>
            {Info(labels.acquistoPop)}
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {imposta && <Card label={impostaLabel} value={imposta} />}
            {data.commission && <Card label={labels.commission} value={data.commission} suffix={labels.plusVat} />}
          </div>
        </div>
      )}

      {hasOwnership && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{labels.groupGestione}</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {data.condo && <Card label={labels.condo} value={data.condo} suffix={labels.perYear} info={labels.condoPop} />}
            {data.ilia &&
              (mode === "prima" ? (
                <Card label={labels.ilia} value={labels.iliaEsente} info={labels.iliaPop} />
              ) : (
                <Card label={labels.ilia} value={data.ilia} suffix={labels.perYear} info={labels.iliaPop} />
              ))}
            {data.mqCalp != null && <TariCard mqCalp={data.mqCalp} labels={labels} locale={locale} info={labels.tariPop} />}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{labels.footnote}</p>
        </div>
      )}
    </section>
  );
}

// TARI card with a live household-size selector (2 → 6+, default 2).
function TariCard({
  mqCalp,
  labels,
  locale,
  info,
}: {
  mqCalp: number;
  labels: TaxBoxLabels;
  locale: string;
  info: Pop;
}) {
  const [n, setN] = useState(2);
  const idx = n - 1;
  const value = Math.round((mqCalp * TARI_FIXED[idx] + TARI_VAR[idx]) * TARI_TEFA);
  const fmt = new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

  const step = (d: number) => setN((x) => Math.min(6, Math.max(2, x + d)));
  const btn =
    "flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-xs uppercase tracking-wide text-neutral-400">{labels.tari}</p>
        {Boolean(info) && (
          <TaxInfo
            ariaLabel={labels.infoAria}
            title={info.title}
            body={info.body}
            link={info.link}
          />
        )}
      </div>
      <p className="mt-1 text-lg font-semibold text-neutral-900">
        ≈ {fmt}
        <span className="ml-1 text-xs font-normal text-neutral-400">{labels.perYear}</span>
      </p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500">
        <span>{labels.occupants}</span>
        <div className="inline-flex items-center gap-2">
          <button type="button" className={btn} onClick={() => step(-1)} disabled={n <= 2} aria-label="−">
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold text-neutral-800">{n >= 6 ? "6+" : n}</span>
          <button type="button" className={btn} onClick={() => step(1)} disabled={n >= 6} aria-label="+">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
