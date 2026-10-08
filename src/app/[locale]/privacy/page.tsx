import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type Section = { h: string; p: string };
type Content = { title: string; updated: string; intro: string; sections: Section[] };

const CONTROLLER =
  "TriesteVillas srl · Via Milano 5, 34132 Trieste (TS), Italia · C.F./P.IVA 01235580329 · " +
  "Email info@triesteimmobiliare.com · PEC milou@pec.emailc.it";

// Una voce per OGNI lingua del router, imposta dal tipo: con `Record<string,…>`
// una lingua dimenticata faceva uscire l'informativa in italiano senza che
// nulla lo segnalasse (lo sloveno è entrato il 2026-10-01).
const CONTENT: Record<Locale, Content> = {
  it: {
    title: "Informativa sulla Privacy",
    updated: "Ultimo aggiornamento: ottobre 2026",
    intro:
      "La presente informativa descrive come TriesteImmobiliare (marchio di TriesteVillas srl) tratta i dati personali raccolti tramite questo sito, ai sensi del Regolamento (UE) 2016/679 (GDPR).",
    sections: [
      { h: "1. Titolare del trattamento", p: CONTROLLER },
      {
        h: "2. Dati trattati",
        p: "Dati di contatto che fornisci volontariamente tramite i moduli (nome, email, telefono, eventuale messaggio e immobile di interesse) e dati tecnici di navigazione (es. indirizzo IP, tipo di browser) raccolti tramite cookie tecnici necessari al funzionamento del sito. Se scrivi all'assistente AI del sito, anche il testo delle conversazioni, che vengono registrate e possono essere rilette dal nostro team.",
      },
      {
        h: "3. Finalità e base giuridica",
        p: "Trattiamo i dati per rispondere alle tue richieste e gestire la relazione (esecuzione di misure precontrattuali e tuo consenso) e per adempiere a obblighi di legge. Il conferimento è facoltativo, ma senza i dati di contatto non possiamo dare seguito alla richiesta.",
      },
      {
        h: "4. Funzione “Invia a un amico”",
        p: "Se usi la funzione per segnalare un immobile a un'altra persona, ci confermi di aver ottenuto il suo consenso a ricevere la comunicazione. Utilizziamo l'indirizzo del destinatario solo per inviare quella singola segnalazione.",
      },
      {
        h: "5. Modalità e conservazione",
        p: "I dati sono trattati con strumenti elettronici e misure di sicurezza adeguate, e conservati per il tempo necessario a gestire la richiesta e per i successivi obblighi di legge, dopodiché vengono cancellati o anonimizzati.",
      },
      {
        h: "6. Destinatari e responsabili",
        p: "I dati possono essere trattati da nostri collaboratori autorizzati e da fornitori che agiscono come responsabili del trattamento per i servizi tecnici del sito, in particolare: i fornitori di hosting e database del gestionale interno del gruppo (CRM), dove arrivano richieste e contatti; Airtable, per alcune funzioni non ancora passate al gestionale, tra cui l'area riservata e la Private Collection; Anthropic, per il modello dell'assistente AI e per gli strumenti di intelligenza artificiale usati nel gestionale; Vercel per l'hosting del sito; un provider di posta per l'invio delle email. I dati non sono diffusi.",
      },
      {
        h: "7. Trasferimenti extra-UE",
        p: "Alcuni fornitori possono trattare i dati al di fuori dell'Unione Europea; in tal caso il trasferimento avviene sulla base di garanzie adeguate (es. clausole contrattuali standard della Commissione Europea).",
      },
      {
        h: "8. I tuoi diritti",
        p: "Puoi esercitare in qualsiasi momento i diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, oltre a revocare il consenso, scrivendo a info@triesteimmobiliare.com. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali.",
      },
      {
        h: "9. Cookie",
        p: "Il sito usa cookie tecnici necessari al funzionamento e, solo con il tuo consenso, cookie di statistica di Google Analytics 4 (Google Ireland Ltd) per capire come viene usato il sito. Il tag di Google si carica in ogni visita in modalità di consenso (Consent Mode v2), con l'archiviazione delle statistiche negata: fino alla tua scelta non scrive nessun cookie di statistica, ma può inviare a Google segnali senza cookie e senza identificativi, che Google usa per stime aggregate. Puoi cambiare idea in ogni momento dal link «Preferenze cookie» in fondo a ogni pagina. Nessuna pubblicità, nessuna profilazione. Eventuali servizi di terze parti (es. mappe, video) possono impostare cookie propri quando ne attivi i contenuti.",
      },
      {
        h: "10. Area riservata e personalizzazione",
        p: "Se crei un account, trattiamo i dati del profilo (nome, email, telefono, preferenze dichiarate) e registriamo la tua attività sul sito da utente autenticato — immobili aperti, tempo di permanenza sulle schede, preferiti, valutazioni e ricerche — per fornirti il servizio (salvataggio preferiti, area personale) e, sulla base del nostro legittimo interesse, per organizzare internamente il follow-up delle richieste. Le proposte personalizzate e le comunicazioni commerciali via email avvengono solo con i consensi facoltativi che puoi dare e revocare in ogni momento dalla tua area account. Gli eventi di navigazione grezzi sono conservati per 18 mesi, poi cancellati o aggregati. Puoi chiedere la cancellazione dell'account direttamente dall'area personale.",
      },
      {
        h: "11. Modifiche",
        p: "Possiamo aggiornare questa informativa; la versione vigente è sempre pubblicata su questa pagina.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 2026",
    intro:
      "This policy explains how TriesteImmobiliare (a TriesteVillas srl brand) processes the personal data collected through this website, under Regulation (EU) 2016/679 (GDPR).",
    sections: [
      { h: "1. Data controller", p: CONTROLLER },
      {
        h: "2. Data we process",
        p: "Contact details you voluntarily provide through the forms (name, email, phone, any message and the property of interest) and technical browsing data (e.g. IP address, browser type) collected via technical cookies required for the site to work. If you write to the site's AI assistant, also the text of the conversations, which are recorded and may be read back by our team.",
      },
      {
        h: "3. Purposes and legal basis",
        p: "We process the data to respond to your requests and manage the relationship (pre-contractual measures and your consent) and to comply with legal obligations. Providing data is optional, but without contact details we cannot follow up on your request.",
      },
      {
        h: "4. “Send to a friend” feature",
        p: "If you use the feature to share a property with another person, you confirm you have their consent to receive the message. We use the recipient's address only to send that single referral.",
      },
      {
        h: "5. Processing and retention",
        p: "Data is processed with electronic tools and appropriate security measures, and kept for as long as needed to handle the request and for subsequent legal obligations, after which it is deleted or anonymised.",
      },
      {
        h: "6. Recipients and processors",
        p: "Data may be handled by our authorised staff and by suppliers acting as data processors for the site's technical services, notably: the hosting and database providers of the group's internal management system (CRM), where requests and contacts arrive; Airtable, for some functions not yet moved to the management system, including the reserved area and the Private Collection; Anthropic, for the AI assistant's model and for the artificial intelligence tools used in the management system; Vercel for hosting the site; an email provider for sending emails. Data is not disseminated.",
      },
      {
        h: "7. Non-EU transfers",
        p: "Some suppliers may process data outside the European Union; where this happens, the transfer is based on appropriate safeguards (e.g. the European Commission's standard contractual clauses).",
      },
      {
        h: "8. Your rights",
        p: "You may at any time exercise the rights of access, rectification, erasure, restriction, objection and portability, and withdraw consent, by writing to info@triesteimmobiliare.com. You also have the right to lodge a complaint with the Italian Data Protection Authority.",
      },
      {
        h: "9. Cookies",
        p: "The site uses technical cookies required for operation and, only with your consent, Google Analytics 4 statistics cookies (Google Ireland Ltd) to understand how the site is used. Google's tag loads on every visit in consent mode (Consent Mode v2), with analytics storage denied: until you choose it sets no statistics cookie, but it may send Google cookieless signals without identifiers, which Google uses for aggregate estimates. You can change your mind at any time via the “Cookie preferences” link at the bottom of every page. No advertising, no profiling. Third-party services (e.g. maps, video) may set their own cookies when you activate their content.",
      },
      {
        h: "10. Account area and personalisation",
        p: "If you create an account, we process your profile data (name, email, phone, stated preferences) and log your on-site activity as an authenticated user — properties opened, time spent on listings, favourites, ratings and searches — to provide the service (saved favourites, personal area) and, on the basis of our legitimate interest, to organise the follow-up of enquiries internally. Personalised proposals and commercial emails only happen with the optional consents you can give and withdraw at any time from your account area. Raw browsing events are kept for 18 months, then deleted or aggregated. You can request the deletion of your account directly from your personal area.",
      },
      {
        h: "11. Changes",
        p: "We may update this policy; the current version is always published on this page.",
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: Oktober 2026",
    intro:
      "Diese Erklärung beschreibt, wie TriesteImmobiliare (eine Marke der TriesteVillas srl) die über diese Website erhobenen personenbezogenen Daten gemäß der Verordnung (EU) 2016/679 (DSGVO) verarbeitet.",
    sections: [
      { h: "1. Verantwortlicher", p: CONTROLLER },
      {
        h: "2. Verarbeitete Daten",
        p: "Kontaktdaten, die Sie freiwillig über die Formulare angeben (Name, E-Mail, Telefon, ggf. Nachricht und betreffende Immobilie), sowie technische Nutzungsdaten (z. B. IP-Adresse, Browsertyp), die über technisch notwendige Cookies erfasst werden. Wenn Sie dem KI-Assistenten der Website schreiben, auch der Text der Gespräche, die aufgezeichnet werden und von unserem Team nachgelesen werden können.",
      },
      {
        h: "3. Zwecke und Rechtsgrundlage",
        p: "Wir verarbeiten die Daten, um Ihre Anfragen zu beantworten und die Beziehung zu verwalten (vorvertragliche Maßnahmen und Ihre Einwilligung) sowie zur Erfüllung gesetzlicher Pflichten. Die Angabe ist freiwillig, ohne Kontaktdaten können wir Ihre Anfrage jedoch nicht bearbeiten.",
      },
      {
        h: "4. Funktion „An einen Freund senden“",
        p: "Wenn Sie eine Immobilie an eine andere Person weiterempfehlen, bestätigen Sie, deren Einwilligung zum Erhalt der Mitteilung zu haben. Die Adresse des Empfängers wird nur für diese einzelne Empfehlung verwendet.",
      },
      {
        h: "5. Verarbeitung und Speicherung",
        p: "Die Daten werden mit elektronischen Mitteln und angemessenen Sicherheitsmaßnahmen verarbeitet und so lange gespeichert, wie es zur Bearbeitung der Anfrage und für gesetzliche Pflichten erforderlich ist; danach werden sie gelöscht oder anonymisiert.",
      },
      {
        h: "6. Empfänger und Auftragsverarbeiter",
        p: "Die Daten können von autorisierten Mitarbeitern und von Dienstleistern als Auftragsverarbeiter für die technischen Dienste der Website verarbeitet werden, insbesondere: die Hosting- und Datenbankanbieter des internen Verwaltungssystems der Gruppe (CRM), in dem Anfragen und Kontakte eingehen; Airtable für einige noch nicht in das Verwaltungssystem überführte Funktionen, darunter der geschützte Bereich und die Private Collection; Anthropic für das Modell des KI-Assistenten und für die im Verwaltungssystem eingesetzten KI-Werkzeuge; Vercel für das Hosting der Website; ein E-Mail-Anbieter für den Versand. Die Daten werden nicht verbreitet.",
      },
      {
        h: "7. Übermittlung außerhalb der EU",
        p: "Einige Dienstleister können Daten außerhalb der Europäischen Union verarbeiten; in diesem Fall erfolgt die Übermittlung auf Grundlage geeigneter Garantien (z. B. Standardvertragsklauseln der Europäischen Kommission).",
      },
      {
        h: "8. Ihre Rechte",
        p: "Sie können jederzeit die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit ausüben sowie Ihre Einwilligung widerrufen, indem Sie an info@triesteimmobiliare.com schreiben. Zudem haben Sie das Recht, Beschwerde bei der italienischen Datenschutzbehörde einzulegen.",
      },
      {
        h: "9. Cookies",
        p: "Die Website verwendet technisch notwendige Cookies und, nur mit Ihrer Einwilligung, Statistik-Cookies von Google Analytics 4 (Google Ireland Ltd), um die Nutzung der Website zu verstehen. Das Google-Tag lädt bei jedem Besuch im Einwilligungsmodus (Consent Mode v2), mit abgelehnter Speicherung für Statistiken: Bis zu Ihrer Entscheidung setzt es kein Statistik-Cookie, kann Google aber Signale ohne Cookies und ohne Kennungen senden, die Google für zusammengefasste Schätzungen nutzt. Sie können Ihre Wahl jederzeit über den Link „Cookie-Einstellungen“ am Ende jeder Seite ändern. Keine Werbung, kein Profiling. Dienste Dritter (z. B. Karten, Videos) können eigene Cookies setzen, wenn Sie deren Inhalte aktivieren.",
      },
      {
        h: "10. Kontobereich und Personalisierung",
        p: "Wenn Sie ein Konto erstellen, verarbeiten wir Ihre Profildaten (Name, E-Mail, Telefon, erklärte Präferenzen) und protokollieren Ihre Aktivität als angemeldeter Nutzer — geöffnete Objekte, Verweildauer auf Exposés, Favoriten, Bewertungen und Suchen —, um den Dienst zu erbringen (gespeicherte Favoriten, persönlicher Bereich) und, auf Grundlage unseres berechtigten Interesses, die interne Bearbeitung von Anfragen zu organisieren. Personalisierte Vorschläge und werbliche E-Mails erfolgen nur mit den optionalen Einwilligungen, die Sie jederzeit in Ihrem Kontobereich erteilen und widerrufen können. Roh-Navigationsdaten werden 18 Monate aufbewahrt, danach gelöscht oder aggregiert. Die Löschung des Kontos können Sie direkt im persönlichen Bereich beantragen.",
      },
      {
        h: "11. Änderungen",
        p: "Wir können diese Erklärung aktualisieren; die jeweils gültige Fassung ist stets auf dieser Seite veröffentlicht.",
      },
    ],
  },
  sl: {
    title: "Obvestilo o zasebnosti",
    updated: "Zadnja posodobitev: oktober 2026",
    intro:
      "To obvestilo opisuje, kako TriesteImmobiliare (blagovna znamka družbe TriesteVillas srl) obdeluje osebne podatke, zbrane prek te spletne strani, v skladu z Uredbo (EU) 2016/679 (Splošna uredba o varstvu podatkov – GDPR).",
    sections: [
      { h: "1. Upravljavec", p: CONTROLLER },
      {
        h: "2. Obdelovani podatki",
        p: "Kontaktni podatki, ki jih prostovoljno posredujete prek obrazcev (ime, e-pošta, telefon, morebitno sporočilo in nepremičnina, ki vas zanima), ter tehnični podatki o brskanju (npr. naslov IP, vrsta brskalnika), zbrani prek tehničnih piškotkov, potrebnih za delovanje spletne strani. Če pišete pomočniku UI na spletni strani, tudi besedilo pogovorov, ki se beležijo in jih naša ekipa lahko ponovno prebere.",
      },
      {
        h: "3. Nameni in pravna podlaga",
        p: "Podatke obdelujemo, da odgovorimo na vaša povpraševanja in vodimo odnos z vami (izvajanje predpogodbenih ukrepov in vaša privolitev) ter da izpolnimo zakonske obveznosti. Posredovanje podatkov je prostovoljno, vendar brez kontaktnih podatkov povpraševanja ne moremo obravnavati.",
      },
      {
        h: "4. Funkcija »Pošljite prijatelju«",
        p: "Če s to funkcijo nepremičnino priporočite drugi osebi, nam potrjujete, da ste pridobili njeno privolitev za prejem sporočila. Naslov prejemnika uporabimo samo za pošiljanje tega posameznega priporočila.",
      },
      {
        h: "5. Način obdelave in hramba",
        p: "Podatki se obdelujejo z elektronskimi sredstvi in ustreznimi varnostnimi ukrepi ter hranijo toliko časa, kolikor je potrebno za obravnavo povpraševanja in za poznejše zakonske obveznosti; nato se izbrišejo ali anonimizirajo.",
      },
      {
        h: "6. Prejemniki in obdelovalci",
        p: "Podatke lahko obdelujejo naši pooblaščeni sodelavci in ponudniki, ki kot obdelovalci skrbijo za tehnične storitve spletne strani, zlasti: ponudniki gostovanja in podatkovne baze notranjega upravljavskega sistema skupine (CRM), kamor prihajajo povpraševanja in stiki; Airtable za nekatere funkcije, ki še niso prenesene v upravljavski sistem, med njimi zaprto območje in Private Collection; Anthropic za model pomočnika UI in za orodja umetne inteligence, ki se uporabljajo v upravljavskem sistemu; Vercel za gostovanje spletne strani; ponudnik e-pošte za pošiljanje sporočil. Podatkov ne objavljamo.",
      },
      {
        h: "7. Prenosi zunaj EU",
        p: "Nekateri ponudniki lahko podatke obdelujejo zunaj Evropske unije; v tem primeru prenos temelji na ustreznih zaščitnih ukrepih (npr. standardnih pogodbenih klavzulah Evropske komisije).",
      },
      {
        h: "8. Vaše pravice",
        p: "Kadar koli lahko uveljavljate pravice do dostopa, popravka, izbrisa, omejitve obdelave, ugovora in prenosljivosti podatkov ter prekličete privolitev, tako da pišete na info@triesteimmobiliare.com. Prav tako imate pravico vložiti pritožbo pri italijanskem nadzornem organu za varstvo osebnih podatkov (Garante per la protezione dei dati personali).",
      },
      {
        h: "9. Piškotki",
        p: "Spletna stran uporablja tehnične piškotke, potrebne za delovanje, in – samo z vašo privolitvijo – statistične piškotke Google Analytics 4 (Google Ireland Ltd), s katerimi razumemo, kako se stran uporablja. Googlova oznaka se naloži ob vsakem obisku v načinu privolitve (Consent Mode v2), s shranjevanjem za statistiko zavrnjenim: dokler se ne odločite, ne shrani nobenega statističnega piškotka, lahko pa Googlu pošlje signale brez piškotkov in brez identifikatorjev, ki jih Google uporablja za združene statistične izračune. Svojo odločitev lahko kadar koli spremenite prek povezave »Nastavitve piškotkov« v nogi vsake strani. Brez oglaševanja, brez profiliranja. Storitve tretjih oseb (npr. zemljevidi, videoposnetki) lahko ob aktivaciji njihove vsebine nastavijo lastne piškotke.",
      },
      {
        h: "10. Uporabniški račun in prilagajanje",
        p: "Če ustvarite račun, obdelujemo podatke vašega profila (ime, e-pošta, telefon, navedene želje) in beležimo vašo dejavnost na strani kot prijavljenega uporabnika – odprte nepremičnine, čas, preživet na predstavitvah, priljubljene, ocene in iskanja –, da vam zagotovimo storitev (shranjene priljubljene, osebno območje) in da na podlagi našega zakonitega interesa interno organiziramo nadaljnjo obravnavo povpraševanj. Prilagojeni predlogi in komercialna sporočila po e-pošti se pošiljajo samo na podlagi neobveznih privolitev, ki jih lahko kadar koli podate in prekličete v svojem računu. Neobdelani dogodki brskanja se hranijo 18 mesecev, nato se izbrišejo ali združijo v zbirne podatke. Izbris računa lahko zahtevate neposredno v osebnem območju.",
      },
      {
        h: "11. Spremembe",
        p: "To obvestilo lahko posodobimo; veljavna različica je vedno objavljena na tej strani.",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: { absolute: t("privacy.title") },
    description: t("privacy.description"),
    alternates: pageAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTENT[locale as Locale] ?? CONTENT.it;

  return (
    <article className="mx-auto max-w-3xl px-4 pb-14 pt-32">
      <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-1 text-sm text-neutral-400">{c.updated}</p>
      <p className="mt-5 text-neutral-600">{c.intro}</p>
      <div className="mt-8 space-y-6">
        {c.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-semibold text-neutral-900">{s.h}</h2>
            <p className="mt-1 leading-relaxed text-neutral-600">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
