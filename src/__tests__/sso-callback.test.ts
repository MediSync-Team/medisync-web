import { describe, expect, it, vi } from 'vitest';
import { persistSsoToken } from '../../app/lib/sso-callback';

describe('SSO callback token persistence', () => {
  it('stores the exchanged SSO token for localStorage-backed frontend features', () => {
    const storage = { setItem: vi.fn() };

    persistSsoToken('jwt-token', storage);

    expect(storage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
  });

  it('ignores missing tokens', () => {
    const storage = { setItem: vi.fn() };

    persistSsoToken(undefined, storage);

    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
