type TokenStorage = Pick<Storage, 'setItem'>;

export function persistSsoToken(token?: string, storage?: TokenStorage | null) {
  if (!token || !storage) return;
  storage.setItem('token', token);
}
