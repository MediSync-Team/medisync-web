'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function PagoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');
  
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!turnoId) {
      router.push('/');
      return;
    }
    
    crearPreferenciaYRedirigir();
  }, [turnoId]);

  const crearPreferenciaYRedirigir = async () => {
    const token = localStorage.getItem('token');
    
    try {
      setRedirecting(true);
      
      const res = await fetch(`${API_URL}/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ turnoId }),
      });

      const data = await res.json();

      if (data.success && data.data?.initPoint) {
        window.location.href = data.data.initPoint;
      } else {
        setErrorMessage(data.error?.message || 'No se pudo crear la preferencia de pago');
        setRedirecting(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage('Error al procesar el pago');
      setRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center card p-8 max-w-md w-full">
        <div className="text-4xl mb-4">💳</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Procesando pago</h1>
        {!errorMessage ? (
          <>
            <p className="text-slate-600">Seras redirigido a Mercado Pago en unos segundos.</p>
            <div className="mt-5 animate-pulse">
              <div className="w-48 h-2 bg-blue-200 rounded mx-auto"></div>
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="alert alert-error text-left" role="status" aria-live="polite">
              <span>{errorMessage}</span>
            </div>
            <button className="btn btn-primary w-full" onClick={() => router.push('/dashboard/paciente')}>
              Volver al panel
            </button>
          </div>
        )}
        {!errorMessage && !redirecting && !loading && (
          <div className="mt-4">
            <button className="btn btn-secondary w-full" onClick={() => router.push('/dashboard/paciente')}>
              Volver al panel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PagoContent />
    </Suspense>
  );
}
