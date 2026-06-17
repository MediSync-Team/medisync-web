'use client';

import { useEffect, useState } from 'react';
import { api, AdminAnalytics } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';

/** Revenue & analytics tab of the admin dashboard. */
export default function RevenueTab() {
  const { t, lang } = useLang();
  const admin = t('admin');
  const locale = getLocale(lang);
  const translateSpecialty = useTranslateSpecialty();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">{admin.loadingAnalytics}</div>;
  if (!data) return <div className="text-red-500 text-sm">{admin.analyticsError}</div>;

  const maxRevenue = Math.max(...data.revenueByMonth.map(d => d.revenue), 1);
  const maxTurnos = Math.max(...data.turnosByMonth.map(d => d.count), 1);
  const maxEsp = Math.max(...data.turnosPorEspecialidad.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{admin.revenueAnalytics}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: admin.totalRevenue, value: `$${data.revenueTotal.toLocaleString(locale)}`, color: 'emerald' },
          { label: admin.commissions, value: `$${data.comisionesTotal.toLocaleString(locale)}`, color: 'blue' },
          { label: admin.completionRate, value: `${data.tasaCompletado.toFixed(1)}%`, color: 'indigo' },
          { label: admin.cancellationRate, value: `${data.tasaCancelacion.toFixed(1)}%`, color: 'red' },
        ].map(c => {
          const colorMap: Record<string, string> = {
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            red: 'bg-red-50 border-red-200 text-red-700',
          };
          return (
            <div key={c.label} className={`border rounded-xl p-5 ${colorMap[c.color]}`}>
              <p className="text-xs font-medium opacity-70">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{admin.monthlyRevenue}</h2>
        <div className="flex items-end gap-1 h-40">
          {data.revenueByMonth.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                <div
                  className="w-full bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-600"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 128, d.revenue > 0 ? 4 : 0)}px` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                  ${d.revenue.toLocaleString(locale)}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 rotate-45 origin-left translate-x-2 whitespace-nowrap">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly turnos chart */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{admin.monthlyAppointments}</h2>
        <div className="flex items-end gap-1 h-32">
          {data.turnosByMonth.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                <div
                  className="w-full bg-blue-400 rounded-t transition-all group-hover:bg-blue-500"
                  style={{ height: `${Math.max((d.count / maxTurnos) * 104, d.count > 0 ? 4 : 0)}px` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                  {d.count} {d.count === 1 ? admin.appointmentSingular : admin.appointmentPlural}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 rotate-45 origin-left translate-x-2 whitespace-nowrap">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments by specialty */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{admin.appointmentsBySpecialty}</h2>
        <div className="space-y-3">
          {data.turnosPorEspecialidad.map(d => (
            <div key={d.especialidad} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300 w-40 truncate flex-shrink-0">{translateSpecialty(d.especialidad)}</span>
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(d.count / maxEsp) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-10 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top professionals */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{admin.topProfessionals}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">#</th>
              <th className="text-left px-5 py-3">{admin.professional}</th>
              <th className="text-left px-5 py-3">{admin.specialty}</th>
              <th className="text-right px-5 py-3">{admin.completed}</th>
              <th className="text-right px-5 py-3">{admin.generatedRevenue}</th>
            </tr>
          </thead>
          <tbody>
            {data.topProfesionales.map((p, i) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-5 py-3 text-slate-400 font-mono text-xs">#{i + 1}</td>
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{p.nombre} {p.apellido}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{translateSpecialty(p.especialidad)}</td>
                <td className="px-5 py-3 text-right text-slate-700 dark:text-slate-200">{p.completados}</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">${p.revenue.toLocaleString(locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
