'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { API_BASE } from '../lib/api';
import { getPostAuthRedirect } from '../lib/auth-redirects';
import { useLang } from '../lib/i18n/context';
import { GoogleIcon } from '../components/icons';
import PasswordInput from '../components/PasswordInput';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const redirect = params.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const me = await login(email, password);
      router.push(getPostAuthRedirect(me, redirect));
    } catch (err) {
      setError(err instanceof Error ? err.message : a.loginBtn);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm text-muted-foreground">{a.subtitle}</p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-8">
            <h2 className="mb-6 font-heading text-lg font-semibold">{a.welcomeBack}</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <Alert variant="destructive" aria-live="polite">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">{a.password}</Label>
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

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? a.loggingIn : a.loginBtn}
              </Button>

              <div className="pt-1 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {a.forgotPassword}
                </Link>
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-card px-3">{a.orContinueWith}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                render={<a href={`${API_BASE}/auth/google`} />}
              >
                <GoogleIcon size={16} />
                Google
              </Button>

              <p className="pt-2 text-center text-sm text-muted-foreground">
                {a.noAccount}{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  {a.registerBtn}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLang();
  const a = t('auth');

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
          <div className="text-muted-foreground">{a.loginLoading}</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
