'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, X } from 'lucide-react';
import { api, CuponValidado } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import { getLocale } from '../lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function PagoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLang();
  const p = t('auth').payment;
  const c = t('common');
  const turnoId = searchParams.get('turno');

  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState<CuponValidado | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (!turnoId) {
      router.push('/');
      return;
    }
    setLoading(false);
  }, [turnoId]);

  const handleValidateCoupon = async () => {
    if (!turnoId || !couponCode.trim()) {
      setCouponError(p.couponRequired);
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');
    try {
      const result = await api.cupones.validar(couponCode.trim(), turnoId);
      setValidatedCoupon(result);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : p.couponInvalid);
      setValidatedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setValidatedCoupon(null);
    setCouponError('');
  };

  const crearPreferenciaYRedirigir = async () => {
    try {
      setRedirecting(true);
      setErrorMessage('');

      if (!turnoId) {
        setErrorMessage(p.paymentProcessingError);
        setRedirecting(false);
        return;
      }

      const body: { turnoId: string; cuponCodigo?: string } = { turnoId };
      if (validatedCoupon) {
        body.cuponCodigo = couponCode.trim();
      }

      const data = await api.pagos.crearPreferencia(body);

      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else if (data.necesitaPago === false) {
        router.push(`/pago-exitoso?turno=${turnoId}`);
      } else {
        setErrorMessage(data.mensaje || p.couponCreateError);
        setRedirecting(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage(p.paymentProcessingError);
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Card><CardContent className="p-8 text-muted-foreground">{p.loading}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-6">
      <Card className="w-full max-w-md rounded-2xl">
        <CardContent className="p-8">
          <div className="mb-4 flex justify-center text-primary">
            <CreditCard className="size-8" />
          </div>
          <h1 className="mb-6 text-center font-heading text-xl font-bold">{p.checkoutTitle}</h1>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4" role="status" aria-live="polite">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Coupon section */}
          <div className="mb-6 border-b pb-6">
            <Label className="mb-2 block">{p.couponPrompt}</Label>
            <div className="mb-3 flex gap-2">
              <Input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError('');
                  setValidatedCoupon(null);
                }}
                placeholder={p.couponPlaceholder}
                disabled={validatingCoupon || redirecting}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleValidateCoupon}
                disabled={validatingCoupon || redirecting || !couponCode.trim()}
              >
                {validatingCoupon ? p.couponValidating : p.couponApply}
              </Button>
            </div>

            {couponError && <p className="mb-2 text-xs text-destructive">{couponError}</p>}

            {validatedCoupon && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-success">{p.couponApplied}</p>
                    {validatedCoupon.descripcion && (
                      <p className="mt-1 text-sm font-medium text-success">{validatedCoupon.descripcion}</p>
                    )}
                    <div className="mt-2 space-y-1 text-xs text-success/90">
                      <p>{p.originalPrice}: ${validatedCoupon.montoOriginal.toLocaleString(getLocale(lang))}</p>
                      <p className="font-semibold">{p.savings}: -${validatedCoupon.montoDescuento.toLocaleString(getLocale(lang))}</p>
                      <p className="font-bold text-success">{p.total}: ${validatedCoupon.montoFinal.toLocaleString(getLocale(lang))}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-success hover:text-success/80"
                    disabled={redirecting}
                    aria-label="Quitar cupón"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment button */}
          <Button onClick={crearPreferenciaYRedirigir} disabled={redirecting} className="w-full">
            {redirecting
              ? p.processing
              : validatedCoupon !== null && validatedCoupon.montoFinal <= 0
                ? p.confirmAppointment
                : p.continueToPayment}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/paciente?tab=proximos')}
            disabled={redirecting}
            className="mt-3 w-full"
          >
            {c.cancel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PagoPage() {
  const { t } = useLang();

  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30 p-8 text-muted-foreground">{t('common').loading}</div>}>
      <PagoContent />
    </Suspense>
  );
}
