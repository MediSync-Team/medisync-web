import type { InAppNotification } from './api';
import type { Lang } from './i18n/translations';

const ENGLISH_TITLES: Record<string, string> = {
  TURNO_RESERVADO: 'Appointment booked',
  TURNO_CONFIRMADO: 'Appointment confirmed',
  TURNO_CANCELADO: 'Appointment canceled',
  TURNO_REPROGRAMADO: 'Appointment rescheduled',
  RECETA_EMITIDA: 'Prescription issued',
  LISTA_ESPERA_NOTIFICADA: 'An appointment opened up!',
};

function matchOne(text: string, patterns: Array<[RegExp, (...parts: string[]) => string]>): string {
  for (const [pattern, format] of patterns) {
    const match = text.match(pattern);
    if (match) return format(...match.slice(1));
  }

  return text;
}

function translateTitleToEnglish(notification: InAppNotification): string {
  if (notification.tipo === 'CHAT_MENSAJE') {
    return matchOne(notification.titulo, [
      [/^Mensaje de (.+)$/i, sender => `Message from ${sender}`],
    ]);
  }

  if (notification.tipo.startsWith('RECORDATORIO')) {
    return matchOne(notification.titulo, [
      [/^Turno en (.+)$/i, label => `Appointment in ${label}`],
    ]);
  }

  return ENGLISH_TITLES[notification.tipo] ?? notification.titulo;
}

function translateBodyToEnglish(notification: InAppNotification): string {
  const body = notification.cuerpo;

  switch (notification.tipo) {
    case 'TURNO_RESERVADO':
      return matchOne(body, [
        [/^Tu turno con Dr\/a\. (.+) fue reservado para el (.+)\.$/i, (doctor, date) => `Your appointment with Dr/a. ${doctor} was booked for ${date}.`],
      ]);

    case 'TURNO_CONFIRMADO':
      return matchOne(body, [
        [/^Tu turno con Dr\/a\. (.+) del (.+) fue confirmado\.$/i, (doctor, date) => `Your appointment with Dr/a. ${doctor} on ${date} was confirmed.`],
      ]);

    case 'TURNO_CANCELADO':
      return matchOne(body, [
        [/^Tu turno del (.+) fue cancelado\. Raz[oó]n: (.+)\.$/i, (date, reason) => `Your appointment on ${date} was canceled. Reason: ${reason}.`],
        [/^Tu turno del (.+) fue cancelado\.$/i, date => `Your appointment on ${date} was canceled.`],
      ]);

    case 'TURNO_REPROGRAMADO':
      return matchOne(body, [
        [/^(.+) reprogram[oó] tu turno con Dr\/a\. (.+) para el (.+)\.$/i, (actor, doctor, date) => `${actor} rescheduled your appointment with Dr/a. ${doctor} for ${date}.`],
      ]);

    case 'RECETA_EMITIDA':
      return matchOne(body, [
        [/^Dr\/a\. (.+) emiti[oó] tu receta de la consulta del (.+)\.$/i, (doctor, date) => `Dr/a. ${doctor} issued your prescription for the appointment on ${date}.`],
      ]);

    case 'LISTA_ESPERA_NOTIFICADA':
      return matchOne(body, [
        [/^Se liber[oó] un turno con (.+) para el (.+) a las (.+)\. Ten[eé]s (.+) horas para reservarlo\.$/i, (doctor, date, time, hours) => `An appointment with ${doctor} opened up for ${date} at ${time}. You have ${hours} hours to book it.`],
      ]);

    case 'RECORDATORIO_24H':
    case 'RECORDATORIO_2H':
      return matchOne(body, [
        [/^Tu turno con (.+) es en (.+)\.$/i, (doctor, label) => `Your appointment with ${doctor} is in ${label}.`],
      ]);

    default:
      return body;
  }
}

export function localizeNotification(notification: InAppNotification, lang: Lang): InAppNotification {
  if (lang !== 'en') return notification;

  return {
    ...notification,
    titulo: translateTitleToEnglish(notification),
    cuerpo: translateBodyToEnglish(notification),
  };
}

export function formatNotificationTime(dateStr: string, lang: Lang, now = Date.now()): string {
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return '';

  const diff = now - time;
  const mins = Math.floor(diff / 60_000);

  if (mins < 1) return lang === 'en' ? 'now' : 'ahora';
  if (mins < 60) return lang === 'en' ? `${mins} min ago` : `hace ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'en' ? `${hours}h ago` : `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return lang === 'en' ? `${days}d ago` : `hace ${days} d`;
}
