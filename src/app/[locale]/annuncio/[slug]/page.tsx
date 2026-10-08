import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getProperties, getProperty } from "@/lib/airtable";
import { aTrieste, isSold, risolviSlug, tsvVince, zoneKey, ZONE_OTHER } from "@/lib/properties";
import { etichettaTag, localizeValue } from "@/lib/listingI18n";
import { scegliSimili } from "@/lib/simili";
import { presenza, soloSiNo, statoDotazioni, vociSchema } from "@/lib/dotazioni";
import { stessoPalazzo } from "@/lib/stesso-palazzo";
import PropertyCharacteristics, {
  type Characteristic,
} from "@/components/PropertyCharacteristics";
import PropertyMap from "@/components/PropertyMap";
import PhotoGallery from "@/components/PhotoGallery";
import PhotoImg from "@/components/PhotoImg";
import RicordaScheda from "@/components/RicordaScheda";
import { photoSrc, photoSrcSet } from "@/lib/photoSrc";
import { gallerySet } from "@/lib/photoSet";
import Planimetrie from "@/components/Planimetrie";
import PropertyBadge from "@/components/PropertyBadge";
import PropertyCard from "@/components/PropertyCard";
import StickyNav from "@/components/StickyNav";
import Scene from "@/components/motion/Scene";
import LeadForm from "@/components/LeadForm";
import VisitForm from "@/components/VisitForm";
import TourFrame from "@/components/TourFrame";
import VideoYoutube from "@/components/VideoYoutube";
import SfondoVideo from "@/components/media/SfondoVideo";
import RiquadriEvidenza from "@/components/RiquadriEvidenza";
import { riquadriAnnuncio } from "@/content/annunciRiquadri";
import ApprofondimentoAnnuncio from "@/components/ApprofondimentoAnnuncio";
import { approfondimentoAnnuncio } from "@/content/annunciApprofondimenti";
import { videoDelSito, videoYoutube } from "@/lib/video-sito";
import {
  buildPropertyView,
  contractBadge,
  clusterBadge,
  localizedDescription,
  localizedTitle,
  localizePlaceName,
  metaClamp,
  priceLabel,
  soldBadge,
  translatedDescription,
} from "@/lib/propertyView";
import { pageAlternates, pageOpenGraph, listingJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { formatNumber, formatPrice } from "@/lib/format";
import TaxBox from "@/components/TaxBox";
import PropertyActions from "@/components/account/PropertyActions";
import AccountPerks from "@/components/account/AccountPerks";
import DwellTracker from "@/components/account/DwellTracker";
import BuyerConcierge from "@/components/compra/BuyerConcierge";
import ElegieDuinoInvito, { ElegieChip, ElegiePlansHint } from "@/components/ElegieDuinoInvito";
import { isElegieProgetto } from "@/lib/elegie";
import EtichettaAi from "@/components/EtichettaAi";
import { linkPaginaAi } from "@/lib/pagina-ai";
import {
  fotoAi,
  fotoPerAnteprima,
  localizzaFoto,
  nellaLingua,
  chiusuraRiepilogo,
  comandoDettaglio,
  notaSenzaAttacco,
  righeDettaglio,
  rigaRiepilogo,
  senzaNotaAi,
  testiTrasparenza,
} from "@/lib/trasparenza";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.triesteimmobiliare.com";

// Ladder dell'hero a tutto schermo. Il fallback resta 2000 px per i desktop
// larghi; il ladder esiste perché con sizes="100vw" un telefono ne serve 780 e
// senza si portava a casa comunque i 2000.
const HERO_WIDTHS = [800, 1200, 1600, 2000] as const;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const properties = await getProperties();
  return routing.locales.flatMap((locale) =>
    properties.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};
  // Titolo e meta description nella lingua della pagina.
  //
  // ORDINE, e conta: su /en e /de viene prima la descrizione TRADOTTA (così la
  // SERP non mostra italiano a chi cerca in inglese o tedesco), ma solo se
  // esiste DAVVERO — `translatedDescription`, non `localizedDescription`, che
  // ripiegherebbe sull'italiano e ce lo farebbe preferire all'one-liner.
  // Quando la traduzione manca il gradino giusto è l'one-liner: è italiano come
  // il ripiego, ma è corto, scritto a mano e pensato per lo snippet, invece del
  // primo pezzo di una descrizione da 1000 caratteri tagliata a metà frase.
  //   en/de → descrizione tradotta → one-liner → descrizione italiana
  //   sl    → descrizione slovena → inglese → one-liner → descrizione italiana
  //   it    →                        one-liner → descrizione italiana
  const title = localizedTitle(property, locale);
  const description =
    metaClamp(translatedDescription(property, locale)) ??
    property.oneliner ??
    metaClamp(property.description) ??
    "TriesteImmobiliare";
  // De-cannibalizzazione col gemello TSV: slug identici e canonical self su
  // entrambi i domini facevano competere le stesse schede in SERP (audit
  // 2026-08-11). Regola condivisa e complementare a quella di TSV: dai 500k in
  // su il pregio e' mestiere di TriesteVillas — se il record e' pubblicato
  // anche la', questa copia cede il posto. Sotto i 500k (o senza prezzo) vince
  // TSI, quindi qui si resta self-canonical. Hreflang omessi sul duplicato.
  const tsvWins = tsvVince(property);
  const alternates = tsvWins
    ? {
        canonical: `https://triestevillas.com${locale === "it" ? "" : `/${locale}`}/annuncio/${slug}`,
      }
    : pageAlternates(locale, `/annuncio/${slug}`);
  const ogFoto = fotoPerAnteprima(property);
  return {
    title: { absolute: titoloSerp(title) },
    description,
    alternates,
    openGraph: pageOpenGraph(
      locale,
      `/annuncio/${slug}`,
      title,
      description,
      // Le anteprime social non portano etichette: mai una foto AI di
      // sostanza lì (lib/trasparenza.ts → fotoPerAnteprima). Senza dati: la
      // copertina. Dalla v1.3 può essere una foto di sola luce: passa da
      // photoSrc, così il file dell'anteprima porta la sua marcatura IPTC
      // (`-ctam`) come in galleria. Una foto senza marca ha lo stesso URL di
      // prima (`/foto/<att>/2000.webp`).
      ogFoto ? photoSrc(ogFoto, 2000) : undefined,
    ),
  };
}

// Il <title> della scheda (08/10/2026): oltre i 60-65 caratteri Google lo
// tronca o lo riscrive, e qui si arrivava a 103 (audit SEO del 07/10). Il
// marchio in coda resta finché ci sta; se il titolo da solo è troppo lungo si
// taglia sul confine di parola, con i puntini.
const TITOLO_MAX = 65;
function titoloSerp(title: string): string {
  const conMarchio = `${title} · TriesteImmobiliare`;
  if (conMarchio.length <= TITOLO_MAX) return conMarchio;
  if (title.length <= TITOLO_MAX) return title;
  const taglio = title.slice(0, TITOLO_MAX - 1);
  const spazio = taglio.lastIndexOf(" ");
  return `${(spazio > 40 ? taglio.slice(0, spazio) : taglio).replace(/[\s,;:·—–-]+$/, "")}…`;
}

// Split a description into readable paragraphs. Honours author-made line breaks
// (blank lines or single newlines); for a single wall of text, groups sentences
// into chunks of ~3. Sentence split only on punctuation + space + capital, so
// "10.200,00" / "ecc." don't cause false breaks.
function toParagraphs(text: string): string[] {
  const byBreak = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (byBreak.length > 1) return byBreak;
  const sentences = text
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý"«])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join(" "));
  }
  return chunks.length ? chunks : [text];
}

// Extract 11-char YouTube ids from the common URL shapes.
function youtubeIds(urls: string[]): string[] {
  return urls
    .map(
      (u) =>
        u.match(
          /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
        )?.[1],
    )
    .filter((x): x is string => Boolean(x));
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const all = await getProperties();
  // Uno slug vecchio di una casa ancora viva → 308 allo slug di oggi; uno slug
  // che non porta a nessuna casa → 404 vero. Fino all'08/10 tutto andava con
  // un 307 a /immobili, che Google legge come soft-404 (lib/properties.ts →
  // risolviSlug, gemello di triesteaffitti).
  const esito = risolviSlug(slug, all);
  if (esito.tipo === "sposta") {
    permanentRedirect({ href: `/annuncio/${esito.property.slug}`, locale });
  }
  if (esito.tipo !== "esatto") notFound();
  const property = esito.property;

  const t = await getTranslations("property");
  const tNav = await getTranslations("nav");
  const tZones = await getTranslations("zones");
  // "Prenota una visita" vive nel namespace lead (usato da VisitForm), non property.
  const tLead = await getTranslations("lead");
  const fsLabel =
    ({ it: "Schermo intero", en: "Fullscreen", de: "Vollbild", sl: "Celozaslonski način" } as Record<
      string,
      string
    >)[locale] ?? "Fullscreen";
  // Quattro scelte, mostrate tre o quattro secondo la griglia (v. la sezione
  // «simili» in fondo): la regola sta in lib/simili.ts, gemello di TSV.
  // «Nello stesso palazzo» (lib/stesso-palazzo.ts): le altre unità dello stesso
  // progetto, tutte. Non per Elegie, che ha la sua scena-ponte. Quelle mostrate
  // lì escono dai simili, o la stessa casa comparirebbe due volte.
  const palazzo = isElegieProgetto(property.progetto) ? [] : stessoPalazzo(property, all);
  const inPalazzo = new Set(palazzo.map((p) => p.slug));
  const similar = scegliSimili(
    property,
    all.filter((p) => !inPalazzo.has(p.slug)),
    4,
  );
  // La zona passa dal dizionario delle zone (messages → zones): «ALTE» è la
  // sigla del gestionale, al pubblico è «Carso e Altopiano». Fuori elenco o
  // uguale al comune («Muggia, Muggia») non si scrive.
  const comuneLoc = localizePlaceName(property.comune, locale);
  const zonaK = zoneKey(property);
  const zonaLoc = zonaK === ZONE_OTHER ? null : tZones(zonaK);
  const place = [
    property.via,
    zonaLoc && zonaLoc.toLowerCase() !== (comuneLoc ?? "").toLowerCase() ? zonaLoc : null,
    comuneLoc,
  ]
    .filter(Boolean)
    .join(", ");
  const hasLocation = property.lat != null && property.lng != null;
  const ytIds = youtubeIds(property.videos);
  // Il registro dei video del CRM, letto solo se la scheda ha video.
  const videoAiYt = await videoYoutube(ytIds, locale);

  // Titolo e descrizione nella lingua del visitatore, con ritorno all'italiano
  // quando la traduzione non è ancora stata scritta (vedi localizedDescription).
  const title = localizedTitle(property, locale);
  // Trasparenza AI (01/10/2026, lib/trasparenza.ts). `trasp` c'è solo quando il
  // CRM ha dati per questo immobile; senza, ogni ramo qui sotto è quello di prima.
  const trasp = property.trasparenza ?? null;
  const tTrasp = testiTrasparenza(locale);
  const notaAi = trasp ? nellaLingua(trasp.nota, locale) : null;
  const notaDettaglio = notaAi ? notaSenzaAttacco(notaAi) : null;
  const rigaAi = trasp ? rigaRiepilogo(trasp.conteggi, locale) : null;
  const chiusuraAi = trasp ? chiusuraRiepilogo(trasp.conteggi, locale) : null;
  const mostraFotoAi =
    trasp != null && (notaAi != null || trasp.conteggi.ai > 0 || trasp.conteggi.ricontrollo > 0);
  // La pagina «Come usiamo l'AI» del gruppo (triestevillas.com), solo nelle
  // lingue in cui risponde 200 — vedi lib/pagina-ai.ts. Si prova solo dove il
  // riepilogo c'è.
  const linkAi = mostraFotoAi ? await linkPaginaAi(locale) : null;

  // Video di testata mp4 (registro content/annunciVideo.ts, 02/10/2026): se
  // l'immobile ne ha uno, l'hero lo mostra sopra la copertina (SfondoVideo);
  // gli YouTube restano in #video. Senza, la scheda è identica a prima: niente
  // letture in più, niente classi in più nell'hero.
  const heroMp4 = property.heroVideo ?? null;
  // I riquadri in evidenza (content/annunciRiquadri.ts): in alto sul foglio.
  const riquadri = riquadriAnnuncio(property.id, locale);
  // L'approfondimento (content/annunciApprofondimenti.ts): dopo la descrizione.
  const approfondimento = approfondimentoAnnuncio(property.id, locale);
  // L'etichetta del video dal registro dei video del CRM (`tsi:<percorso del
  // 1080>`), come per ogni altro file del sito (VideoSito): senza riga, null.
  const heroMp4Ai = heroMp4 ? await videoDelSito(heroMp4.mp4, locale) : null;
  // La frase AI sul video porta il link alla pagina del gruppo, se oggi
  // risponde nella lingua (lib/pagina-ai.ts); senza, la frase resta da sola.
  const heroMp4LinkAi = heroMp4?.ai ? await linkPaginaAi(locale) : null;
  // La pillola del registro prende il posto di quella della copertina, che
  // sparisce mentre il video si vede: stessa colonna (max-w-5xl, px-6), stessa
  // quota — sotto la riga del «← Torna», dove stanno i tasti del video.
  const POSTO_ETICHETTA_VIDEO = "right-6 min-[64rem]:right-[calc((100%-64rem)/2+1.5rem)] top-[9.25rem]";
  // SPEC §5.4: quando la nota arriva dal CRM, la nota scritta a mano dentro la
  // descrizione si toglie — la si legge una volta sola, nel riepilogo. Solo se
  // il CRM ce l'ha NELLA LINGUA DELLA PAGINA: se l'ha trattenuta (guardia dei
  // nomi) o non l'ha scritta, la nota del testo è l'unica che il visitatore
  // legge nella sua lingua, e resta.
  const description = trasp?.nota?.[locale as keyof NonNullable<typeof trasp.nota>]
    ? senzaNotaAi(localizedDescription(property, locale))
    : localizedDescription(property, locale);
  const heroFoto = property.coverPhoto ?? property.photos[0] ?? null;
  const heroAi = fotoAi(heroFoto?.trasparenza, locale);
  // Le foto per il browser: didascalie già nella lingua della pagina.
  const loc = (ph: (typeof property.photos)[number]) => localizzaFoto(ph, locale);
  // Elegie Duino: la scheda è una delle otto unità del progetto → scena-ponte
  // verso elegieduino.it (chip in hero, voce nav, scena dopo le foto, hint
  // planimetrie). Decide SOLO il campo progetto, mai il cluster CANTIERI.
  const isElegie = isElegieProgetto(property.progetto);
  const tElegie = isElegie ? await getTranslations("elegie") : null;
  const SITO = "triesteimmobiliare.com" as const;

  // Box costi indicativi (solo vendita), col toggle prima/seconda casa —
  // stesso impianto del gemello TriesteVillas: imposta dallo scenario, fee 4%
  // netta con tag "+ IVA", condominio ordinario, ILIA (esente prima casa),
  // TARI viva col selettore occupanti. Ogni cifra è preceduta da ≈.
  const isSale = property.contratto !== "AFFITTO";
  const ca = (n: number) => `≈ ${formatPrice(n, locale)}`;
  const feeNet = isSale && property.priceSale ? property.priceSale * 0.04 : null;
  const condoAnnuo = property.condoMensile != null ? property.condoMensile * 12 : null;
  const taxData = isSale
    ? {
        primaImposta: property.impostePrima != null ? ca(property.impostePrima) : null,
        secondaImposta: property.imposteSeconda != null ? ca(property.imposteSeconda) : null,
        commission: feeNet != null ? ca(feeNet) : null,
        condo: condoAnnuo != null ? ca(condoAnnuo) : null,
        ilia: property.iliaAnnua != null ? ca(property.iliaAnnua) : null,
        // La scheda TARI calcola con le tariffe di Trieste: fuori Trieste non c'è.
        mqCalp: aTrieste(property.comune) && property.mq != null ? Math.round(property.mq * 0.8) : null,
      }
    : null;
  const hasCosts =
    taxData != null &&
    Boolean(
      taxData.primaImposta ||
        taxData.secondaImposta ||
        taxData.commission ||
        taxData.condo ||
        taxData.ilia ||
        taxData.mqCalp != null,
    );
  const taxLabels = {
    title: t("taxTitle"),
    groupAcquisto: t("taxGroupAcquisto"),
    groupGestione: t("taxGroupGestione"),
    primaCasa: t("taxPrimaCasa"),
    secondaCasa: t("taxSecondaCasa"),
    firstHome: t("taxFirstHome"),
    secondHome: t("taxSecondHome"),
    commission: t("taxCommission"),
    plusVat: t("taxPlusVat"),
    condo: t("taxCondo"),
    ilia: t("taxIlia"),
    tari: t("taxTari"),
    iliaEsente: t("taxIliaEsente"),
    perYear: t("taxPerYear"),
    occupants: t("taxOccupants"),
    footnote: t("taxEstimateFootnote"),
    infoAria: t("taxInfoAria"),
    acquistoPop: {
      title: t("taxInfoTitle"),
      body: [t("taxAiDisclaimer")],
      criteria: property.noteImposte,
      criteriaLabel: t("taxCriteria"),
    },
    condoPop: { title: t("taxCondoInfoTitle"), body: [t("taxCondoInfoBody")] },
    iliaPop: { title: t("taxIliaInfoTitle"), body: [t("taxIliaInfoBody")] },
    tariPop: {
      title: t("taxTariInfoTitle"),
      body: [t("taxTariInfoBody")],
      link: { href: "https://esattospa.it/tributo/tari/", label: t("taxTariInfoLink") },
    },
  };

  // Dotazioni: UNA lettura (lib/dotazioni.ts) per i dati strutturati più giù.
  // Prima «campo non vuoto» valeva «c'è», e il "No" del CRM usciva nel JSON-LD
  // come `Ascensore: true` (misurato il 06-07/10/2026).
  const dot = statoDotazioni(property);
  // Un Sì o un No del CRM ("Si", "No") si traduce nella lingua della pagina;
  // un valore che dice di più ("Parzialmente", una frase) resta com'è.
  const siNo = (raw: string) =>
    soloSiNo(raw) ? (presenza(raw) ? t("yes") : t("no")) : raw;
  // I valori a elenco del CRM (tipologia, stato, cucina, piano…) nella lingua
  // della pagina: su /en uscivano in italiano (lib/listingI18n.ts).
  const lv = (raw: string) => localizeValue(raw, locale) ?? raw;
  const tA = await getTranslations("audit0810");

  // La riga energetica (D.Lgs. 192/2005 art. 6 c. 8; DM 26/06/2015): c'è
  // SEMPRE, a vista, come sul gemello triestevillas-web. Classe e indice
  // EPgl,nren quando li abbiamo; senza classe, lo stato dichiarato dal CRM —
  // un dato mancante si dice, non sparisce (audit del 07/10: 13 annunci con
  // la classe nel dato e 0 a vista, l'indice solo nel testo).
  const energia: Characteristic = {
    icon: "energy",
    label: t("energyClass"),
    value: property.energyClass
      ? property.energyIndex != null
        ? `${property.energyClass} · ${formatNumber(property.energyIndex, locale)} ${tA("energia.unita")}`
        : property.energyClass
      : property.apeStato === "APE a fine lavori"
        ? tA("energia.fineLavori")
        : tA("energia.nonDisponibile"),
    alwaysVisible: true,
  };

  const characteristics = [
    // Order matters: PropertyCharacteristics keeps the first 8 (the headline
    // specs) always visible and collapses the rest behind a "show all" toggle.
    // — Primary: always visible —
    property.tipologia && { icon: "home", label: t("type"), value: lv(property.tipologia) },
    {
      icon: "contract",
      label: t("contract"),
      value: property.contratto === "AFFITTO" ? t("forRent") : t("forSale"),
    },
    property.mq && { icon: "surface", label: t("surface"), value: t("sqm", { value: property.mq }) },
    property.rooms && { icon: "rooms", label: t("rooms"), value: property.rooms },
    property.camere && { icon: "bedroom", label: t("bedrooms"), value: String(property.camere) },
    property.baths && { icon: "baths", label: t("baths"), value: String(property.baths) },
    property.floor && { icon: "floor", label: t("floor"), value: lv(property.floor) },
    property.stato && { icon: "condition", label: t("condition"), value: lv(property.stato) },
    energia,
    // — Secondary: revealed on click —
    property.tipoProprieta && { icon: "ownership", label: t("propertyType"), value: property.tipoProprieta },
    property.disponibilita && { icon: "availability", label: t("availability"), value: property.disponibilita },
    property.cucina && { icon: "kitchen", label: t("kitchen"), value: lv(property.cucina) },
    property.terrazzo && { icon: "terrace", label: t("terrace"), value: t("yes") },
    property.balcone && { icon: "balcony", label: t("balcony"), value: t("yes") },
    property.giardino && { icon: "garden", label: t("garden"), value: lv(property.giardino) },
    property.pianiEdificio && { icon: "building", label: t("floorsBuilding"), value: String(property.pianiEdificio) },
    property.annoCostruzione && { icon: "year", label: t("yearBuilt"), value: String(property.annoCostruzione) },
    property.ascensore && { icon: "elevator", label: t("elevator"), value: siNo(property.ascensore) },
    property.accessoDisabili && { icon: "accessible", label: t("accessibility"), value: t("yes") },
    property.arredato && { icon: "furnished", label: t("furnished"), value: siNo(property.arredato) },
    property.parcheggio && { icon: "parking", label: t("parking"), value: property.parcheggio },
    property.piscina && { icon: "pool", label: t("pool"), value: property.piscina },
    property.riscaldamento && { icon: "heating", label: t("heating"), value: lv(property.riscaldamento) },
    property.classeImmobile && { icon: "grade", label: t("propertyClass"), value: property.classeImmobile },
  ].filter((c): c is Characteristic => Boolean(c));

  // Le chip dei tag: solo quelli della lista bianca, con l'etichetta pubblica
  // nella lingua della pagina (lib/listingI18n.ts). Fino all'08/10 uscivano i
  // tag grezzi del CRM in minuscolo («parz arredato», «non adatto anziani»).
  const chips = [...new Set(property.tags.map((tag) => etichettaTag(tag, locale)).filter((x): x is string => !!x))];

  // Sticky anchor nav (immobiliare.it style) — only sections that exist.
  const nav = [
    (property.coverPhoto || property.photos.length) && { id: "foto", label: t("galPhotos") },
    isElegie && tElegie && { id: "elegie", label: tElegie("nav") },
    description && { id: "descrizione", label: t("descriptionTitle") },
    approfondimento && { id: "approfondimento", label: approfondimento.voce },
    property.planimetrie.length && { id: "planimetrie", label: t("galPlans") },
    ytIds.length && { id: "video", label: t("galVideo") },
    property.matterportUrl && { id: "tour", label: t("galTour") },
    palazzo.length && { id: "stesso-palazzo", label: t("sameBuildingNav") },
    hasLocation && { id: "posizione", label: t("locationTitle") },
    // Niente voce «AI» qui (v1.3, review di misura del 02/10): restava
    // accesa per tutto lo scorrimento, il segno AI più persistente della
    // pagina. Il riepilogo resta in fondo al dossier, e la pillola della
    // copertina, quando c'è, ci porta.
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  // Dati strutturati della scheda, dalla lettura unica delle dotazioni (`dot`).
  // Esce solo ciò che si sa — true = c'è, false = il CRM dice di no ("No",
  // "Nessuno") — e il resto si tace. Il commento che stava qui («il campo è
  // popolato SOLO quando la dotazione c'è») era falso.
  const amenities = vociSchema(dot, {
    terrazzo: t("terrace"),
    balcone: t("balcony"),
    giardino: t("garden"),
    piscina: t("pool"),
    ascensore: t("elevator"),
    parcheggio: t("parking"),
    accessoDisabili: t("accessibility"),
  });

  const path = `/annuncio/${property.slug}`;

  return (
    <article>
      {/* Annota questa scheda: al ritorno /immobili ci si riapre sopra. */}
      <RicordaScheda slug={property.slug} />
      <JsonLd
        data={[
          listingJsonLd({
            locale,
            path,
            title,
            description: property.oneliner ?? description ?? null,
            tipologia: property.tipologia,
            contratto: property.contratto,
            via: property.via,
            comune: property.comune,
            mq: property.mq,
            camere: property.camere,
            baths: property.baths,
            floor: property.floor,
            annoCostruzione: property.annoCostruzione,
            priceSale: property.priceSale,
            priceRent: property.priceRent,
            trattativaRiservata: property.trattativaRiservata,
            venduto: isSold(property),
            onlineDa: property.onlineDa,
            amenities,
          }),
          breadcrumbJsonLd(locale, [
            { name: "TriesteImmobiliare", path: "/" },
            { name: tNav("properties"), path: "/immobili" },
            { name: title, path },
          ]),
        ]}
      />
      {/* Cinematic hero — parallax cover, shared-element morph target */}
      <Scene as="header" mode="cover" smooth={0.14} className="relative min-h-[82vh] overflow-hidden bg-ink-2 sm:h-[82vh] sm:min-h-[520px]">
        {/* L'alt delle foto nasce dal titolo italiano in mapRecord (che non conosce
            il locale): sull'immagine principale usiamo il titolo localizzato. Le foto
            della galleria restano con l'alt costruito in mapRecord. */}
        {/* Qui stava il buco più grosso del sito: `.url` è l'ORIGINALE Airtable,
            e con images.unoptimized arrivava intero al browser. Il 2026-07-30 in
            produzione era un PNG da 6,49 MB su una scheda da 12,46 MB di sole
            immagini. Ora passa dal proxy, in WebP; e il srcSet è quello che
            salva il telefono, perché con sizes="100vw" su un 390 a DPR 2 ne
            servono 780 px e senza ladder si scaricavano comunque i 2000. */}
        {(property.coverPhoto ?? property.photos[0]) ? (
          <ViewTransition name={`prop-${property.slug}`} share="morph">
            <PhotoImg
              src={photoSrc((property.coverPhoto ?? property.photos[0])!, 2000)}
              srcSet={photoSrcSet((property.coverPhoto ?? property.photos[0])!, HERO_WIDTHS)}
              sizes="100vw"
              alt={title}
              priority
              className="par-zoom object-cover"
            />
          </ViewTransition>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark to-ink" />
        )}
        {/* Video di testata mp4 (content/annunciVideo.ts): layer client-only,
            fratello della copertina e PRIMA del velo di gradiente — la foto
            resta opaca sotto (LCP e snapshot del morph al «← Torna»), il velo
            resta sopra il video a tenere leggibile il testo. Sale sulla
            copertina solo quando il filmato suona davvero; fascia 16:9 sotto
            i 640 px, pausa, frase AI sul video quando `ai`, etichetta del
            registro del CRM. Nell'HTML iniziale non c'è nessun <video>. */}
        {heroMp4 && (
          <SfondoVideo
            video={heroMp4}
            locale={locale}
            title={title}
            fascia
            velo
            layerClassName="par-zoom"
            etichetta={heroMp4Ai}
            etichettaClassName={POSTO_ETICHETTA_VIDEO}
            linkAi={heroMp4LinkAi ? { href: heroMp4LinkAi, testo: tTrasp.linkAi } : null}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/10 to-ink/90" />
        {/* L'etichetta AI della copertina, in alto a destra sotto la testata.
            Con il riepilogo in pagina è anche la scorciatoia per leggerlo.
            Con un video di testata: scende sotto la riga dei tasti del video
            (top-24 + h-11) e sparisce mentre il video si vede — il
            `[data-video-visibile]` di SfondoVideo, fratello PRECEDENTE, la
            nasconde col combinatore `~`: l'etichetta parla della foto, non
            del filmato. Senza video, la classe di sempre. */}
        {heroAi?.etichetta && (
          <div
            className={
              heroMp4
                ? "pointer-events-none absolute inset-x-0 top-[9.25rem] z-[1] mx-auto flex max-w-5xl justify-end px-6 [[data-video-visibile]~&]:hidden"
                : "pointer-events-none absolute inset-x-0 top-24 z-[1] mx-auto flex max-w-5xl justify-end px-6"
            }
          >
            {mostraFotoAi ? (
              <a
                href="#foto-ai"
                className="pointer-events-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand"
              >
                <EtichettaAi testo={heroAi.etichetta} aria={heroAi.aria} forma="estesa" />
              </a>
            ) : (
              <EtichettaAi testo={heroAi.etichetta} aria={heroAi.aria} forma="estesa" />
            )}
          </div>
        )}

        <div className="absolute left-0 right-0 top-24 mx-auto max-w-5xl px-6">
          <Link
            href="/immobili"
            transitionTypes={["nav-back"]}
            className="group/back text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <span className="inline-block transition-transform duration-300 ease-[var(--ease-lux)] group-hover/back:-translate-x-1">
              ←
            </span>{" "}
            {t("backToList")}
          </Link>
        </div>

        {/* Sotto 640px il blocco sta nel flusso (pt-40 lascia libere testata fissa e
            «Torna agli immobili») e l'hero cresce con lui: ancorato in basso a
            un'altezza fissa, su un telefono da 320 px la riga dei badge finiva
            sotto la testata (misurato l'11/09). Da sm in su torna assoluto in
            fondo all'hero, com'era. Stessa correzione del gemello TSV. */}
        {/* Con un video di testata, sotto 640px il padding fa posto anche alla
            sua fascia 16:9: top-36 (9rem) + 56.25vw di altezza + 0.75rem di
            respiro — la stessa aritmetica di triestevillas.com. Riservato già
            dal server: niente salto di layout quando il video si accende. */}
        <div
          className={
            heroMp4
              ? "relative mx-auto max-w-5xl px-6 pb-12 pt-[calc(9.75rem+56.25vw)] sm:absolute sm:inset-x-0 sm:bottom-0 sm:pt-0"
              : "relative mx-auto max-w-5xl px-6 pb-12 pt-40 sm:absolute sm:inset-x-0 sm:bottom-0 sm:pt-0"
          }
        >
          <div className="flex flex-wrap items-center gap-2" data-reveal="now">
            {soldBadge(property, t) && <PropertyBadge {...soldBadge(property, t)!} />}
            <PropertyBadge {...contractBadge(property, t)} />
            {clusterBadge(property, t) && (
              <PropertyBadge {...clusterBadge(property, t)!} />
            )}
            {isElegie && <ElegieChip property={property} locale={locale} sito={SITO} />}
          </div>
          <h1 className="display-chapter mt-4 max-w-3xl text-white [text-shadow:0_4px_30px_rgba(0,0,0,0.5)]">
            {title}
          </h1>
          {/* Bianco quasi pieno con un'ombra: il grigio /65 su una foto
              movimentata si leggeva male (audit visivo del 07/10). */}
          <p className="mt-2 text-sm text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.65)]">
            {t("reference")} {property.id}
            {place && (
              <>
                {" · "}
                {hasLocation ? (
                  <a href="#posizione" className="underline-offset-2 hover:text-white hover:underline">
                    {place}
                  </a>
                ) : (
                  place
                )}
              </>
            )}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="text-3xl font-semibold tracking-tight text-white">
              {priceLabel(property, locale, t)}
            </p>
          </div>
          {/* CTA in evidenza: prenotazione visita (link esterno, es. Open Day) e
              tour 3D immersivo. Guidate dai dati — compaiono solo se valorizzati.
              Il tour è ANCHE embeddato più in basso (sezione #tour); questo è
              l'accesso rapido a schermo intero. */}
          {(property.bookingUrl || property.matterportUrl) && (
            <div className="mt-5 flex flex-wrap items-center gap-3" data-reveal>
              {property.bookingUrl && (
                <a
                  href={property.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {tLead("visitCta")}
                </a>
              )}
              {property.matterportUrl && (
                <a
                  href={property.matterportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
                  </svg>
                  {t("galTour")}
                </a>
              )}
            </div>
          )}
          {/* Un solo linguaggio di feedback: cuore + avviso prezzo + "non fa
              per me" — i pollici in fondo pagina non esistono più. */}
          <div className="mt-4">
            <PropertyActions slug={property.slug} />
          </div>
        </div>
      </Scene>
      {/* Tracker view+dwell: attivo solo per utenti loggati, renderizza nulla. */}
      <DwellTracker slug={property.slug} />

      {/* Paper sheet — the dossier */}
      <div className="relative z-10 -mt-5 rounded-t-[2.25rem] bg-paper text-neutral-900 shadow-[0_-24px_60px_rgba(15,39,55,0.16)]">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-8">
          {nav.length > 1 && (
            <StickyNav
              title={title}
              reference={`${t("reference")} ${property.id}`}
              items={nav}
            />
          )}

          {/* I riquadri in evidenza (content/annunciRiquadri.ts): i due o tre
              fatti che contano più della tabella, subito sotto prezzo e
              titolo. Senza voce nel registro non c'è niente. */}
          <RiquadriEvidenza riquadri={riquadri} etichetta={t("highlightsLabel")} />

          {/* Concierge AI subito sotto il hero, ben visibile — non più sepolto
              in fondo. Col contesto della scheda: "questa casa" per lui È
              questa casa. Widget dark → card scura nella zona paper. */}
          <div className="mt-6 rounded-2xl bg-ink px-4 pb-4 pt-5" data-reveal>
            {/* `city` non esce da qui: disambigua la ricerca su Google Maps quando
                il concierge cita la via senza ripetere il comune. Il ripiego su
                "Trieste" è la stessa convenzione dei dati strutturati (lib/seo)
                — comune vuoto in scheda non è un immobile altrove. */}
            <BuyerConcierge
              context={{ slug: property.slug, title, city: property.comune ?? "Trieste" }}
            />
          </div>
          <AccountPerks />

          <div className="mt-6">
            <PhotoGallery
              cover={property.coverPhoto ? loc(property.coverPhoto) : null}
              topPhotos={property.topPhotos.map(loc)}
              allPhotos={property.photos.map(loc)}
              compact
              labels={{
                // Il conteggio deve essere quello della lista VERA del
                // lightbox (copertina + curate + tutte, senza doppioni), non
                // quello del solo campo `foto`: altrimenti l'etichetta
                // promette dieci foto e la griglia ne apre altre.
                viewAll: t("galViewAll", {
                  count: gallerySet(property.coverPhoto, property.topPhotos, property.photos).length,
                }),
                close: t("galClose"),
                photosComing: t("photosComing"),
                grid: t("galGrid"),
              }}
            />
          </div>


          {isElegie && (
            <ElegieDuinoInvito property={property} title={title} locale={locale} sito={SITO} />
          )}
          <PropertyCharacteristics
            title={t("characteristicsTitle")}
            items={characteristics}
            primaryCount={8}
            moreLabel={t("showAllFeatures")}
            lessLabel={t("showLess")}
          />

          {description && (
            <section id="descrizione" className="mt-8 scroll-mt-32" data-reveal>
              <h2 className="text-lg font-semibold">{t("descriptionTitle")}</h2>
              {/* 68ch: a tutta larghezza correva per ~140 caratteri a riga
                  su desktop (audit visivo del 07/10), come TSV e TA ora no. */}
              <div className="mt-3 max-w-[68ch] space-y-4 leading-relaxed text-neutral-700">
                {toParagraphs(description).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          <ApprofondimentoAnnuncio approfondimento={approfondimento} altro={t("deepDiveMore")} />

          {hasCosts && taxData && <TaxBox data={taxData} labels={taxLabels} locale={locale} />}

          <Planimetrie
            items={property.planimetrie}
            title={t("galPlans")}
            closeLabel={t("galClose")}
          />

          {isElegie && <ElegiePlansHint property={property} locale={locale} sito={SITO} />}

          {ytIds.length > 0 && (
            <section id="video" className="mt-8 scroll-mt-32">
              <h2 className="text-lg font-semibold">{t("galVideo")}</h2>
              <div className="mt-3 space-y-4">
                {ytIds.map((id, i) => {
                  // Trasparenza AI (SPEC v1.2 §10.1): con un'etichetta nel
                  // registro dei video del CRM, il player etichettato
                  // (VideoYoutube); senza, l'iframe di prima, identico — più
                  // la didascalia, se la riga ne ha una senza etichetta.
                  const ai = videoAiYt[i];
                  if (ai?.etichetta) {
                    return <VideoYoutube key={id} id={id} title={title} ai={ai} fsLabel={fsLabel} />;
                  }
                  const player = (
                    <div
                      key={id}
                      className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900"
                    >
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${id}`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    </div>
                  );
                  if (!ai?.didascalia) return player;
                  return (
                    <figure key={id}>
                      {player}
                      <figcaption className="mt-2 text-xs leading-snug text-neutral-500">{ai.didascalia}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {property.matterportUrl && (
            <section id="tour" className="mt-8 scroll-mt-32">
              <h2 className="text-lg font-semibold">{t("galTour")}</h2>
              <TourFrame
                src={property.matterportUrl}
                title={t("galTour")}
                fsLabel={fsLabel}
              />
            </section>
          )}

          {palazzo.length > 0 && (
            <section id="stesso-palazzo" className="mt-10 scroll-mt-32" data-reveal>
              <h2 className="text-lg font-semibold">{t("sameBuildingTitle")}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {t("sameBuildingLead", { n: palazzo.length })}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2" data-reveal-stagger>
                {palazzo.map((p) => (
                  <PropertyCard
                    key={p.slug}
                    view={buildPropertyView(p, locale, t, tZones(zoneKey(p)))}
                    photosComing={t("photosComing")}
                  />
                ))}
              </div>
            </section>
          )}

          {chips.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t("featuresTitle")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasLocation && (
            <section id="posizione" className="mt-8 scroll-mt-32">
              <h2 className="text-lg font-semibold">{t("locationTitle")}</h2>
              <div className="mt-3">
                <PropertyMap lat={property.lat!} lng={property.lng!} />
              </div>
              <p className="mt-2 text-sm text-neutral-500">{t("locationApprox")}</p>
            </section>
          )}

          {/* Riepilogo della trasparenza AI (SPEC §5.3 + §9.3, snellito dalla
              v1.3 §11.2 del 02/10): in chiusura del dossier, prima dei moduli
              di contatto, nella grafica delle altre sezioni della scheda.
              Visibili solo il titolo, UNA riga calcolata dai conteggi (mai
              scritta a mano: rigaRiepilogo) e «La visita resta l'unico
              riferimento.»; il resto — la nota completa del CRM, i conteggi per
              tipo, il link a /ai — sta dentro «Leggi come le abbiamo
              ritoccate», chiuso di default. Niente tessere coi numeri grandi:
              «40 / 40» in evidenza era rumore. I numeri si contano sulle foto
              che la pagina mostra davvero (stessa lista del lightbox). */}
          {mostraFotoAi && trasp && (
            <section id="foto-ai" className="mt-10 scroll-mt-32 border-t border-neutral-200 pt-8" data-reveal>
              <h2 className="text-lg font-semibold">{tTrasp.titolo}</h2>
              {/* La riga e la chiusura nello stesso paragrafo, di peso normale:
                  in grassetto «La visita resta…» era la riga più forte del
                  blocco e suonava come una clausola (review del 02/10). */}
              <p className="mt-3 max-w-prose leading-relaxed text-neutral-700">
                {rigaAi}
                {rigaAi && chiusuraAi && " "}
                {chiusuraAi}
              </p>
              <details className="mt-3 max-w-prose">
                <summary className="cursor-pointer text-sm font-semibold text-brand underline-offset-4 hover:underline">
                  {comandoDettaglio(trasp.conteggi, locale, notaDettaglio != null)}
                </summary>
                <div className="mt-3 space-y-5 leading-relaxed text-neutral-700">
                  {notaDettaglio && (
                    <div className="space-y-3">
                      {toParagraphs(notaDettaglio).map((par, i) => (
                        <p key={i}>{par}</p>
                      ))}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800">{tTrasp.tipiTitolo}</h3>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {righeDettaglio(trasp, locale).map((r) => (
                        <li key={r.chiave} className="flex items-baseline gap-2.5">
                          <span className="w-7 shrink-0 text-right font-semibold tabular-nums text-ink">{r.n}</span>
                          <span>
                            {r.pillola && (
                              <span className="mr-2 inline-flex select-none items-center whitespace-nowrap rounded bg-ink/85 px-1.5 py-0.5 text-[11px] font-semibold leading-none tracking-wide text-white">
                                {r.pillola}
                              </span>
                            )}
                            {r.testo}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {linkAi && (
                    // Un altro sito del gruppo: si apre accanto, la scheda resta.
                    <a
                      href={linkAi}
                      target="_blank"
                      rel="noopener"
                      className="inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
                    >
                      {tTrasp.linkAi} ↗
                    </a>
                  )}
                </div>
              </details>
            </section>
          )}

          {/* immobileNome resta il titolo ITALIANO in tutti e tre i locali: finisce
              nel CRM come identità del record, e un immobile deve avere un nome solo
              qualunque sia la lingua del visitatore (la lingua viaggia già in `lingua`).
              Stessa regola del log visite della Private Collection. */}
          <LeadForm
            rif={property.id}
            immobileNome={property.title}
            url={`${SITE_URL}${locale === "it" ? "" : `/${locale}`}/annuncio/${property.slug}`}
            sito="triesteimmobiliare.com"
            lingua={locale}
          />

          {/* Anche qui il nome italiano: vedi la nota su LeadForm. */}
          <VisitForm
            rif={property.id}
            immobileNome={property.title}
            url={`${SITE_URL}${locale === "it" ? "" : `/${locale}`}/annuncio/${property.slug}`}
            sito="triesteimmobiliare.com"
            lingua={locale}
          />

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-500">
            <a className="hover:text-brand" href="mailto:info@triesteimmobiliare.com">
              info@triesteimmobiliare.com
            </a>
            {/* Linea unica del gruppo, telefono e WhatsApp (regola di Martino
                del 09/06/2026): sostituisce il 040 dell'ufficio. */}
            <a className="hover:text-brand" href="tel:+393318940822">
              {locale === "it" ? "331 8940822" : "+39 331 8940822"}
            </a>
          </div>

          {similar.length > 0 && (
            <section className="mt-12 border-t border-neutral-200 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("similarTitle")}
              </h2>
              <div
                className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-sm:[&>*:nth-child(4)]:hidden lg:[&>*:nth-child(4)]:hidden"
                data-reveal-stagger
              >
                {similar.map((p) => (
                  <PropertyCard
                    key={p.slug}
                    view={buildPropertyView(p, locale, t, tZones(zoneKey(p)))}
                    photosComing={t("photosComing")}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
