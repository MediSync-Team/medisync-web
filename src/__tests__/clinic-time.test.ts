import { describe, expect, it } from 'vitest';
import {
  calendarDateKey,
  addDaysToClinicDateKey,
  clinicDateKeyFromInstant,
  clinicDateTimeToIso,
  formatClinicDateKeyForDisplay,
  formatClinicInstantTime,
  formatClinicDateKey,
  getClinicMonthFetchBounds,
  isSameClinicCalendarDay,
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
