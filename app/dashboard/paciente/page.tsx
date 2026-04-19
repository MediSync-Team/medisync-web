'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api, Turno, ListaEsperaItem, RecetaIndicacion, Resena, HistorialTurno, HistorialPaginatedResponse, PacienteStats, CertificadoConDatos, RecetaPaciente, CertificadoPaciente } from '../../lib/api';
import ChatModal from '../../components/ChatModal';
import ProfileModal from '../../components/ProfileModal';
import OnboardingTour from '../../components/OnboardingTour';
import Pagination from '../../components/Pagination';
import StarRating from '../../components/StarRating';
import VideoCallModal from '../../components/VideoCallModal';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import { useLang } from '../../lib/i18n/context';
import { NotificationBell } from '../../components/NotificationBell';
import { imprimirReceta } from '../../lib/receta-pdf';
import { imprimirHistorial } from '../../lib/historial-pdf';
import { imprimirCertificado } from '../../lib/certificado-pdf';
import AgendarCalendario from '../../components/AgendarCalendario';

const PACIENTE_TOUR_STEPS = [
  {
    selector: '[data-onboarding="pac-tab-proximos"]',
    title: 'Tus próximos turnos',
    description: 'Aquí vas a ver todos tus turnos futuros. Podés pagar, reprogramar o cancelar desde acá.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="pac-tab-lista-espera"]',
    title: 'Lista de espera',
    description: 'Si el profesional que querés no tiene turnos disponibles, podés anotarte en lista de espera y te avisamos cuando se libere un lugar.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="pac-buscar-link"]',
    title: 'Buscá más profesionales',
    description: 'Desde acá podés volver al buscador para encontrar nuevos especialistas y reservar más turnos.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="pac-profile-btn"]',
    title: 'Tu perfil',
    description: 'Actualizá tus datos de contacto y configuraciones personales haciendo clic en tu nombre.',
    position: 'bottom' as const,
  },
];
import {
  MediSyncLogo, CalendarIcon, ClockIcon, UserIcon, LogOutIcon,
  BellIcon, VideoIcon, BuildingIcon, CreditCardIcon, RefreshIcon,
  XIcon, SearchIcon, WaitlistIcon, CheckIcon, InfoIcon, ClipboardIcon, ChatIcon,
} from '../../components/icons';
import { estadoBadge } from '../../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useLang();
  const p = t('paciente');
  const c = t('common');
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'proximos' | 'pasados' | 'listaEspera' | 'historial' | 'recetas' | 'certificados' | 'datosMedicos' | 'estadisticas'>('resumen');
  const [pacienteStats, setPacienteStats] = useState<PacienteStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [historial, setHistorial] = useState<HistorialTurno[]>([]);
  const [historialPagination, setHistorialPagination] = useState({ total: 0, totalPages: 1 });
  const [historialPage, setHistorialPage] = useState(1);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const HISTORIAL_LIMIT = 5;
  const [page, setPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });
  const TURNOS_LIMIT = 5;
  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [pagosPendientes, setPagosPendientes] = useState<Record<string, { necesitaPago: boolean; initPoint?: string }>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [horasMinCancelacion, setHorasMinCancelacion] = useState(24);
  const [turnoReprogramar, setTurnoReprogramar] = useState<Turno | null>(null);
  const [listaEspera, setListaEspera] = useState<ListaEsperaItem[]>([]);
  const [showRecordatorios, setShowRecordatorios] = useState(false);
  const [turnoPreconsulta, setTurnoPreconsulta] = useState<Turno | null>(null);
  const [turnoReceta, setTurnoReceta] = useState<Turno | null>(null);
  const [turnoCalificar, setTurnoCalificar] = useState<Turno | null>(null);
  const [turnoVideoCall, setTurnoVideoCall] = useState<Turno | null>(null);
  const [turnoChat, setTurnoChat] = useState<Turno | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Datos médicos
  const [datosMedicos, setDatosMedicos] = useState<{
    antecedentesPersonales: string; antecedentesFamiliares: string;
    alergias: string; medicacionActual: string; habitos: string; diagnosticosPrevios: string;
  }>({ antecedentesPersonales: '', antecedentesFamiliares: '', alergias: '', medicacionActual: '', habitos: '', diagnosticosPrevios: '' });
  const [savingDatos, setSavingDatos] = useState(false);
  const [datosSaved, setDatosSaved] = useState(false);

  // Recetas y certificados
  const [misRecetas, setMisRecetas] = useState<RecetaPaciente[]>([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [misCertificados, setMisCertificados] = useState<CertificadoPaciente[]>([]);
  const [loadingCertificados, setLoadingCertificados] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      if (user.paciente) {
        loadTurnos('proximos', 1);
        loadRecordatorios();
        loadPoliticaCancelacion();
        loadListaEspera();
        loadMisRecetas();
        loadMisCertificados();
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadTurnos = useCallback(async (tab: 'proximos' | 'pasados' = 'proximos', p: number = 1) => {
    setLoading(true);
    try {
      const data = await api.turnos.misTurnos({ tipo: tab, page: p, limit: TURNOS_LIMIT });
      setTurnos(data.turnos);
      setPaginationMeta({ total: data.pagination.total, totalPages: data.pagination.totalPages });
      loadPagosInfo(data.turnos);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const loadPagosInfo = async (turnosData: Turno[]) => {
    const token = localStorage.getItem('token');
    const pagos: Record<string, any> = {};
    for (const turno of turnosData) {
      if (turno.estado === 'RESERVADO' && Number(turno.profesional?.precioConsulta) > 0) {
        try {
          const res = await fetch(`${API_URL}/pagos/estado/${turno.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) pagos[turno.id] = data.data;
        } catch (err) { console.error(err); }
      }
    }
    setPagosPendientes(pagos);
  };

  const loadRecordatorios = async () => {
    try {
      const data = await api.recordatorios.getPaciente();
      setRecordatorios(data.turnos || []);
    } catch (err) { console.error(err); }
  };

  const loadPoliticaCancelacion = async () => {
    try {
      const data = await api.turnos.getPoliticaCancelacion();
      setHorasMinCancelacion(data.horasMinimas || 24);
    } catch (err) { console.error(err); }
  };

  const loadHistorial = async (p: number = 1) => {
    setLoadingHistorial(true);
    try {
      const data = await api.turnos.miHistorial({ page: p, limit: HISTORIAL_LIMIT });
      setHistorial(data.turnos);
      setHistorialPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
    } catch (err) { console.error(err); }
    finally { setLoadingHistorial(false); }
  };

  const loadListaEspera = async () => {
    try {
      const data = await api.listaEspera.misSuscripciones();
      setListaEspera(data);
    } catch (err) { console.error(err); }
  };

  const loadMisRecetas = async () => {
    setLoadingRecetas(true);
    try {
      const data = await api.pacientes.getMisRecetas();
      setMisRecetas(data.recetas);
    } catch (err) { console.error(err); }
    finally { setLoadingRecetas(false); }
  };

  const loadMisCertificados = async () => {
    setLoadingCertificados(true);
    try {
      const data = await api.pacientes.getMisCertificados();
      setMisCertificados(data.certificados);
    } catch (err) { console.error(err); }
    finally { setLoadingCertificados(false); }
  };

  const loadDatosMedicos = async () => {
    if (!user?.paciente?.id) return;
    try {
      const paciente = await api.pacientes.getPerfil();
      setDatosMedicos({
        antecedentesPersonales: paciente.antecedentesPersonales ?? '',
        antecedentesFamiliares: paciente.antecedentesFamiliares ?? '',
        alergias: paciente.alergias ?? '',
        medicacionActual: paciente.medicacionActual ?? '',
        habitos: paciente.habitos ?? '',
        diagnosticosPrevios: paciente.diagnosticosPrevios ?? '',
      });
    } catch (err) { console.error(err); }
  };

  const saveDatosMedicos = async () => {
    setSavingDatos(true);
    try {
      await api.pacientes.updatePerfil(datosMedicos);
      setDatosSaved(true);
      setTimeout(() => setDatosSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSavingDatos(false); }
  };

  const downloadHistorialPDF = async () => {
    if (!user?.paciente) return;
    try {
      const [data, perfil] = await Promise.all([
        api.turnos.miHistorial({ page: 1, limit: 100 }),
        api.pacientes.getPerfil(),
      ]);
      imprimirHistorial({
        paciente: perfil,
        turnos: data.turnos,
        antecedentes: {
          antecedentesPersonales: perfil.antecedentesPersonales,
          antecedentesFamiliares: perfil.antecedentesFamiliares,
          alergias: perfil.alergias,
          medicacionActual: perfil.medicacionActual,
          habitos: perfil.habitos,
          diagnosticosPrevios: perfil.diagnosticosPrevios,
        },
      });
    } catch (err) { console.error(err); }
  };

  const cancelarListaEspera = async (id: string) => {
    try {
      await api.listaEspera.cancelar(id);
      await loadListaEspera();
      setInlineNotice({ type: 'success', text: 'Saliste de la lista de espera.' });
    } catch (err) {
      setInlineNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo salir de la lista' });
    }
  };

  const handleCancelar = async (turnoId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/turnos/${turnoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'CANCELADO' }),
      });
      const data = await res.json();
      if (data.success) {
        loadTurnos(activeTab === 'proximos' || activeTab === 'pasados' ? activeTab : 'proximos', page);
        setInlineNotice({ type: 'success', text: 'Turno cancelado correctamente.' });
      }
    } catch {
      setInlineNotice({ type: 'error', text: 'Error al cancelar turno' });
    }
  };

  const canCancel = (fechaHora: string) =>
    new Date(fechaHora).getTime() - Date.now() >= horasMinCancelacion * 3_600_000;

  if (authLoading || !user || !user.paciente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin text-blue-600" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.pacientes.getMisStats();
      setPacienteStats(data);
    } catch (err) { console.error(err); }
    finally { setLoadingStats(false); }
  };

  const handleTabChange = (tab: 'resumen' | 'proximos' | 'pasados' | 'listaEspera' | 'historial' | 'recetas' | 'certificados' | 'datosMedicos' | 'estadisticas') => {
    setActiveTab(tab);
    if (tab === 'historial') {
      setHistorialPage(1);
      loadHistorial(1);
    } else if (tab === 'datosMedicos') {
      loadDatosMedicos();
    } else if (tab === 'estadisticas') {
      if (!pacienteStats) loadStats();
    } else if (tab === 'recetas') {
      // Already loaded on mount
    } else if (tab === 'certificados') {
      // Already loaded on mount
    } else if (tab === 'resumen') {
      // Summary tab, no special loading needed
    } else if (tab !== 'listaEspera') {
      setPage(1);
      loadTurnos(tab, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadTurnos(activeTab === 'proximos' || activeTab === 'pasados' ? activeTab : 'proximos', newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Reminder banner ─────────────────────────────── */}
      {recordatorios.length > 0 && (
        <div className="bg-amber-500 text-white">
          <div className="page-container py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <BellIcon size={15} className="shrink-0" />
              <span className="font-medium">
                {recordatorios.length} turno{recordatorios.length > 1 ? 's' : ''} mañana
              </span>
              <button onClick={() => setShowRecordatorios(!showRecordatorios)} className="underline underline-offset-2 text-amber-100 hover:text-white text-xs">
                {showRecordatorios ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            <button onClick={() => setRecordatorios([])} className="text-amber-200 hover:text-white">
              <XIcon size={14} />
            </button>
          </div>
          {showRecordatorios && (
            <div className="page-container pb-3">
              <div className="bg-amber-600/50 rounded-lg p-3 space-y-1.5">
                {recordatorios.map((rec: any) => (
                  <div key={rec.id} className="flex items-center gap-3 text-sm text-amber-50">
                    <CalendarIcon size={13} className="shrink-0 text-amber-200" />
                    <span>
                      {new Date(rec.fechaHora).toLocaleDateString('es-AR')} a las{' '}
                      {new Date(rec.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {' con '}
                      {rec.profesional?.nombre} {rec.profesional?.apellido}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <MediSyncLogo size={28} />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">MediSync</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-none mt-0.5">Mi panel</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <ThemeLangToggle compact />
              <Link href="/" data-onboarding="pac-buscar-link" className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm hidden sm:inline-flex">
                <SearchIcon size={15} />
                Buscar profesionales
              </Link>
              <button data-onboarding="pac-profile-btn" onClick={() => setShowProfileModal(true)} className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm">
                <UserIcon size={15} />
                <span className="hidden sm:inline">{user.paciente.nombre} {user.paciente.apellido}</span>
              </button>
              <button onClick={() => { logout(); router.push('/'); }} className="btn btn-secondary text-sm">
                <LogOutIcon size={15} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container py-6 max-w-3xl mx-auto">
        {inlineNotice && (
          <div className={`alert mb-4 ${inlineNotice.type === 'success' ? 'alert-success' : inlineNotice.type === 'error' ? 'alert-error' : 'alert-info'}`} role="status" aria-live="polite">
            <InfoIcon size={15} className="shrink-0" />
            <span>{inlineNotice.text}</span>
            <button className="ml-auto text-xs underline" onClick={() => setInlineNotice(null)}>Ocultar</button>
          </div>
        )}

        {/* ── Cancellation policy notice ───────────────── */}
        <div className="alert alert-info mb-4 text-xs">
          <InfoIcon size={15} className="shrink-0" />
          <span>
            Política de cancelación: cancelá con al menos <strong>{horasMinCancelacion} horas</strong> de anticipación para evitar penalidades.
          </span>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="tab-nav px-1 pt-1">
            <button
              onClick={() => handleTabChange('resumen')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'resumen' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Resumen
            </button>
            <button
              data-onboarding="pac-tab-proximos"
              onClick={() => handleTabChange('proximos')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'proximos' ? 'tab-btn-active' : ''}`}
            >
              <CalendarIcon size={13} />
              {p.upcoming}
              {activeTab === 'proximos' && paginationMeta.total > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {paginationMeta.total}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('pasados')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'pasados' ? 'tab-btn-active' : ''}`}
            >
              <ClockIcon size={13} />
              {p.past}
              {activeTab === 'pasados' && paginationMeta.total > 0 && (
                <span className="ml-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {paginationMeta.total}
                </span>
              )}
            </button>
            <button
              data-onboarding="pac-tab-lista-espera"
              onClick={() => handleTabChange('listaEspera')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'listaEspera' ? 'tab-btn-active' : ''}`}
            >
              <WaitlistIcon size={13} />
              {p.waitlist}
              {listaEspera.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {listaEspera.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('historial')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'historial' ? 'tab-btn-active' : ''}`}
            >
              <ClipboardIcon size={13} />
              Historial clínico
            </button>
            <button
              onClick={() => handleTabChange('recetas')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'recetas' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Recetas
              {misRecetas.length > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {misRecetas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('certificados')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'certificados' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="19" x2="12" y2="13"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
              Certificados
              {misCertificados.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {misCertificados.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('datosMedicos')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'datosMedicos' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              Mis datos médicos
            </button>
            <button
              onClick={() => handleTabChange('estadisticas')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'estadisticas' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Estadísticas
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'resumen' ? (
              <ResumenPacienteView
                turnosProximos={turnos.filter(t => t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')}
                misRecetas={misRecetas}
                misCertificados={misCertificados}
                pacienteStats={pacienteStats}
                recordatorios={recordatorios}
              />
            ) : activeTab === 'estadisticas' ? (
              <EstadisticasPaciente stats={pacienteStats} loading={loadingStats} />
            ) : activeTab === 'historial' ? (
              /* ── Historial clínico ────────────────── */
              loadingHistorial ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-56 rounded" />
                      <div className="skeleton h-16 w-full rounded-lg mt-2" />
                    </div>
                  ))}
                </div>
              ) : historial.length === 0 ? (
                <div className="py-12 text-center">
                  <ClipboardIcon size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">No hay consultas completadas en tu historial.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={downloadHistorialPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Descargar historial completo
                    </button>
                  </div>
                  <div className="space-y-4">
                    {historial.map(item => (
                      <HistorialCard key={item.id} item={item} onCalificar={(t) => setTurnoCalificar(t as any)} />
                    ))}
                  </div>
                  <Pagination
                    page={historialPage}
                    totalPages={historialPagination.totalPages}
                    total={historialPagination.total}
                    limit={HISTORIAL_LIMIT}
                    onPageChange={(p) => { setHistorialPage(p); loadHistorial(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                </>
              )
            ) : activeTab === 'recetas' ? (
              /* ── Recetas ────────────────────────────── */
              loadingRecetas ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-56 rounded" />
                      <div className="skeleton h-16 w-full rounded-lg mt-2" />
                    </div>
                  ))}
                </div>
              ) : misRecetas.length === 0 ? (
                <div className="py-12 text-center">
                  <ClipboardIcon size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">No tienes recetas disponibles.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {misRecetas.map((receta) => (
                    <RecetaCard
                      key={receta.turnoId}
                      receta={receta}
                      onDescargar={() => {
                        imprimirReceta({
                          receta: {
                            id: receta.turnoId,
                            turnoId: receta.turnoId,
                            diagnostico: receta.receta.diagnostico,
                            medicamentos: receta.receta.medicamentos,
                            indicaciones: receta.receta.indicaciones,
                            planTratamiento: receta.receta.planTratamiento,
                            estudiosSolicitados: receta.receta.estudiosSolicitados,
                            proximoControl: receta.receta.proximoControl,
                            advertencias: receta.receta.advertencias,
                            observaciones: receta.receta.observaciones,
                            emitidaAt: receta.receta.emitidaAt,
                            createdAt: receta.receta.emitidaAt,
                            updatedAt: receta.receta.emitidaAt,
                          },
                          profesional: {
                            nombre: receta.profesional.nombre,
                            apellido: receta.profesional.apellido,
                            especialidad: receta.profesional.especialidad,
                            fotoUrl: receta.profesional.fotoUrl || undefined,
                          },
                          fechaHora: receta.fechaHora,
                          modalidad: 'VIRTUAL',
                        });
                      }}
                    />
                  ))}
                </div>
              )
            ) : activeTab === 'certificados' ? (
              /* ── Certificados ───────────────────────── */
              loadingCertificados ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-56 rounded" />
                      <div className="skeleton h-16 w-full rounded-lg mt-2" />
                    </div>
                  ))}
                </div>
              ) : misCertificados.length === 0 ? (
                <div className="py-12 text-center">
                  <ClipboardIcon size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">No tienes certificados disponibles.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {misCertificados.map((cert) => (
                    <CertificadoCard
                      key={cert.turnoId}
                      certificado={cert}
                      onDescargar={() => {
                        imprimirCertificado({
                          id: cert.certificado.id,
                          turnoId: cert.certificado.turnoId,
                          tipo: cert.certificado.tipo,
                          diagnostico: cert.certificado.diagnostico,
                          texto: cert.certificado.texto,
                          diasReposo: cert.certificado.diasReposo,
                          emitidaAt: cert.certificado.emitidaAt,
                          createdAt: cert.certificado.createdAt,
                          turno: {
                            fechaHora: cert.fechaHora,
                            modalidad: 'VIRTUAL',
                            profesional: {
                              nombre: cert.profesional.nombre,
                              apellido: cert.profesional.apellido,
                              matricula: null,
                              fotoUrl: null,
                              lugarAtencion: null,
                              telefono: '',
                              especialidad: { nombre: '' },
                            },
                            paciente: user.paciente ? {
                              nombre: user.paciente.nombre,
                              apellido: user.paciente.apellido,
                              email: user.paciente.email,
                              dni: user.paciente.dni || null,
                              fechaNacimiento: user.paciente.fechaNacimiento || null,
                              obraSocial: user.paciente.obraSocial || null,
                            } : null,
                          },
                        });
                      }}
                    />
                  ))}
                </div>
              )
            ) : activeTab === 'datosMedicos' ? (
              /* ── Mis datos médicos ──────────────── */
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Antecedentes personales</h3>
                  <p className="text-xs text-slate-400 mb-2">Enfermedades previas, cirugías, hospitalizaciones.</p>
                  <textarea
                    value={datosMedicos.antecedentesPersonales}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, antecedentesPersonales: e.target.value }))}
                    rows={3}
                    placeholder="Ej: Hipertensión arterial desde 2018, apendicectomía 2010..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Antecedentes familiares</h3>
                  <p className="text-xs text-slate-400 mb-2">Enfermedades hereditarias o relevantes en la familia.</p>
                  <textarea
                    value={datosMedicos.antecedentesFamiliares}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, antecedentesFamiliares: e.target.value }))}
                    rows={3}
                    placeholder="Ej: Padre con diabetes tipo 2, madre con cardiopatía..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Alergias</h3>
                  <p className="text-xs text-slate-400 mb-2">Medicamentos, alimentos, materiales u otras sustancias.</p>
                  <textarea
                    value={datosMedicos.alergias}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, alergias: e.target.value }))}
                    rows={2}
                    placeholder="Ej: Penicilina (urticaria), ibuprofeno, mariscos..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Medicación actual</h3>
                  <p className="text-xs text-slate-400 mb-2">Medicamentos que tomás habitualmente con dosis y frecuencia.</p>
                  <textarea
                    value={datosMedicos.medicacionActual}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, medicacionActual: e.target.value }))}
                    rows={3}
                    placeholder="Ej: Enalapril 10mg/día, Metformina 500mg c/12h..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Hábitos</h3>
                  <p className="text-xs text-slate-400 mb-2">Tabaco, alcohol, actividad física, alimentación.</p>
                  <textarea
                    value={datosMedicos.habitos}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, habitos: e.target.value }))}
                    rows={2}
                    placeholder="Ej: No fumador, consumo ocasional de alcohol, sedentario..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Diagnósticos previos</h3>
                  <p className="text-xs text-slate-400 mb-2">Diagnósticos confirmados por profesionales de salud.</p>
                  <textarea
                    value={datosMedicos.diagnosticosPrevios}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, diagnosticosPrevios: e.target.value }))}
                    rows={2}
                    placeholder="Ej: Hipotiroidismo, ansiedad generalizada..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveDatosMedicos}
                    disabled={savingDatos}
                    className="btn btn-primary text-sm"
                  >
                    {savingDatos ? 'Guardando...' : 'Guardar datos médicos'}
                  </button>
                  {datosSaved && (
                    <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Datos guardados
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Esta información es visible para los profesionales que te atiendan en MediSync y se incluye en tu historial clínico.</p>
              </div>
            ) : activeTab === 'listaEspera' ? (
              /* ── Lista de espera ────────────────── */
              listaEspera.length === 0 ? (
                <div className="py-12 text-center">
                  <WaitlistIcon size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">{p.noWaitlist}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {listaEspera.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-xl p-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.profesional?.nombre} {item.profesional?.apellido}
                        </p>
                        <p className="text-sm text-blue-600 font-medium">{item.profesional?.especialidad?.nombre}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><CalendarIcon size={11} />{new Date(item.fecha).toLocaleDateString('es-AR')}</span>
                          <span>{item.modalidad}</span>
                        </div>
                        <span className="badge badge-yellow mt-2">{item.estado}</span>
                      </div>
                      <button onClick={() => cancelarListaEspera(item.id)} className="btn btn-secondary btn-sm">
                        {p.cancel}
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="skeleton h-4 w-40 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                    <div className="skeleton h-8 w-32 rounded-lg mt-2" />
                  </div>
                ))}
              </div>
            ) : turnos.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm font-medium">
                  {activeTab === 'proximos' ? p.noUpcoming : p.noPast}
                </p>
                {activeTab === 'proximos' && (
                  <Link href="/" className="btn btn-primary btn-sm mt-4">
                    <SearchIcon size={13} /> {p.searchProfessional}
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {turnos.map((turno) => (
                    <TurnoCard
                      key={turno.id}
                      turno={turno}
                      pagoInfo={pagosPendientes[turno.id]}
                      horasMinCancelacion={horasMinCancelacion}
                      canCancel={canCancel(turno.fechaHora)}
                      onPagar={() => router.push(`/pago?turno=${turno.id}`)}
                      onCancelar={() => handleCancelar(turno.id)}
                      onReprogramar={() => setTurnoReprogramar(turno)}
                      onCompletarPreconsulta={() => setTurnoPreconsulta(turno)}
                      onVerReceta={() => setTurnoReceta(turno)}
                      onCalificar={() => setTurnoCalificar(turno)}
                      onVideoCall={() => setTurnoVideoCall(turno)}
                      onChat={() => setTurnoChat(turno)}
                    />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={paginationMeta.totalPages}
                  total={paginationMeta.total}
                  limit={TURNOS_LIMIT}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userType="paciente"
          user={user}
          onUpdate={() => window.location.reload()}
        />
      )}

      {turnoReprogramar && (
        <ReprogramarModal
          turno={turnoReprogramar}
          onClose={() => setTurnoReprogramar(null)}
          onSuccess={() => { setTurnoReprogramar(null); loadTurnos(activeTab === 'proximos' || activeTab === 'pasados' ? activeTab : 'proximos', page); loadRecordatorios(); }}
        />
      )}

      {turnoPreconsulta && (
        <PreconsultaModal
          turno={turnoPreconsulta}
          onClose={() => setTurnoPreconsulta(null)}
          onSuccess={() => {
            setTurnoPreconsulta(null);
            loadTurnos(activeTab === 'proximos' || activeTab === 'pasados' ? activeTab : 'proximos', page);
          }}
        />
      )}

      {turnoReceta && (
        <RecetaModal turno={turnoReceta} onClose={() => setTurnoReceta(null)} />
      )}

      {turnoCalificar && (
        <CalificarModal
          turno={turnoCalificar}
          onClose={() => setTurnoCalificar(null)}
          onSuccess={() => {
            setTurnoCalificar(null);
            setInlineNotice({ type: 'success', text: '¡Gracias por tu calificación!' });
            if (activeTab === 'historial') loadHistorial(historialPage);
          }}
        />
      )}

      {turnoVideoCall && (
        <VideoCallModal
          turnoId={turnoVideoCall.id}
          profesionalNombre={turnoVideoCall.profesional ? `${turnoVideoCall.profesional.nombre} ${turnoVideoCall.profesional.apellido}` : 'Profesional'}
          fechaHora={turnoVideoCall.fechaHora}
          onClose={() => setTurnoVideoCall(null)}
        />
      )}

      {turnoChat && user.paciente && (
        <ChatModal
          turnoId={turnoChat.id}
          myUserId={user.id}
          otherName={turnoChat.profesional ? `${turnoChat.profesional.nombre} ${turnoChat.profesional.apellido}` : 'Profesional'}
          onClose={() => setTurnoChat(null)}
        />
      )}

      <OnboardingTour
        storageKey="medisync-paciente-tour-v1"
        steps={PACIENTE_TOUR_STEPS}
        delay={1000}
      />
    </div>
  );
}

/* ── Turno Card ──────────────────────────────────────────── */
function TurnoCard({
  turno, pagoInfo, canCancel, onPagar, onCancelar, onReprogramar, onCompletarPreconsulta, onVerReceta, onCalificar, onVideoCall, onChat, horasMinCancelacion,
}: {
  turno: Turno;
  pagoInfo?: { necesitaPago: boolean };
  canCancel: boolean;
  horasMinCancelacion: number;
  onPagar: () => void;
  onCancelar: () => void;
  onReprogramar: () => void;
  onCompletarPreconsulta: () => void;
  onVerReceta: () => void;
  onCalificar: () => void;
  onVideoCall: () => void;
  onChat: () => void;
}) {
  const { t } = useLang();
  const p = t('paciente');
  const isActive = turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO';
  const isFuture = new Date(turno.fechaHora) >= new Date();
  const preconsultaCompletada = Boolean(turno.preconsultaCompletadaAt);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    api.chat.getUnread(turno.id).then(d => setUnreadCount(d.count)).catch(() => {});
  }, [turno.id, isActive]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Status bar */}
      <div className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between ${
        turno.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-700' :
        turno.estado === 'RESERVADO' ? 'bg-amber-50 text-amber-700' :
        turno.estado === 'CANCELADO' ? 'bg-red-50 text-red-700' :
        'bg-blue-50 text-blue-700'
      }`}>
        <span className="flex items-center gap-1.5">
          {turno.estado === 'CONFIRMADO' && <CheckIcon size={11} />}
          {turno.estado}
        </span>
        {turno.modalidad === 'VIRTUAL' ? (
          <span className="flex items-center gap-1"><VideoIcon size={11} /> {t('home').virtual}</span>
        ) : (
          <span className="flex items-center gap-1"><BuildingIcon size={11} /> {t('home').inPerson}</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Professional info */}
          <div className="flex-1">
            <p className="font-semibold text-slate-800">
              {turno.profesional?.nombre} {turno.profesional?.apellido}
            </p>
            <p className="text-xs text-blue-600 font-medium mt-0.5">{turno.profesional?.especialidad?.nombre}</p>
          </div>
          {/* Date/time */}
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-slate-700">
              {new Date(turno.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Video call */}
        {turno.modalidad === 'VIRTUAL' && (turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
          <button
            onClick={onVideoCall}
            className="btn btn-success btn-sm mt-3 w-full"
          >
            <VideoIcon size={13} /> {p.joinVideoCall}
          </button>
        )}

        {/* Actions */}
        {isActive && isFuture && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {/* Pay button */}
            {turno.profesional?.precioConsulta && Number(turno.profesional.precioConsulta) > 0 && (
              <button
                onClick={onPagar}
                disabled={pagoInfo?.necesitaPago === false}
                className={`btn btn-sm flex-1 ${pagoInfo?.necesitaPago === false ? 'btn-secondary opacity-60 cursor-not-allowed' : 'btn-success'}`}
              >
                <CreditCardIcon size={13} />
                {pagoInfo?.necesitaPago === false
                  ? p.paid
                  : `${p.pay} $${Number(turno.profesional.precioConsulta).toLocaleString('es-AR')}`}
              </button>
            )}

            {/* Reschedule */}
            <button
              onClick={onReprogramar}
              disabled={!canCancel}
              className="btn btn-secondary btn-sm"
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <RefreshIcon size={13} /> {p.reschedule}
            </button>

            {/* Cancel */}
            <button
              onClick={onCancelar}
              disabled={!canCancel}
              className={`btn btn-sm ${canCancel ? 'btn-ghost text-red-500 hover:bg-red-50' : 'btn-ghost text-slate-400 cursor-not-allowed'}`}
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <XIcon size={13} /> {p.cancel}
            </button>

            <Link href={`/profesional/${turno.profesional?.id}`} className="btn btn-ghost btn-sm text-slate-500">
              Ver profesional
            </Link>

            {/* Chat button */}
            <button
              onClick={() => { onChat(); setUnreadCount(0); }}
              className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 relative"
            >
              <ChatIcon size={13} />
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {!preconsultaCompletada ? (
              <button onClick={onCompletarPreconsulta} className="btn btn-primary btn-sm">
                <ClipboardIcon size={13} /> {p.preconsulta}
              </button>
            ) : (
              <span className="badge badge-green">{t('dashboard').preconsulta}</span>
            )}

            {(turno.estado === 'COMPLETADO' || turno.estado === 'CONFIRMADO') && (
              <button onClick={onVerReceta} className="btn btn-secondary btn-sm">
                <ClipboardIcon size={13} /> {p.viewPrescription}
              </button>
            )}

            {turno.estado === 'COMPLETADO' && (
              <button onClick={onCalificar} className="btn btn-ghost btn-sm text-amber-600 hover:bg-amber-50">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                {p.rate}
              </button>
            )}
          </div>
        )}

        {/* Calendar buttons for active future turnos */}
        {isActive && isFuture && turno.profesional && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <AgendarCalendario
              variant="compact"
              turno={{
                turnoId: turno.id,
                fechaHora: turno.fechaHora,
                duracionMin: turno.duracionMin,
                modalidad: turno.modalidad,
                profesionalNombre: turno.profesional.nombre,
                profesionalApellido: turno.profesional.apellido,
                especialidad: turno.profesional.especialidad?.nombre ?? '',
                lugarAtencion: turno.profesional.lugarAtencion,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RecetaModal({ turno, onClose }: { turno: Turno; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [receta, setReceta] = useState<RecetaIndicacion | null>(null);

  useEffect(() => {
    const loadReceta = async () => {
      setLoading(true);
      try {
        const data = await api.turnos.getReceta(turno.id);
        setReceta(data);
      } catch (err) {
        console.error(err);
        setReceta(null);
      } finally {
        setLoading(false);
      }
    };

    loadReceta();
  }, [turno.id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-bold text-slate-800">Receta e indicaciones</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-20 rounded-lg" />
              <div className="skeleton h-20 rounded-lg" />
            </div>
          ) : !receta ? (
            <div className="alert alert-warning text-sm">
              <InfoIcon size={14} className="shrink-0" />
              <span>Aun no hay receta/indicaciones emitidas para este turno.</span>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">Emitida: {new Date(receta.emitidaAt).toLocaleString('es-AR')}</p>
              <div>
                <p className="font-semibold text-slate-700">Diagnostico</p>
                <p className="text-slate-600 whitespace-pre-wrap">{receta.diagnostico}</p>
              </div>
              {receta.planTratamiento && (
                <div>
                  <p className="font-semibold text-slate-700">Plan de tratamiento</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.planTratamiento}</p>
                </div>
              )}
              {receta.medicamentos && (
                <div>
                  <p className="font-semibold text-slate-700">Medicamentos</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.medicamentos}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-700">Indicaciones</p>
                <p className="text-slate-600 whitespace-pre-wrap">{receta.indicaciones}</p>
              </div>
              {receta.estudiosSolicitados && (
                <div>
                  <p className="font-semibold text-slate-700">Estudios solicitados</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.estudiosSolicitados}</p>
                </div>
              )}
              {receta.proximoControl && (
                <div>
                  <p className="font-semibold text-slate-700">Proximo control</p>
                  <p className="text-slate-600">{receta.proximoControl}</p>
                </div>
              )}
              {receta.advertencias && (
                <div>
                  <p className="font-semibold text-slate-700">Advertencias</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.advertencias}</p>
                </div>
              )}
              {receta.observaciones && (
                <div>
                  <p className="font-semibold text-slate-700">Observaciones</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          {receta && turno.profesional && (
            <button
              onClick={() => imprimirReceta({
                receta,
                profesional: {
                  nombre: turno.profesional!.nombre,
                  apellido: turno.profesional!.apellido,
                  especialidad: turno.profesional!.especialidad?.nombre ?? '',
                  matricula: turno.profesional!.matricula,
                  lugarAtencion: turno.profesional!.lugarAtencion,
                  telefono: turno.profesional!.telefono,
                  fotoUrl: turno.profesional!.fotoUrl,
                },
                paciente: turno.paciente
                  ? { nombre: turno.paciente.nombre, apellido: turno.paciente.apellido, email: turno.paciente.email }
                  : null,
                fechaHora: turno.fechaHora,
                modalidad: turno.modalidad,
              })}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PDF
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary flex-1">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function PreconsultaModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  const [motivo, setMotivo] = useState('');
  const [sintomas, setSintomas] = useState('');
  const [escalaDolor, setEscalaDolor] = useState(0);
  const [escalaAnsiedad, setEscalaAnsiedad] = useState(0);
  const [inicioSintomas, setInicioSintomas] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [notasPaciente, setNotasPaciente] = useState('');
  const [riesgo, setRiesgo] = useState<string | null>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const loadPreconsulta = async () => {
      setLoading(true);
      try {
        const data = await api.turnos.getPreconsulta(turno.id);
        setMotivo(data.motivo || '');
        setSintomas(data.sintomas || '');
        setEscalaDolor(data.escalaDolor ?? 0);
        setEscalaAnsiedad(data.escalaAnsiedad ?? 0);
        setInicioSintomas(data.inicioSintomas || '');
        setTemperatura(typeof data.temperatura === 'number' ? data.temperatura.toString() : '');
        setNotasPaciente(data.notasPaciente || '');
        setRiesgo(data.riesgo);
        setFlags(data.flags || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPreconsulta();
  }, [turno.id]);

  const handleGuardar = async () => {
    if (motivo.trim().length < 5 || sintomas.trim().length < 5) {
      setNotice({ type: 'error', text: 'Completa motivo y sintomas con al menos 5 caracteres.' });
      return;
    }

    setGuardando(true);
    try {
      const data = await api.turnos.updatePreconsulta(turno.id, {
        motivo: motivo.trim(),
        sintomas: sintomas.trim(),
        escalaDolor,
        escalaAnsiedad,
        inicioSintomas: inicioSintomas.trim() || null,
        temperatura: temperatura.trim() ? Number(temperatura) : null,
        notasPaciente: notasPaciente.trim() || null,
      });

      setRiesgo(data.riesgo);
      setFlags(data.flags || []);
      setNotice({ type: 'success', text: 'Cuestionario guardado correctamente.' });
      onSuccess();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar la preconsulta' });
    } finally {
      setGuardando(false);
    }
  };

  const riskClass = riesgo === 'URGENTE'
    ? 'badge-red'
    : riesgo === 'ALTO'
    ? 'badge-yellow'
    : riesgo === 'MEDIO'
    ? 'badge-blue'
    : riesgo === 'BAJO'
    ? 'badge-green'
    : 'badge-gray';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-bold text-slate-800">Cuestionario preconsulta</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {notice && (
            <div className={`alert ${notice.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status" aria-live="polite">
              <InfoIcon size={14} className="shrink-0" />
              <span>{notice.text}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Completar este cuestionario ayuda a priorizar tu atencion y a que el profesional llegue mejor preparado al turno.
          </p>

          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-20 rounded-lg" />
              <div className="skeleton h-20 rounded-lg" />
            </div>
          ) : (
            <>
              <div>
                <label className="field-label">Motivo principal de consulta</label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="field-input resize-none min-h-[72px]" placeholder="Describe en pocas lineas el motivo principal..." />
              </div>

              <div>
                <label className="field-label">Sintomas actuales</label>
                <textarea value={sintomas} onChange={(e) => setSintomas(e.target.value)} className="field-input resize-none min-h-[88px]" placeholder="Que sintomas tenes, desde cuando y como evolucionaron..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Nivel de dolor: {escalaDolor}/10</label>
                  <input type="range" min={0} max={10} value={escalaDolor} onChange={(e) => setEscalaDolor(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="field-label">Nivel de ansiedad: {escalaAnsiedad}/10</label>
                  <input type="range" min={0} max={10} value={escalaAnsiedad} onChange={(e) => setEscalaAnsiedad(Number(e.target.value))} className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Inicio de sintomas</label>
                  <input value={inicioSintomas} onChange={(e) => setInicioSintomas(e.target.value)} className="field-input" placeholder="Ej: hace 3 dias" />
                </div>
                <div>
                  <label className="field-label">Temperatura corporal (opcional)</label>
                  <input type="number" min="34" max="43" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className="field-input" placeholder="Ej: 38.2" />
                </div>
              </div>

              <div>
                <label className="field-label">Notas adicionales para el profesional</label>
                <textarea value={notasPaciente} onChange={(e) => setNotasPaciente(e.target.value)} className="field-input resize-none min-h-[72px]" placeholder="Aclaraciones, medicacion previa, estudios recientes..." />
              </div>

              {riesgo && (
                <div className="alert alert-info text-xs">
                  <InfoIcon size={14} className="shrink-0" />
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">Riesgo detectado: <span className={`badge ${riskClass}`}>{riesgo}</span></p>
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {flags.map((flag) => <span key={flag} className="badge badge-red">{flag}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando || loading} className="btn btn-primary flex-1">
            {guardando ? 'Guardando...' : 'Guardar cuestionario'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Calificar Modal ─────────────────────────────────────── */
function CalificarModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  const { t } = useLang();
  const p = t('paciente');
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resenaExistente, setResenaExistente] = useState<Resena | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    api.resenas.getMiResena(turno.id)
      .then((r) => { setResenaExistente(r); if (r) { setRating(r.rating); setComentario(r.comentario || ''); } })
      .catch(() => setResenaExistente(null));
  }, [turno.id]);

  const handleGuardar = async () => {
    if (rating === 0) { setNotice({ type: 'error', text: 'Seleccioná al menos 1 estrella.' }); return; }
    setGuardando(true);
    try {
      await api.resenas.crear({ turnoId: turno.id, rating, comentario: comentario.trim() || undefined });
      onSuccess();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setGuardando(false);
    }
  };

  const labels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{p.rateTitle}</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {notice && (
            <div className={`alert ${notice.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              <InfoIcon size={14} className="shrink-0" /><span>{notice.text}</span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg shrink-0">
              {turno.profesional?.fotoUrl
                ? <img src={turno.profesional.fotoUrl} className="w-full h-full rounded-full object-cover" alt="" />
                : '👨‍⚕️'}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Dr/a. {turno.profesional?.nombre} {turno.profesional?.apellido}</p>
              <p className="text-xs text-blue-600">{turno.profesional?.especialidad?.nombre}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(turno.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {resenaExistente !== undefined && (
            resenaExistente ? (
              <div className="alert alert-info text-sm">
                <InfoIcon size={14} className="shrink-0" />
                <span>Ya calificaste esta consulta con {resenaExistente.rating} estrellas.</span>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-slate-600">¿Cómo fue tu experiencia?</p>
                  <StarRating value={rating} onChange={setRating} size={36} />
                  {rating > 0 && (
                    <p className="text-sm font-semibold text-amber-600">{labels[rating]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Comentario <span className="font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Contá tu experiencia con el profesional..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-slate-800"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{comentario.length}/500</p>
                </div>
              </>
            )
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">{t('common').cancel}</button>
          {!resenaExistente && (
            <button
              onClick={handleGuardar}
              disabled={guardando || rating === 0 || resenaExistente === undefined}
              className="btn btn-primary flex-1"
            >
              {guardando ? t('common').saving : p.rateSubmit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reprogramar Modal ───────────────────────────────────── */
function ReprogramarModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<{ hora: string; disponible: boolean }[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    const profesionalId = turno.profesional?.id;
    if (!fecha || !profesionalId) { setSlots([]); setHoraSeleccionada(''); return; }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await api.profesionales.getSlots(profesionalId, fecha, turno.modalidad);
        setSlots(data.filter(s => s.disponible));
      } catch (err) { setSlots([]); }
      finally { setLoadingSlots(false); }
    };
    loadSlots();
  }, [fecha, turno.profesional?.id, turno.modalidad]);

  const handleGuardar = async () => {
    if (!fecha || !horaSeleccionada) { setNotice('Selecciona fecha y horario.'); return; }
    const fechaHora = new Date(`${fecha}T${horaSeleccionada}:00`);
    if (Number.isNaN(fechaHora.getTime()) || fechaHora <= new Date()) { setNotice('Selecciona una fecha futura valida.'); return; }

    setGuardando(true);
    try {
      await api.turnos.reprogramar(turno.id, { fechaHora: fechaHora.toISOString(), modalidad: turno.modalidad });
      onSuccess();
    } catch (err) { setNotice(err instanceof Error ? err.message : 'No se pudo reprogramar'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Reprogramar turno</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {notice && (
            <div className="alert alert-error text-sm" role="status" aria-live="polite">
              <InfoIcon size={14} className="shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Estás reprogramando tu turno con <strong>{turno.profesional?.nombre} {turno.profesional?.apellido}</strong>.
            Elegí nueva fecha y horario.
          </p>

          <div>
            <label className="field-label">Nueva fecha</label>
            <input
              type="date"
              value={fecha}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setFecha(e.target.value); setHoraSeleccionada(''); }}
              className="field-input"
            />
          </div>

          {fecha && (
            <div>
              <label className="field-label">Horario disponible</label>
              {loadingSlots ? (
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 w-16 rounded-lg" />)}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No hay horarios disponibles para esta fecha</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.hora}
                      onClick={() => setHoraSeleccionada(slot.hora)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        horaSeleccionada === slot.hora
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {slot.hora}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !fecha || !horaSeleccionada}
            className="btn btn-primary flex-1"
          >
            {guardando ? 'Guardando...' : 'Confirmar cambio'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Historial Card ──────────────────────────────────────── */
function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function HistorialCard({ item, onCalificar }: { item: HistorialTurno; onCalificar: (turno: HistorialTurno) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2 bg-blue-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
          <CalendarIcon size={13} />
          {new Date(item.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="text-blue-500 font-normal text-xs">
            {new Date(item.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <span className="badge badge-green text-[10px]">Completado</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Profesional info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
            {item.profesional?.fotoUrl
              ? <img src={item.profesional.fotoUrl} alt="" className="w-full h-full object-cover" />
              : <UserIcon size={16} className="text-blue-500" />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              Dr/a. {item.profesional?.nombre} {item.profesional?.apellido}
            </p>
            <p className="text-xs text-blue-600">{item.profesional?.especialidad?.nombre}</p>
          </div>
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
            {item.modalidad === 'VIRTUAL'
              ? <><VideoIcon size={11} /> Virtual</>
              : <><BuildingIcon size={11} /> Presencial</>}
          </span>
        </div>

        {/* Evolución clínica */}
        {item.evolucion?.contenido && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Evolución clínica</p>
            <p className={`text-slate-700 leading-relaxed whitespace-pre-wrap ${!expanded && 'line-clamp-3'}`}>
              {item.evolucion.contenido}
            </p>
            {item.evolucion.contenido.length > 200 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mt-1">
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        {/* Receta / indicaciones */}
        {item.recetaIndicacion && (
          <div className="border border-emerald-200 rounded-lg p-3 text-sm bg-emerald-50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Receta e indicaciones</p>
              {item.profesional && (
                <button
                  onClick={() => imprimirReceta({
                    receta: item.recetaIndicacion!,
                    profesional: {
                      nombre: item.profesional!.nombre ?? '',
                      apellido: item.profesional!.apellido ?? '',
                      especialidad: item.profesional!.especialidad?.nombre ?? '',
                      matricula: item.profesional!.matricula ?? undefined,
                      lugarAtencion: item.profesional!.lugarAtencion ?? undefined,
                      telefono: item.profesional!.telefono ?? undefined,
                      fotoUrl: item.profesional!.fotoUrl ?? undefined,
                    },
                    paciente: null,
                    fechaHora: item.fechaHora,
                    modalidad: item.modalidad,
                  })}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Descargar PDF
                </button>
              )}
            </div>
            <p className="text-slate-700 font-medium">{item.recetaIndicacion.diagnostico}</p>
            {item.recetaIndicacion.medicamentos && (
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-semibold">Medicamentos:</span> {item.recetaIndicacion.medicamentos}
              </p>
            )}
            {item.recetaIndicacion.proximoControl && (
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-semibold">Próximo control:</span> {item.recetaIndicacion.proximoControl}
              </p>
            )}
          </div>
        )}

        {/* Certificado médico */}
        {item.certificado && (
          <div className="border border-blue-200 rounded-lg p-3 text-sm bg-blue-50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Certificado médico</p>
              <button
                onClick={async () => {
                  try {
                    const certData = await api.certificados.getByTurno(item.id);
                    imprimirCertificado({
                      ...certData,
                      turno: {
                        fechaHora: item.fechaHora,
                        modalidad: item.modalidad,
                        profesional: {
                          nombre: item.profesional?.nombre ?? '',
                          apellido: item.profesional?.apellido ?? '',
                          matricula: item.profesional?.matricula ?? undefined,
                          fotoUrl: item.profesional?.fotoUrl ?? undefined,
                          lugarAtencion: item.profesional?.lugarAtencion ?? undefined,
                          telefono: item.profesional?.telefono ?? undefined,
                          especialidad: { nombre: item.profesional?.especialidad?.nombre ?? '' },
                        },
                        paciente: null,
                      },
                    } as CertificadoConDatos);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar PDF
              </button>
            </div>
            <p className="text-slate-700 font-medium">
              {item.certificado.tipo === 'REPOSO' ? 'Reposo Médico'
                : item.certificado.tipo === 'CONSULTA' ? 'Justificación de Consulta'
                : item.certificado.tipo === 'APTITUD' ? 'Aptitud Física'
                : 'Certificado Médico'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Emitido el {new Date(item.certificado.emitidaAt).toLocaleDateString('es-AR')}
            </p>
          </div>
        )}

        {/* Archivos adjuntos */}
        {item.archivos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Documentos adjuntos</p>
            <div className="flex flex-wrap gap-2">
              {item.archivos.map(archivo => (
                <a
                  key={archivo.id}
                  href={archivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs text-slate-700 hover:text-blue-700 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {archivo.nombreOriginal}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!item.evolucion && !item.recetaIndicacion && item.archivos.length === 0 && (
          <p className="text-xs text-slate-400 italic">Sin evolución clínica registrada para esta consulta.</p>
        )}

        {/* Calificación */}
        {item.resena ? (
          <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Tu calificación</p>
              <div className="flex items-center gap-1.5">
                <StarDisplay rating={item.resena.rating} size={13} />
                <span className="text-xs font-bold text-amber-700">{item.resena.rating}/5</span>
              </div>
            </div>
            {item.resena.comentario && (
              <p className="text-xs text-slate-600 italic">"{item.resena.comentario}"</p>
            )}
            {item.resena.respuesta && (
              <div className="mt-2 pt-2 border-t border-amber-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  Respuesta de Dr/a. {item.profesional?.nombre} {item.profesional?.apellido}
                  {item.resena.respondidaAt && (
                    <span className="font-normal text-slate-400 ml-1">
                      · {new Date(item.resena.respondidaAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{item.resena.respuesta}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={() => onCalificar(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              Calificar consulta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Patient statistics panel ────────────────────────────────────────────── */
function EstadisticasPaciente({ stats, loading }: { stats: PacienteStats | null; loading: boolean }) {
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

  if (!stats) return null;

  const maxMes = Math.max(...stats.turnosPorMes.map(m => m.total), 1);
  const MES_LABELS: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PacienteStatCard label="Total turnos" value={stats.totalTurnos} color="blue" />
        <PacienteStatCard label="Completados" value={stats.completados} color="emerald" />
        <PacienteStatCard label="Cancelados" value={stats.cancelados} color="red" />
        <PacienteStatCard label="Total gastado" value={`$${stats.totalGastado.toLocaleString('es-AR')}`} color="amber" />
      </div>

      {stats.turnosPorMes.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Turnos por mes (últimos 12 meses)
          </p>
          <div className="flex items-end gap-1.5 h-28">
            {stats.turnosPorMes.map(({ mes, total }) => {
              const [, mm] = mes.split('-');
              const pct = Math.round((total / maxMes) * 100);
              return (
                <div key={mes} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{total}</span>
                  <div className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all" style={{ height: `${Math.max(pct, 4)}%` }} title={`${MES_LABELS[mm] ?? mm}: ${total}`} />
                  <span className="text-[9px] text-slate-400">{MES_LABELS[mm] ?? mm}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.topProfesionales.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Profesionales más visitados</p>
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
                  <p className="text-xs text-slate-500 truncate">{profesional.especialidad.nombre}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 shrink-0">{totalTurnos} turno{totalTurnos !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.pagos.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span>Historial de pagos</span>
            <span className="text-xs font-normal text-slate-400">{stats.pagos.length} pago{stats.pagos.length !== 1 ? 's' : ''}</span>
          </p>
          <div className="space-y-2">
            {stats.pagos.map((pago) => (
              <div key={pago.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">Dr/a. {pago.profesional}</p>
                  <p className="text-xs text-slate-500 truncate">{pago.especialidad} · {new Date(pago.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">${pago.monto.toLocaleString('es-AR')}</p>
                  <span className="badge badge-green text-[10px]">Aprobado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalTurnos === 0 && (
        <div className="py-12 text-center text-slate-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <p className="text-sm">Aún no tenés estadísticas. ¡Reservá tu primer turno!</p>
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

function ResumenPacienteView({
  turnosProximos,
  misRecetas,
  misCertificados,
  pacienteStats,
  recordatorios,
}: {
  turnosProximos: Turno[];
  misRecetas: RecetaPaciente[];
  misCertificados: CertificadoPaciente[];
  pacienteStats: PacienteStats | null;
  recordatorios: any[];
}) {
  const proximoTurno = turnosProximos.length > 0 ? turnosProximos[0] : null;
  const recetasActivas = misRecetas.filter(r => {
    if (!r.receta.proximoControl) return true;
    const proximoControlDate = new Date(r.receta.proximoControl);
    const hoy = new Date();
    return proximoControlDate >= hoy;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold mb-1 flex items-center gap-1">
            <CalendarIcon size={12} /> Próximo turno
          </p>
          {proximoTurno ? (
            <>
              <p className="font-bold text-slate-800 text-sm">
                {proximoTurno.profesional?.nombre} {proximoTurno.profesional?.apellido}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {new Date(proximoTurno.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} a las{' '}
                {new Date(proximoTurno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500 font-medium">Sin turnos agendados</p>
          )}
        </div>

        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-semibold mb-1 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg> Recetas activas
          </p>
          <p className="font-bold text-slate-800 text-sm">{recetasActivas.length}</p>
          {recetasActivas.length > 0 && (
            <p className="text-xs text-slate-600 mt-1">Última: {recetasActivas[0].profesional.nombre}</p>
          )}
        </div>

        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-semibold mb-1 flex items-center gap-1">
            <CreditCardIcon size={12} /> Gasto este mes
          </p>
          <p className="font-bold text-slate-800 text-sm">
            ${(pacienteStats?.totalGastado || 0).toLocaleString('es-AR')}
          </p>
        </div>

        <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-600 font-semibold mb-1 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> Certificados
          </p>
          <p className="font-bold text-slate-800 text-sm">{misCertificados.length}</p>
        </div>
      </div>

      {recordatorios.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
            <BellIcon size={14} /> Recordatorios activos
          </p>
          <div className="space-y-2">
            {recordatorios.map(r => (
              <p key={r.id} className="text-xs text-amber-700">
                • Turno {new Date(r.fechaHora).toLocaleDateString('es-AR')} a las{' '}
                {new Date(r.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} con{' '}
                {r.turno?.profesional?.nombre || 'profesional'}
              </p>
            ))}
          </div>
        </div>
      )}

      {(pacienteStats?.topProfesionales || []).length > 0 && (
        <div className="border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Profesionales más visitados</p>
          <div className="flex flex-wrap gap-3">
            {pacienteStats!.topProfesionales.map((prof) => (
              prof.profesional && (
                <div
                  key={prof.profesional.id}
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2"
                >
                  {prof.profesional.fotoUrl ? (
                    <img
                      src={prof.profesional.fotoUrl}
                      alt={prof.profesional.nombre}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <UserIcon size={12} className="text-blue-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {prof.profesional.nombre}
                    </p>
                    <p className="text-xs text-slate-500">{prof.totalTurnos} turno{prof.totalTurnos !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecetaCard({
  receta,
  onDescargar,
}: {
  receta: RecetaPaciente;
  onDescargar: () => void;
}) {
  const isActive = !receta.receta.proximoControl || new Date(receta.receta.proximoControl) >= new Date();

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="font-semibold text-slate-800">
            Dr/a. {receta.profesional.nombre} {receta.profesional.apellido}
          </p>
          <p className="text-xs text-blue-600 font-medium">{receta.profesional.especialidad}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(receta.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {isActive && (
          <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold whitespace-nowrap">
            Activa
          </span>
        )}
      </div>

      <div className="border-t border-slate-100 pt-3 mb-3 space-y-2">
        <div>
          <p className="text-xs font-semibold text-slate-600">Diagnóstico</p>
          <p className="text-sm text-slate-700 line-clamp-2">{receta.receta.diagnostico}</p>
        </div>
        {receta.receta.medicamentos && (
          <div>
            <p className="text-xs font-semibold text-slate-600">Medicamentos</p>
            <p className="text-sm text-slate-700 line-clamp-2">{receta.receta.medicamentos}</p>
          </div>
        )}
      </div>

      <button
        onClick={onDescargar}
        className="btn btn-primary btn-sm w-full"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Descargar receta
      </button>
    </div>
  );
}

function CertificadoCard({
  certificado,
  onDescargar,
}: {
  certificado: CertificadoPaciente;
  onDescargar: () => void;
}) {
  const tipoLabel: Record<string, string> = {
    REPOSO: 'Reposo',
    CONSULTA: 'Consulta',
    APTITUD: 'Aptitud',
    LIBRE: 'Libre',
  };

  const tipoColor: Record<string, string> = {
    REPOSO: 'bg-red-50 text-red-700 border-red-100',
    CONSULTA: 'bg-blue-50 text-blue-700 border-blue-100',
    APTITUD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    LIBRE: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="font-semibold text-slate-800">
            Dr/a. {certificado.profesional.nombre} {certificado.profesional.apellido}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(certificado.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className={`badge border text-[10px] font-bold whitespace-nowrap ${tipoColor[certificado.certificado.tipo]}`}>
          {tipoLabel[certificado.certificado.tipo]}
        </span>
      </div>

      <div className="border-t border-slate-100 pt-3 mb-3 space-y-2">
        <div>
          <p className="text-xs font-semibold text-slate-600">Diagnóstico</p>
          <p className="text-sm text-slate-700">{certificado.certificado.diagnostico}</p>
        </div>
        {certificado.certificado.diasReposo && (
          <div className="bg-red-50 rounded px-2 py-1.5 border border-red-100">
            <p className="text-xs font-semibold text-red-700">Días de reposo: {certificado.certificado.diasReposo}</p>
          </div>
        )}
      </div>

      <button
        onClick={onDescargar}
        className="btn btn-primary btn-sm w-full"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Descargar certificado
      </button>
    </div>
  );
}
