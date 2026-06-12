import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

type Section = { h: string; p: string };
type Content = { title: string; updated: string; intro: string; sections: Section[] };

const CONTROLLER =
  "TriesteVillas srl · Via Milano 5, 34132 Trieste (TS), Italia · C.F./P.IVA 01235580329 · " +
  "Email info@triesteimmobiliare.com · PEC milou@pec.emailc.it";

const CONTENT: Record<string, Content> = {
  it: {
    title: "Informativa sulla Privacy",
    updated: "Ultimo aggiornamento: giugno 2026",
    intro:
      "La presente informativa descrive come TriesteImmobiliare (marchio di TriesteVillas srl) tratta i dati personali raccolti tramite questo sito, ai sensi del Regolamento (UE) 2016/679 (GDPR).",
    sections: [
      { h: "1. Titolare del trattamento", p: CONTROLLER },
      {
        h: "2. Dati trattati",
        p: "Dati di contatto che fornisci volontariamente tramite i moduli (nome, email, telefono, eventuale messaggio e immobile di interesse) e dati tecnici di navigazione (es. indirizzo IP, tipo di browser) raccolti tramite cookie tecnici necessari al funzionamento del sito.",
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
        p: "I dati possono essere trattati da nostri collaboratori autorizzati e da fornitori che agiscono come responsabili del trattamento per i servizi tecnici del sito (in particolare Airtable per la gestione dei contatti, Vercel per l'hosting e un provider di posta per l'invio delle email). I dati non sono diffusi.",
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
        p: "Il sito utilizza cookie tecnici necessari al funzionamento. Eventuali servizi di terze parti (es. mappe, video) possono impostare cookie propri quando ne attivi i contenuti.",
      },
      {
        h: "10. Modifiche",
        p: "Possiamo aggiornare questa informativa; la versione vigente è sempre pubblicata su questa pagina.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: June 2026",
    intro:
      "This policy explains how TriesteImmobiliare (a TriesteVillas srl brand) processes the personal data collected through this website, under Regulation (EU) 2016/679 (GDPR).",
    sections: [
      { h: "1. Data controller", p: CONTROLLER },
      {
        h: "2. Data we process",
        p: "Contact details you voluntarily provide through the forms (name, email, phone, any message and the property of interest) and technical browsing data (e.g. IP address, browser type) collected via technical cookies required for the site to work.",
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
        p: "Data may be handled by our authorised staff and by suppliers acting as data processors for the site's technical services (notably Airtable for contact management, Vercel for hosting and an email provider for sending emails). Data is not disseminated.",
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
        p: "The site uses technical cookies required for operation. Third-party services (e.g. maps, video) may set their own cookies when you activate their content.",
      },
      {
        h: "10. Changes",
        p: "We may update this policy; the current version is always published on this page.",
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: Juni 2026",
    intro:
      "Diese Erklärung beschreibt, wie TriesteImmobiliare (eine Marke der TriesteVillas srl) die über diese Website erhobenen personenbezogenen Daten gemäß der Verordnung (EU) 2016/679 (DSGVO) verarbeitet.",
    sections: [
      { h: "1. Verantwortlicher", p: CONTROLLER },
      {
        h: "2. Verarbeitete Daten",
        p: "Kontaktdaten, die Sie freiwillig über die Formulare angeben (Name, E-Mail, Telefon, ggf. Nachricht und betreffende Immobilie), sowie technische Nutzungsdaten (z. B. IP-Adresse, Browsertyp), die über technisch notwendige Cookies erfasst werden.",
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
        p: "Die Daten können von autorisierten Mitarbeitern und von Dienstleistern als Auftragsverarbeiter für die technischen Dienste der Website verarbeitet werden (insbesondere Airtable für die Kontaktverwaltung, Vercel für das Hosting und ein E-Mail-Anbieter für den Versand). Die Daten werden nicht verbreitet.",
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
        p: "Die Website verwendet technisch notwendige Cookies. Dienste Dritter (z. B. Karten, Videos) können eigene Cookies setzen, wenn Sie deren Inhalte aktivieren.",
      },
      {
        h: "10. Änderungen",
        p: "Wir können diese Erklärung aktualisieren; die jeweils gültige Fassung ist stets auf dieser Seite veröffentlicht.",
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
  return { title: (CONTENT[locale] ?? CONTENT.it).title };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTENT[locale] ?? CONTENT.it;

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
