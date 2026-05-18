import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildReprogrammingFechaHora, getReprogrammingMinDate } from '../../app/lib/reprogramming';

describe('reprogramming timezone helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds reprogramming payloads as Argentina local time converted to UTC', () => {
    expect(buildReprogrammingFechaHora('2026-05-18', '10:00')).toBe('2026-05-18T13:00:00.000Z');
  });

  it('rejects missing date or time before the API call is built', () => {
    expect(() => buildReprogrammingFechaHora('', '10:00')).toThrow('Missing reprogramming date/time');
    expect(() => buildReprogrammingFechaHora('2026-05-18', '')).toThrow('Missing reprogramming date/time');
  });

  it('uses the Argentina clinic date for date input minimums', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T02:30:00.000Z'));

    expect(getReprogrammingMinDate()).toBe('2026-05-17');
  });
});
