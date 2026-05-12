'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, AdminStats, AdminAnalytics, AdminUsuario, AdminProfesional, AdminTurno, Especialidad } from '../../lib/api';
import Pagination from '../../components/Pagination';
import StarRating from '../../components/StarRating';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import { useLang } from '../../lib/i18n/context';
import { getLocale } from '../../lib/date';
import { useTranslateSpecialty } from '../../lib/i18n/use-translate-specialty';

type Tab = 'stats' | 'revenue' | 'usuarios' | 'profesionales' | 'turnos' | 'especialidades';

const ESTADO_COLORS: Record<string, string> = {
  RESERVADO:   'bg-blue-100 text-blue-700',
  CONFIRMADO:  'bg-emerald-100 text-emerald-700',
  COMPLETADO:  'bg-slate-100 text-slate-600',
  CANCELADO:   'bg-red-100 text-red-700',
  AUSENTE:     'bg-amber-100 text-amber-700',
};

const ROL_COLORS: Record<string, string> = {
  PROFESIONAL: 'bg-blue-100 text-blue-700',
  PACIENTE:    'bg-emerald-100 text-emerald-700',
  ADMIN:       'bg-purple-100 text-purple-700',
};

export default function AdminPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const d = t('dashboard');
  const translateSpecialty = useTranslateSpecialty();
  const [tab, setTab] = useState<Tab>('stats');

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    api.auth.me().then(u => {
      if (u.rol !== 'ADMIN') router.push('/');
    }).catch(() => router.push('/login'));
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">MediSync Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeLangToggle />
          <button
            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 min-h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
          <nav className="space-y-1">
            {([
              ['stats',          'Métricas',        'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
              ['revenue',        'Revenue',         'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
              ['usuarios',       'Usuarios',        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
              ['profesionales',  'Profesionales',   'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
              ['turnos',         'Turnos',          'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
              ['especialidades', 'Especialidades',  'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'],
            ] as [Tab, string, string][]).map(([t, label, path]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  tab === t ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                </svg>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          {tab === 'stats'          && <StatsTab />}
          {tab === 'revenue'        && <RevenueTab />}
          {tab === 'usuarios'       && <UsuariosTab />}
          {tab === 'profesionales'  && <ProfesionalesTab />}
          {tab === 'turnos'         && <TurnosTab />}
          {tab === 'especialidades' && <EspecialidadesTab />}
        </main>
      </div>
    </div>
  );
}

// -- Revenue Tab --------------------------------------------------------------
function RevenueTab() {
  const { lang } = useLang();
  const locale = getLocale(lang);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Cargando analytics...</div>;
  if (!data) return <div className="text-red-500 text-sm">Error al cargar analytics.</div>;

  const maxRevenue = Math.max(...data.revenueByMonth.map(d => d.revenue), 1);
  const maxTurnos = Math.max(...data.turnosByMonth.map(d => d.count), 1);
  const maxEsp = Math.max(...data.turnosPorEspecialidad.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Revenue & Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue total', value: `$${data.revenueTotal.toLocaleString(locale)}`, color: 'emerald' },
          { label: 'Comisiones (5%)', value: `$${data.comisionesTotal.toLocaleString(locale)}`, color: 'blue' },
          { label: 'Tasa completado', value: `${data.tasaCompletado.toFixed(1)}%`, color: 'indigo' },
          { label: 'Tasa cancelación', value: `${data.tasaCancelacion.toFixed(1)}%`, color: 'red' },
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
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Revenue mensual (últimos 12 meses)</h2>
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
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Turnos mensuales (últimos 12 meses)</h2>
        <div className="flex items-end gap-1 h-32">
          {data.turnosByMonth.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                <div
                  className="w-full bg-blue-400 rounded-t transition-all group-hover:bg-blue-500"
                  style={{ height: `${Math.max((d.count / maxTurnos) * 104, d.count > 0 ? 4 : 0)}px` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                  {d.count} turnos
                </div>
              </div>
              <span className="text-[10px] text-slate-400 rotate-45 origin-left translate-x-2 whitespace-nowrap">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Turnos por especialidad */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Turnos por especialidad</h2>
        <div className="space-y-3">
          {data.turnosPorEspecialidad.map(d => (
            <div key={d.especialidad} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300 w-40 truncate flex-shrink-0">{d.especialidad}</span>
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

      {/* Top profesionales */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top 10 profesionales</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">#</th>
              <th className="text-left px-5 py-3">Profesional</th>
              <th className="text-left px-5 py-3">Especialidad</th>
              <th className="text-right px-5 py-3">Completados</th>
              <th className="text-right px-5 py-3">Revenue generado</th>
            </tr>
          </thead>
          <tbody>
            {data.topProfesionales.map((p, i) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-5 py-3 text-slate-400 font-mono text-xs">#{i + 1}</td>
                <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{p.nombre} {p.apellido}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.especialidad}</td>
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

// -- Stats Tab ----------------------------------------------------------------
function StatsTab() {
  const { t, lang } = useLang();
  const d = t('dashboard');
  const locale = getLocale(lang);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Cargando métricas...</div>;
  if (!stats) return <div className="text-red-500 text-sm">Error al cargar métricas.</div>;

  const cards = [
    { label: 'Usuarios totales',     value: stats.totalUsuarios,     color: 'blue' },
    { label: 'Profesionales',        value: stats.totalProfesionales, color: 'indigo' },
    { label: 'Pacientes',            value: stats.totalPacientes,     color: 'emerald' },
    { label: 'Turnos totales',       value: stats.totalTurnos,        color: 'amber' },
    { label: 'Especialidades',       value: stats.totalEspecialidades, color: 'purple' },
    { label: d.reviews,              value: stats.totalResenas,        color: 'pink' },
    { label: 'Ingresos aprobados',   value: `$${stats.ingresosAprobados.toLocaleString(locale)}`, color: 'green' },
    { label: 'Turnos (30 días)',      value: stats.turnosUltimos30,    color: 'cyan' },
    { label: 'Registros (30 días)',   value: stats.registrosUltimos30, color: 'teal' },
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
      <h1 className="text-xl font-bold text-slate-800 mb-6">Métricas globales</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`border rounded-xl p-5 ${colorMap[c.color]}`}>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Turnos por estado</h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.turnosPorEstado).map(([estado, count]) => (
              <tr key={estado} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[estado] ?? 'bg-slate-100 text-slate-600'}`}>
                    {estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -- Usuarios Tab -------------------------------------------------------------
function UsuariosTab() {
  const { t, lang } = useLang();
  const d = t("dashboard");
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

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Usuarios</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Buscar</button>
      </form>

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando...</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Especialidad</th>
                  <th className="text-left px-4 py-3">Registrado</th>
                  <th className="text-left px-4 py-3">Estado</th>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_COLORS[u.rol] ?? ''}`}>{u.rol}</span>
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
                            {toggling === u.id ? '...' : u.profesional.activo ? 'Activo' : 'Suspendido'}
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

// -- Profesionales Tab --------------------------------------------------------
function ProfesionalesTab() {
  const { t, lang } = useLang();
  const d = t("dashboard");
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
      <h1 className="text-xl font-bold text-slate-800 mb-4">Profesionales</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o especialidad..."
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Buscar</button>
      </form>

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando...</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Profesional</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Especialidad</th>
                  <th className="text-right px-4 py-3">Precio</th>
                  <th className="text-left px-4 py-3">Rating</th>
                  <th className="text-right px-4 py-3">Turnos</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data?.profesionales.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.nombre} {p.apellido}</td>
                    <td className="px-4 py-3 text-slate-500">{p.usuario.email}</td>
                    <td className="px-4 py-3 text-slate-600">{translateSpecialty(p.especialidad.nombre)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">${Number(p.precioConsulta).toLocaleString(locale)}</td>
                    <td className="px-4 py-3">
                      {p.ratingPromedio != null ? (
                        <span className="flex items-center gap-1">
                          <StarRating value={p.ratingPromedio} size={14} />
                          <span className="text-xs text-slate-500">({p.totalResenas})</span>
                        </span>
                      ) : <span className="text-xs text-slate-400">Sin reseñas</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{p._count.turnos}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {p.activo ? 'Activo' : 'Suspendido'}
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

// -- Turnos Tab ---------------------------------------------------------------
const ESTADOS = ['', 'RESERVADO', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO', 'AUSENTE'];

function TurnosTab() {
  const { t, lang } = useLang();
  const d = t("dashboard");
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
      <h1 className="text-xl font-bold text-slate-800 mb-4">Turnos</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por profesional o paciente..."
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Buscar</button>
        </form>
        <select
          value={estado}
          onChange={e => { setEstado(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando...</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Fecha y hora</th>
                  <th className="text-left px-4 py-3">Profesional</th>
                  <th className="text-left px-4 py-3">Paciente</th>
                  <th className="text-left px-4 py-3">Modalidad</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Pago</th>
                </tr>
              </thead>
              <tbody>
                {data?.turnos.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {new Date(t.fechaHora).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
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
                        {t.modalidad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[t.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                        {t.estado}
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

// -- Especialidades Tab -------------------------------------------------------
function EspecialidadesTab() {
  const [list, setList] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.especialidades.getAll().then(setList).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditId(null);
    setForm({ nombre: '', descripcion: '', icono: '' });
    setMsg(null);
    setShowForm(true);
  }

  function openEdit(e: Especialidad) {
    setEditId(e.id);
    setForm({ nombre: e.nombre, descripcion: e.descripcion ?? '', icono: e.icono ?? '' });
    setMsg(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setMsg({ text: 'El nombre es requerido.', ok: false }); return; }
    setSaving(true);
    setMsg(null);
    try {
      if (editId) {
        const updated = await api.admin.editarEspecialidad(editId, {
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          icono: form.icono || undefined,
        });
        setList(prev => prev.map(e => e.id === editId ? updated : e));
      } else {
        const created = await api.admin.crearEspecialidad({
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          icono: form.icono || undefined,
        });
        setList(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      setMsg({ text: editId ? 'Especialidad actualizada.' : 'Especialidad creada.', ok: true });
      setShowForm(false);
    } catch (e: any) {
      setMsg({ text: e.message ?? 'Error al guardar.', ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.admin.eliminarEspecialidad(id);
      setList(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      alert(e.message ?? 'Error al eliminar.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Especialidades</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva especialidad
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-slate-700 mb-4">{editId ? 'Editar especialidad' : 'Nueva especialidad'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
              <input
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ícono (emoji o texto corto)</label>
              <input
                value={form.icono}
                onChange={e => setForm(p => ({ ...p, icono: e.target.value }))}
                maxLength={10}
                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Ícono</th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Descripción</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xl">{e.icono ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{e.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{e.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(e)}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(e.id, e.nombre)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
