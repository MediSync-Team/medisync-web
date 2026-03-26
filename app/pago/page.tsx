'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PagoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');
  
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

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
      console.log('Pref response:', data);

      if (data.success && data.data?.initPoint) {
        window.location.href = data.data.initPoint;
      } else {
        alert('Error: ' + (data.error?.message || 'No se pudo crear la preferencia'));
        router.push('/dashboard/paciente');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al procesar el pago');
      router.push('/dashboard/paciente');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">💳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Procesando pago...</h1>
        <p className="text-gray-600">Serás redirigido a Mercado Pago</p>
        <div className="mt-6 animate-pulse">
          <div className="w-48 h-2 bg-blue-200 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
