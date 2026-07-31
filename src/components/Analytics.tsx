import Script from "next/script";

// ─────────────────────────────────────────────────────────────────────────────
// Google Analytics 4.
//
// Gemello di quello su triestevillas.com. Qui manca ancora l'ID: la proprietà
// GA4 di TriesteImmobiliare va creata nell'account Analytics del gruppo
// (martino@triestevillas.com), che al 31/07/2026 non è raggiungibile dal Chrome
// collegato. APPENA C'È L'ID: si scrive in GA_ID qui sotto e si rilascia —
// niente altro da toccare, il componente è già montato nel layout.
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
// ⚠️ CONSENSO: questo tag scrive cookie di analytics. Il sito NON ha ancora un
// banner di consenso; finché non c'è, l'installazione va trattata come una
// scelta consapevole del titolare, non come un default tecnico.
// ─────────────────────────────────────────────────────────────────────────────

const GA_ID = ""; // ← ID di misurazione di TriesteImmobiliare (G-…), da creare

export default function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
