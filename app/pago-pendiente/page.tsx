'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '../lib/i18n/context';

function PagoPendienteContent() {
  const router = useRouter();
  const { t } = useLang();
  const labels = t('auth').paymentResult.pending;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/paciente');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-yellow-600 mb-4">{labels.title}</h1>
        <p className="text-gray-600 mb-6">
          {labels.description}
        </p>
        <div className="space-y-3">
          <Link 
            href="/dashboard/paciente"
            className="block w-full py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            {labels.viewAppointments}
          </Link>
          <Link 
            href="/"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {labels.home}
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">{labels.redirecting}</p>
      </div>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PagoPendienteContent />
    </Suspense>
  );
}
