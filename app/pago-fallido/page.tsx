'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { XIcon } from '../components/icons';

function PagoFallidoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(turnoId ? `/pago?turno=${turnoId}` : '/dashboard/paciente');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, turnoId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4 flex items-center justify-center"><XIcon size={48} className="text-red-600" /></div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Pago rechazado</h1>
        <p className="text-gray-600 mb-6">
          No se pudo procesar el pago. Tu turno no ha sido confirmado. Podés intentar nuevamente.
        </p>
        <div className="space-y-3">
          <Link 
            href={turnoId ? `/pago?turno=${turnoId}` : "/dashboard/paciente"}
            className="block w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Intentar nuevamente
          </Link>
          <Link 
            href="/dashboard/paciente"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Ver mis turnos
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Redirigiendo en 5 segundos...</p>
      </div>
    </div>
  );
}

export default function PagoFallidoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PagoFallidoContent />
    </Suspense>
  );
}
