'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api, Turno, ListaEsperaItem, HistorialTurno, PacienteStats, RecetaPaciente, CertificadoPaciente } from '../../lib/api';
import ChatModal from '../../components/ChatModal';
import ProfileModal from '../../components/ProfileModal';
import OnboardingTour from '../../components/OnboardingTour';
import Pagination from '../../components/Pagination';
import VideoCallModal from '../../components/VideoCallModal';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import { useLang } from '../../lib/i18n/context';
import { NotificationBell } from '../../components/NotificationBell';
import { imprimirReceta } from '../../lib/receta-pdf';
import { imprimirHistorial } from '../../lib/historial-pdf';
import { imprimirCertificado } from '../../lib/certificado-pdf';
import { getTurnosTabRequest, PacienteDashboardTab } from '../../lib/paciente-dashboard-tabs';
import Spinner from '../../components/Spinner';
import { getLocale } from '../../lib/date';
import { useTranslateSpecialty } from '../../lib/i18n/use-translate-specialty';
import TurnoCard from './components/TurnoCard';
import HistorialCard from './components/HistorialCard';
import RecetaCard from './components/RecetaCard';
import CertificadoCard from './components/CertificadoCard';
import RecetaModal from './components/RecetaModal';
import PreconsultaModal from './components/PreconsultaModal';
import CalificarModal from './components/CalificarModal';
import ReprogramarModal from './components/ReprogramarModal';
import ResumenPacienteView from './components/ResumenPacienteView';
import EstadisticasPaciente from './components/EstadisticasPaciente';

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
  BellIcon, XIcon, SearchIcon, WaitlistIcon, InfoIcon, ClipboardIcon,
} from '../../components/icons';

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, lang } = useLang();
  const p = t('paciente');
  const d = t('dashboard');
  const c = t('common');
  const s = t('status');
  const m = t('modality');
  const locale = getLocale(lang);
  const translateSpecialty = useTranslateSpecialty();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PacienteDashboardTab>('resumen');
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
  const [cancellingTurnoId, setCancellingTurnoId] = useState<string | null>(null);

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
        loadStats();
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadTurnos = useCallback(async (tab: 'proximos' | 'pasados' = 'proximos', p: number = 1) => {
    setLoading(true);
    try {
      const data = await api.turnos.getMisTurnos({ tipo: tab, page: p, limit: TURNOS_LIMIT });
      setTurnos(data.turnos);
      setPaginationMeta({ total: data.pagination.total, totalPages: data.pagination.totalPages });
      loadPagosInfo(data.turnos);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const loadPagosInfo = async (turnosData: Turno[]) => {
    const pagos: Record<string, any> = {};
    for (const turno of turnosData) {
      if (turno.estado === 'RESERVADO' && Number(turno.profesional?.precioConsulta) > 0) {
        try {
          pagos[turno.id] = await api.pagos.getEstado(turno.id);
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
      }, getLocale(lang));
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
    if (cancellingTurnoId) return;
    setCancellingTurnoId(turnoId);
    try {
      await api.turnos.updateEstado(turnoId, 'CANCELADO');
      setTurnos(prev => prev.map(turno => turno.id === turnoId ? { ...turno, estado: 'CANCELADO' } : turno));
      await Promise.all([
        loadTurnos(activeTab === 'proximos' || activeTab === 'pasados' ? activeTab : 'proximos', page),
        loadStats(),
      ]);
      setInlineNotice({ type: 'success', text: 'Turno cancelado correctamente.' });
    } catch {
      setInlineNotice({ type: 'error', text: 'Error al cancelar turno' });
    } finally {
      setCancellingTurnoId(null);
    }
  };

  const canCancel = (fechaHora: string) =>
    new Date(fechaHora).getTime() - Date.now() >= horasMinCancelacion * 3_600_000;

  if (authLoading || !user || !user.paciente) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} className="text-blue-600" />
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

  const handleTabChange = (tab: PacienteDashboardTab) => {
    setActiveTab(tab);
    const turnosRequest = getTurnosTabRequest(tab);
    if (turnosRequest) {
      setPage(turnosRequest.page);
      loadTurnos(turnosRequest.tipo, turnosRequest.page);
    } else if (tab === 'estadisticas' && !pacienteStats) {
      loadStats();
    } else if (tab === 'historial' && historial.length === 0) {
      loadHistorial(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (activeTab === 'proximos' || activeTab === 'pasados') {
      loadTurnos(activeTab, newPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* -- Reminder banner ------------------------------- */}
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
                      {new Date(rec.fechaHora).toLocaleDateString(locale)} {p.atTime}{' '}
                      {new Date(rec.fechaHora).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      {' '}{p.withProfessional}{' '}
                      {rec.profesional?.nombre} {rec.profesional?.apellido}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- Navbar ---------------------------------------- */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <MediSyncLogo size={28} />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">MediSync</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-none mt-0.5">{d.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <ThemeLangToggle compact />
              <Link href="/" data-onboarding="pac-buscar-link" className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm hidden sm:inline-flex">
                <SearchIcon size={15} />
                {d.searchProfessionals}
              </Link>
              <button data-onboarding="pac-profile-btn" onClick={() => setShowProfileModal(true)} className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm">
                <UserIcon size={15} />
                <span className="hidden sm:inline">{user.paciente.nombre} {user.paciente.apellido}</span>
              </button>
              <button onClick={() => { logout(); router.push('/'); }} className="btn btn-secondary text-sm">
                <LogOutIcon size={15} />
                <span className="hidden sm:inline">{d.logout}</span>
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

        {/* -- Cancellation policy notice ----------------- */}
        <div className="alert alert-info mb-4 text-xs">
          <InfoIcon size={15} className="shrink-0" />
          <span>
            {d.cancellationPolicy}: {d.cancellationPolicyText.replace('{horas}', String(horasMinCancelacion))}
          </span>
        </div>

        {/* -- Tabs -------------------------------------- */}
        <div className="card overflow-hidden">
          <div className="tab-nav px-1 pt-1">
            <button
              onClick={() => handleTabChange('resumen')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'resumen' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
{p.summary}
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
              {d.medicalHistory}
            </button>
            <button
              onClick={() => handleTabChange('recetas')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'recetas' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {d.recipes}
            </button>
            <button
              onClick={() => handleTabChange('certificados')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'certificados' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="19" x2="12" y2="13"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
              {d.certificates_}
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
              {d.myMedicalData}
            </button>
            <button
              onClick={() => handleTabChange('estadisticas')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'estadisticas' ? 'tab-btn-active' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              {d.statistics}
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
                d={d}
              />
            ) : activeTab === 'estadisticas' ? (
              <EstadisticasPaciente stats={pacienteStats} loading={loadingStats} d={d} translateSpecialty={translateSpecialty} />
            ) : activeTab === 'historial' ? (
              /* -- Historial clínico ------------------ */
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
                  <p className="text-slate-500 text-sm font-medium">{d.noCompletedConsultations}</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={downloadHistorialPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {d.downloadFullHistory}
              </button>
                  </div>
                  <div className="space-y-4">
                    {historial.map(item => (
                      <HistorialCard key={item.id} item={item} onCalificar={(t) => setTurnoCalificar(t as any)} d={d} m={m} s={s} translateSpecialty={translateSpecialty} />
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
              /* -- Recetas ------------------------------ */
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
                  <p className="text-slate-500 text-sm font-medium">{p.noRecipes}</p>
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
              /* -- Certificados ------------------------- */
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
                  <p className="text-slate-500 text-sm font-medium">{p.noCertificates}</p>
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
              /* -- Mis datos médicos ---------------- */
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{d.personalHistory}</h3>
                  <p className="text-xs text-slate-400 mb-2">{d.personalHistoryDesc}</p>
                  <textarea
                    value={datosMedicos.antecedentesPersonales}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, antecedentesPersonales: e.target.value }))}
                    rows={3}
                    placeholder={d.placeholder.personalHistory}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{d.familyHistory}</h3>
                  <p className="text-xs text-slate-400 mb-2">{d.familyHistoryDesc}</p>
                  <textarea
                    value={datosMedicos.antecedentesFamiliares}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, antecedentesFamiliares: e.target.value }))}
                    rows={3}
                    placeholder={d.placeholder.familyHistory}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{d.allergies}</h3>
                  <p className="text-xs text-slate-400 mb-2">{d.allergiesDesc}</p>
                  <textarea
                    value={datosMedicos.alergias}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, alergias: e.target.value }))}
                    rows={2}
                    placeholder={d.placeholder.allergies}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{d.currentMedication}</h3>
                  <p className="text-xs text-slate-400 mb-2">{d.currentMedicationDesc}</p>
                  <textarea
                    value={datosMedicos.medicacionActual}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, medicacionActual: e.target.value }))}
                    rows={3}
                    placeholder={d.placeholder.currentMedication}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{d.habits}</h3>
                  <p className="text-xs text-slate-400 mb-2">{d.habitsDesc}</p>
                  <textarea
                    value={datosMedicos.habitos}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, habitos: e.target.value }))}
                    rows={2}
                    placeholder={d.placeholder.habits}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">{d.previousDiagnoses}</h3>
                  <p className="text-xs text-slate-400 mb-2">{d.previousDiagnosesDesc}</p>
                  <textarea
                    value={datosMedicos.diagnosticosPrevios}
                    onChange={(e) => setDatosMedicos(prev => ({ ...prev, diagnosticosPrevios: e.target.value }))}
                    rows={2}
                    placeholder={d.placeholder.previousDiagnoses}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveDatosMedicos}
                    disabled={savingDatos}
                    className="btn btn-primary text-sm"
                  >
                    {savingDatos ? d.saving : d.saveMedicalData}
                  </button>
                  {datosSaved && (
                    <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {d.savedMedicalData}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{d.medicalDataVisibility}</p>
              </div>
            ) : activeTab === 'listaEspera' ? (
              /* -- Lista de espera ------------------ */
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
                        <p className="text-sm text-blue-600 font-medium">{translateSpecialty(item.profesional?.especialidad?.nombre)}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><CalendarIcon size={11} />{new Date(item.fecha).toLocaleDateString(locale)}</span>
                          <span>{item.modalidad}</span>
                        </div>
                        <span className="badge badge-yellow mt-2">{(s as any)[item.estado] || item.estado}</span>
                      </div>
                      <button onClick={() => cancelarListaEspera(item.id)} className="btn btn-secondary btn-sm">
                        {p.cancel}
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (activeTab === 'proximos' || activeTab === 'pasados') && loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="skeleton h-4 w-40 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                    <div className="skeleton h-8 w-32 rounded-lg mt-2" />
                  </div>
                ))}
              </div>
            ) : activeTab === 'proximos' && turnos.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm font-medium mb-2">{p.noUpcoming}</p>
                <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
                  {d.firstAppointment}
                </p>
                <Link href="/" className="btn btn-primary btn-sm">
                  <SearchIcon size={13} /> {p.searchProfessional}
                </Link>
              </div>
            ) : activeTab === 'pasados' && turnos.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm font-medium">{p.noPast}</p>
              </div>
            ) : (activeTab === 'proximos' || activeTab === 'pasados') ? (
              <>
                <div className="space-y-3">
                  {turnos.map((turno) => (
                    <TurnoCard
                      key={turno.id}
                      turno={turno}
                      pagoInfo={pagosPendientes[turno.id]}
                      horasMinCancelacion={horasMinCancelacion}
                      canCancel={canCancel(turno.fechaHora)}
                      isCancelling={cancellingTurnoId === turno.id}
                      onPagar={() => router.push(`/pago?turno=${turno.id}`)}
                      onCancelar={() => handleCancelar(turno.id)}
                      onReprogramar={() => setTurnoReprogramar(turno)}
                      onCompletarPreconsulta={() => setTurnoPreconsulta(turno)}
                      onVerReceta={() => setTurnoReceta(turno)}
                      onCalificar={() => setTurnoCalificar(turno)}
                      onVideoCall={() => setTurnoVideoCall(turno)}
                      onChat={() => setTurnoChat(turno)}
                      d={d}
                      s={s}
                      translateSpecialty={translateSpecialty}
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
            ) : null}
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
