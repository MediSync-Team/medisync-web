export const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const CLINIC_UTC_OFFSET_MINUTES = -180;
const CLINIC_DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

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

export function clinicDateKeyFromInstant(value: string | Date): string {
  return formatClinicDateKey(typeof value === 'string' ? new Date(value) : value);
}

export function calendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isSameClinicCalendarDay(instant: string | Date, calendarDate: Date): boolean {
  return clinicDateKeyFromInstant(instant) === calendarDateKey(calendarDate);
}

export function todayInputValue(): string {
  return formatClinicDateKey(new Date());
}

export function addDaysToClinicDateKey(dateKey: string, days: number): string {
  const match = CLINIC_DATE_KEY_RE.exec(dateKey);
  if (!match) {
    throw new Error('Invalid clinic date key');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0, 0));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function formatClinicDateKeyForDisplay(dateKey: string, locale: string, opts: Intl.DateTimeFormatOptions): string {
  const match = CLINIC_DATE_KEY_RE.exec(dateKey);
  if (!match) {
    throw new Error('Invalid clinic date key');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)).toLocaleDateString(locale, {
    ...opts,
    timeZone: CLINIC_TIME_ZONE,
  });
}

export function formatClinicInstantTime(value: string | Date, locale: string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
    timeZone: CLINIC_TIME_ZONE,
  });
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

export function getClinicMonthFetchBounds(year: number, month: number): { desde: string; hasta: string } {
  const start = new Date(Date.UTC(year, month, 1, -CLINIC_UTC_OFFSET_MINUTES / 60, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, -CLINIC_UTC_OFFSET_MINUTES / 60, 0, 0, 0));
  return { desde: start.toISOString(), hasta: end.toISOString() };
}

export function buildUpcomingClinicDays(count: number): Date[] {
  const todayKey = todayInputValue();
  const [year, month, day] = todayKey.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => new Date(year, month - 1, day + i, 12, 0, 0, 0));
}
