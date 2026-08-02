"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Google Analytics 4.
//
// Gemello di quello su triestevillas.com, acceso il 2026-07-31 con l'ID della
// proprietà GA4 di TriesteImmobiliare (fornito da Martino dal flusso di dati
// web dell'account Analytics del gruppo).
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

const GA_ID = "G-TTVSE30EJF";

export default function Analytics() {
  // ⚠️ NIENTE ANALYTICS DENTRO L'AREA RISERVATA — gemello della stessa esclusione su
  // triestevillas-web. Il link delle mail porta il CODICE D'ACCESSO nella query, e
  // GA4 manda `page_location` con la query intera: sarebbe la credenziale della
  // collezione riservata spedita a un servizio di analytics a ogni uscita. L'area
  // ha già un tracciamento suo, PC_ACCESS_LOG, molto più preciso.
  const pathname = usePathname();
  if (/^\/(it|en|de)?\/?private(\/|$)/.test(pathname ?? "")) return null;
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
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
