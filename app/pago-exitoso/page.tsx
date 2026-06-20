'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, TriangleAlert, Loader2 } from 'lucide-react';
import AgendarCalendario from '../components/AgendarCalendario';
import { TurnoCalendarInfo } from '../lib/calendar';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_TIMEOUT_MS = 2 * 60 * 1000;

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLang();
  const labels = t('auth').paymentResult.success;
  const turnoId = searchParams.get('turno');

  const [confirming, setConfirming] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [calInfo, setCalInfo] = useState<TurnoCalendarInfo | null>(null);
  const pollRunRef = useRef(0);

  const checkPaymentStatus = useCallback(async () => {
    if (!turnoId) return false;

    const runId = pollRunRef.current + 1;
    pollRunRef.current = runId;
    setConfirming(true);
    setConfirmed(false);

    const startedAt = Date.now();

    while (pollRunRef.current === runId) {
      try {
        const res = await api.pagos.confirmarPago(turnoId);
        if (res?.confirmed) {
          if (pollRunRef.current === runId) {
            setConfirmed(true);
            setConfirming(false);
          }
          return true;
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
      }

      if (Date.now() - startedAt >= PAYMENT_POLL_TIMEOUT_MS) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, PAYMENT_POLL_INTERVAL_MS));
    }

    if (pollRunRef.current === runId) {
      setConfirmed(false);
      setConfirming(false);
    }
    return false;
  }, [turnoId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('medisync_last_turno_cal');
      if (raw) {
        const parsed: TurnoCalendarInfo = JSON.parse(raw);
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

    return () => {
      pollRunRef.current += 1;
    };
  }, [turnoId, checkPaymentStatus]);

  useEffect(() => {
    if (!confirming && confirmed) {
      const timer = setTimeout(() => {
        router.push('/dashboard/paciente?tab=proximos');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [confirming, confirmed, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-8 text-center">
            <div className="flex justify-center">
              <div
                className={`flex size-16 items-center justify-center rounded-full ${
                  confirming ? 'bg-info/10 text-info' : confirmed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}
              >
                {confirming ? (
                  <Loader2 className="size-8 animate-spin" />
                ) : confirmed ? (
                  <Check className="size-8" strokeWidth={2.5} />
                ) : (
                  <TriangleAlert className="size-8" />
                )}
              </div>
            </div>

            <div>
              <h1 className="font-heading text-2xl font-bold">
                {confirming ? labels.confirmingTitle : confirmed ? labels.confirmedTitle : labels.pendingTitle}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {confirming ? labels.confirmingDescription : confirmed ? labels.confirmedDescription : labels.pendingDescription}
              </p>
            </div>

            {!confirming && (
              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full" render={<Link href="/dashboard/paciente?tab=proximos" />}>
                  {labels.viewAppointments}
                </Button>
                {!confirmed ? (
                  <Button variant="ghost" className="w-full" onClick={checkPaymentStatus}>
                    {labels.retry}
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full" render={<Link href="/" />}>
                    {labels.home}
                  </Button>
                )}
              </div>
            )}

            {confirming && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-pulse rounded-full bg-info" style={{ width: '60%' }} />
              </div>
            )}
          </CardContent>
        </Card>

        {!confirming && confirmed && calInfo && <AgendarCalendario turno={calInfo} />}

        {!confirming && confirmed && (
          <p className="text-center text-xs text-muted-foreground">{labels.redirecting}</p>
        )}
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <PagoExitosoContent />
    </Suspense>
  );
}
