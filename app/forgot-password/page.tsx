'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Info } from 'lucide-react';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthIndicator, { getRequirements } from '../components/PasswordStrengthIndicator';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      await api.auth.forgotPassword(email);
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
    if (!reqs.minLength || !reqs.hasUppercase || !reqs.hasLowercase || !reqs.hasNumber || !reqs.hasSpecial) {
      setError(v.passwordRequirements);
      return;
    }

    setLoading(true);

    try {
      await api.auth.resetPassword(token!, newPassword);
      setSuccess(fp.resetSuccess);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : fp.resetError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background/80 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl">
            <CardContent className="p-8">
              <h1 className="mb-2 font-heading text-2xl font-bold">
                {step === 'request' ? fp.requestTitle : fp.resetTitle}
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                {step === 'request' ? fp.requestSubtitle : fp.resetSubtitle}
              </p>

              {error && (
                <Alert variant="destructive" className="mb-4" aria-live="polite">
                  <Info />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-success/40 text-success" role="status" aria-live="polite">
                  <Info />
                  <AlertDescription className="text-success/90">{success}</AlertDescription>
                </Alert>
              )}

              {step === 'request' ? (
                <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">{a.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? fp.requestLoading : fp.requestSubmit}
                  </Button>

                  <div className="pt-2 text-center">
                    <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                      {fp.backToLogin}
                    </Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="newPassword">{fp.newPasswordLabel}</Label>
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

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirmPassword">{a.confirmPassword}</Label>
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

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? fp.resetLoading : fp.resetSubmit}
                  </Button>

                  <div className="pt-2 text-center">
                    <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                      {fp.backToLogin}
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {fp.supportPrefix}{' '}
            <a href="mailto:support@medisync.com" className="font-medium text-primary hover:underline">
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
          <div className="text-muted-foreground">{t('common').loading}</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
