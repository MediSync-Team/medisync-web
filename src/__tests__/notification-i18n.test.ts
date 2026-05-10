import { describe, expect, it } from 'vitest';
import type { InAppNotification } from '../../app/lib/api';
import { formatNotificationTime, localizeNotification } from '../../app/lib/notification-i18n';

function notification(overrides: Partial<InAppNotification>): InAppNotification {
  return {
    id: 'notif-1',
    tipo: 'TURNO_RESERVADO',
    titulo: 'Turno reservado',
    cuerpo: 'Tu turno con Dr/a. Sal fue reservado para el lunes 10.',
    leida: false,
    link: null,
    createdAt: '2026-05-10T18:00:00.000Z',
    ...overrides,
  };
}

describe('notification i18n', () => {
  it('formats relative time in the active language', () => {
    const now = new Date('2026-05-10T18:30:00.000Z').getTime();

    expect(formatNotificationTime('2026-05-10T18:30:00.000Z', 'es', now)).toBe('ahora');
    expect(formatNotificationTime('2026-05-10T18:00:00.000Z', 'es', now)).toBe('hace 30 min');
    expect(formatNotificationTime('2026-05-10T16:30:00.000Z', 'en', now)).toBe('2h ago');
    expect(formatNotificationTime('2026-05-08T18:30:00.000Z', 'en', now)).toBe('2d ago');
  });

  it('keeps Spanish notifications unchanged for Spanish users', () => {
    const original = notification({});

    expect(localizeNotification(original, 'es')).toEqual(original);
  });

  it('translates booked appointment notifications for English users', () => {
    const translated = localizeNotification(notification({}), 'en');

    expect(translated.titulo).toBe('Appointment booked');
    expect(translated.cuerpo).toBe('Your appointment with Dr/a. Sal was booked for lunes 10.');
  });

  it('translates cancellation notifications with reasons for English users', () => {
    const translated = localizeNotification(
      notification({
        tipo: 'TURNO_CANCELADO',
        titulo: 'Turno cancelado',
        cuerpo: 'Tu turno del lunes 10 fue cancelado. Razón: emergencia.',
      }),
      'en',
    );

    expect(translated.titulo).toBe('Appointment canceled');
    expect(translated.cuerpo).toBe('Your appointment on lunes 10 was canceled. Reason: emergencia.');
  });

  it('translates chat and waitlist titles for English users', () => {
    expect(localizeNotification(notification({
      tipo: 'CHAT_MENSAJE',
      titulo: 'Mensaje de Dra. Luna',
      cuerpo: 'Hola!',
    }), 'en').titulo).toBe('Message from Dra. Luna');

    expect(localizeNotification(notification({
      tipo: 'LISTA_ESPERA_NOTIFICADA',
      titulo: '¡Se liberó un turno!',
      cuerpo: 'Se liberó un turno con Dra. Luna para el lunes 10 a las 10:30. Tenés 4 horas para reservarlo.',
    }), 'en').cuerpo).toBe('An appointment with Dra. Luna opened up for lunes 10 at 10:30. You have 4 hours to book it.');
  });
});
