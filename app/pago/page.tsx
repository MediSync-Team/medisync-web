'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, CuponValidado } from '../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function PagoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
      setCouponError('Ingresa un código de cupón');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');
    try {
      const result = await api.cupones.validar(couponCode.trim(), turnoId);
      setValidatedCoupon(result);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Cupón inválido');
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
    const token = localStorage.getItem('token');

    try {
      setRedirecting(true);
      setErrorMessage('');

      const body: any = { turnoId };
      if (validatedCoupon) {
        body.cuponCodigo = couponCode.trim();
      }

      const res = await fetch(`${API_URL}/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card p-8">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-6">
      <div className="card p-8 max-w-md w-full">
        <div className="text-4xl mb-4 text-center">💳</div>
        <h1 className="text-xl font-bold text-slate-900 mb-6 text-center">Pagar consulta</h1>

        {errorMessage && (
          <div className="alert alert-error text-left mb-4" role="status" aria-live="polite">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Coupon section */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <label className="field-label mb-2">¿Tienes un código de descuento?</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError('');
                setValidatedCoupon(null);
              }}
              placeholder="ej: PROMO10"
              className="field-input flex-1"
              disabled={validatingCoupon || redirecting}
            />
            <button
              onClick={handleValidateCoupon}
              disabled={validatingCoupon || redirecting || !couponCode.trim()}
              className="btn btn-secondary btn-sm"
            >
              {validatingCoupon ? 'Validando...' : 'Aplicar'}
            </button>
          </div>

          {couponError && (
            <p className="text-xs text-red-600 mb-2">{couponError}</p>
          )}

          {validatedCoupon && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 font-semibold">✓ Cupón aplicado</p>
                  {validatedCoupon.descripcion && (
                    <p className="text-sm text-emerald-800 font-medium mt-1">{validatedCoupon.descripcion}</p>
                  )}
                  <div className="text-xs text-emerald-600 mt-2 space-y-1">
                    <p>Precio original: ${validatedCoupon.montoOriginal.toLocaleString('es-AR')}</p>
                    <p className="font-semibold">Ahorro: -${validatedCoupon.montoDescuento.toLocaleString('es-AR')}</p>
                    <p className="font-bold text-emerald-700">Total: ${validatedCoupon.montoFinal.toLocaleString('es-AR')}</p>
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
          {redirecting ? 'Procesando...' : 'Continuar al pago'}
        </button>

        <button
          onClick={() => router.push('/dashboard/paciente')}
          disabled={redirecting}
          className="btn btn-secondary w-full mt-3"
        >
          Cancelar
        </button>
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
