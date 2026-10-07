"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import BarcolanaMappa from "./BarcolanaMappa";
import { GIORNI, brindisi, oraRoma, statoStand, type Stato } from "./orari";
import s from "./barcolana.module.css";

// Il pannello del pop-up Barcolana (lo apre il cancello BarcolanaStand).
// <dialog> nativo con showModal(): trappola del fuoco, Esc, inerzia della
// pagina sotto e livello superiore (sopra header, banner cookie, barre) li dà
// il browser. Testi in due lingue soltanto, qui sotto: il pop-up vive cinque
// giorni e non entra nei cataloghi messages/*.json dei siti.

type Lingua = "it" | "en";

const T = {
  it: {
    aria: "Barcolana 58: lo stand TriesteVillas e Metroarea",
    kicker: "Barcolana 58 · Villaggio",
    titolo: ["Vi aspettiamo", "alla Barcolana."],
    titoloBrindisi: ["Un brindisi", "sul Golfo."],
    brindisiPrima: "Oggi · dalle 18 alle 20",
    brindisiAdesso: "Adesso · fino alle 20",
    brindisi:
      "Passate allo stand per un bicchiere in compagnia: colleghi, proprietari, amici e conoscenti, siete tutti invitati.",
    corpo:
      "Dal 7 all’11 ottobre siamo al Villaggio Barcolana con uno stand condiviso con Metroarea Architetti. Passate a trovarci per due chiacchiere davanti al mare sulla casa: quella da trovare e quella da progettare.",
    stand: "Stand 25 · Area Shopping",
    dove: "Lato mare, a pochi passi dal Molo Audace",
    orari: "Orari dello stand",
    oggi: "oggi",
    aperto: (h: number) => (h === 24 ? "Aperto ora · fino a mezzanotte" : `Aperto ora · fino alle ${h}:00`),
    apre: (h: number) => `Oggi apriamo alle ${h}:00`,
    domani: (h: number) => `Domani dalle ${h}:00`,
    indicazioni: "Come arrivare",
    continua: "Continua sul sito",
    chiudi: "Chiudi",
    cercate: "Non ci trovate?",
    nuovaScheda: "(si apre in una nuova scheda)",
    architetti: "Architetti associati",
  },
  en: {
    aria: "Barcolana 58: the TriesteVillas and Metroarea stand",
    kicker: "Barcolana 58 · Race Village",
    titolo: ["Come and see us", "at the Barcolana."],
    titoloBrindisi: ["A toast", "on the Gulf."],
    brindisiPrima: "Today · 6 to 8 pm",
    brindisiAdesso: "Right now · until 8 pm",
    brindisi:
      "Drop by the stand for a glass with us: colleagues, homeowners, friends and acquaintances, you are all invited.",
    corpo:
      "From 7 to 11 October we are at the Barcolana Village, sharing a stand with Metroarea Architetti. Come by for a chat by the sea about homes: the one to find and the one to design.",
    stand: "Stand 25 · Shopping Area",
    dove: "On the seafront, a few steps from Molo Audace",
    orari: "Stand opening hours",
    oggi: "today",
    aperto: (h: number) => (h === 24 ? "Open now · until midnight" : `Open now · until ${h}:00`),
    apre: (h: number) => `Opening today at ${h}:00`,
    domani: (h: number) => `Tomorrow from ${h}:00`,
    indicazioni: "Get directions",
    continua: "Continue to the site",
    chiudi: "Close",
    cercate: "Can’t find us?",
    nuovaScheda: "(opens in a new tab)",
    architetti: "Architetti associati",
  },
} as const;

// Lo stand, sulla Riva a nord-est della radice del Molo Audace (OSM: radice
// 45.65138, 13.76757). Coordinate e non il nome del molo: il molo è lungo
// 250 metri e Google mette lo spillo a metà, in mare.
const MAPPA = "https://www.google.com/maps/search/?api=1&query=45.65163%2C13.76795";
const WHATSAPP = "https://wa.me/393318940822";

function traccia(azione: string) {
  try {
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "barcolana_stand", { azione });
  } catch {
    /* niente gtag (blocker, consenso negato): va bene così */
  }
}

function testoStato(t: (typeof T)[Lingua], st: Stato) {
  if (!st) return null;
  if (st.tipo === "aperto") return t.aperto(st.chiude);
  if (st.tipo === "apre") return t.apre(st.apre);
  return t.domani(st.apre);
}

export default function BarcolanaStandDialog({ lingua, onChiudi }: { lingua: Lingua; onChiudi: () => void }) {
  const t = T[lingua];
  const ref = useRef<HTMLDialogElement>(null);
  const [ora, setOra] = useState(() => Date.now());
  const [uscita, setUscita] = useState(false);

  // Apertura modale + blocco dello scroll della pagina sotto.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    // Il fuoco va al dialogo, non alla X: showModal() lo darebbe al primo
    // bottone, che mostrerebbe l'anello di fuoco senza che nessuno abbia
    // toccato la tastiera. Con Tab si arriva comunque alla X.
    d.focus();
    const html = document.documentElement;
    const prima = html.style.overflow;
    html.style.overflow = "hidden";
    traccia("visto");
    return () => {
      html.style.overflow = prima;
      if (d.open) d.close();
    };
  }, []);

  // Lo stato «aperto ora / domani dalle…» resta vero anche se il pannello resta aperto a lungo.
  useEffect(() => {
    const id = window.setInterval(() => setOra(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const chiudi = () => {
    if (uscita) return;
    traccia("chiuso");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onChiudi();
    setUscita(true);
    window.setTimeout(onChiudi, 220);
  };

  // Clic sul fondo (fuori dal pannello) = chiudi.
  const suFondo = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) chiudi();
  };

  const oggi = oraRoma(ora).data;
  const momento = brindisi(ora);
  const stato = testoStato(t, statoStand(ora));
  const [riga1, riga2] = momento ? t.titoloBrindisi : t.titolo;

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      className={`${s.dialogo} ${uscita ? s.uscita : ""}`}
      aria-labelledby="barcolana-titolo"
      aria-describedby="barcolana-corpo"
      onCancel={(e) => {
        e.preventDefault();
        chiudi();
      }}
      onClick={suFondo}
    >
      <button type="button" className={s.chiudiX} onClick={chiudi} aria-label={t.chiudi}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <div className={s.pannello}>
        <div className={s.testo}>
          <div className={s.loghi}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/barcolana-58/triestevillas.svg" alt="TriesteVillas" width={205} height={36} className={s.logoTsv} />
            <span className={s.per} aria-hidden="true">×</span>
            <span className={s.metro}>
              <svg viewBox="0 0 32 32" className={s.metroQuadro} aria-hidden="true">
                <rect x="4" y="4" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4.5" />
              </svg>
              <span className={s.metroNome}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/barcolana-58/metroarea.png" alt="Metroarea" width={435} height={71} />
                <span>{t.architetti}</span>
              </span>
            </span>
          </div>

          <p className={s.kicker}>{t.kicker}</p>
          <h2 id="barcolana-titolo" className={s.titolo}>
            {riga1} <em>{riga2}</em>
          </h2>

          {momento && (
            <div className={s.brindisi}>
              <p className={s.brindisiQuando}>
                <span className={s.punto} aria-hidden="true" />
                {momento === "adesso" ? t.brindisiAdesso : t.brindisiPrima}
              </p>
              <p>{t.brindisi}</p>
            </div>
          )}

          <p id="barcolana-corpo" className={s.corpo}>
            {t.corpo}
          </p>

          <div className={s.dove}>
            <p className={s.stand}>{t.stand}</p>
            <p className={s.doveTesto}>{t.dove}</p>
            {stato && (
              <p className={s.stato}>
                <span className={s.punto} aria-hidden="true" />
                {stato}
              </p>
            )}
          </div>

          <div className={s.orari} role="group" aria-label={t.orari}>
            <p className={s.orariTitolo}>{t.orari}</p>
            <ul role="list">
              {GIORNI.map((g) => {
                const passato = g.data < oggi;
                const corrente = g.data === oggi;
                return (
                  <li
                    key={g.data}
                    className={`${corrente ? s.oggi : ""} ${passato ? s.passato : ""}`}
                    aria-current={corrente ? "date" : undefined}
                  >
                    <span className={s.giorno}>
                      {g[lingua]}
                      {corrente && <span className={s.srOnly}> ({t.oggi})</span>}
                    </span>
                    <span className={s.ore}>
                      {g.apre}–{g.chiude}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={s.azioni}>
            <a
              href={MAPPA}
              target="_blank"
              rel="noopener noreferrer"
              className={s.primario}
              onClick={() => traccia("indicazioni")}
            >
              {t.indicazioni}
              <span aria-hidden="true">↗</span>
              <span className={s.srOnly}> {t.nuovaScheda}</span>
            </a>
            <button type="button" className={s.secondario} onClick={chiudi}>
              {t.continua}
            </button>
          </div>

          <p className={s.contatto}>
            {t.cercate}{" "}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" onClick={() => traccia("whatsapp")}>
              WhatsApp +39 331 894 0822
              <span className={s.srOnly}> {t.nuovaScheda}</span>
            </a>
          </p>
        </div>

        <div className={s.mappa}>
          <BarcolanaMappa lingua={lingua} />
        </div>
      </div>
    </dialog>
  );
}
