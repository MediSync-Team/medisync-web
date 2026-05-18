'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from './api';
import { setAutoCoverageDisabled } from './home-filters';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    const result = await api.auth.login({ email, password });
    if (result.token) localStorage.setItem('token', result.token);
    const userData = await api.auth.me();
    setAutoCoverageDisabled(userData.id, false);
    setUser(userData);
  };

  const register = async (data: Parameters<typeof api.auth.register>[0]) => {
    const result = await api.auth.register(data);
    if (result.token) localStorage.setItem('token', result.token);
    const userData = await api.auth.me();
    setAutoCoverageDisabled(userData.id, false);
    setUser(userData);
  };

  const logout = async () => {
    await api.auth.logout();
    localStorage.removeItem('token');
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
