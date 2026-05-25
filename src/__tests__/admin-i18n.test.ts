import { describe, expect, it } from 'vitest';
import translations from '../../app/lib/i18n/translations';

describe('admin i18n', () => {
  it('provides localized admin navigation labels', () => {
    expect(translations.es.admin.metrics).toBe('Métricas');
    expect(translations.es.admin.revenue).toBe('Facturación');
    expect(translations.es.admin.users).toBe('Usuarios');
    expect(translations.es.admin.professionals).toBe('Profesionales');
    expect(translations.es.admin.appointments).toBe('Turnos');
    expect(translations.es.admin.specialties).toBe('Especialidades');

    expect(translations.en.admin.metrics).toBe('Metrics');
    expect(translations.en.admin.revenue).toBe('Billing');
    expect(translations.en.admin.users).toBe('Users');
    expect(translations.en.admin.professionals).toBe('Professionals');
    expect(translations.en.admin.appointments).toBe('Appointments');
    expect(translations.en.admin.specialties).toBe('Specialties');
  });
});
