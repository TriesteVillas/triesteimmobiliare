"use client";

// SELETTORE LINGUA DELL'AREA RISERVATA.
//
// Perché ne serve uno suo, e non basta quello dell'header. L'area Private
// Collection nasconde di proposito header e footer pubblici (`globals.css`,
// regola `body:has(.pc-root) header[data-pill] { display:none }`), perché il
// mondo gated sembri un mondo separato. Ma il selettore lingua era montato solo
// dentro quell'header: nascondendo la cornice si è nascosto anche l'unico
// comando per cambiare lingua. Non è mai stata una regressione — la PC è nata
// così, nello stesso commit — ma dal 21/07 le pagine riservate sono tradotte, e
// una pagina tradotta senza un modo per cambiare lingua è una traduzione che
// quasi nessuno vedrà.
//
// Il caso che conta: chi arriva dal link in mail (`/private?c=CODICE`) atterra
// direttamente qui senza attraversare nessuna pagina pubblica. Prima di questo
// componente, per quella persona l'italiano era una condanna.
//
// Montato UNA volta nel layout e mostrato dalla stessa condizione che nasconde
// l'header (`body:has(.pc-root)`): così vale per tutte le pagine PC — gate,
// collezione, scheda, richiesta credenziali — senza doverlo aggiungere a
// ciascuna, e senza rischiare di dimenticarlo sulla prossima.

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { it: "IT", en: "EN", de: "DE" };

export default function PcLocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      // `pc-lang` è la maniglia CSS: invisibile ovunque, visibile solo quando in
      // pagina c'è un .pc-root. La logica di visibilità sta accanto a quella che
      // nasconde l'header, così chi tocca l'una vede l'altra.
      className="pc-lang"
      aria-busy={isPending}
      aria-label="Lingua"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => startTransition(() => router.replace(pathname, { locale: loc }))}
          aria-current={loc === locale}
          className={loc === locale ? "pc-lang-on" : "pc-lang-off"}
        >
          {LABELS[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
