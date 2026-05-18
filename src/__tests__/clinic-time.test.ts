import { describe, expect, it } from 'vitest';
import { clinicDateTimeToIso, formatClinicDateKey } from '../../app/lib/date';

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
});
