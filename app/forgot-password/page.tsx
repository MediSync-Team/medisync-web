'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import ThemeLangToggle from '../components/ThemeLangToggle';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthIndicator, { getRequirements } from '../components/PasswordStrengthIndicator';
import { InfoIcon } from '../components/icons';

function ForgotPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const a = t('auth');
  const fp = a.forgotPasswordFlow;
  const v = a.validation;

  const token = params.get('token');
  const [step, setStep] = useState<'request' | 'reset'>(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || fp.requestError);
      }

      setSuccess(fp.requestSuccess);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : fp.requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(v.passwordsNoMatch);
      return;
    }

    const reqs = getRequirements(newPassword);
    if (!reqs.minLength || !reqs.hasUppercase || !reqs.hasLowercase || !reqs.hasNumber) {
      setError(v.passwordRequirements);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || fp.resetError);
      }

      setSuccess(fp.resetSuccess);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : fp.resetError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4">
        <div className="page-container flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-slate-800 dark:text-slate-100">
            MediSync
          </Link>
          <ThemeLangToggle compact />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {step === 'request' ? fp.requestTitle : fp.resetTitle}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {step === 'request'
                ? fp.requestSubtitle
                : fp.resetSubtitle}
            </p>

            {error && (
              <div
                className="alert alert-error text-sm mb-4"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
              >
                <InfoIcon size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success text-sm mb-4" role="status" aria-live="polite">
                <InfoIcon size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label htmlFor="email" className="field-label">{a.email}</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                    placeholder="tu@email.com"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                  {loading ? fp.requestLoading : fp.requestSubmit}
                </button>

                <div className="text-center pt-4">
                  <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                    {fp.backToLogin}
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="field-label">{fp.newPasswordLabel}</label>
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    ariaLabel={fp.newPasswordLabel}
                  />
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="field-label">{a.confirmPassword}</label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    ariaLabel={a.confirmPassword}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                  {loading ? fp.resetLoading : fp.resetSubmit}
                </button>

                <div className="text-center pt-4">
                  <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                    {fp.backToLogin}
                  </Link>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            {fp.supportPrefix}{' '}
            <a href="mailto:support@medisync.com" className="text-blue-600 hover:text-blue-500 font-medium">
              {fp.supportLink}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useLang();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-slate-500 dark:text-slate-400">{t('common').loading}</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
