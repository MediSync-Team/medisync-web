'use client';

import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { PacienteStats } from '../../../lib/api';

/* -- Patient statistics panel ---------------------------------------------- */
function EstadisticasPaciente({ stats, loading, d, translateSpecialty }: { stats: PacienteStats | null; loading: boolean; d: any; translateSpecialty: (name?: string) => string }) {
  const { lang } = useLang();
  const locale = getLocale(lang);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-slate-400">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <p className="text-sm">{d.noStatsYet}</p>
      </div>
    );
  }

  const turnosPorMes = Array.isArray(stats.turnosPorMes)
    ? stats.turnosPorMes.map((item) => ({ ...item, total: Number(item.total) || 0 }))
    : [];
  const maxMes = Math.max(...turnosPorMes.map(m => m.total), 1);
  const MES_LABELS: Record<string, string> = lang === 'en'
    ? {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
      }
    : {
        '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
      };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PacienteStatCard label={d.totalAppointments} value={stats.totalTurnos} color="blue" />
        <PacienteStatCard label={d.completed} value={stats.completados} color="emerald" />
        <PacienteStatCard label={d.cancelled} value={stats.cancelados} color="red" />
        <PacienteStatCard label={d.totalSpent} value={`$${stats.totalGastado.toLocaleString(locale)}`} color="amber" />
      </div>

      {turnosPorMes.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            {d.appointmentsPerMonth}
          </p>
          <div className="flex gap-1.5 h-36">
            {turnosPorMes.map(({ mes, total }) => {
              const [, mm] = mes.split('-');
              const pct = Math.round((total / maxMes) * 100);
              return (
                <div key={mes} className="flex-1 min-w-0 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{total}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all min-h-1"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${MES_LABELS[mm] ?? mm}: ${total}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 truncate max-w-full">{MES_LABELS[mm] ?? mm}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.topProfesionales.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{d.mostVisitedProfessionals}</p>
          <div className="space-y-3">
            {stats.topProfesionales.map(({ profesional, totalTurnos }, i) => profesional && (
              <div key={profesional.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-4 text-center">{i + 1}</span>
                {profesional.fotoUrl ? (
                  <img src={profesional.fotoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                    {profesional.nombre[0]}{profesional.apellido[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">Dr/a. {profesional.nombre} {profesional.apellido}</p>
                  <p className="text-xs text-slate-500 truncate">{translateSpecialty(profesional.especialidad.nombre)}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 shrink-0">{totalTurnos} {totalTurnos === 1 ? d.appointment : d.appointments}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.pagos.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span>{d.paymentHistory}</span>
            <span className="text-xs font-normal text-slate-400">{stats.pagos.length} {d.payment}{stats.pagos.length !== 1 ? 's' : ''}</span>
          </p>
          <div className="space-y-2">
            {stats.pagos.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">Dr/a. {pago.profesional}</p>
                  <p className="text-xs text-slate-500 truncate">{translateSpecialty(pago.especialidad)} · {new Date(pago.fecha).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">${pago.monto.toLocaleString(locale)}</p>
                  <span className="badge badge-green text-[10px]">{d.approved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalTurnos === 0 && (
        <div className="py-12 text-center text-slate-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <p className="text-sm">{d.noStatsYet} {d.bookFirstAppointmentStats}</p>
        </div>
      )}
    </div>
  );
}

function PacienteStatCard({ label, value, color }: { label: string; value: string | number; color: 'blue' | 'emerald' | 'red' | 'amber' }) {
  const colors = {
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
    red:     'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800',
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

export default EstadisticasPaciente;
export { PacienteStatCard };
