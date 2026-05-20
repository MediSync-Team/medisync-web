'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
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
  const [confirmed, setConfirmed] = useState(false);
  const [calInfo, setCalInfo] = useState<TurnoCalendarInfo | null>(null);

  const checkPaymentStatus = useCallback(async () => {
    if (!turnoId) return false;
    
    setConfirming(true);
    let isConfirmed = false;
    
    // Poll up to 5 times, waiting 2 seconds between attempts
    for (let i = 0; i < 5; i++) {
      try {
        const res = await api.pagos.confirmarPago(turnoId);
        if (res?.confirmed) {
          isConfirmed = true;
          break;
        }
      } catch (err) {
        console.error(`Error confirming payment (attempt ${i + 1}):`, err);
      }
      
      // Wait 2 seconds before next attempt (if not the last attempt)
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setConfirmed(isConfirmed);
    setConfirming(false);
    return isConfirmed;
  }, [turnoId]);

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

    if (turnoId) {
      checkPaymentStatus();
    } else {
      setConfirming(false);
    }
  }, [turnoId, checkPaymentStatus]);

  useEffect(() => {
    // Redirect only if the payment is successfully confirmed
    if (!confirming && confirmed) {
      const timer = setTimeout(() => {
        router.push('/dashboard/paciente?tab=proximos');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [confirming, confirmed, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              confirming ? 'bg-blue-100' : confirmed ? 'bg-emerald-100' : 'bg-orange-100'
            }`}>
              {confirming ? (
                <Spinner size={32} className="text-blue-500" />
              ) : confirmed ? (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {confirming 
                ? 'Confirmando pago...' 
                : confirmed 
                  ? '¡Pago exitoso!' 
                  : 'Verificación pendiente'}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {confirming
                ? 'Verificando tu pago con Mercado Pago...'
                : confirmed
                  ? 'Tu turno quedó confirmado. Recibirás un email con los detalles.'
                  : 'El pago aún no se ha confirmado. Si ya pagaste, puede demorar unos minutos en procesarse.'}
            </p>
          </div>

          {!confirming && (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/dashboard/paciente?tab=proximos"
                className="btn btn-primary w-full"
              >
                Ver mis turnos
              </Link>
              {!confirmed ? (
                <button
                  onClick={checkPaymentStatus}
                  className="btn btn-ghost w-full text-slate-500"
                >
                  Volver a intentar
                </button>
              ) : (
                <Link
                  href="/"
                  className="btn btn-ghost w-full text-slate-500"
                >
                  Volver al inicio
                </Link>
              )}
            </div>
          )}

          {confirming && (
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>

        {/* Calendar card — shown once payment is confirmed and we have turno info */}
        {!confirming && confirmed && calInfo && (
          <AgendarCalendario turno={calInfo} />
        )}

        {!confirming && confirmed && (
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
