const LOCALE_TAG: Record<string, string> = {
  it: "it-IT",
  en: "en-GB",
  de: "de-DE",
};

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
