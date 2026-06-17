'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, AdminTurno } from '../../../lib/api';
import Pagination from '../../../components/Pagination';
import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDateTime, getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';
import { ESTADO_COLORS } from './estado-colors';

const ESTADOS = ['', 'RESERVADO', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO', 'AUSENTE'];

/** Appointments management tab of the admin dashboard. */
export default function TurnosTab() {
  const { t, lang } = useLang();
  const admin = t('admin');
  const common = t('common');
  const status = t('status');
  const modality = t('modality');
  const translateSpecialty = useTranslateSpecialty();
  const locale = getLocale(lang);
  const [data, setData] = useState<{ turnos: AdminTurno[]; pagination: any } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number, q: string, e: string) => {
    setLoading(true);
    api.admin.getTurnos({ page: p, limit: 20, search: q || undefined, estado: e || undefined })
      .then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, query, estado); }, [page, query, estado, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">{admin.appointments}</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={admin.searchAppointment}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{common.search}</button>
        </form>
        <select
          value={estado}
          onChange={e => { setEstado(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ESTADOS.map(e => <option key={e} value={e}>{e ? (status[e as keyof typeof status] ?? e) : admin.allStatuses}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">{common.loading}</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">{admin.dateTime}</th>
                  <th className="text-left px-4 py-3">{admin.professional}</th>
                  <th className="text-left px-4 py-3">{admin.patient}</th>
                  <th className="text-left px-4 py-3">{admin.modality}</th>
                  <th className="text-left px-4 py-3">{admin.status}</th>
                  <th className="text-right px-4 py-3">{admin.payment}</th>
                </tr>
              </thead>
              <tbody>
                {data?.turnos.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {formatClinicInstantDateTime(t.fechaHora, locale, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.profesional.nombre} {t.profesional.apellido}
                      <span className="block text-xs text-slate-400">{translateSpecialty(t.profesional.especialidad.nombre)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.modalidad === 'VIRTUAL' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {modality[t.modalidad as keyof typeof modality] ?? t.modalidad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[t.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {status[t.estado as keyof typeof status] ?? t.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.pago ? (
                        <span className="text-slate-700">${Number(t.pago.monto).toLocaleString(locale)}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onPageChange={p => setPage(p)}
            />
          )}
        </>
      )}
    </div>
  );
}
