'use client';

import { useLang } from '../../lib/i18n/context';
import { SuscripcionEstado } from '../../lib/api';
import { getLocale } from '../../lib/date';

const PLAN_PRO_PRICE_ARS = 20000;

function formatPlanPrice(lang: string) {
  return new Intl.NumberFormat(getLocale(lang), {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(PLAN_PRO_PRICE_ARS);
}

export default function PlanView({
  suscripcion,
  loading,
  onIniciarSuscripcion,
  onCancelarSuscripcion,
  redirecting,
}: {
  suscripcion: SuscripcionEstado | null;
  loading: boolean;
  onIniciarSuscripcion: () => void;
  onCancelarSuscripcion: () => void;
  redirecting: boolean;
}) {
  const { lang, t } = useLang();
  const c = t('common');
  const d = t('dashboard');
  const planPrice = formatPlanPrice(lang);
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!suscripcion) {
    return <div className="text-center text-muted-foreground">{t('common').loading}</div>;
  }

  const isPro = suscripcion.plan === 'PRO';
  const turnosRemainingTemplate = d.turnosRemaining;
  const updateToProLabel = d.updateToPro.replace('{{price}}', planPrice);
  const planMonthlyPriceLabel = d.planMonthlyPrice.replace('{{price}}', planPrice);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Plan Banner */}
      <div className={`rounded-2xl p-6 border-2 ${isPro ? 'bg-gradient-to-br from-primary/10 to-success/10 border-primary/20' : 'bg-muted border-border'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-sm font-bold uppercase tracking-wider ${isPro ? 'text-primary' : 'text-muted-foreground'}`}>
              {d.planCurrent}
            </div>
            <h2 className={`text-3xl font-bold mt-2 ${isPro ? 'text-primary' : 'text-foreground'}`}>
              {isPro ? d.planPro : d.planFree}
            </h2>
            <p className={`text-sm mt-3 ${isPro ? 'text-primary/80' : 'text-muted-foreground'}`}>
              {isPro ? d.planProSubtitle : d.planFreeSubtitle}
            </p>
          </div>
          <div className={`text-5xl font-bold opacity-20 ${isPro ? 'text-primary' : 'text-muted-foreground'}`}>
            {isPro ? '∞' : '20'}
          </div>
        </div>
      </div>

      {/* Turno Counter (for FREE) */}
      {!isPro && (
        <div className="rounded-2xl bg-card border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">{d.turnosThisMonth}</span>
            <span className="text-sm text-muted-foreground">{suscripcion.turnosEsteMes} / {suscripcion.limiteTurnos}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(suscripcion.turnosEsteMes / suscripcion.limiteTurnos) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {turnosRemainingTemplate
              .replace('{{count}}', String(suscripcion.turnosRestantes))
              .replace('{{plural}}', suscripcion.turnosRestantes !== 1 ? 's' : '')}
          </p>
        </div>
      )}

      {/* Billing Info */}
      {isPro && suscripcion.planVenceAt && (
        <div className="rounded-2xl bg-success/10 border border-success/20 p-6">
          <div className="text-sm font-medium text-success">{d.nextCollection}</div>
          <div className="text-2xl font-bold text-success mt-2">
            {new Date(suscripcion.planVenceAt).toLocaleDateString(getLocale(lang))}
          </div>
          <p className="text-xs text-success/80 mt-2">{planMonthlyPriceLabel}</p>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3 flex-col sm:flex-row">
        {!isPro && (
          <button
            onClick={onIniciarSuscripcion}
            disabled={redirecting}
            className="btn btn-primary flex-1"
          >
            {redirecting ? d.redirecting : updateToProLabel}
          </button>
        )}

        {isPro && (
          <button
            onClick={onCancelarSuscripcion}
            disabled={redirecting}
            className="btn btn-secondary flex-1"
          >
            {d.cancelSubscription}
          </button>
        )}
      </div>

      {/* Features comparison */}
      <div className="rounded-2xl bg-card border p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">{d.planCompare}</h3>
        <div className="space-y-3">
          {[
            { feature: d.features.appointments, free: d.planFreeLimit, pro: d.planUnlimited },
            { feature: d.features.statistics, free: c.no, pro: c.yes },
            { feature: d.features.coupons, free: c.yes, pro: c.yes },
            { feature: d.features.onlinePayments, free: c.yes, pro: c.yes },
            { feature: d.features.medicalHistory, free: c.yes, pro: c.yes },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm font-medium text-foreground">{row.feature}</span>
              <div className="flex gap-4 text-sm">
                <span className={isPro ? 'text-muted-foreground' : 'font-bold text-primary'}>{row.free}</span>
                <span className={isPro ? 'font-bold text-primary' : 'text-muted-foreground'}>{row.pro}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
