import { describe, expect, it } from 'vitest';
import translations from '../../app/lib/i18n/translations';

describe('dashboard i18n', () => {
  it('has professional share profile labels in both languages', () => {
    expect(translations.es.dashboard.shareProfile).toBe('Compartir perfil');
    expect(translations.en.dashboard.shareProfile).toBe('Share profile');
  });
});
