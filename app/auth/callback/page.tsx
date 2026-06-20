'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useLang } from '../../lib/i18n/context';
import { MediSyncLogo } from '../../components/icons';
import { persistSsoToken } from '../../lib/sso-callback';
import { getSafeRedirectPath } from '../../lib/auth-redirects';

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const sso = t('auth').sso;

  useEffect(() => {
    const code = params.get('code');
    const error = params.get('error');
    const msg = params.get('msg');

    if (error) {
      const errorMsg = msg
        ? decodeURIComponent(msg)
        : error === 'EMAIL_EN_USO_CON_PASSWORD'
        ? sso.emailInUseWithPassword
        : sso.providerError;
      router.push(`/login?ssoError=${encodeURIComponent(errorMsg)}`);
      return;
    }

    if (!code) {
      router.push('/login');
      return;
    }

    api.auth.exchangeCode(code)
      .then(({ token, dest }) => {
        persistSsoToken(token, typeof window !== 'undefined' ? window.localStorage : null);
        router.push(getSafeRedirectPath(dest) ?? '/dashboard');
      })
      .catch(() => {
        router.push('/login?ssoError=' + encodeURIComponent(sso.linkExpired));
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <MediSyncLogo />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('auth').loginLoading}</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  const { t } = useLang();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MediSyncLogo />
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('common').loading}</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
