"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useUtmGruppo } from "@/lib/utm-gruppo";
import { useProvenienzaModuli } from "@/lib/provenienza-moduli";

// ─────────────────────────────────────────────────────────────────────────────
// Google Analytics 4.
//
// Gemello di quello su triestevillas.com, acceso il 2026-07-31.
//
// ⚠️ L'ID È CAMBIATO IL 2026-09-18. Dal 31/07 il sito spediva `G-TTVSE30EJF`,
// che NON è il flusso della proprietà di TriesteImmobiliare: è un secondo flusso
// creato DENTRO la proprietà «TRIESTEVILLAS.com - GA4» (337699857). Risultato:
// sette settimane di visite di TSI contate come TSV, e la proprietà vera di TSI
// («www.triesteimmobiliare.com», 530742980) a zero — «ma non è possibile, c'è
// chi ci ha scritto». Lo ha scoperto la sentinella del CRM v4 leggendo i flussi
// per ID (lib/marketing/siti-copertura.ts). L'ID qui sotto è quello del flusso
// della proprietà giusta; il registro dei siti del v4 (lib/marketing/siti.ts)
// deve dire lo stesso, o la sentinella griderà «senza proprietà».
//
// L'ID di misurazione è un identificatore PUBBLICO (si legge nel sorgente di
// ogni pagina): sta in chiaro qui e non in una variabile d'ambiente, così non
// può sparire da una env dimenticata a un deploy.
//
// Navigazioni interne: l'App Router cambia pagina con la History API, e la
// "misurazione avanzata" di GA4 (attiva di serie sui flussi web) registra da sé
// i page_view sui cambi di cronologia. Niente listener nostro: due sorgenti di
// page_view sarebbero doppio conteggio.
//
// CONSENSO (Consent Mode v2, dal 2026-07-31): si parte con TUTTO negato, quindi
// prima della scelta non viene scritto nessun cookie di analytics. La scelta
// arriva da CookieBanner e vale subito, senza ricaricare. L'ordine conta: il
// comando `default` entra nel dataLayer PRIMA di `config`, ed è nello stesso
// script inline proprio per non doverlo sperare.
// ─────────────────────────────────────────────────────────────────────────────

const GA_ID = "G-K3ZQZN73NV";

export default function Analytics() {
  // I link verso gli altri siti del gruppo escono con la provenienza (lib/utm-gruppo.ts).
  useUtmGruppo("triesteimmobiliare.com");
  // Ogni invio verso il sito porta la provenienza della visita al CRM (lib/provenienza-moduli.ts).
  // Sta prima dei `return null` qui sotto di proposito: nell'area riservata e
  // nelle pagine col gettone nella query GA4 resta spento, l'innesto no — una
  // richiesta d'accesso alla Private Collection porta anche lei la sua
  // provenienza (solo percorso e UTM: codice e gettoni della query non ne fanno
  // mai parte, lib/provenienza.ts tiene della query le sole utm_*).
  useProvenienzaModuli();
  // ── Gli eventi che contano (23/09/2026) ────────────────────────────────────
  // Senza eventi GA4 misura pagine e basta. Un ascoltatore solo, delegato al
  // documento, per tutti i punti di contatto del sito — così un modulo nuovo o
  // un numero di telefono in una pagina nuova sono già misurati senza toccare
  // niente:
  //   · `contatto` al clic su tel: / WhatsApp / mailto:, con `canale`.
  //   · `generate_lead` NON più da qui (08/10/2026, audit del 07/10): il
  //     submit di QUALSIASI <form> contava come lead anche login,
  //     registrazione, preferenze e ogni messaggio della chat, e la richiesta
  //     fallita come quella riuscita. Ora parte SOLO dai moduli lead, dopo la
  //     risposta ok del server (lib/track.ts aggiunge `modulo`).
  // Nel CRM v4 il job `eventi` li marca come eventi chiave e registra i due
  // parametri come dimensioni: senza, nei report non comparirebbero.
  useEffect(() => {
    const invia = (nome: string, parametri: Record<string, string>) => {
      try { (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", nome, parametri); } catch { /* niente analytics = niente da fare */ }
    };
    const alClic = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const h = a.getAttribute("href") ?? "";
      if (/^tel:/i.test(h)) invia("contatto", { canale: "telefono" });
      else if (/wa\.me|api\.whatsapp\.com|^whatsapp:/i.test(h)) invia("contatto", { canale: "whatsapp" });
      else if (/^mailto:/i.test(h)) invia("contatto", { canale: "email" });
    };
    document.addEventListener("click", alClic, true);
    return () => {
      document.removeEventListener("click", alClic, true);
    };
  }, []);
  // ⚠️ NIENTE ANALYTICS DENTRO L'AREA RISERVATA — gemello della stessa esclusione su
  // triestevillas-web. Il link delle mail porta il CODICE D'ACCESSO nella query, e
  // GA4 manda `page_location` con la query intera: sarebbe la credenziale della
  // collezione riservata spedita a un servizio di analytics a ogni uscita. L'area
  // ha già un tracciamento suo, PC_ACCESS_LOG, molto più preciso.
  const pathname = usePathname();
  // `sl` compreso (08/10/2026): dal 01/10 c'è /sl/private, e la regola che
  // conosceva solo it/en/de lasciava partire GA4 col codice nella query.
  if (/^\/(it|en|de|sl)?\/?private(\/|$)/.test(pathname ?? "")) return null;
  // Stessa ragione per le due pagine dell'area clienti che si aprono da un link
  // con un token nella query (09/10/2026): il reset della password — quel token
  // da solo cambia la password — e la verifica dell'email. Gemello su TSV.
  // Dal 09/10/2026 anche lo spazio già pronto (/account/benvenuto?k=…): quel
  // gettone apre un modulo con nome ed email della persona.
  if (/^\/(it|en|de|sl)?\/?account\/(reset|verifica|benvenuto)(\/|$)/.test(pathname ?? "")) return null;
  if (!GA_ID) return null;
  return (
    <>
      {/* `lazyOnload` e non `afterInteractive`: misurato il 2026-08-03 su
          produzione, gtag.js costava 231 ms di bootup e 185 KB scaricati mentre
          la pagina stava ancora dipingendo (il main thread era il collo di
          bottiglia dell'LCP, 3,0 s di lavoro). Spostato dopo l'evento `load`
          non toglie nulla alla misurazione: GA4 registra comunque il page_view,
          e il consenso resta intatto perché nessun cookie può essere scritto
          prima che lo script esista. L'ordine fra i due <Script> è preservato,
          quindi `consent default` continua a precedere `config`. */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('tsi_consenso_v1')==='si'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
