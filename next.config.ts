import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Intestazioni di sicurezza di base su TUTTE le risposte (08/10/2026, audit
// del 07/10): fino a oggi il sito mandava soltanto HSTS, e le aree con login
// (/account, Private Collection) si potevano incorniciare da qualunque sito
// (clickjacking). Lo stesso blocco di triestevillas.com, più `frame-ancestors`
// applicato (non solo report-only): il sito non incornicia sé stesso altrove e
// nessuno lo incornicia — i tour 3D e le mappe sono iframe che QUESTE pagine
// aprono, e non ne sono toccati.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  // allow-popups: i link social/WhatsApp aprono in tab nuova; il same-origin
  // puro spezzerebbe l'opener anche dove è legittimo.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Niente `x-powered-by: Next.js`: non serve a nessuno e dice la tecnologia.
  poweredByHeader: false,
  experimental: {
    // React <ViewTransition> for route morphs/slides (see globals.css).
    viewTransition: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  // 301s for the old site's URLs still indexed by Google (sections from the
  // SERP + structure recovered via the Wayback Machine, 2026-06-12). Deep
  // blog articles intentionally stay 404. Old /annuncio/<slug> links are
  // handled in the annuncio page by `risolviSlug` (lib/properties.ts): an old
  // slug of a listing that still exists → 308 to today's slug; an unknown
  // slug → notFound(), the localized 404 (until 08/10 it was a 307 to
  // /immobili, which Google reads as a soft-404).
  async redirects() {
    return [
      // L'italiano vive alla radice: /it/… è un alias che next-intl rimandava
      // con un 307 (temporaneo, che Google non consolida). Qui è un 308 — lo
      // stesso del gemello triesteaffitti dal 30/09 — e gira PRIMA del proxy di
      // next-intl, quindi non tocca la riscrittura interna /… → /it/….
      { source: "/it", destination: "/", permanent: true },
      { source: "/it/:path*", destination: "/:path*", permanent: true },
      // sections
      { source: "/chi-siamo", destination: "/gruppo", permanent: true },
      { source: "/agenzia-immobiliare-triestevillas", destination: "/gruppo", permanent: true },
      { source: "/luxury", destination: "/immobili", permanent: true },
      { source: "/luxury/:path*", destination: "/immobili", permanent: true },
      { source: "/affitti", destination: "/immobili", permanent: true },
      { source: "/affitti/:path*", destination: "/immobili", permanent: true },
      { source: "/affitti-turistici-trieste", destination: "/immobili", permanent: true },
      { source: "/annuncio", destination: "/immobili", permanent: true },
      { source: "/blog-affitti", destination: "/", permanent: true },
      { source: "/blog-proprietari", destination: "/", permanent: true },
      { source: "/category/:path*", destination: "/", permanent: true },
      // legacy .html era (specific targets first, then catch-all to home)
      { source: "/affitti-mensili.html", destination: "/immobili", permanent: true },
      { source: "/affitti-tradizionali.html", destination: "/immobili", permanent: true },
      { source: "/affitti-turistici.html", destination: "/immobili", permanent: true },
      { source: "/cercovendita.html", destination: "/vendi", permanent: true },
      { source: "/cercoaffitto.html", destination: "/immobili", permanent: true },
      { source: "/:page(.*\\.html)", destination: "/", permanent: true },
      // old German WordPress paths (named so they don't shadow the new /de routes)
      { source: "/de/immobilien-zu-miete/:path*", destination: "/de/immobili", permanent: true },
      { source: "/de/immobilien-recherche", destination: "/de/immobili", permanent: true },
      { source: "/de/Immobilien-Recherche", destination: "/de/immobili", permanent: true },
      { source: "/de/Nachrichten/:path*", destination: "/de", permanent: true },
      { source: "/de/nachrichten/:path*", destination: "/de", permanent: true },
      { source: "/de/cloud-trieste-villas", destination: "/de", permanent: true },
      { source: "/de/cookie", destination: "/de/privacy", permanent: true },
      { source: "/cookie", destination: "/privacy", permanent: true },
    ];
  },
  images: {
    // Vercel's Image Optimizer keys its cache on the SOURCE url. Airtable
    // attachment urls are signed and rotate on every ISR revalidation (600s),
    // so each cycle is a fresh cache key → a fresh transformation + cache write,
    // which blows the Hobby free tier and then 402s (alt text instead of photos).
    // We bypass the optimizer and serve Airtable's own sized renditions instead
    // (thumbnails.large for cards/grids; original only for hero + lightbox).
    unoptimized: true,
    remotePatterns: [
      // Airtable attachment CDN (URLs are signed and expire ~2h; refreshed on each ISR revalidation).
      { protocol: "https", hostname: "v5.airtableusercontent.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
