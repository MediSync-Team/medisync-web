import { getLocale } from './date';
import translations, { Lang } from './i18n/translations';

export type PdfLanguageInput = Lang | string | undefined;

export function resolvePdfI18n(input: PdfLanguageInput = 'es') {
  const lang: Lang = input === 'en' || input === 'en-US' ? 'en' : 'es';

  return {
    lang,
    locale: getLocale(lang),
    pdf: translations[lang].pdf,
  };
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ''));
}
