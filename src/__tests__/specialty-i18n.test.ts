import { describe, expect, it } from 'vitest';
import { translateSpecialtyName } from '../../app/lib/i18n/translations';

describe('specialty translations', () => {
  it('translates clínica médica variants to English', () => {
    expect(translateSpecialtyName('Clínica Médica', 'en')).toBe('Clinical Medicine');
    expect(translateSpecialtyName('Clinica Medica', 'en')).toBe('Clinical Medicine');
    expect(translateSpecialtyName('CLINICA_MEDICA', 'en')).toBe('Clinical Medicine');
  });

  it('normalizes clínica médica variants in Spanish', () => {
    expect(translateSpecialtyName('Clínica Médica', 'es')).toBe('Clínica médica');
    expect(translateSpecialtyName('Clinica Medica', 'es')).toBe('Clínica médica');
    expect(translateSpecialtyName('CLINICA_MEDICA', 'es')).toBe('Clínica médica');
  });
});
