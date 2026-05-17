'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AgendarCalendario from '../components/AgendarCalendario';
import Spinner from '../components/Spinner';
import { TurnoCalendarInfo } from '../lib/calendar';
import { api } from '../lib/api';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnoId = searchParams.get('turno');
  const [confirming, setConfirming] = useState(true);
  const [calInfo, setCalInfo] = useState<TurnoCalendarInfo | null>(null);

  useEffect(() => {
    // Read calendar info persisted before the redirect to Mercado Pago
    try {
      const raw = localStorage.getItem('medisync_last_turno_cal');
      if (raw) {
        const parsed: TurnoCalendarInfo = JSON.parse(raw);
        // Only use it if it matches the current turnoId
        if (!turnoId || parsed.turnoId === turnoId) {
          setCalInfo(parsed);
        }
      }
    } catch { /* ignore */ }

    const confirmarPago = async () => {
      if (!turnoId) {
        setConfirming(false);
        return;
      }

      try {
        await api.pagos.confirmarPago(turnoId);
      } catch (err) {
        console.error('Error confirming payment:', err);
      } finally {
        setConfirming(false);
      }
    };

    confirmarPago();
  }, [turnoId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${confirming ? 'bg-blue-100' : 'bg-emerald-100'}`}>
              {confirming ? (
                <Spinner size={32} className="text-blue-500" />
              ) : (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {confirming ? 'Confirmando pago...' : '¡Pago exitoso!'}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {confirming
                ? 'Verificando tu pago con Mercado Pago...'
                : 'Tu turno quedó confirmado. Recibirás un email con los detalles.'}
            </p>
          </div>

          {!confirming && (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/dashboard/paciente"
                className="btn btn-primary w-full"
              >
                Ver mis turnos
              </Link>
              <Link
                href="/"
                className="btn btn-ghost w-full text-slate-500"
              >
                Volver al inicio
              </Link>
            </div>
          )}

          {confirming && (
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>

        {/* Calendar card — shown once payment is confirmed and we have turno info */}
        {!confirming && calInfo && (
          <AgendarCalendario turno={calInfo} />
        )}

        {!confirming && (
          <p className="text-center text-xs text-slate-400">
            Redirigiendo a tus turnos en 8 segundos...
          </p>
        )}
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <PagoExitosoContent />
    </Suspense>
  );
}
