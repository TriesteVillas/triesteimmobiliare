// Tag BCP 47 per Intl, una lingua del sito → una convenzione di formato.
// Lo sloveno (2026-10-01) scrive i prezzi come il tedesco: «250.000 €».
const LOCALE_TAG: Record<string, string> = {
  it: "it-IT",
  en: "en-GB",
  de: "de-DE",
  sl: "sl-SI",
};

/** Il tag Intl della lingua del sito, con l'italiano come ripiego. Da usare
 *  invece di ricopiare la tabella: una lingua aggiunta in un posto solo
 *  formatterebbe le date in italiano senza che nessuno se ne accorga. */
export function intlLocale(locale: string): string {
  return LOCALE_TAG[locale] ?? "it-IT";
}

export function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT").format(value);
}

/** Un importo breve per le fasce di budget dei moduli («50K €», «€50k»,
 *  «50 tis. €», «1,5 Mln €»), nella convenzione della lingua (08/10/2026):
 *  prima era «50k €» / «1,5 M€» all'italiana anche su /en, /de e /sl. */
export function formatEuroBreve(value: number, locale: string): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
