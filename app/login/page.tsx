'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import ThemeLangToggle from '../components/ThemeLangToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLang();
  const a = t('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const me = await api.auth.me();
      router.push(me.rol === 'ADMIN' ? '/dashboard/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : a.loginBtn);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      {/* Top-right toggles */}
      <div className="fixed top-4 right-4">
        <ThemeLangToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">MediSync</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{a.subtitle}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{a.welcomeBack}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="field-label">{a.email}</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="field-input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">{a.password}</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="field-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? a.loggingIn : a.loginBtn}
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
              {a.noAccount}{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                {a.registerBtn}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
