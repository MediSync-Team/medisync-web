import { describe, expect, it } from 'vitest';
import translations from '../../app/lib/i18n/translations';

const requiredSections = [
  'tabs',
  'stats',
  'team',
  'agenda',
  'invitations',
  'config',
  'inviteModal',
  'removeModal',
] as const;

function expectNonEmpty(value: unknown) {
  expect(typeof value).toBe('string');
  expect((value as string).trim().length).toBeGreaterThan(0);
}

describe('clinic dashboard i18n', () => {
  it('has complete Spanish clinic dashboard labels', () => {
    const clinic = translations.es.clinica;

    for (const section of requiredSections) {
      expect(clinic[section]).toBeTruthy();
    }

    expect(clinic.tabs.overview).toBe('Resumen');
    expect(clinic.tabs.professionals).toBe('Profesionales');
    expect(clinic.inviteProfessional).toBe('Invitar profesional');
    expect(clinic.config.title).toBe('Perfil de la clínica');
    expect(clinic.invitations.empty).toBe('No hay invitaciones pendientes');

    expectNonEmpty(clinic.stats.todayAppointments);
    expectNonEmpty(clinic.stats.cancellationThisMonth);
    expectNonEmpty(clinic.stats.cancellationsThisMonth);
    expectNonEmpty(clinic.team.noAvailability);
    expectNonEmpty(clinic.agenda.noAppointments);
    expectNonEmpty(clinic.config.phonePlaceholder);
    expectNonEmpty(clinic.inviteModal.emailRequired);
    expectNonEmpty(clinic.removeModal.confirm);

    for (const state of ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA'] as const) {
      expectNonEmpty(clinic.invitations.states[state]);
    }
  });

  it('has complete English clinic dashboard labels', () => {
    const clinic = translations.en.clinica;

    for (const section of requiredSections) {
      expect(clinic[section]).toBeTruthy();
    }

    expect(clinic.tabs.overview).toBe('Overview');
    expect(clinic.tabs.professionals).toBe('Professionals');
    expect(clinic.inviteProfessional).toBe('Invite professional');
    expect(clinic.config.title).toBe('Clinic profile');
    expect(clinic.invitations.empty).toBe('No pending invitations');

    expectNonEmpty(clinic.stats.todayAppointments);
    expectNonEmpty(clinic.stats.cancellationThisMonth);
    expectNonEmpty(clinic.stats.cancellationsThisMonth);
    expectNonEmpty(clinic.team.noAvailability);
    expectNonEmpty(clinic.agenda.noAppointments);
    expectNonEmpty(clinic.config.phonePlaceholder);
    expectNonEmpty(clinic.inviteModal.emailRequired);
    expectNonEmpty(clinic.removeModal.confirm);

    for (const state of ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA'] as const) {
      expectNonEmpty(clinic.invitations.states[state]);
    }
  });
});
