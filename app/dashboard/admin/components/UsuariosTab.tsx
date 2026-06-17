'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, AdminUsuario } from '../../../lib/api';
import Pagination from '../../../components/Pagination';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';

const ROL_COLORS: Record<string, string> = {
  PROFESIONAL: 'bg-blue-100 text-blue-700',
  PACIENTE:    'bg-emerald-100 text-emerald-700',
  ADMIN:       'bg-purple-100 text-purple-700',
};

/** Users management tab of the admin dashboard. */
export default function UsuariosTab() {
  const { t, lang } = useLang();
  const admin = t('admin');
  const common = t('common');
  const translateSpecialty = useTranslateSpecialty();
  const locale = getLocale(lang);
  const [data, setData] = useState<{ usuarios: AdminUsuario[]; pagination: any } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    api.admin.getUsuarios({ page: p, limit: 20, search: q || undefined })
      .then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, query); }, [page, query, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  async function toggleActivo(id: string) {
    setToggling(id);
    try {
      const res = await api.admin.toggleActivo(id);
      setData(prev => prev ? {
        ...prev,
        usuarios: prev.usuarios.map(u =>
          u.id === id && u.profesional ? { ...u, profesional: { ...u.profesional, activo: res.activo } } : u
        ),
      } : prev);
    } finally {
      setToggling(null);
    }
  }

  const roleLabels: Record<string, string> = {
    ADMIN: admin.roleAdmin,
    PROFESIONAL: admin.roleProfessional,
    PACIENTE: admin.rolePatient,
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">{admin.users}</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={admin.searchByName}
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
                  <th className="text-left px-4 py-3">{admin.email}</th>
                  <th className="text-left px-4 py-3">{admin.name}</th>
                  <th className="text-left px-4 py-3">{admin.role}</th>
                  <th className="text-left px-4 py-3">{admin.specialty}</th>
                  <th className="text-left px-4 py-3">{admin.registered}</th>
                  <th className="text-left px-4 py-3">{admin.status}</th>
                </tr>
              </thead>
              <tbody>
                {data?.usuarios.map(u => {
                  const nombre = u.profesional
                    ? `${u.profesional.nombre} ${u.profesional.apellido}`
                    : u.paciente
                    ? `${u.paciente.nombre} ${u.paciente.apellido}`
                    : '—';
                  return (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{u.email}</td>
                      <td className="px-4 py-3 text-slate-700">{nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLORS[u.rol] ?? ''}`}>{roleLabels[u.rol] ?? u.rol}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{translateSpecialty(u.profesional?.especialidad.nombre) ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString(locale)}</td>
                      <td className="px-4 py-3">
                        {u.profesional ? (
                          <button
                            onClick={() => toggleActivo(u.id)}
                            disabled={toggling === u.id}
                            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                              u.profesional.activo
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700'
                                : 'bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                          >
                            {toggling === u.id ? '...' : u.profesional.activo ? admin.active : admin.suspended}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
