import { describe, expect, it } from 'vitest';
import translations from '../../app/lib/i18n/translations';

function flattenTranslationKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return flattenTranslationKeys(child, path);
  });
}

describe('translation key parity', () => {
  it('keeps Spanish and English dictionaries structurally aligned', () => {
    const spanishKeys = flattenTranslationKeys(translations.es).sort();
    const englishKeys = flattenTranslationKeys(translations.en).sort();

    const missingInEnglish = spanishKeys.filter((key) => !englishKeys.includes(key));
    const missingInSpanish = englishKeys.filter((key) => !spanishKeys.includes(key));

    expect({
      missingInEnglish,
      missingInSpanish,
    }).toEqual({
      missingInEnglish: [],
      missingInSpanish: [],
    });
  });
});
