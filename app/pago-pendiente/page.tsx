'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PagoPendienteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');

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
        <h1 className="text-2xl font-bold text-yellow-600 mb-4">Pago pendiente</h1>
        <p className="text-gray-600 mb-6">
          Tu pago está siendo procesado. Te notificaremos cuando sea confirmado. 
          Tu turno quedará pendiente hasta que se complete el pago.
        </p>
        <div className="space-y-3">
          <Link 
            href="/dashboard/paciente"
            className="block w-full py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Ver mis turnos
          </Link>
          <Link 
            href="/"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Volver al inicio
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Redirigiendo en 5 segundos...</p>
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
