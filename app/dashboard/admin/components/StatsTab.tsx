'use client';

import { useEffect, useState } from 'react';
import { api, AdminStats } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { ESTADO_COLORS } from './estado-colors';

/** Global metrics tab of the admin dashboard. */
export default function StatsTab() {
  const { t, lang } = useLang();
  const admin = t('admin');
  const status = t('status');
  const locale = getLocale(lang);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">{admin.loadingMetrics}</div>;
  if (!stats) return <div className="text-red-500 text-sm">{admin.metricsError}</div>;

  const cards = [
    { label: admin.totalUsers,         value: stats.totalUsuarios,     color: 'blue' },
    { label: admin.totalProfessionals, value: stats.totalProfesionales, color: 'indigo' },
    { label: admin.totalPatients,      value: stats.totalPacientes,     color: 'emerald' },
    { label: admin.totalAppointments,  value: stats.totalTurnos,        color: 'amber' },
    { label: admin.totalSpecialties,   value: stats.totalEspecialidades, color: 'purple' },
    { label: admin.totalReviews,       value: stats.totalResenas,        color: 'pink' },
    { label: admin.approvedIncome,     value: `$${stats.ingresosAprobados.toLocaleString(locale)}`, color: 'green' },
    { label: admin.last30Appointments, value: stats.turnosUltimos30,    color: 'cyan' },
    { label: admin.last30Registrations, value: stats.registrosUltimos30, color: 'teal' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">{admin.globalMetrics}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`border rounded-xl p-5 ${colorMap[c.color]}`}>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">{admin.appointmentsByStatus}</h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">{admin.status}</th>
              <th className="text-right px-4 py-3">{admin.quantity}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.turnosPorEstado).map(([estado, count]) => (
              <tr key={estado} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[estado] ?? 'bg-slate-100 text-slate-600'}`}>
                    {status[estado as keyof typeof status] ?? estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
