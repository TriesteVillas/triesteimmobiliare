import Script from "next/script";

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
// ⚠️ CONSENSO: questo tag scrive cookie di analytics. Il sito NON ha ancora un
// banner di consenso; finché non c'è, l'installazione va trattata come una
// scelta consapevole del titolare, non come un default tecnico.
// ─────────────────────────────────────────────────────────────────────────────

const GA_ID = "G-TTVSE30EJF";

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
