'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from './api';
import { setAutoCoverageDisabled } from './home-filters';
import { clearApiCache } from './api/cache';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Parameters<typeof api.auth.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function hasStoredAuthToken(storage?: Pick<Storage, 'getItem'> | null) {
  if (storage === null) return false;
  const targetStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!targetStorage || typeof targetStorage.getItem !== 'function') return false;
  return Boolean(targetStorage?.getItem('token'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasStoredAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    api.auth.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadCurrentUser = async (): Promise<User> => {
    try {
      const userData = await api.auth.me();
      setAutoCoverageDisabled(userData.id, false);
      setUser(userData);
      return userData;
    } catch (err) {
      // Keep token/user consistent: a failed me() must not leave a token with user=null.
      localStorage.removeItem('token');
      setUser(null);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    clearApiCache();
    const result = await api.auth.login({ email, password });
    if (result.token) localStorage.setItem('token', result.token);
    return loadCurrentUser();
  };

  const register = async (data: Parameters<typeof api.auth.register>[0]) => {
    clearApiCache();
    const result = await api.auth.register(data);
    if (result.token) localStorage.setItem('token', result.token);
    await loadCurrentUser();
  };

  const logout = async () => {
    await api.auth.logout();
    localStorage.removeItem('token');
    clearApiCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
