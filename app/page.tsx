'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api, Especialidad, Profesional } from './lib/api';
import { useAuth } from './lib/auth-context';
import { getSavedCoverageFilter, isAutoCoverageDisabled, setAutoCoverageDisabled, shouldDisableAutoCoverage } from './lib/home-filters';
import { useLang } from './lib/i18n/context';
import OnboardingTour from './components/OnboardingTour';
import Pagination from './components/Pagination';
import ThemeLangToggle from './components/ThemeLangToggle';
import { MediSyncLogo, SearchIcon } from './components/icons';
import { loadObrasSociales, getObrasSociales } from './lib/obras-sociales';
import { getDashboardPath } from './lib/auth-redirects';
import ProfCard from './components/ProfCard';
import { getSpecialtyDisplayName } from './lib/specialty';
import { formatClinicDateKeyForDisplay, getLocale, todayInputValue } from './lib/date';

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
  disponibleEstaSemana: boolean;
  obraSocial: string;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  especialidad: '',
  precioMin: '',
  precioMax: '',
  modalidad: '',
  fecha: '',
  orderBy: '',
  disponibleEstaSemana: false,
  obraSocial: '',
};

function activeFilterCount(f: Filters) {
  return [f.precioMin, f.precioMax, f.modalidad, f.fecha, f.orderBy, f.obraSocial, f.disponibleEstaSemana ? 'x' : ''].filter(Boolean).length;
}

export default function HomePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const h = t('home');
  const nav = t('nav');
  const a = t('auth');
  const homeTourSteps = [
    { selector: '[data-onboarding="hero"]', title: h.tour.welcomeTitle, description: h.tour.welcomeDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="search-bar"]', title: h.tour.searchTitle, description: h.tour.searchDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="prof-list"]', title: h.tour.listTitle, description: h.tour.listDesc, position: 'top' as const },
    { selector: '[data-onboarding="nav-register"]', title: h.tour.registerTitle, description: h.tour.registerDesc, position: 'bottom' as const },
  ];

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Draft state while panel is open
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const initialisedSearch = useRef(false);

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
      if (f.disponibleEstaSemana) params.disponibleEstaSemana = 'true';
      if (f.obraSocial) params.obraSocial = f.obraSocial.trim().toUpperCase();

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
    loadObrasSociales();
  }, []);

  useEffect(() => {
    if (authLoading || initialisedSearch.current) return;
    initialisedSearch.current = true;
    // Auto-populate obra social filter if the logged-in paciente has one saved
    const initialFilters = { ...EMPTY_FILTERS };
    const savedCoverage = getSavedCoverageFilter(user?.paciente?.obraSocial);
    if (savedCoverage && !isAutoCoverageDisabled(user?.id)) {
      initialFilters.obraSocial = savedCoverage;
    }

    setFilters(initialFilters);
    setDraft(initialFilters);
    fetchProfesionales(initialFilters, 1);
  }, [authLoading, fetchProfesionales, user?.id, user?.paciente?.obraSocial]);

  const applyFilters = (f: Filters) => {
    const savedCoverage = getSavedCoverageFilter(user?.paciente?.obraSocial);
    if (shouldDisableAutoCoverage(f.obraSocial, savedCoverage)) {
      setAutoCoverageDisabled(user?.id, true);
    } else if (f.obraSocial) {
      setAutoCoverageDisabled(user?.id, false);
    }

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
    const updated = { ...filters, [key]: key === 'disponibleEstaSemana' ? false : '' };
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
    ...(filters.disponibleEstaSemana ? [{ key: 'disponibleEstaSemana' as const, label: h.activeFilters }] : []),
    ...(filters.precioMin ? [{ key: 'precioMin' as const, label: `${h.priceMin}: $${filters.precioMin}` }] : []),
    ...(filters.precioMax ? [{ key: 'precioMax' as const, label: `${h.priceMax}: $${filters.precioMax}` }] : []),
    ...(filters.modalidad ? [{ key: 'modalidad' as const, label: filters.modalidad === 'PRESENCIAL' ? h.inPerson : h.virtual }] : []),
    ...(filters.fecha ? [{ key: 'fecha' as const, label: `${h.date} ${formatClinicDateKeyForDisplay(filters.fecha, getLocale(lang), { day: 'numeric', month: 'short' })}` }] : []),
    ...(filters.orderBy ? [{ key: 'orderBy' as const, label: { precio_asc: h.priceAsc, precio_desc: h.priceDesc, nombre_asc: h.nameAsc }[filters.orderBy] }] : []),
    ...(filters.obraSocial ? [{ key: 'obraSocial' as const, label: `${h.obraSocial}: ${filters.obraSocial}` }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {!user && (
        <OnboardingTour storageKey="medisync-home-tour-v1" steps={homeTourSteps} delay={1200} />
      )}

      {/* -- Navbar ----------------------------------------- */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm dark:border-b dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2.5">
              <MediSyncLogo size={28} />
              <span className="text-xl font-bold text-blue-600 tracking-tight">MediSync</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeLangToggle />
              {user ? (
                <>
                  <Link href={getDashboardPath(user)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">
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
        {/* -- Hero ------------------------------------------- */}
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
              {h.platform}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              {h.heroTitle}<br className="hidden sm:block" />
            </h1>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
              {h.heroSubtitle}
            </p>

            {/* -- Search bar ------------------------------- */}
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
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 dark:text-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
              <select
                value={draft.especialidad}
                onChange={(e) => setDraft({ ...draft, especialidad: e.target.value, search: '' })}
                className="px-4 py-3 rounded-xl text-slate-900 dark:text-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              >
                <option value="">{h.allSpecialties}</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.nombre}>{getSpecialtyDisplayName(esp.nombre, lang, h.specialties as Record<string, string>)}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-sm shrink-0 transition-colors"
              >
                {t('common').search}
              </button>
            </div>

            {/* -- Quick filter pills ----------------------- */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  const updated = { ...filters, disponibleEstaSemana: !filters.disponibleEstaSemana };
                  applyFilters({ ...draft, disponibleEstaSemana: updated.disponibleEstaSemana });
                  setDraft((d) => ({ ...d, disponibleEstaSemana: updated.disponibleEstaSemana }));
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  filters.disponibleEstaSemana
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-md'
                    : 'bg-white/15 border-white/30 text-white hover:bg-white/25'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${filters.disponibleEstaSemana ? 'bg-white' : 'bg-emerald-400'} animate-pulse`} />
                {h.availableThisWeek}
              </button>

              {/* -- Advanced filter toggle ------------------- */}
              <button
                onClick={() => { setDraft(filters); setShowAdvanced(!showAdvanced); }}
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white text-sm transition-colors px-3.5 py-1.5 rounded-full border-2 border-white/20 bg-white/10 hover:bg-white/20"
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
          </div>

          {/* -- Advanced filter panel ---------------------- */}
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
                          placeholder={h.minPrice}
                          value={draft.precioMin}
                          onChange={(e) => setDraft({ ...draft, precioMin: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <span className="text-slate-400 text-sm shrink-0">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          placeholder={h.maxPrice}
                          value={draft.precioMax}
                          onChange={(e) => setDraft({ ...draft, precioMax: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 dark:text-slate-200"
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
                          {m === '' ? h.allModalities : m === 'PRESENCIAL' ? h.inPerson : h.virtual}
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
                      min={todayInputValue()}
                      onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* Ordenamiento */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{h.orderBy}</label>
                    <select
                      value={draft.orderBy}
                      onChange={(e) => setDraft({ ...draft, orderBy: e.target.value as OrderBy })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">{h.relevance}</option>
                      <option value="precio_asc">{h.priceAsc}</option>
                      <option value="precio_desc">{h.priceDesc}</option>
                      <option value="nombre_asc">{h.nameAsc}</option>
                    </select>
                  </div>

                  {/* Obra social */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      {h.healthInsurance}
                    </label>
                    <select
                      value={draft.obraSocial}
                      onChange={(e) => setDraft({ ...draft, obraSocial: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">{h.allCoverages}</option>
                      {getObrasSociales().map((os) => (
                        <option key={os} value={os}>{os}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Disponibilidad real esta semana */}
                <label className="flex items-center gap-3 mt-4 p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={draft.disponibleEstaSemana}
                    onChange={(e) => setDraft({ ...draft, disponibleEstaSemana: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
<div>
                      <p className="text-sm font-semibold text-emerald-800">{h.availableThisWeek}</p>
                      <p className="text-xs text-emerald-600">{h.availableThisWeekSubtext}</p>
                    </div>
                </label>

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

        {/* -- Feature pills ---------------------------------- */}
        <section className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> {h.featurePills.onlineAppointments}</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> {h.featurePills.securePayment}</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> {h.featurePills.medicalHistory}</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> {h.featurePills.inPersonVirtual}</span>
          </div>
        </section>

        {/* -- Active filter pills ---------------------------- */}
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

        {/* -- Professionals grid ----------------------------- */}
        <section id="prof-section" className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{h.professionalsAvailable}</h2>
            {!loading && pagination.total > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">{pagination.total} {h.found}</span>
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
              <div className="text-5xl mb-4 text-slate-400 flex items-center justify-center"><SearchIcon size={36} /></div>
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
                  <ProfCard key={prof.id} prof={prof} showDisponible={filters.disponibleEstaSemana} />
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
