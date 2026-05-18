export const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const CLINIC_UTC_OFFSET_MINUTES = -180;

export function getLocale(lang: string): string {
  return lang === 'es' ? 'es-AR' : 'en-US';
}

function formatDatePartsInClinic(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function formatClinicDateKey(date: Date): string {
  const { year, month, day } = formatDatePartsInClinic(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayInputValue(): string {
  return formatClinicDateKey(new Date());
}

export function formatDateInput(d: Date): string {
  return formatClinicDateKey(d);
}

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function clinicDateTimeToIso(dateKey: string, time: string): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error('Invalid clinic date/time');
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  return new Date(Date.UTC(year, month - 1, day, hour - CLINIC_UTC_OFFSET_MINUTES / 60, minute, 0, 0)).toISOString();
}

export function buildUpcomingClinicDays(count: number): Date[] {
  const todayKey = todayInputValue();
  const [year, month, day] = todayKey.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => new Date(year, month - 1, day + i, 12, 0, 0, 0));
}
