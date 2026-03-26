'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PagoFallidoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');

  useEffect(() => {
    if (turnoId) {
      setTimeout(() => {
        router.push(`/profesional/${turnoId.split('-')[0] || ''}`);
      }, 5000);
    }
  }, [turnoId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Pago rechazado</h1>
        <p className="text-gray-600 mb-6">
          No se pudo procesar el pago. Tu turno no ha sido confirmado. Podés intentar nuevamente.
        </p>
        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver al inicio
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
