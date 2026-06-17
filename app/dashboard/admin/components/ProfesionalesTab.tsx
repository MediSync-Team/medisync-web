'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, AdminProfesional } from '../../../lib/api';
import Pagination from '../../../components/Pagination';
import StarRating from '../../../components/StarRating';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';

/** Professionals management tab of the admin dashboard. */
export default function ProfesionalesTab() {
  const { t, lang } = useLang();
  const admin = t('admin');
  const common = t('common');
  const translateSpecialty = useTranslateSpecialty();
  const locale = getLocale(lang);
  const [data, setData] = useState<{ profesionales: AdminProfesional[]; pagination: any } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    api.admin.getProfesionales({ page: p, limit: 20, search: q || undefined })
      .then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, query); }, [page, query, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">{admin.professionals}</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={admin.searchProfessional}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{common.search}</button>
      </form>

      {loading ? (
        <div className="text-slate-400 text-sm">{common.loading}</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">{admin.professional}</th>
                  <th className="text-left px-4 py-3">{admin.email}</th>
                  <th className="text-left px-4 py-3">{admin.specialty}</th>
                  <th className="text-right px-4 py-3">{admin.price}</th>
                  <th className="text-left px-4 py-3">{admin.rating}</th>
                  <th className="text-right px-4 py-3">{admin.appointmentsCount}</th>
                  <th className="text-left px-4 py-3">{admin.status}</th>
                </tr>
              </thead>
              <tbody>
                {data?.profesionales.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{p.nombre} {p.apellido}</td>
                    <td className="px-4 py-3 text-slate-500">{p.usuario.email}</td>
                    <td className="px-4 py-3 text-slate-600">{translateSpecialty(p.especialidad.nombre)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">${Number(p.precioConsulta).toLocaleString(locale)}</td>
                    <td className="px-4 py-3">
                      {p.ratingPromedio != null ? (
                        <span className="flex items-center gap-1">
                          <StarRating value={p.ratingPromedio} size={14} />
                          <span className="text-xs text-slate-500">({p.totalResenas})</span>
                        </span>
                      ) : <span className="text-xs text-slate-400">{admin.noReviews}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{p._count.turnos}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {p.activo ? admin.active : admin.suspended}
                      </span>
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
