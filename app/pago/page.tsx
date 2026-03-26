'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function PagoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');
  const cardFormContainerRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [turno, setTurno] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [mpReady, setMpReady] = useState(false);
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    if (!turnoId) {
      router.push('/');
      return;
    }
    loadTurnoData();
    loadMercadoPagoSDK();
  }, [turnoId]);

  const loadTurnoData = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/turnos/${turnoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTurno(data.data);
      }
    } catch (err) {
      console.error('Error loading turno:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMercadoPagoSDK = () => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      const mp = new window.MercadoPago('APP_USR-e2f7b18f-7dc9-44c2-a9a9-5d872f09ca4f', {
        locale: 'es-AR',
      });
      
      window.mpInstance = mp;
      setMpReady(true);
    };
    document.body.appendChild(script);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ turnoId }),
      });
      const prefData = await res.json();

      if (!prefData.success || !prefData.data.preferenciaId) {
        throw new Error(prefData.error?.message || 'Error al crear preferencia');
      }

      const paymentData = {
        transaction_amount: Number(turno?.profesional?.precioConsulta),
        token: 'mock-token-' + Date.now(),
        description: `Consulta con ${turno?.profesional?.nombre} ${turno?.profesional?.apellido}`,
        installments: installments,
        payment_method_id: 'visa',
        payer: {
          email: email || 'test@test.com',
        },
        external_reference: turnoId,
      };

      const paymentRes = await fetch(`${API_URL}/pagos/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const paymentResult = await paymentRes.json();

      if (paymentResult.success && paymentResult.data?.status === 'approved') {
        router.push('/pago-exitoso?turno=' + turnoId);
      } else {
        setError(paymentResult.error?.message || 'Error en el pago');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pagar Consulta</h1>
          <Link href="/dashboard/paciente" className="text-gray-500 hover:text-gray-700">
            ← Volver
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Resumen del turno</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Profesional:</span>{' '}
              {turno?.profesional ? (
                <span className="font-medium">
                  {turno.profesional.nombre} {turno.profesional.apellido}
                </span>
              ) : (
                <span className="text-red-500">No disponible</span>
              )}
            </p>
            <p>
              <span className="text-gray-500">Especialidad:</span>{' '}
              {turno?.profesional?.especialidad?.nombre || '-'}
            </p>
            <p>
              <span className="text-gray-500">Fecha:</span>{' '}
              {turno ? new Date(turno.fechaHora).toLocaleDateString('es-AR') : '-'}
            </p>
            <p>
              <span className="text-gray-500">Hora:</span>{' '}
              {turno ? new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </p>
            <p className="text-lg font-bold pt-2 border-t">
              Total: ${turno?.profesional?.precioConsulta ? Number(turno.profesional.precioConsulta).toLocaleString('es-AR') : '0'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Datos de pago</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento (MM/AA)</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="12/25"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del titular</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Como aparece en la tarjeta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="DNI">DNI</option>
                  <option value="CI">CI</option>
                  <option value="RUT">RUT</option>
                  <option value="CPF">CPF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de documento</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas</label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="1">1 cuota</option>
                  <option value="3">3 cuotas</option>
                  <option value="6">6 cuotas</option>
                  <option value="9">9 cuotas</option>
                  <option value="12">12 cuotas</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={processing || !turno}
              className="w-full mt-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? 'Procesando...' : `Pagar $${turno?.profesional?.precioConsulta ? Number(turno.profesional.precioConsulta).toLocaleString('es-AR') : '0'}`}
            </button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-md text-xs text-blue-700">
            <p><strong>Modo prueba:</strong> Usá estas tarjetas de prueba de Mercado Pago:</p>
            <p>• Visa: 4509 9535 6623 3704</p>
            <p>• Mastercard: 5031 4332 1540 6351</p>
            <p>• CVV: 123 | Vencimiento: cualquier fecha futura</p>
          </div>
        </div>
      </div>
    </div>
  );
}
