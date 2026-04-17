'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, Especialidad, Profesional } from './lib/api';
import { useAuth } from './lib/auth-context';
import { useLang } from './lib/i18n/context';
import OnboardingTour from './components/OnboardingTour';
import Pagination from './components/Pagination';
import StarRating from './components/StarRating';
import ThemeLangToggle from './components/ThemeLangToggle';

const HOME_TOUR_STEPS = [
  {
    selector: '[data-onboarding="hero"]',
    title: '¡Bienvenido a MediSync!',
    description:
      'La plataforma para conectar pacientes con profesionales de la salud. Reservá turnos al instante, pagá online y gestioná tu historial clínico.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="search-bar"]',
    title: 'Buscá tu especialista',
    description:
      'Escribí la especialidad que necesitás o elegí del menú desplegable. Luego hacé clic en "Buscar" para ver los profesionales disponibles.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="prof-list"]',
    title: 'Profesionales disponibles',
    description:
      'Aquí aparecen los profesionales de la salud registrados. Hacé clic en "Ver perfil y reservar" para ver sus horarios disponibles y reservar un turno.',
    position: 'top' as const,
  },
  {
    selector: '[data-onboarding="nav-register"]',
    title: '¡Registrate gratis!',
    description:
      'Como paciente podés reservar turnos, recibir recordatorios y acceder a tus recetas. Como profesional podés gestionar tu agenda y facturar consultas.',
    position: 'bottom' as const,
  },
];

const LIMIT = 9;

type Modalidad = 'PRESENCIAL' | 'VIRTUAL' | '';
type OrderBy = 'precio_asc' | 'precio_desc' | 'nombre_asc' | '';

interface Filters {
  search: string;
  especialidad: string;
  precioMin: string;
  precioMax: string;
  modalidad: Modalidad;
  fecha: string;
  orderBy: OrderBy;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  especialidad: '',
  precioMin: '',
  precioMax: '',
  modalidad: '',
  fecha: '',
  orderBy: '',
};

function activeFilterCount(f: Filters) {
  return [f.precioMin, f.precioMax, f.modalidad, f.fecha, f.orderBy].filter(Boolean).length;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const h = t('home');
  const nav = t('nav');
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Draft state while panel is open
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);

  const fetchProfesionales = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.profesionales.getAll>[0] = {
        page: String(p),
        limit: String(LIMIT),
      };
      const term = f.search || f.especialidad;
      if (term) params.especialidad = term;
      if (f.precioMin) params.precioMin = f.precioMin;
      if (f.precioMax) params.precioMax = f.precioMax;
      if (f.modalidad) params.modalidad = f.modalidad;
      if (f.fecha) params.fecha = f.fecha;
      if (f.orderBy) params.orderBy = f.orderBy;

      const data = await api.profesionales.getAll(params);
      setProfesionales(data.profesionales);
      setPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
    } catch (err) {
      console.error('Error loading profesionales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.especialidades.getAll().then(setEspecialidades).catch(() => {});
    fetchProfesionales(EMPTY_FILTERS, 1);
  }, [fetchProfesionales]);

  const applyFilters = (f: Filters) => {
    setFilters(f);
    setPage(1);
    setShowAdvanced(false);
    fetchProfesionales(f, 1);
  };

  const handleSearch = () => applyFilters({ ...draft, search: draft.search || filters.search });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProfesionales(filters, newPage);
    document.getElementById('prof-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const removeFilter = (key: keyof Filters) => {
    const updated = { ...filters, [key]: '' };
    applyFilters(updated);
    setDraft(updated);
  };

  const clearAll = () => {
    applyFilters(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
  };

  const advCount = activeFilterCount(filters);

  // Labels for active filter pills
  const filterPills: { key: keyof Filters; label: string }[] = [
    ...(filters.precioMin ? [{ key: 'precioMin' as const, label: `Precio mín: $${filters.precioMin}` }] : []),
    ...(filters.precioMax ? [{ key: 'precioMax' as const, label: `Precio máx: $${filters.precioMax}` }] : []),
    ...(filters.modalidad ? [{ key: 'modalidad' as const, label: filters.modalidad === 'PRESENCIAL' ? 'Presencial' : 'Virtual' }] : []),
    ...(filters.fecha ? [{ key: 'fecha' as const, label: `Disponible el ${new Date(filters.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}` }] : []),
    ...(filters.orderBy ? [{ key: 'orderBy' as const, label: { precio_asc: 'Precio ↑', precio_desc: 'Precio ↓', nombre_asc: 'Nombre A-Z' }[filters.orderBy] }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {!user && (
        <OnboardingTour storageKey="medisync-home-tour-v1" steps={HOME_TOUR_STEPS} delay={1200} />
      )}

      {/* ── Navbar ───────────────────────────────────────── */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm dark:border-b dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#2563EB" />
                <path d="M9 16h14M16 9v14" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <circle cx="16" cy="16" r="5" stroke="white" strokeWidth="1.5" />
              </svg>
              <span className="text-xl font-bold text-blue-600 tracking-tight">MediSync</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeLangToggle />
              {user ? (
                <>
                  <Link href={user.paciente ? '/dashboard/paciente' : '/dashboard'} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">
                    {nav.dashboard}
                  </Link>
                  <button onClick={logout} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 font-medium">
                    {nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">{t('auth').login}</Link>
                  <Link href="/register" data-onboarding="nav-register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
                    {t('auth').register}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section data-onboarding="hero" className="relative overflow-hidden bg-blue-600 text-white py-24">
          <span className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-blue-500/40" />
          <span className="pointer-events-none absolute top-8 left-1/4 w-24 h-24 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -top-8 right-1/3 w-40 h-40 rounded-full bg-blue-400/30" />
          <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-8 w-56 h-56 rounded-full bg-blue-500/25" />
          <span className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-700/50 translate-x-1/3 translate-y-1/3" />
          <span className="pointer-events-none absolute bottom-4 left-10 w-16 h-16 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute bottom-12 left-1/3 w-10 h-10 rounded-full bg-emerald-400/30" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 text-blue-50 text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Plataforma médica argentina
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              Encontrá tu especialista<br className="hidden sm:block" /> y reservá al instante
            </h1>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
              Conectá con profesionales de la salud, pagá online y gestioná toda tu historia clínica en un solo lugar.
            </p>

            {/* ── Search bar ─────────────────────────────── */}
            <div
              data-onboarding="search-bar"
              className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white/15 backdrop-blur-sm p-2 rounded-2xl border border-white/20 shadow-xl"
            >
              <input
                type="text"
                placeholder={h.searchPlaceholder}
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
              <select
                value={draft.especialidad}
                onChange={(e) => setDraft({ ...draft, especialidad: e.target.value, search: '' })}
                className="px-4 py-3 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              >
                <option value="">{h.allSpecialties}</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.nombre}>{esp.nombre}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-sm shrink-0 transition-colors"
              >
                {t('common').search}
              </button>
            </div>

            {/* ── Advanced filter toggle ─────────────────── */}
            <button
              onClick={() => { setDraft(filters); setShowAdvanced(!showAdvanced); }}
              className="mt-4 inline-flex items-center gap-2 text-blue-100 hover:text-white text-sm transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              {h.advancedFilters}
              {advCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{advCount}</span>
              )}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* ── Advanced filter panel ────────────────────── */}
          {showAdvanced && (
            <div className="relative max-w-2xl mx-auto mt-4 px-4">
              <div className="bg-white rounded-2xl shadow-2xl p-5 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price range */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{h.priceMin} / {h.priceMax}</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Mín"
                          value={draft.precioMin}
                          onChange={(e) => setDraft({ ...draft, precioMin: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800"
                        />
                      </div>
                      <span className="text-slate-400 text-sm shrink-0">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Máx"
                          value={draft.precioMax}
                          onChange={(e) => setDraft({ ...draft, precioMax: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modalidad */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{h.modality}</label>
                    <div className="flex gap-2">
                      {(['', 'PRESENCIAL', 'VIRTUAL'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDraft({ ...draft, modalidad: m })}
                          className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                            draft.modalidad === m
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {m === '' ? h.allModalities : m === 'PRESENCIAL' ? `🏥 ${h.inPerson}` : `💻 ${h.virtual}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fecha disponibilidad */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{h.date}</label>
                    <input
                      type="date"
                      value={draft.fecha}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800"
                    />
                  </div>

                  {/* Ordenamiento */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{h.orderBy}</label>
                    <select
                      value={draft.orderBy}
                      onChange={(e) => setDraft({ ...draft, orderBy: e.target.value as OrderBy })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800"
                    >
                      <option value="">{h.relevance}</option>
                      <option value="precio_asc">{h.priceAsc}</option>
                      <option value="precio_desc">{h.priceDesc}</option>
                      <option value="nombre_asc">{h.nameAsc}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => { setDraft(EMPTY_FILTERS); }}
                    className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {h.clearAll}
                  </button>
                  <button
                    onClick={() => applyFilters({ ...draft })}
                    className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    {h.applyFilters}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Feature pills ────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Turnos online 24/7</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Pago seguro con Mercado Pago</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Historia clínica digital</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Consultas presenciales y virtuales</span>
          </div>
        </section>

        {/* ── Active filter pills ──────────────────────────── */}
        {filterPills.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{h.activeFilters}:</span>
            {filterPills.map(({ key, label }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
              >
                {label}
                <button onClick={() => removeFilter(key)} aria-label={`Quitar filtro ${label}`} className="hover:text-blue-900">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </span>
            ))}
            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 underline underline-offset-2">
              {h.clearAll}
            </button>
          </div>
        )}

        {/* ── Professionals grid ───────────────────────────── */}
        <section id="prof-section" className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profesionales Disponibles</h2>
            {!loading && pagination.total > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">{pagination.total} encontrados</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-9 bg-slate-200 rounded-lg mt-5" />
                </div>
              ))}
            </div>
          ) : profesionales.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">
                {advCount > 0 || filters.search || filters.especialidad
                  ? h.noResultsDesc
                  : h.noResultsTitle}
              </p>
              {advCount > 0 && (
                <button onClick={clearAll} className="mt-4 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                  {h.clearAll}
                </button>
              )}
            </div>
          ) : (
            <>
              <div data-onboarding="prof-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profesionales.map((prof) => (
                  <ProfCard key={prof.id} prof={prof} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={LIMIT}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function ProfCard({ prof }: { prof: Profesional }) {
  const { t } = useLang();
  const h = t('home');
  const modalidades = [...new Set(prof.disponibilidades?.map((d) => d.modalidad) ?? [])];
  const tienePresencial = modalidades.some((m) => m === 'PRESENCIAL' || m === 'AMBOS');
  const tieneVirtual = modalidades.some((m) => m === 'VIRTUAL' || m === 'AMBOS');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600 transition-all flex flex-col">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl shrink-0 border border-blue-100 dark:border-blue-800 overflow-hidden">
          {prof.fotoUrl
            ? <img src={prof.fotoUrl} alt={prof.nombre} className="w-full h-full object-cover" />
            : '👨‍⚕️'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">Dr/a. {prof.nombre} {prof.apellido}</h3>
          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-0.5">{prof.especialidad?.nombre}</p>
          {prof.precioConsulta > 0 ? (
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-1">
              ${Number(prof.precioConsulta).toLocaleString('es-AR')}
            </p>
          ) : (
            <p className="text-slate-400 text-xs mt-1">Consultar precio</p>
          )}
          {prof.ratingPromedio != null && (
            <div className="flex items-center gap-1.5 mt-1">
              <StarRating value={prof.ratingPromedio} size={13} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{prof.ratingPromedio} ({prof.totalResenas})</span>
            </div>
          )}
        </div>
      </div>

      {/* Modalidad badges */}
      {(tienePresencial || tieneVirtual) && (
        <div className="flex gap-1.5 mt-3">
          {tienePresencial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-medium">
              🏥 {h.inPerson}
            </span>
          )}
          {tieneVirtual && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-medium">
              💻 {h.virtual}
            </span>
          )}
        </div>
      )}

      {prof.lugarAtencion && (
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 flex items-center gap-1 truncate">
          <span>📍</span> {prof.lugarAtencion}
        </p>
      )}

      {prof.bio && (
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-2">{prof.bio}</p>
      )}

      <Link
        href={`/profesional/${prof.id}`}
        className="block mt-4 text-center py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        {h.viewProfile}
      </Link>
    </div>
  );
}
