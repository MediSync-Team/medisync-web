import { describe, expect, it } from 'vitest';
import translations from '../../app/lib/i18n/translations';

const genderKeys = ['genderNS', 'genderM', 'genderF', 'genderO'] as const;

describe('profile i18n', () => {
  it('has Spanish gender labels and photo URL placeholder', () => {
    for (const key of genderKeys) {
      expect(translations.es.profile[key]).toBeTruthy();
    }

    expect(translations.es.profile.photoUrlPlaceholder).toContain('ejemplo.com');
  });

  it('has English gender labels and photo URL placeholder', () => {
    for (const key of genderKeys) {
      expect(translations.en.profile[key]).toBeTruthy();
    }

    expect(translations.en.profile.photoUrlPlaceholder).toContain('example.com');
  });
});
