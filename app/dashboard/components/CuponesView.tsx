'use client';

import { useLang } from '../../lib/i18n/context';
import { Cupon } from '../../lib/api';
import { TrashIcon } from '../../components/icons';
import { getLocale } from '../../lib/date';

export default function CuponesView({
  cupones,
  loading,
  onShowNuevo,
  onToggleActivo,
  onEliminar,
}: {
  cupones: Cupon[];
  loading: boolean;
  onShowNuevo: () => void;
  onToggleActivo: (id: string, activo: boolean) => void;
  onEliminar: (id: string) => void;
}) {
  const { lang, t } = useLang();
  const d = t('dashboard');
  const couponsText = d.couponsView;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{couponsText.title}</h3>
        <button onClick={onShowNuevo} className="btn btn-primary btn-sm">
          + {couponsText.newCoupon}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : cupones.length === 0 ? (
        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-sm">{couponsText.empty}</p>
          <button onClick={onShowNuevo} className="btn btn-primary btn-sm mt-3">
            {couponsText.createFirst}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {cupones.map((cupon) => {
            const isExpired = cupon.expiresAt && new Date(cupon.expiresAt) < new Date();
            const isExhausted = cupon.maxUsos && cupon.usosActuales >= cupon.maxUsos;
            const statusBadge = !cupon.activo
              ? couponsText.statusInactive
              : isExpired
                ? couponsText.statusExpired
                : isExhausted
                  ? couponsText.statusExhausted
                  : couponsText.statusActive;
            const statusColor = !cupon.activo ? 'bg-slate-100 text-slate-600' : isExpired ? 'bg-red-100 text-red-600' : isExhausted ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600';

            return (
              <div key={cupon.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{cupon.codigo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusBadge}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{cupon.descripcion || '-'}</p>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>{couponsText.discount}: {cupon.tipo === 'PORCENTAJE' ? `${cupon.valor}%` : `$${cupon.valor.toLocaleString(getLocale(lang))}`}</p>
                    {cupon.maxUsos && (
                      <p>{couponsText.uses}: {cupon.usosActuales}/{cupon.maxUsos}</p>
                    )}
                    {cupon.expiresAt && (
                      <p>{couponsText.expires}: {new Date(cupon.expiresAt).toLocaleDateString(getLocale(lang))}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleActivo(cupon.id, cupon.activo)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
                      cupon.activo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cupon.activo ? couponsText.statusActive : couponsText.statusInactive}
                  </button>
                  <button
                    onClick={() => onEliminar(cupon.id)}
                    className="btn btn-ghost p-2 text-slate-400 hover:text-red-600"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
