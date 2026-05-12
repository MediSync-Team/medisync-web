import { describe, expect, it } from 'vitest';
import { getNotificationStreamUrl, isActiveNotificationSession } from '../../app/lib/notification-context';

describe('notification context session guards', () => {
  it('accepts results only for the active open notification session', () => {
    expect(isActiveNotificationSession(2, 2, false)).toBe(true);
    expect(isActiveNotificationSession(1, 2, false)).toBe(false);
    expect(isActiveNotificationSession(2, 2, true)).toBe(false);
  });

  it('builds an encoded SSE URL for the current token', () => {
    expect(getNotificationStreamUrl('jwt token/value')).toBe(
      'http://localhost:4000/api/notifications/stream?token=jwt%20token%2Fvalue'
    );
  });
});
