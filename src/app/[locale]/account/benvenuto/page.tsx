import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { acctGateConfigured } from "@/lib/account/session";
import { currentWebAccount } from "@/lib/account/auth";
import { findAccountByEmail } from "@/lib/account/store";
import { gettoneBuono, sceltaVista, type InvitoLetto } from "@/lib/account/benvenuto";
import { pAccountInvito, pAccountInvitoUsato } from "@/lib/private/porta";
import BenvenutoForm, { BenvenutoAccesso } from "@/components/account/BenvenutoForm";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// LO SPAZIO PERSONALE GIÀ PRONTO (09/10/2026) — la pagina del link del CRM.
//
// A chi ha visitato una casa con noi il CRM manda `…/account/benvenuto?k=<gettone>`:
// un clic, una password, ed è dentro, con nome ed email già compilati. Nessun
// account nasce senza quel gesto, nessuna password viaggia nella mail, e
// nell'indirizzo c'è solo un gettone opaco. A chi appartiene lo dice il CRM
// dalla porta firmata della Private Collection (lib/private/porta.ts), che per
// questo sito è `pc-tsi`: un gettone di triestevillas.com qui non apre niente.
//
// Quale pagina mostrare lo decide `sceltaVista` (lib/account/benvenuto.ts,
// pura e provata): il modulo, l'accesso per chi l'account ce l'ha già, o una
// pagina gentile se il link non vale o se la porta non risponde. Un guasto non
// diventa mai «il tuo link non vale»: a chi ha un link buono si dice di
// riprovare.
//
// Su questo sito l'accesso con Google non c'è (la rotta risponde 503: mancano
// le chiavi), quindi la pagina non lo offre e non lo promette.
//
// ⚠️ La GET non scrive niente sull'account: il modulo scrive con una POST
// (/api/account/benvenuto), così un antivirus che apre i link della posta non
// crea nulla. L'unica cosa che la GET dice al CRM è «è entrata dal link» quando
// trova la persona già dentro con QUELL'email — e un antivirus il cookie della
// sessione non ce l'ha. (La porta, leggendo il gettone, segna anche `visto_il`:
// è il contratto.)
// GA4 resta fuori da questa pagina (components/Analytics.tsx): il gettone sta
// nella query.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("benvenuto.metaTitle"), robots: { index: false, follow: false } };
}

/** Il nome per il saluto: il primo, e solo se il CRM l'ha scritto come si
 *  scrive un nome. «ROSSI MARIO» (tutto maiuscolo, spesso cognome in testa)
 *  darebbe «Ciao ROSSI»: meglio un saluto senza nome. */
function nomeSaluto(nome: string): string {
  const primo = nome.trim().split(/\s+/)[0] ?? "";
  if (primo.length < 2 || /\d|@/.test(primo) || primo === primo.toUpperCase()) return "";
  return primo.charAt(0).toUpperCase() + primo.slice(1);
}

export default async function AccountBenvenutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const { k } = await searchParams;

  const servizio = acctGateConfigured();
  let invito: InvitoLetto | null = null;
  let account: "c'è" | "non c'è" | "guasto" | null = null;
  let sessioneEmail: string | null = null;
  if (servizio && gettoneBuono(k)) {
    invito = await pAccountInvito(k);
    if (invito.tipo === "ok") {
      try {
        account = (await findAccountByEmail(invito.email)) ? "c'è" : "non c'è";
      } catch (e) {
        console.error("[acct] benvenuto: lettura account fallita:", e);
        account = "guasto";
      }
      if (account === "c'è") {
        // currentWebAccount e non la sola sessione firmata: un account sospeso
        // o con la password cambiata non conta come «dentro».
        const cur = await currentWebAccount().catch(() => null);
        sessioneEmail = cur?.email ?? null;
      }
    }
  }
  const vista = sceltaVista({ gettone: k, servizio, invito, account, sessioneEmail });

  // Già dentro, con l'account di quell'email: il link ha fatto il suo lavoro.
  // Lo si dice al CRM (chiude il gettone e scrive la riga sul lead) e si va
  // nello spazio. È anche il punto d'arrivo di chi, dalla vista «esiste», ha
  // appena fatto login: il modulo ricarica questa pagina.
  if (vista === "dentro" && gettoneBuono(k)) {
    await pAccountInvitoUsato(k, "esisteva");
    redirect({ href: "/account", locale });
  }

  const main = "mx-auto max-w-md px-5 pb-24 pt-32 md:pt-36";
  const h1 = "text-2xl font-semibold tracking-tight text-neutral-900";
  const eyebrow = (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">{t("benvenuto.eyebrow")}</p>
  );
  const bottone =
    "btn-press mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90";

  if (vista === "attiva" && invito?.tipo === "ok" && gettoneBuono(k)) {
    const nome = nomeSaluto(invito.nome);
    const promesse = ["perk1", "perk2", "perk3"] as const;
    return (
      <main className={main}>
        {eyebrow}
        <h1 className={`mt-3 ${h1}`}>{nome ? t("benvenuto.titleNamed", { name: nome }) : t("benvenuto.title")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">{t("benvenuto.intro")}</p>
        <h2 className="mt-8 text-sm font-semibold text-neutral-900">{t("benvenuto.perksTitle")}</h2>
        <ul className="mt-3 space-y-3">
          {promesse.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {t(`benvenuto.${p}`)}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <BenvenutoForm k={k} email={invito.email} chiediNome={invito.nome.trim().length < 2} />
        </div>
      </main>
    );
  }

  if (vista === "esiste" && invito?.tipo === "ok") {
    return (
      <main className={main}>
        {eyebrow}
        <h1 className={`mt-3 ${h1}`}>{t("benvenuto.existsTitle")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          {t("benvenuto.existsBody", { email: invito.email })}
        </p>
        <div className="mt-8">
          <BenvenutoAccesso email={invito.email} />
        </div>
      </main>
    );
  }

  // Le pagine gentili: niente modulo, una strada per entrare o per riprovare.
  const testi =
    vista === "gia-attivo"
      ? { titolo: t("benvenuto.usedTitle"), corpo: t("benvenuto.usedBody"), cta: t("benvenuto.goSpace") }
      : vista === "scaduto"
        ? { titolo: t("benvenuto.expiredTitle"), corpo: t("benvenuto.expiredBody"), cta: t("benvenuto.toAccount") }
        : vista === "non-valido"
          ? { titolo: t("benvenuto.invalidTitle"), corpo: t("benvenuto.invalidBody"), cta: t("benvenuto.toAccount") }
          : { titolo: t("benvenuto.downTitle"), corpo: t("benvenuto.downBody"), cta: "" };

  return (
    <main className={main}>
      {eyebrow}
      <h1 className={`mt-3 ${h1}`}>{testi.titolo}</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{testi.corpo}</p>
      {testi.cta ? (
        <Link href="/account" className={bottone}>
          {testi.cta}
        </Link>
      ) : gettoneBuono(k) ? (
        // Il guasto: si riprova sulla stessa pagina, col suo gettone. Un <a>
        // semplice e non <Link>: deve rifare la richiesta al server, non
        // riusare una pagina già in memoria.
        <a href={`?k=${encodeURIComponent(k)}`} className={bottone}>
          {t("benvenuto.retry")}
        </a>
      ) : null}
    </main>
  );
}
