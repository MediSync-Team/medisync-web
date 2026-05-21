'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, CuponValidado } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import { getLocale } from '../lib/date';
import { CreditCardIcon } from '../components/icons';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card p-8">{p.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-6">
      <div className="card p-8 max-w-md w-full">
        <div className="text-4xl mb-4 text-center text-blue-700 flex items-center justify-center"><CreditCardIcon size={30} /></div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-6 text-center">{p.checkoutTitle}</h1>

        {errorMessage && (
          <div className="alert alert-error text-left mb-4" role="status" aria-live="polite">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Coupon section */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <label className="field-label mb-2">{p.couponPrompt}</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError('');
                setValidatedCoupon(null);
              }}
              placeholder={p.couponPlaceholder}
              className="field-input flex-1"
              disabled={validatingCoupon || redirecting}
            />
            <button
              onClick={handleValidateCoupon}
              disabled={validatingCoupon || redirecting || !couponCode.trim()}
              className="btn btn-secondary btn-sm"
            >
              {validatingCoupon ? p.couponValidating : p.couponApply}
            </button>
          </div>

          {couponError && (
            <p className="text-xs text-red-600 mb-2">{couponError}</p>
          )}

          {validatedCoupon && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 font-semibold">{p.couponApplied}</p>
                  {validatedCoupon.descripcion && (
                    <p className="text-sm text-emerald-800 font-medium mt-1">{validatedCoupon.descripcion}</p>
                  )}
                  <div className="text-xs text-emerald-600 mt-2 space-y-1">
                    <p>{p.originalPrice}: ${validatedCoupon.montoOriginal.toLocaleString(getLocale(lang))}</p>
                    <p className="font-semibold">{p.savings}: -${validatedCoupon.montoDescuento.toLocaleString(getLocale(lang))}</p>
                    <p className="font-bold text-emerald-700">{p.total}: ${validatedCoupon.montoFinal.toLocaleString(getLocale(lang))}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-emerald-600 hover:text-emerald-700 text-xl"
                  disabled={redirecting}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment button */}
        <button
          onClick={crearPreferenciaYRedirigir}
          disabled={redirecting}
          className="btn btn-primary w-full"
        >
          {redirecting ? p.processing : validatedCoupon !== null && validatedCoupon.montoFinal <= 0 ? p.confirmAppointment : p.continueToPayment}
        </button>

        <button
          onClick={() => router.push('/dashboard/paciente?tab=proximos')}
          disabled={redirecting}
          className="btn btn-secondary w-full mt-3"
        >
          {c.cancel}
        </button>
      </div>
    </div>
  );
}

export default function PagoPage() {
  const { t } = useLang();

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50">{t('common').loading}</div>}>
      <PagoContent />
    </Suspense>
  );
}
