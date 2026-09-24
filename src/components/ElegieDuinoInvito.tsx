import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import Scene from "@/components/motion/Scene";
import Tilt from "@/components/motion/Tilt";
import Magnetic from "@/components/motion/Magnetic";
import ElegieDuinoTrack from "@/components/ElegieDuinoTrack";
import type { Property } from "@/lib/properties";
import { elegieHref, type ElegieSito } from "@/lib/elegie";

// Scena-ponte «una delle otto»: compare solo sulle unità con progetto DUINO (era «DUINO RICCESI» fino al 24/09: il cognome non esce più dalla vetrina)
// (decide il page con isElegieProgetto). Palette del sito dedicato via token eld-*
// (globals.css): sage SOLO decorativo (3,4:1 su nero non basta per testo).
// Tutto server-reso: il moto è CSS su --p (Scene, mode cover) + data-reveal; l'unica
// isola client è ElegieDuinoTrack, che rende null. Colori SOLO dai token eld-*
// (il gate check-contrast del prebuild vieta la classe bianca nuda di Tailwind).
const IMG = "/progetti/elegie/";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eld-cream/80 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-eld-ink";

type Base = { property: Property; locale: string; sito: ElegieSito };

/** Chip per la riga badge dell'hero, accanto a «Nuova costruzione». */
export async function ElegieChip({ property, locale, sito }: Base) {
  const t = await getTranslations("elegie");
  return (
    <a
      href={elegieHref(locale, property.id, sito)}
      target="_blank"
      rel="noopener noreferrer"
      data-eld-cta="hero"
      className={`btn-press inline-flex items-center gap-1.5 rounded-full bg-eld-ink/70 py-1 pl-1.5 pr-2.5 text-[11px] font-medium text-eld-cream ring-1 ring-eld-cream/35 backdrop-blur-sm hover:bg-eld-ink/85 hover:ring-eld-cream/70 sm:text-xs ${FOCUS}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${IMG}logo-white-96.png`} alt="" width={96} height={66} className="h-4 w-auto" />
      <span>
        {t("chip")}
        <span className="hidden sm:inline">{t("chipTail")}</span>
      </span>
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> {t("newTab")}</span>
    </a>
  );
}

/** Riga di richiamo dopo le planimetrie dell'unità: tutte le piante sono sul sito. */
export async function ElegiePlansHint({ property, locale, sito }: Base) {
  const t = await getTranslations("elegie");
  return (
    <p className="mt-4 text-sm text-neutral-600">
      {t("plansHint")}{" "}
      <a
        href={elegieHref(locale, property.id, sito, "planimetrie")}
        target="_blank"
        rel="noopener noreferrer"
        data-eld-cta="planimetrie"
        className="rounded-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        elegieduino.it <span aria-hidden="true">↗</span>
        <span className="sr-only"> {t("newTab")}</span>
      </a>
    </p>
  );
}

export default async function ElegieDuinoInvito({
  property, title, locale, sito,
}: Base & { title: string }) {
  const t = await getTranslations("elegie");
  const primary = elegieHref(locale, property.id, sito);
  const secondary = elegieHref(locale, property.id, sito, "capitolato");
  const frames = [t("f1"), t("f2"), t("f3")];
  const bullets = [1, 2, 3, 4].map((n) => ({
    n: String(n).padStart(2, "0"), k: t(`b${n}k`), v: t(`b${n}v`),
  }));
  const dati: [string, string][] = [
    [t("d1k"), t("d1v")], [t("d2k"), t("d2v")], [t("d3k"), t("d3v")], [t("d4k"), t("d4v")],
  ];
  const ext = <span className="sr-only"> {t("newTab")}</span>;

  return (
    <section id="elegie" aria-labelledby="elegie-title" className="-mx-4 mt-10 scroll-mt-32">
      <ElegieDuinoTrack propId={property.id} title={title} locale={locale} sito={sito} />
      <Scene
        mode="cover"
        smooth={0.12}
        className="eld relative overflow-hidden bg-eld-ink text-eld-cream sm:rounded-3xl"
      >
        {/* Layer 0: render al tramonto, più alto del box (corsa del parallasse).
            Sotto 640px NON copre tutta la scena (che è alta ~3 finestre: il crop 4:5
            finiva ingrandito 3× e per due terzi scartato — revisione 10/09): è una
            banda 4:5 in testa, chiusa da una sfumatura verso l'ink; corpo, CTA e
            pannello stanno su fondo pieno, dove il contrasto non dipende dalla foto. */}
        <div className="eld-img pointer-events-none absolute inset-x-0 -inset-y-[8%] max-sm:inset-y-auto max-sm:top-0 max-sm:aspect-[4/5]" aria-hidden="true">
          <picture>
            <source
              media="(max-width: 639px)"
              sizes="100vw"
              srcSet={`${IMG}sunset-m-720.webp 720w, ${IMG}sunset-m-1080.webp 1080w`}
            />
            <img
              src={`${IMG}sunset-1280.webp`}
              srcSet={`${IMG}sunset-768.webp 768w, ${IMG}sunset-1280.webp 1280w, ${IMG}sunset-1920.webp 1920w, ${IMG}sunset-2400.webp 2400w`}
              // Il cover + scale(1.14) rendono l'immagine più larga del box: sizes lo dice.
              sizes="(min-width: 1088px) 1210px, 115vw"
              width={1920}
              height={1071}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover"
              style={{ objectPosition: "62% 58%" }}
            />
          </picture>
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-eld-ink sm:hidden" aria-hidden="true" />
        </div>
        {/* Veli: leggibilità colonna sinistra + base/cielo */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-eld-ink/90 via-eld-ink/55 to-eld-ink/15 max-sm:from-eld-ink/92 max-sm:via-eld-ink/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-eld-ink/85 via-transparent to-eld-ink/25"
          aria-hidden="true"
        />

        <div className="relative grid gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:min-h-[540px] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:px-14 lg:py-16">
          {/* Colonna sinistra */}
          <div data-reveal-stagger>
            {/* wrapper: il reveal scrive transform su di lui, il parallasse sul <img> */}
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}logo-white.png`}
                width={640}
                height={437}
                alt="Elegie Duino"
                loading="lazy"
                decoding="async"
                draggable={false}
                className="eld-logo h-[90px] w-auto lg:h-[120px] [filter:drop-shadow(0_1px_12px_rgba(0,0,0,.35))]"
              />
            </div>
            <p className="eld-eyebrow mt-6">{t("eyebrow")}</p>
            <h2 id="elegie-title" className="display-chapter mt-3 max-w-xl text-eld-cream">
              {t("title")}
            </h2>
            <ol role="list" className="eld-tri data-mono mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium uppercase tracking-[0.14em] text-eld-beige" aria-label={t("framesLabel")}>
              {frames.map((f) => <li key={f}>{f}</li>)}
            </ol>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-eld-cream/85">{t("body")}</p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <Magnetic strength={0.3} className="w-full sm:w-auto">
                <span className="eld-ring flex w-full sm:inline-flex sm:w-auto">
                  <a
                    href={primary}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-eld-cta="primary"
                    className={`btn-hero group inline-flex w-full items-center justify-center gap-2 rounded-full bg-eld-cream px-6 py-3 text-sm font-semibold text-eld-ink hover:bg-eld-beige sm:w-auto ${FOCUS}`}
                  >
                    {t("cta")}
                    <span aria-hidden="true" className="eld-arrow inline-block">↗</span>
                    {ext}
                  </a>
                </span>
              </Magnetic>
              <a
                href={secondary}
                target="_blank"
                rel="noopener noreferrer"
                data-eld-cta="secondary"
                className={`self-center rounded-sm text-sm font-medium text-eld-cream underline decoration-eld-cream/40 underline-offset-[6px] transition-colors hover:decoration-eld-cream ${FOCUS}`}
              >
                {t("secondary")}
                {ext}
              </a>
            </div>
            <p className="mt-3 text-xs text-eld-cream/65">{t("micro")}</p>
          </div>

          {/* Colonna destra: pannello «sul sito del progetto» */}
          <Tilt className="rounded-2xl" max={5}>
            <div
              className="rounded-2xl border border-eld-cream/15 bg-eld-ink/75 p-5 lg:p-7"
              data-reveal
              style={{ "--reveal-delay": "220ms" } as CSSProperties}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eld-beige">
                {t("panelTitle")}
              </p>
              <ol role="list" className="mt-3 list-none sm:grid sm:grid-cols-2 sm:gap-x-6 lg:block">
                {bullets.map((b) => (
                  <li key={b.n} className="flex gap-3 border-t border-eld-cream/10 py-3 text-sm leading-snug text-eld-cream">
                    <span aria-hidden="true" className="eld-n data-mono pt-0.5 text-[11px] tracking-[0.18em] text-eld-beige">
                      {b.n}
                    </span>
                    <span>
                      <strong className="font-semibold">{b.k}:</strong> {b.v}
                    </span>
                  </li>
                ))}
              </ol>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-eld-cream/15 pt-4">
                {dati.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-eld-beige">{k}</dt>
                    <dd className="data-mono mt-0.5 text-sm font-semibold text-eld-cream">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Tilt>
        </div>
      </Scene>
    </section>
  );
}
