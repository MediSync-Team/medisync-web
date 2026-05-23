import { describe, expect, it, vi } from 'vitest';
import {
  buildUpcomingClinicDateKeys,
  calendarDateKey,
  addDaysToClinicDateKey,
  clinicDateKeyFromDateOnly,
  clinicDateKeyFromInstant,
  clinicDateTimeToIso,
  formatClinicDateKeyForDisplay,
  formatClinicInstantDate,
  formatClinicInstantDateTime,
  formatClinicInstantTime,
  formatClinicDateKey,
  getClinicCurrentMonthRange,
  getClinicMonthRangeFromDateKey,
  getClinicMonthFetchBounds,
  isSameClinicCalendarDay,
  todayInputValue,
} from '../../app/lib/date';

describe('frontend clinic-time helpers', () => {
  it('builds appointment payloads as Argentina local time converted to UTC', () => {
    expect(clinicDateTimeToIso('2026-05-18', '10:00')).toBe('2026-05-18T13:00:00.000Z');
  });

  it('formats ISO instants as Argentina-local date keys', () => {
    expect(formatClinicDateKey(new Date('2026-05-18T13:00:00.000Z'))).toBe('2026-05-18');
  });

  it('does not roll late-night Argentina instants into the next appointment day', () => {
    expect(formatClinicDateKey(new Date('2026-05-19T02:30:00.000Z'))).toBe('2026-05-18');
  });

  it('groups appointment instants by Argentina clinic date', () => {
    expect(clinicDateKeyFromInstant('2026-05-19T02:30:00.000Z')).toBe('2026-05-18');
    expect(clinicDateKeyFromInstant('2026-05-18T13:00:00.000Z')).toBe('2026-05-18');
  });

  it('extracts date-only API values without applying Argentina instant conversion', () => {
    expect(clinicDateKeyFromDateOnly('2026-05-18T00:00:00.000Z')).toBe('2026-05-18');
    expect(clinicDateKeyFromDateOnly(new Date('2026-05-18T00:00:00.000Z'))).toBe('2026-05-18');
  });

  it('compares appointment instants to synthetic calendar cells by clinic date', () => {
    const may18Cell = new Date(2026, 4, 18, 12, 0, 0, 0);
    const may19Cell = new Date(2026, 4, 19, 12, 0, 0, 0);

    expect(calendarDateKey(may18Cell)).toBe('2026-05-18');
    expect(isSameClinicCalendarDay('2026-05-19T02:30:00.000Z', may18Cell)).toBe(true);
    expect(isSameClinicCalendarDay('2026-05-19T02:30:00.000Z', may19Cell)).toBe(false);
  });

  it('builds month fetch bounds using Argentina day boundaries', () => {
    expect(getClinicMonthFetchBounds(2026, 4)).toEqual({
      desde: '2026-05-01T03:00:00.000Z',
      hasta: '2026-06-01T03:00:00.000Z',
    });
  });

  it('builds current clinic month filter ranges from Argentina today', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-01T02:30:00.000Z'));
      expect(getClinicCurrentMonthRange()).toEqual({ desde: '2026-05-01', hasta: '2026-05-31' });

      vi.setSystemTime(new Date('2026-06-15T15:00:00.000Z'));
      expect(getClinicCurrentMonthRange()).toEqual({ desde: '2026-06-01', hasta: '2026-06-30' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('builds clinic month filter ranges with correct month endings', () => {
    expect(getClinicMonthRangeFromDateKey('2024-02-10')).toEqual({ desde: '2024-02-01', hasta: '2024-02-29' });
    expect(getClinicMonthRangeFromDateKey('2026-02-10')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
    expect(getClinicMonthRangeFromDateKey('2026-12-31')).toEqual({ desde: '2026-12-01', hasta: '2026-12-31' });
  });

  it('navigates clinic agenda date keys without browser-local Date math', () => {
    expect(addDaysToClinicDateKey('2026-05-18', -1)).toBe('2026-05-17');
    expect(addDaysToClinicDateKey('2026-05-18', 1)).toBe('2026-05-19');
  });

  it('formats clinic agenda dates and times in Argentina time', () => {
    expect(formatClinicDateKeyForDisplay('2026-05-18', 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })).toBe('Monday, May 18');
    expect(formatClinicInstantTime('2026-05-19T02:30:00.000Z', 'es-AR')).toContain('11:30');
  });

  it('formats appointment instants for display in Argentina time', () => {
    expect(formatClinicInstantDate('2026-06-01T02:30:00.000Z', 'es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })).toBe('31/05/2026');
    expect(formatClinicInstantTime('2026-06-01T02:30:00.000Z', 'es-AR')).toContain('11:30');
    expect(formatClinicInstantDateTime('2026-06-01T03:00:00.000Z', 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    })).toMatch(/6\/1\/26.*12:00 AM/);
  });

  it('builds upcoming clinic date keys from Argentina today', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-05-18T02:30:00.000Z'));

      expect(todayInputValue()).toBe('2026-05-17');
      expect(buildUpcomingClinicDateKeys(3)).toEqual([
        '2026-05-17',
        '2026-05-18',
        '2026-05-19',
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('groups month-boundary appointments by Argentina clinic month', () => {
    // 2026-05-31 23:30 ART = 2026-06-01 02:30 UTC
    // Should be grouped as May, not June
    const lateNightMay = '2026-06-01T02:30:00.000Z';
    expect(clinicDateKeyFromInstant(lateNightMay)).toBe('2026-05-31');
    expect(clinicDateKeyFromInstant(lateNightMay).startsWith('2026-05')).toBe(true);

    // 2026-06-01 00:30 ART = 2026-06-01 03:30 UTC
    // Should be grouped as June
    const earlyJune = '2026-06-01T03:30:00.000Z';
    expect(clinicDateKeyFromInstant(earlyJune)).toBe('2026-06-01');
    expect(clinicDateKeyFromInstant(earlyJune).startsWith('2026-06')).toBe(true);
  });
});
