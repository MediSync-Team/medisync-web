import { translateSpecialtyName } from './i18n/translations';

export function getSpecialtyDisplayName(
  name: string,
  lang: string,
  specialtyMap: Record<string, string>
): string {
  if (!name) return '';
  const translated = translateSpecialtyName(name, lang as 'es' | 'en');
  if (translated !== name) return translated;
  const key = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return specialtyMap[key] || name;
}
