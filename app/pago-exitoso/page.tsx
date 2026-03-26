'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PagoExitosoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    const confirmarPago = async () => {
      if (!turnoId) {
        setConfirming(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/pagos/confirmar-pago?turnoId=${turnoId}`, {
          method: 'POST',
        });
        
        if (res.ok) {
          await fetch(`${API_URL}/turnos/${turnoId}`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ estado: 'CONFIRMADO' }),
          });
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
      } finally {
        setConfirming(false);
      }
    };

    confirmarPago();

    const timer = setTimeout(() => {
      router.push('/dashboard/paciente');
    }, 5000);

    return () => clearTimeout(timer);
  }, [turnoId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">{confirming ? '⏳' : '✅'}</div>
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          {confirming ? 'Confirmando pago...' : '¡Pago exitoso!'}
        </h1>
        <p className="text-gray-600 mb-6">
          {confirming 
            ? 'Verificando tu pago con Mercado Pago...'
            : 'Tu turno ha sido confirmado. Recibirás un email con los detalles.'}
        </p>
        {!confirming && (
          <div className="space-y-3">
            <Link 
              href="/dashboard/paciente"
              className="block w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
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
        )}
        {confirming && (
          <div className="mt-4 animate-pulse">
            <div className="w-full h-2 bg-gray-200 rounded">
              <div className="h-2 bg-green-500 rounded" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400 mt-4">Redirigiendo en 5 segundos...</p>
      </div>
    </div>
  );
}
