import { describe, expect, it } from 'vitest';
import {
  calendarDateKey,
  clinicDateKeyFromInstant,
  clinicDateTimeToIso,
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
});
