'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MediSyncLogo } from '../../components/icons';

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const isNew = params.get('isNew') === 'true';
    const error = params.get('error');
    const msg = params.get('msg');

    if (error) {
      const errorMsg = msg
        ? decodeURIComponent(msg)
        : error === 'EMAIL_EN_USO_CON_PASSWORD'
        ? 'Este email ya está registrado con contraseña. Iniciá sesión normalmente.'
        : 'Error al iniciar sesión con proveedor externo.';
      router.push(`/login?ssoError=${encodeURIComponent(errorMsg)}`);
      return;
    }

    if (!token) {
      router.push('/login');
      return;
    }

    localStorage.setItem('token', token);
    router.push(isNew ? '/auth/completa-perfil' : '/dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <MediSyncLogo />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MediSyncLogo />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
