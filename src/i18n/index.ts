import it from './it.json';
import en from './en.json';
import de from './de.json';
import sl from './sl.json';

export const locales = ['it', 'en', 'de', 'sl'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'it';

const dict = { it, en, de, sl } as const;

export function getTranslations(locale: Locale) {
  return dict[locale] ?? dict[defaultLocale];
}

export function getLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (locales.includes(seg as Locale) && seg !== defaultLocale) return seg as Locale;
  return defaultLocale;
}

export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return `/${locale}${clean === '/' ? '' : clean}`;
}

export const localeMeta: Record<Locale, { code: string; label: string; htmlLang: string; ogLocale: string }> = {
  it: { code: 'IT', label: 'Italiano', htmlLang: 'it-IT', ogLocale: 'it_IT' },
  en: { code: 'EN', label: 'English', htmlLang: 'en-GB', ogLocale: 'en_GB' },
  de: { code: 'DE', label: 'Deutsch', htmlLang: 'de-DE', ogLocale: 'de_DE' },
  sl: { code: 'SL', label: 'Slovensko', htmlLang: 'sl-SI', ogLocale: 'sl_SI' },
};
