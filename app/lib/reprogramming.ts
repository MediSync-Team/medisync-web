import { clinicDateTimeToIso, todayInputValue } from './date';

export function buildReprogrammingFechaHora(fecha: string, hora: string): string {
  if (!fecha || !hora) {
    throw new Error('Missing reprogramming date/time');
  }

  return clinicDateTimeToIso(fecha, hora);
}

export function getReprogrammingMinDate(): string {
  return todayInputValue();
}
