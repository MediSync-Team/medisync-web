'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, API_BASE } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import { GoogleIcon, MicrosoftIcon } from '../components/icons';
import ThemeLangToggle from '../components/ThemeLangToggle';
import PasswordInput from '../components/PasswordInput';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { t } = useLang();
  const a = t('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('ssoError') || '');
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
              <div className="alert alert-error text-sm" role="alert" aria-live="polite" aria-atomic="true">{error}</div>
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
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? a.loggingIn : a.loginBtn}
            </button>

            <div className="text-center pt-3">
              <Link href="/forgot-password" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 underline">
                {a.forgotPassword}
              </Link>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-400 dark:text-slate-500">
                <span className="bg-white dark:bg-slate-800 px-3">{a.orContinueWith}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <a href={`${API_BASE}/auth/google`} className="btn btn-secondary flex-1 justify-center gap-2">
                <GoogleIcon size={16} />
                Google
              </a>
              <a href={`${API_BASE}/auth/microsoft`} className="btn btn-secondary flex-1 justify-center gap-2">
                <MicrosoftIcon size={16} />
                Microsoft
              </a>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4">
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

export default function LoginPage() {
  const { t } = useLang();
  const a = t('auth');

  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">{a.loginLoading}</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
