'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, Turno, Disponibilidad, BloqueoDisponibilidad, Evolucion, HistoriaClinicaPaciente, HistoriaClinicaEditableFields, PreconsultaTurno, RecetaIndicacionInput, RecetaIndicacion, PagosDashboardResponse, Resena, ResenasStats, CertificadoConDatos, TipoCertificado, Cupon, TipoDescuento, SuscripcionEstado, PlanProfesional } from '../lib/api';
import ChatModal from '../components/ChatModal';
import StarRating from '../components/StarRating';
import StatsPanel from '../components/StatsPanel';
import ProfileModal from '../components/ProfileModal';
import VideoCallModal from '../components/VideoCallModal';
import OnboardingTour from '../components/OnboardingTour';
import ThemeLangToggle from '../components/ThemeLangToggle';
import { useLang } from '../lib/i18n/context';
import { NotificationBell } from '../components/NotificationBell';
import ProfesionalOnboardingWizard from '../components/ProfesionalOnboardingWizard';
import { imprimirReceta } from '../lib/receta-pdf';
import { exportarHistoriaClinicaPDF } from '../lib/historia-clinica-pdf';
import { imprimirCertificado } from '../lib/certificado-pdf';
import {
  MediSyncLogo, CalendarIcon, ClockIcon, UserIcon, LogOutIcon,
  BellIcon, ChartIcon, TrashIcon, ClipboardIcon, PaperclipIcon,
  XIcon, CheckIcon, VideoIcon, BuildingIcon, MapPinIcon, InfoIcon, ChatIcon, StarIcon,
} from '../components/icons';
import { DIAS_SEMANA, estadoBadge, clinicalRiskBadge } from '../lib/utils';

const PROF_TOUR_STEPS = [
  {
    selector: '[data-onboarding="stat-cards"]',
    title: 'Tu resumen de actividad',
    description: 'Mirá de un vistazo cuántos turnos tenés hoy, cuántos tuviste este mes y tu especialidad.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="tab-calendario"]',
    title: 'Tu agenda diaria',
    description: 'En la pestaña "Agenda" encontrás todos los turnos del día seleccionado. Hacé clic en cualquier turno para ver la evolución clínica, historia del paciente y emitir recetas.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="tab-disponibilidad"]',
    title: 'Configurá tus horarios',
    description: 'En "Disponibilidad" agregás los días y rangos horarios en los que atendés. Los pacientes solo podrán reservar en esos bloques.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="tab-stats"]',
    title: 'Estadísticas y facturación',
    description: 'Revisá la evolución de tus turnos e ingresos mes a mes en el panel de estadísticas.',
    position: 'bottom' as const,
  },
  {
    selector: '[data-onboarding="profile-btn"]',
    title: 'Tu perfil profesional',
    description: 'Actualizá tu foto, precio de consulta, lugar de atención y biografía para que los pacientes te encuentren más fácilmente.',
    position: 'bottom' as const,
  },
];

interface StatsData {
  turnosPorMes: any[];
  ingresosPorMes: any[];
  resumen: { totalTurnos: number; totalPacientes: number };
}

export default function ProfesionalDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useLang();
  const d = t('dashboard');
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendario' | 'disponibilidad' | 'stats' | 'pagos' | 'resenas' | 'cupones' | 'plan'>('calendario');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [turnosDelDia, setTurnosDelDia] = useState<Turno[]>([]);
  const [nuevaDisp, setNuevaDisp] = useState({ diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', modalidad: 'PRESENCIAL' as const, lugarAtencion: '' });
  const [slotActual, setSlotActual] = useState<Turno | null>(null);
  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [showRecordatorios, setShowRecordatorios] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaEstado, setAgendaEstado] = useState<'TODOS' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE'>('TODOS');
  const [agendaModalidad, setAgendaModalidad] = useState<'TODAS' | 'PRESENCIAL' | 'VIRTUAL'>('TODAS');
  const [agendaSoloRiesgo, setAgendaSoloRiesgo] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileCopied, setProfileCopied] = useState(false);
  const [bloqueos, setBloqueos] = useState<BloqueoDisponibilidad[]>([]);
  const [loadingBloqueos, setLoadingBloqueos] = useState(false);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loadingCupones, setLoadingCupones] = useState(false);
  const [showNuevoCupon, setShowNuevoCupon] = useState(false);
  const [nuevosCuponForm, setNuevosCuponForm] = useState({
    codigo: '',
    tipo: 'PORCENTAJE' as TipoDescuento,
    valor: '',
    descripcion: '',
    maxUsos: '',
    expiresAt: '',
  });
  const [savingCupon, setSavingCupon] = useState(false);
  const [suscripcion, setSuscripcion] = useState<SuscripcionEstado | null>(null);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(false);
  const [redirectingToMP, setRedirectingToMP] = useState(false);

  useEffect(() => { if (!selectedDate) setSelectedDate(new Date()); }, [selectedDate]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.rol === 'ADMIN') { router.push('/dashboard/admin'); return; }
    if (!authLoading && user?.rol === 'CLINICA') { router.push('/dashboard/clinica'); return; }
    if (!authLoading && user?.paciente) { router.push('/dashboard/paciente'); return; }
    if (user?.profesional) { loadData(true); loadRecordatorios(); }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!selectedDate) return;
    const delDia = turnos.filter(t => new Date(t.fechaHora).toDateString() === selectedDate.toDateString());
    setTurnosDelDia(delDia);
  }, [turnos, selectedDate]);

  useEffect(() => {
    if (activeTab === 'stats') loadStats();
    if (activeTab === 'disponibilidad') loadBloqueos();
  }, [activeTab]);

  const loadData = async (checkOnboarding = false) => {
    if (!user?.profesional) return;
    try {
      const [turnosData, dispData] = await Promise.all([
        api.turnos.getByProfesional(user.profesional.id, {
          desde: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          hasta: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          limit: '200',
        }),
        api.profesionales.getById(user.profesional.id),
      ]);
      setTurnos(turnosData.turnos);
      const disps = dispData.disponibilidades || [];
      setDisponibilidades(disps);
      if (checkOnboarding) {
        const done = localStorage.getItem(`medisync_onboarding_done_${user.id}`);
        if (!done && disps.length === 0) setShowOnboarding(true);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadRecordatorios = async () => {
    try {
      const data = await api.recordatorios.getProfesional();
      setRecordatorios(data.turnos || []);
    } catch (err) { console.error(err); }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/profesional/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) { console.error(err); }
    finally { setLoadingStats(false); }
  };

  const loadBloqueos = async () => {
    setLoadingBloqueos(true);
    try {
      const data = await api.bloqueos.getMisBloqueos();
      setBloqueos(data);
    } catch (err) { console.error(err); }
    finally { setLoadingBloqueos(false); }
  };

  const handleAgregarDisponibilidad = async () => {
    if (!user?.profesional) return;
    try {
      await api.profesionales.crearDisponibilidad(user.profesional.id, {
        ...nuevaDisp,
        lugarAtencion: nuevaDisp.lugarAtencion.trim() || undefined,
      });
      loadData();
      setNuevaDisp({ diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', modalidad: 'PRESENCIAL', lugarAtencion: '' });
      setInlineFeedback({ type: 'success', text: 'Horario agregado correctamente.' });
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al agregar horario' });
    }
  };

  const handleEliminarDisponibilidad = async (id: string) => {
    if (!user?.profesional) return;
    try {
      await api.profesionales.eliminarDisponibilidad(user.profesional.id, id);
      loadData();
      setInlineFeedback({ type: 'success', text: 'Horario eliminado.' });
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al eliminar horario' });
    }
  };

  const getSemanaActual = () => {
    const dias = [];
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const f = new Date(hoy);
      f.setDate(hoy.getDate() + i);
      dias.push(f);
    }
    return dias;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin text-blue-600" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <p className="text-slate-500 text-sm">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!user?.profesional) return null;

  const hoyTurnos = turnos.filter(t =>
    new Date(t.fechaHora).toDateString() === new Date().toDateString() && t.estado !== 'CANCELADO'
  );
  const mesActual = new Date();
  const turnosMes = turnos.filter(t => {
    const f = new Date(t.fechaHora);
    return f.getMonth() === mesActual.getMonth() && f.getFullYear() === mesActual.getFullYear() && t.estado !== 'CANCELADO';
  });

  const loadCupones = async () => {
    setLoadingCupones(true);
    try {
      const data = await api.cupones.listar();
      setCupones(data);
    } catch (err) {
      console.error(err);
      setInlineFeedback({ type: 'error', text: 'Error al cargar cupones' });
    } finally {
      setLoadingCupones(false);
    }
  };

  const handleCrearCupon = async () => {
    if (!nuevosCuponForm.codigo.trim() || !nuevosCuponForm.valor) {
      setInlineFeedback({ type: 'error', text: 'Completa código y valor' });
      return;
    }

    setSavingCupon(true);
    try {
      const res = await api.cupones.crear({
        codigo: nuevosCuponForm.codigo.trim().toUpperCase(),
        tipo: nuevosCuponForm.tipo,
        valor: parseFloat(nuevosCuponForm.valor),
        descripcion: nuevosCuponForm.descripcion || undefined,
        maxUsos: nuevosCuponForm.maxUsos ? parseInt(nuevosCuponForm.maxUsos) : undefined,
        expiresAt: nuevosCuponForm.expiresAt || undefined,
      });
      setCupones([res, ...cupones]);
      setNuevosCuponForm({ codigo: '', tipo: 'PORCENTAJE', valor: '', descripcion: '', maxUsos: '', expiresAt: '' });
      setShowNuevoCupon(false);
      setInlineFeedback({ type: 'success', text: 'Cupón creado' });
      setTimeout(() => setInlineFeedback(null), 3000);
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al crear cupón' });
    } finally {
      setSavingCupon(false);
    }
  };

  const handleToggleCupon = async (id: string, activo: boolean) => {
    try {
      const res = await api.cupones.actualizar(id, { activo: !activo });
      setCupones(cupones.map(c => c.id === id ? res : c));
    } catch (err) {
      setInlineFeedback({ type: 'error', text: 'Error al actualizar cupón' });
    }
  };

  const handleEliminarCupon = async (id: string) => {
    try {
      await api.cupones.eliminar(id);
      setCupones(cupones.filter(c => c.id !== id));
      setInlineFeedback({ type: 'success', text: 'Cupón eliminado' });
      setTimeout(() => setInlineFeedback(null), 2000);
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al eliminar cupón' });
    }
  };

  const loadSuscripcion = async () => {
    setLoadingSuscripcion(true);
    try {
      const data = await api.suscripciones.estado();
      setSuscripcion(data);
    } catch (err) {
      console.error(err);
      setInlineFeedback({ type: 'error', text: 'Error al cargar plan' });
    } finally {
      setLoadingSuscripcion(false);
    }
  };

  const handleIniciarSuscripcion = async () => {
    setRedirectingToMP(true);
    try {
      const { initPoint } = await api.suscripciones.iniciar();
      window.location.href = initPoint;
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al iniciar suscripción' });
      setRedirectingToMP(false);
    }
  };

  const handleCancelarSuscripcion = async () => {
    if (!confirm('¿Estás seguro de que querés cancelar tu suscripción Pro?')) return;
    try {
      await api.suscripciones.cancelar();
      setInlineFeedback({ type: 'success', text: 'Suscripción cancelada' });
      await loadSuscripcion();
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Error al cancelar' });
    }
  };

  useEffect(() => {
    if (activeTab === 'cupones') loadCupones();
    if (activeTab === 'plan') loadSuscripcion();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Onboarding wizard ───────────────────────────── */}
      {showOnboarding && (
        <ProfesionalOnboardingWizard
          profesionalId={user.profesional.id}
          userId={user.id}
          nombre={user.profesional.nombre}
          onComplete={() => { setShowOnboarding(false); loadData(); }}
        />
      )}

      {/* ── Reminder banner ─────────────────────────────── */}
      {recordatorios.length > 0 && (
        <div className="bg-blue-600 text-white">
          <div className="page-container py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <BellIcon size={15} className="shrink-0" />
              <span className="font-medium">
                {recordatorios.length} turno{recordatorios.length > 1 ? 's' : ''} en las próximas 24 h
              </span>
              <button
                onClick={() => setShowRecordatorios(!showRecordatorios)}
                className="underline underline-offset-2 text-blue-100 hover:text-white text-xs"
              >
                {showRecordatorios ? 'Ocultar' : 'Ver detalle'}
              </button>
            </div>
            <button onClick={() => setRecordatorios([])} className="text-blue-200 hover:text-white">
              <XIcon size={14} />
            </button>
          </div>
          {showRecordatorios && (
            <div className="page-container pb-3">
              <div className="bg-blue-700/50 rounded-lg p-3 space-y-1.5">
                {recordatorios.map((rec: any) => (
                  <div key={rec.id} className="flex items-center gap-3 text-sm text-blue-50">
                    <ClockIcon size={13} className="shrink-0 text-blue-300" />
                    <span>
                      {new Date(rec.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {rec.paciente?.nombre} {rec.paciente?.apellido}
                    </span>
                    {rec.modalidad === 'VIRTUAL' && (
                      <span className="badge badge-blue text-[10px]">Virtual</span>
                    )}
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
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-none mt-0.5">{d.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <ThemeLangToggle compact />
              <button
                onClick={() => {
                  const url = `${window.location.origin}/profesional/${user.profesional!.id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setProfileCopied(true);
                    setTimeout(() => setProfileCopied(false), 2500);
                  });
                }}
                title="Copiar link de mi perfil"
                className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm relative"
              >
                {profileCopied ? (
                  <>
                    <CheckIcon size={15} className="text-emerald-500" />
                    <span className="hidden sm:inline text-emerald-600 text-xs">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    {/* Share / link icon */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span className="hidden sm:inline">Compartir perfil</span>
                  </>
                )}
              </button>
              <button
                data-onboarding="profile-btn"
                onClick={() => setShowProfileModal(true)}
                className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm"
              >
                <UserIcon size={15} />
                <span className="hidden sm:inline">
                  Dr/a. {user.profesional.nombre} {user.profesional.apellido}
                </span>
              </button>
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="btn btn-secondary text-sm"
              >
                <LogOutIcon size={15} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container py-6">
        {inlineFeedback && (
          <div className={`alert mb-4 ${inlineFeedback.type === 'success' ? 'alert-success' : inlineFeedback.type === 'error' ? 'alert-error' : 'alert-info'}`} role="status" aria-live="polite">
            <InfoIcon size={14} className="shrink-0" />
            <span>{inlineFeedback.text}</span>
            <button className="ml-auto text-xs underline" onClick={() => setInlineFeedback(null)}>Ocultar</button>
          </div>
        )}

        {/* ── Stat cards ──────────────────────────────────── */}
        <div data-onboarding="stat-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <p className="stat-label">{d.appointments} — {d.today}</p>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon size={15} className="text-blue-600" />
              </div>
            </div>
            <p className="stat-value text-blue-600">{hoyTurnos.length}</p>
            <p className="stat-desc">
              {hoyTurnos.filter(t => t.estado === 'CONFIRMADO').length} confirmados
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between">
              <p className="stat-label">{d.appointments} — {d.thisMonth}</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ChartIcon size={15} className="text-emerald-600" />
              </div>
            </div>
            <p className="stat-value text-emerald-600">{turnosMes.length}</p>
            <p className="stat-desc">{mesActual.toLocaleString('es-AR', { month: 'long' })}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between">
              <p className="stat-label">{d.specialtyLabel}</p>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <ClipboardIcon size={15} className="text-purple-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 mt-1 leading-tight">
              {user.profesional.especialidad?.nombre || '—'}
            </p>
            <p className="stat-desc">{d.title}</p>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="tab-nav px-1 pt-1">
            {([
              { id: 'calendario', label: d.agenda, icon: <CalendarIcon size={14} />, onboarding: 'tab-calendario' },
              { id: 'disponibilidad', label: d.availability, icon: <ClockIcon size={14} />, onboarding: 'tab-disponibilidad' },
              { id: 'stats', label: d.stats, icon: <ChartIcon size={14} />, onboarding: 'tab-stats' },
              { id: 'pagos', label: 'Pagos', icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>, onboarding: 'tab-pagos' },
              { id: 'resenas', label: 'Reseñas', icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>, onboarding: 'tab-resenas' },
              { id: 'cupones', label: 'Cupones', icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.008h.01m0 0h-.01M16.5 18v.008h.01m0 0h-.01M6 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>, onboarding: 'tab-cupones' },
              { id: 'plan', label: 'Plan', icon: <StarIcon size={14} />, onboarding: 'tab-plan' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                data-onboarding={tab.onboarding}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn flex items-center gap-1.5 ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'calendario' && (
              <CalendarioView
                selectedDate={selectedDate ?? new Date()}
                setSelectedDate={setSelectedDate}
                getSemanaActual={getSemanaActual}
                turnosDelDia={turnosDelDia}
                onSelectTurno={setSlotActual}
                agendaSearch={agendaSearch}
                setAgendaSearch={setAgendaSearch}
                agendaEstado={agendaEstado}
                setAgendaEstado={setAgendaEstado}
                agendaModalidad={agendaModalidad}
                setAgendaModalidad={setAgendaModalidad}
                agendaSoloRiesgo={agendaSoloRiesgo}
                setAgendaSoloRiesgo={setAgendaSoloRiesgo}
              />
            )}
            {activeTab === 'disponibilidad' && (
              <>
                <DisponibilidadView
                  disponibilidades={disponibilidades}
                  nuevaDisp={nuevaDisp}
                  setNuevaDisp={setNuevaDisp}
                  onAgregar={handleAgregarDisponibilidad}
                  onEliminar={handleEliminarDisponibilidad}
                  bloqueos={bloqueos}
                  loadingBloqueos={loadingBloqueos}
                  onReloadBloqueos={loadBloqueos}
                />
                <EmbedWidgetSection profesionalId={user.profesional!.id} />
              </>
            )}
            {activeTab === 'stats' && (
              <div>
                {loadingStats ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-slate-500">
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    {t('common').loading}
                  </div>
                ) : (
                  <StatsPanel stats={stats} />
                )}
              </div>
            )}
            {activeTab === 'pagos' && (
              <PagosView />
            )}
            {activeTab === 'resenas' && (
              <ResenasView />
            )}
            {activeTab === 'cupones' && cupones && (
              <CuponesView
                cupones={cupones}
                loading={loadingCupones}
                onShowNuevo={() => setShowNuevoCupon(true)}
                onToggleActivo={(id: string, activo: boolean) => handleToggleCupon(id, activo)}
                onEliminar={(id: string) => handleEliminarCupon(id)}
              />
            )}
            {activeTab === 'plan' && (
              <PlanView
                suscripcion={suscripcion}
                loading={loadingSuscripcion}
                onIniciarSuscripcion={handleIniciarSuscripcion}
                onCancelarSuscripcion={handleCancelarSuscripcion}
                redirecting={redirectingToMP}
              />
            )}
            {activeTab === 'stats' && suscripcion?.plan === 'FREE' && (
              <UpgradePrompt feature="estadísticas" onViewPlans={() => setActiveTab('plan')} />
            )}
          </div>
        </div>
      </main>

      {/* ── Turno modal ─────────────────────────────────── */}
      {slotActual && (
        <TurnoModal turno={slotActual} onClose={() => setSlotActual(null)} onUpdate={loadData} />
      )}

      {showProfileModal && user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userType="profesional"
          user={user}
          onUpdate={() => window.location.reload()}
        />
      )}

      {showNuevoCupon && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Nuevo Cupón</h3>
              <button onClick={() => setShowNuevoCupon(false)} className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600">
                <XIcon size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="field-label">Código de cupón</label>
                <input
                  type="text"
                  value={nuevosCuponForm.codigo}
                  onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, codigo: e.target.value.toUpperCase() })}
                  placeholder="ej: PROMO10"
                  className="field-input"
                  disabled={savingCupon}
                />
              </div>

              <div>
                <label className="field-label mb-2">Tipo de descuento</label>
                <div className="flex gap-2">
                  {(['PORCENTAJE', 'MONTO_FIJO'] as TipoDescuento[]).map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setNuevosCuponForm({ ...nuevosCuponForm, tipo })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        nuevosCuponForm.tipo === tipo
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {tipo === 'PORCENTAJE' ? '%' : '$'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Valor {nuevosCuponForm.tipo === 'PORCENTAJE' ? '(%)' : '($ARS)'}</label>
                <input
                  type="number"
                  value={nuevosCuponForm.valor}
                  onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, valor: e.target.value })}
                  placeholder="ej: 10"
                  className="field-input"
                  disabled={savingCupon}
                />
              </div>

              <div>
                <label className="field-label">Descripción (opcional)</label>
                <input
                  type="text"
                  value={nuevosCuponForm.descripcion}
                  onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, descripcion: e.target.value })}
                  placeholder="ej: 10% en primera consulta"
                  className="field-input"
                  disabled={savingCupon}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Usos máximos (opcional)</label>
                  <input
                    type="number"
                    value={nuevosCuponForm.maxUsos}
                    onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, maxUsos: e.target.value })}
                    placeholder="ilimitado"
                    className="field-input"
                    disabled={savingCupon}
                  />
                </div>
                <div>
                  <label className="field-label">Vence el (opcional)</label>
                  <input
                    type="date"
                    value={nuevosCuponForm.expiresAt}
                    onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, expiresAt: e.target.value })}
                    className="field-input"
                    disabled={savingCupon}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 rounded-b-2xl">
              <button onClick={() => setShowNuevoCupon(false)} className="btn btn-secondary flex-1" disabled={savingCupon}>
                Cancelar
              </button>
              <button onClick={handleCrearCupon} className="btn btn-primary flex-1" disabled={savingCupon}>
                {savingCupon ? 'Creando...' : 'Crear Cupón'}
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardingTour
        storageKey="medisync-prof-tour-v1"
        steps={PROF_TOUR_STEPS}
        delay={1000}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CUPONES VIEW
══════════════════════════════════════════════════════════════ */
function CuponesView({
  cupones,
  loading,
  onShowNuevo,
  onToggleActivo,
  onEliminar,
}: {
  cupones: Cupon[];
  loading: boolean;
  onShowNuevo: () => void;
  onToggleActivo: (id: string, activo: boolean) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Cupones disponibles</h3>
        <button onClick={onShowNuevo} className="btn btn-primary btn-sm">
          + Nuevo Cupón
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : cupones.length === 0 ? (
        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 6v.008h.01m0 0h-.01M16.5 18v.008h.01m0 0h-.01M6 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          <p className="text-sm">Sin cupones disponibles</p>
          <button onClick={onShowNuevo} className="btn btn-primary btn-sm mt-3">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {cupones.map((cupon) => {
            const isExpired = cupon.expiresAt && new Date(cupon.expiresAt) < new Date();
            const isExhausted = cupon.maxUsos && cupon.usosActuales >= cupon.maxUsos;
            const statusBadge = !cupon.activo ? 'Inactivo' : isExpired ? 'Vencido' : isExhausted ? 'Agotado' : 'Activo';
            const statusColor = !cupon.activo ? 'bg-slate-100 text-slate-600' : isExpired ? 'bg-red-100 text-red-600' : isExhausted ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600';

            return (
              <div key={cupon.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{cupon.codigo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusBadge}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{cupon.descripcion || '—'}</p>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>Descuento: {cupon.tipo === 'PORCENTAJE' ? `${cupon.valor}%` : `$${cupon.valor.toLocaleString('es-AR')}`}</p>
                    {cupon.maxUsos && (
                      <p>Usos: {cupon.usosActuales}/{cupon.maxUsos}</p>
                    )}
                    {cupon.expiresAt && (
                      <p>Vence: {new Date(cupon.expiresAt).toLocaleDateString('es-AR')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleActivo(cupon.id, cupon.activo)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
                      cupon.activo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cupon.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => onEliminar(cupon.id)}
                    className="btn btn-ghost p-2 text-slate-400 hover:text-red-600"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CALENDARIO VIEW
══════════════════════════════════════════════════════════════ */
function CalendarioView({
  selectedDate, setSelectedDate, getSemanaActual, turnosDelDia, onSelectTurno,
  agendaSearch, setAgendaSearch, agendaEstado, setAgendaEstado, agendaModalidad, setAgendaModalidad, agendaSoloRiesgo, setAgendaSoloRiesgo,
}: {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  getSemanaActual: () => Date[];
  turnosDelDia: Turno[];
  onSelectTurno: (t: Turno) => void;
  agendaSearch: string;
  setAgendaSearch: (v: string) => void;
  agendaEstado: 'TODOS' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
  setAgendaEstado: (v: 'TODOS' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE') => void;
  agendaModalidad: 'TODAS' | 'PRESENCIAL' | 'VIRTUAL';
  setAgendaModalidad: (v: 'TODAS' | 'PRESENCIAL' | 'VIRTUAL') => void;
  agendaSoloRiesgo: boolean;
  setAgendaSoloRiesgo: (v: boolean) => void;
}) {
  const { t } = useLang();
  const d = t('dashboard');
  const h = t('home');
  const hoy = typeof window !== 'undefined' ? new Date().toDateString() : '';
  const filteredTurnos = useMemo(() => {
    return turnosDelDia
      .filter((t) => agendaEstado === 'TODOS' || t.estado === agendaEstado)
      .filter((t) => agendaModalidad === 'TODAS' || t.modalidad === agendaModalidad)
      .filter((t) => {
        if (!agendaSearch.trim()) return true;
        const fullName = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}`.toLowerCase() : 'paciente sin cuenta';
        return fullName.includes(agendaSearch.toLowerCase());
      })
      .filter((t) => !agendaSoloRiesgo || t.preconsultaRiesgo === 'ALTO' || t.preconsultaRiesgo === 'URGENTE')
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }, [turnosDelDia, agendaEstado, agendaModalidad, agendaSearch, agendaSoloRiesgo]);

  return (
    <div>
      {/* Day strip */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {getSemanaActual().map((fecha) => {
          const isSelected = fecha.toDateString() === selectedDate.toDateString();
          const isToday = fecha.toDateString() === hoy;
          return (
            <button
              key={fecha.toISOString()}
              onClick={() => setSelectedDate(fecha)}
              className={`flex flex-col items-center justify-center rounded-lg p-2 min-w-[52px] border transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : isToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {DIAS_SEMANA[fecha.getDay()].slice(0, 3)}
              </span>
              <span className={`text-base font-bold mt-0.5 ${isSelected ? '' : isToday ? '' : ''}`}>
                {fecha.getDate()}
              </span>
              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">
          {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        <span className="badge badge-gray">{filteredTurnos.length}/{turnosDelDia.length} turnos</span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <input
          value={agendaSearch}
          onChange={(e) => setAgendaSearch(e.target.value)}
          placeholder={`${t('common').search} ${d.patient}...`}
          className="field-input"
          aria-label="Buscar paciente en agenda"
        />
        <select value={agendaEstado} onChange={(e) => setAgendaEstado(e.target.value as any)} className="field-select" aria-label="Filtrar por estado">
          <option value="TODOS">{t('status').all}</option>
          <option value="RESERVADO">{t('status').RESERVADO}</option>
          <option value="CONFIRMADO">{t('status').CONFIRMADO}</option>
          <option value="COMPLETADO">{t('status').COMPLETADO}</option>
          <option value="CANCELADO">{t('status').CANCELADO}</option>
          <option value="AUSENTE">{t('status').AUSENTE}</option>
        </select>
        <select value={agendaModalidad} onChange={(e) => setAgendaModalidad(e.target.value as any)} className="field-select" aria-label="Filtrar por modalidad">
          <option value="TODAS">{h.allModalities}</option>
          <option value="PRESENCIAL">{h.inPerson}</option>
          <option value="VIRTUAL">{h.virtual}</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-3 bg-white dark:bg-slate-700">
          <input type="checkbox" checked={agendaSoloRiesgo} onChange={(e) => setAgendaSoloRiesgo(e.target.checked)} />
          {t('status').highRisk}
        </label>
      </div>

      {/* Appointment list */}
      {filteredTurnos.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{d.noAppointments}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTurnos.map((turno) => (
              <button
                key={turno.id}
                onClick={() => onSelectTurno(turno)}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 transition-all text-left group"
              >
                {/* Time */}
                <div className="shrink-0 text-center w-14">
                  <p className="text-lg font-bold text-slate-700 group-hover:text-blue-700 leading-none">
                    {new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="w-px h-8 bg-slate-200 group-hover:bg-blue-200" />

                {/* Patient */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 group-hover:text-blue-700 truncate">
                    {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Paciente sin cuenta'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {turno.modalidad === 'VIRTUAL' ? (
                      <VideoIcon size={12} className="text-blue-400" />
                    ) : (
                      <BuildingIcon size={12} className="text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500">
                      {turno.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                    </span>
                    {turno.preconsultaRiesgo && (
                      <span className={clinicalRiskBadge(turno.preconsultaRiesgo)}>
                        {turno.preconsultaRiesgo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span className={estadoBadge(turno.estado)}>
                  {turno.estado}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DISPONIBILIDAD VIEW
══════════════════════════════════════════════════════════════ */
const MOTIVOS_BLOQUEO = ['Vacaciones', 'Feriado', 'Capacitación', 'Personal', 'Otro'];

function DisponibilidadView({
  disponibilidades, nuevaDisp, setNuevaDisp, onAgregar, onEliminar,
  bloqueos, loadingBloqueos, onReloadBloqueos,
}: {
  disponibilidades: Disponibilidad[];
  nuevaDisp: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL'; lugarAtencion: string };
  setNuevaDisp: (d: any) => void;
  onAgregar: () => void;
  onEliminar: (id: string) => void;
  bloqueos: BloqueoDisponibilidad[];
  loadingBloqueos: boolean;
  onReloadBloqueos: () => void;
}) {
  const { t } = useLang();
  const d = t('dashboard');
  const h = t('home');

  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
    esHoraParcial: false,
  });
  const [savingBloqueo, setSavingBloqueo] = useState(false);
  const [bloqueoError, setBloqueoError] = useState('');
  const [bloqueoOk, setBloqueoOk] = useState('');

  const handleCrearBloqueo = async () => {
    setBloqueoError('');
    setBloqueoOk('');
    if (!nuevoBloqueo.fechaInicio || !nuevoBloqueo.fechaFin) {
      setBloqueoError('La fecha de inicio y fin son obligatorias.');
      return;
    }
    if (nuevoBloqueo.esHoraParcial && (!nuevoBloqueo.horaInicio || !nuevoBloqueo.horaFin)) {
      setBloqueoError('Para bloqueo parcial indicá hora de inicio y fin.');
      return;
    }
    setSavingBloqueo(true);
    try {
      await api.bloqueos.crear({
        fechaInicio: nuevoBloqueo.fechaInicio,
        fechaFin: nuevoBloqueo.fechaFin,
        horaInicio: nuevoBloqueo.esHoraParcial ? nuevoBloqueo.horaInicio : undefined,
        horaFin: nuevoBloqueo.esHoraParcial ? nuevoBloqueo.horaFin : undefined,
        motivo: nuevoBloqueo.motivo || undefined,
      });
      setBloqueoOk('Bloqueo guardado correctamente.');
      setNuevoBloqueo({ fechaInicio: '', fechaFin: '', horaInicio: '', horaFin: '', motivo: '', esHoraParcial: false });
      onReloadBloqueos();
    } catch (err) {
      setBloqueoError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingBloqueo(false);
    }
  };

  const handleEliminarBloqueo = async (id: string) => {
    try {
      await api.bloqueos.eliminar(id);
      onReloadBloqueos();
    } catch (err) {
      setBloqueoError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatFechaBloqueo = (b: BloqueoDisponibilidad) => {
    const inicio = new Date(b.fechaInicio + 'T12:00:00');
    const fin = new Date(b.fechaFin + 'T12:00:00');
    const fmt = (d: Date) => d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    if (b.fechaInicio === b.fechaFin) return fmt(inicio);
    return `${fmt(inicio)} → ${fmt(fin)}`;
  };

  return (
    <div className="space-y-8">
      {/* ── Horarios recurrentes ── */}
      <div>
        <h3 className="section-title mb-3">{d.availability}</h3>
        {disponibilidades.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <ClockIcon size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('common').noResults}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {disponibilidades.map((disp) => (
              <div key={disp.id} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-24 shrink-0">
                  <p className="font-semibold text-slate-700 text-sm">{DIAS_SEMANA[disp.diaSemana]}</p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                  <ClockIcon size={13} className="text-slate-400" />
                  <span>{disp.horaInicio} — {disp.horaFin}</span>
                </div>
                <span className={`ml-1 badge ${disp.modalidad === 'VIRTUAL' ? 'badge-blue' : disp.modalidad === 'PRESENCIAL' ? 'badge-green' : 'badge-purple'}`}>
                  {disp.modalidad}
                </span>
                {disp.lugarAtencion && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 truncate max-w-[180px]">
                    <MapPinIcon size={11} className="shrink-0 text-slate-400" />
                    {disp.lugarAtencion}
                  </span>
                )}
                <button
                  onClick={() => onEliminar(disp.id)}
                  className="ml-auto btn btn-ghost text-red-400 hover:text-red-600 p-1.5"
                  title="Eliminar horario"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Agregar horario ── */}
      <div>
        <h3 className="section-title mb-3">{d.addAvailability}</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="field-label">{d.day}</label>
              <select
                value={nuevaDisp.diaSemana}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, diaSemana: parseInt(e.target.value) })}
                className="field-select"
              >
                {DIAS_SEMANA.map((dia, i) => <option key={i} value={i}>{dia}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">{d.from}</label>
              <input
                type="time" value={nuevaDisp.horaInicio}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaInicio: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{d.to}</label>
              <input
                type="time" value={nuevaDisp.horaFin}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{t('professional').modality}</label>
              <select
                value={nuevaDisp.modalidad}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, modalidad: e.target.value as any })}
                className="field-select"
              >
                <option value="PRESENCIAL">{h.inPerson}</option>
                <option value="VIRTUAL">{h.virtual}</option>
              </select>
            </div>
          </div>
          {/* Lugar de atención por horario */}
          <div className="mt-3">
            <label className="field-label flex items-center gap-1">
              <MapPinIcon size={12} className="text-slate-400" />
              Lugar de atención (para este horario)
              <span className="text-slate-400 font-normal ml-1">— opcional</span>
            </label>
            <input
              type="text"
              placeholder={nuevaDisp.modalidad === 'VIRTUAL' ? 'Videollamada' : 'Ej: Consultorio 3 — Av. Corrientes 1234, CABA'}
              value={nuevaDisp.lugarAtencion}
              onChange={(e) => setNuevaDisp({ ...nuevaDisp, lugarAtencion: e.target.value })}
              className="field-input"
            />
          </div>
          <button onClick={onAgregar} className="btn btn-primary mt-4">
            + {d.addAvailability}
          </button>
        </div>
      </div>

      {/* ══ Bloqueos de días ══ */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center gap-2 mb-1">
          {/* Calendar-off icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
          <h3 className="section-title">Ausencias y días bloqueados</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Bloqueá días o rangos de fechas en los que no vas a atender. Los pacientes no podrán reservar turnos en esos períodos.</p>

        {/* Lista de bloqueos activos */}
        {loadingBloqueos ? (
          <div className="py-6 flex justify-center text-slate-400 text-sm">Cargando...</div>
        ) : bloqueos.length === 0 ? (
          <div className="py-6 text-center text-slate-400 border-2 border-dashed border-amber-100 rounded-xl mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30 text-amber-400">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="text-sm">Sin bloqueos próximos</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {bloqueos.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-amber-500">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm">{formatFechaBloqueo(b)}</p>
                  <p className="text-xs text-slate-500">
                    {b.horaInicio && b.horaFin ? `${b.horaInicio}–${b.horaFin}` : 'Día completo'}
                    {b.motivo ? ` · ${b.motivo}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleEliminarBloqueo(b.id)}
                  className="btn btn-ghost text-red-400 hover:text-red-600 p-1.5 shrink-0"
                  title="Eliminar bloqueo"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario nuevo bloqueo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-3">Agregar nuevo bloqueo</h4>
          {bloqueoError && <p className="text-xs text-red-600 mb-2">{bloqueoError}</p>}
          {bloqueoOk && <p className="text-xs text-emerald-600 mb-2">{bloqueoOk}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="field-label">Fecha inicio</label>
              <input
                type="date"
                value={nuevoBloqueo.fechaInicio}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fechaInicio: e.target.value, fechaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Fecha fin</label>
              <input
                type="date"
                value={nuevoBloqueo.fechaFin}
                min={nuevoBloqueo.fechaInicio || new Date().toISOString().split('T')[0]}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fechaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Motivo (opcional)</label>
              <select
                value={nuevoBloqueo.motivo}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, motivo: e.target.value })}
                className="field-select"
              >
                <option value="">Sin especificar</option>
                {MOTIVOS_BLOQUEO.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle bloqueo parcial */}
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={nuevoBloqueo.esHoraParcial}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, esHoraParcial: e.target.checked })}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-600">Bloqueo parcial (solo un rango horario)</span>
          </label>

          {nuevoBloqueo.esHoraParcial && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="field-label">Hora inicio</label>
                <input
                  type="time"
                  value={nuevoBloqueo.horaInicio}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: e.target.value })}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Hora fin</label>
                <input
                  type="time"
                  value={nuevoBloqueo.horaFin}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaFin: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleCrearBloqueo}
            disabled={savingBloqueo}
            className="btn btn-primary bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700"
          >
            {savingBloqueo ? 'Guardando...' : '+ Agregar bloqueo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMITIR CERTIFICADO MODAL
══════════════════════════════════════════════════════════════ */
const CERT_TEMPLATES: Record<TipoCertificado, string> = {
  REPOSO: 'El/la paciente ha sido visto/a y luego del examen clínico, se prescribe reposo médico.',
  CONSULTA: 'El/la paciente ha sido visto/a por consulta especializada.',
  APTITUD: 'Por este medio se certifica que el/la paciente se encuentra apto/a para las actividades indicadas.',
  LIBRE: '',
};

function EmitirCertificadoModal({
  form,
  setForm,
  onSave,
  loading,
  onClose,
}: {
  form: { tipo: TipoCertificado; diagnostico: string; texto: string; diasReposo: number };
  setForm: (f: any) => void;
  onSave: () => void;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Emitir Certificado Médico</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600">
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tipo de certificado */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de certificado</label>
            <div className="flex flex-wrap gap-2">
              {(['CONSULTA', 'REPOSO', 'APTITUD', 'LIBRE'] as TipoCertificado[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    setForm({ ...form, tipo, texto: CERT_TEMPLATES[tipo] });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo === tipo
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {tipo === 'REPOSO' ? 'Reposo Médico'
                    : tipo === 'CONSULTA' ? 'Justificación de Consulta'
                    : tipo === 'APTITUD' ? 'Aptitud Física'
                    : 'Certificado Libre'}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="field-label">Diagnóstico (obligatorio)</label>
            <textarea
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
              placeholder="Diagnóstico principal de la consulta..."
              className="field-input resize-none min-h-[64px] text-sm"
            />
          </div>

          {/* Texto del certificado */}
          <div>
            <label className="field-label">Texto del certificado (obligatorio)</label>
            <textarea
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder="Contenido del certificado médico..."
              className="field-input resize-none min-h-[80px] text-sm"
            />
          </div>

          {/* Días de reposo (solo si REPOSO) */}
          {form.tipo === 'REPOSO' && (
            <div>
              <label className="field-label">Días de reposo (obligatorio)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={form.diasReposo}
                onChange={(e) => setForm({ ...form, diasReposo: parseInt(e.target.value) || 0 })}
                className="field-input"
                placeholder="Ej: 3"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
            Cancelar
          </button>
          <button onClick={onSave} className="btn btn-primary flex-1" disabled={loading}>
            {loading ? 'Emitiendo...' : 'Emitir y descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TURNO MODAL
══════════════════════════════════════════════════════════════ */
type Archivo = { id: string; url: string; nombreOriginal: string; tipo: string; tamanoBytes: number; mimeType: string };

function TurnoModal({ turno, onClose, onUpdate }: { turno: Turno; onClose: () => void; onUpdate: () => void }) {
  const [evolucion, setEvolucion] = useState<Evolucion | null>(null);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [loadingEvolucion, setLoadingEvolucion] = useState(true);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState('OTRO');
  const [savedMessage, setSavedMessage] = useState('');
  const [historiaClinica, setHistoriaClinica] = useState<HistoriaClinicaPaciente | null>(null);
  const [historiaForm, setHistoriaForm] = useState<HistoriaClinicaEditableFields>({});
  const [loadingHistoria, setLoadingHistoria] = useState(true);
  const [savingHistoria, setSavingHistoria] = useState(false);
  const [historiaMessage, setHistoriaMessage] = useState('');
  const [preconsulta, setPreconsulta] = useState<PreconsultaTurno | null>(null);
  const [loadingPreconsulta, setLoadingPreconsulta] = useState(true);
  const { t } = useLang();
  const d = t('dashboard');
  const [receta, setReceta] = useState<RecetaIndicacion | null>(null);
  const [recetaForm, setRecetaForm] = useState<RecetaIndicacionInput>({ diagnostico: '', indicaciones: '' });
  const [loadingReceta, setLoadingReceta] = useState(true);
  const [savingReceta, setSavingReceta] = useState(false);
  const [shareText, setShareText] = useState('');
  const [modalNotice, setModalNotice] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReprogramar, setShowReprogramar] = useState(false);
  const [reprogramarFecha, setReprogramarFecha] = useState('');
  const [reprogramarSlots, setReprogramarSlots] = useState<{ hora: string; disponible: boolean }[]>([]);
  const [reprogramarHora, setReprogramarHora] = useState('');
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const { user: authUser } = useAuth();
  const [certificado, setCertificado] = useState<CertificadoConDatos | null>(null);
  const [loadingCertificado, setLoadingCertificado] = useState(true);
  const [showEmitirCertificado, setShowEmitirCertificado] = useState(false);
  const [certificadoForm, setCertificadoForm] = useState<{
    tipo: TipoCertificado;
    diagnostico: string;
    texto: string;
    diasReposo: number;
  }>({
    tipo: 'CONSULTA',
    diagnostico: '',
    texto: '',
    diasReposo: 0,
  });
  const [savingCertificado, setSavingCertificado] = useState(false);

  useEffect(() => {
    if (turno.estado !== 'CANCELADO') {
      api.chat.getUnread(turno.id).then(d => setUnreadChat(d.count)).catch(() => {});
    }
  }, [turno.id, turno.estado]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => { loadEvolucion(); loadArchivos(); }, [turno.id]);
  useEffect(() => { loadPreconsulta(); }, [turno.id]);
  useEffect(() => { loadReceta(); }, [turno.id]);
  useEffect(() => { loadCertificado(); }, [turno.id]);
  useEffect(() => {
    if (turno.paciente?.id) {
      loadHistoriaClinica(turno.paciente.id);
      return;
    }

    setHistoriaClinica(null);
    setHistoriaForm({});
    setLoadingHistoria(false);
  }, [turno.id, turno.paciente?.id]);

  const loadHistoriaClinica = async (pacienteId: string) => {
    setLoadingHistoria(true);
    try {
      const data = await api.pacientes.getHistoriaClinica(pacienteId);
      setHistoriaClinica(data);
      setHistoriaForm({
        antecedentesPersonales: data.paciente.antecedentesPersonales ?? '',
        antecedentesFamiliares: data.paciente.antecedentesFamiliares ?? '',
        alergias: data.paciente.alergias ?? '',
        medicacionActual: data.paciente.medicacionActual ?? '',
        habitos: data.paciente.habitos ?? '',
        diagnosticosPrevios: data.paciente.diagnosticosPrevios ?? '',
        notasClinicasGenerales: data.paciente.notasClinicasGenerales ?? '',
      });
    } catch (err) {
      console.error(err);
      setHistoriaClinica(null);
      setHistoriaForm({});
    } finally {
      setLoadingHistoria(false);
    }
  };

  const loadPreconsulta = async () => {
    setLoadingPreconsulta(true);
    try {
      const data = await api.turnos.getPreconsulta(turno.id);
      setPreconsulta(data);
    } catch (err) {
      console.error(err);
      setPreconsulta(null);
    } finally {
      setLoadingPreconsulta(false);
    }
  };

  const loadReceta = async () => {
    setLoadingReceta(true);
    try {
      const data = await api.turnos.getReceta(turno.id);
      setReceta(data);
      if (data) {
        setRecetaForm({
          diagnostico: data.diagnostico,
          planTratamiento: data.planTratamiento || '',
          medicamentos: data.medicamentos || '',
          indicaciones: data.indicaciones,
          estudiosSolicitados: data.estudiosSolicitados || '',
          proximoControl: data.proximoControl || '',
          advertencias: data.advertencias || '',
          observaciones: data.observaciones || '',
        });
      }
    } catch (err) {
      console.error(err);
      setReceta(null);
    } finally {
      setLoadingReceta(false);
    }
  };

  const loadCertificado = async () => {
    setLoadingCertificado(true);
    try {
      const data = await api.certificados.getByTurno(turno.id);
      setCertificado(data);
      setCertificadoForm({
        tipo: data.tipo,
        diagnostico: data.diagnostico,
        texto: data.texto,
        diasReposo: data.diasReposo || 0,
      });
    } catch (err) {
      console.error(err);
      setCertificado(null);
    } finally {
      setLoadingCertificado(false);
    }
  };

  const handleSaveReceta = async () => {
    if (recetaForm.diagnostico.trim().length < 5 || recetaForm.indicaciones.trim().length < 5) {
      setModalNotice({ type: 'error', text: 'Completa diagnostico e indicaciones (minimo 5 caracteres).' });
      return;
    }

    setSavingReceta(true);
    try {
      const response = await api.turnos.guardarReceta(turno.id, {
        ...recetaForm,
        diagnostico: recetaForm.diagnostico.trim(),
        indicaciones: recetaForm.indicaciones.trim(),
      });
      setReceta(response.receta);
      setShareText(response.shareText);
      setSavedMessage('Receta/indicaciones emitidas');
      setTimeout(() => setSavedMessage(''), 2500);
      setModalNotice({ type: 'success', text: 'Receta emitida correctamente.' });
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo emitir la receta' });
    } finally {
      setSavingReceta(false);
    }
  };

  const handleCopyShareText = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setSavedMessage('Texto de receta copiado');
      setTimeout(() => setSavedMessage(''), 2500);
    } catch {
      setModalNotice({ type: 'error', text: 'No se pudo copiar al portapapeles.' });
    }
  };

  const handleSaveCertificado = async () => {
    if (certificadoForm.diagnostico.trim().length < 5 || certificadoForm.texto.trim().length < 5) {
      setModalNotice({ type: 'error', text: 'Completa diagnóstico y texto (mínimo 5 caracteres).' });
      return;
    }
    if (certificadoForm.tipo === 'REPOSO' && certificadoForm.diasReposo <= 0) {
      setModalNotice({ type: 'error', text: 'Indicá cantidad de días de reposo.' });
      return;
    }

    setSavingCertificado(true);
    try {
      const response = await api.certificados.emitir({
        turnoId: turno.id,
        tipo: certificadoForm.tipo,
        diagnostico: certificadoForm.diagnostico.trim(),
        texto: certificadoForm.texto.trim(),
        diasReposo: certificadoForm.tipo === 'REPOSO' ? certificadoForm.diasReposo : undefined,
      });
      setCertificado(response as any);
      setShowEmitirCertificado(false);
      setModalNotice({ type: 'success', text: 'Certificado emitido correctamente.' });
      if (turno.profesional && turno.paciente) {
        imprimirCertificado({
          ...response,
          turno: {
            fechaHora: turno.fechaHora,
            modalidad: turno.modalidad,
            profesional: {
              nombre: turno.profesional.nombre,
              apellido: turno.profesional.apellido,
              matricula: turno.profesional.matricula ?? null,
              fotoUrl: turno.profesional.fotoUrl ?? null,
              lugarAtencion: turno.profesional.lugarAtencion ?? null,
              telefono: turno.profesional.telefono ?? '',
              especialidad: { nombre: turno.profesional.especialidad?.nombre ?? '' },
            },
            paciente: turno.paciente
              ? {
                  nombre: turno.paciente.nombre,
                  apellido: turno.paciente.apellido,
                  email: turno.paciente.email,
                  dni: turno.paciente.dni ?? null,
                  fechaNacimiento: turno.paciente.fechaNacimiento ?? null,
                  obraSocial: turno.paciente.obraSocial ?? null,
                }
              : null,
          },
        } as CertificadoConDatos);
      }
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo emitir el certificado' });
    } finally {
      setSavingCertificado(false);
    }
  };

  const handleSaveHistoriaClinica = async () => {
    if (!turno.paciente?.id) return;

    setSavingHistoria(true);
    try {
      await api.pacientes.updateHistoriaClinica(turno.paciente.id, historiaForm);
      setHistoriaMessage('Historia clinica longitudinal actualizada');
      setTimeout(() => setHistoriaMessage(''), 3000);
      await loadHistoriaClinica(turno.paciente.id);
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo actualizar la historia clinica' });
    } finally {
      setSavingHistoria(false);
    }
  };

  const historiaFields: { key: keyof HistoriaClinicaEditableFields; label: string; placeholder: string }[] = [
    {
      key: 'antecedentesPersonales',
      label: 'Antecedentes personales',
      placeholder: 'Patologias previas, cirugias, internaciones relevantes...',
    },
    {
      key: 'antecedentesFamiliares',
      label: 'Antecedentes familiares',
      placeholder: 'Antecedentes familiares de importancia clinica...',
    },
    {
      key: 'alergias',
      label: 'Alergias',
      placeholder: 'Medicamentos, alimentos u otras alergias conocidas...',
    },
    {
      key: 'medicacionActual',
      label: 'Medicacion actual',
      placeholder: 'Tratamientos en curso, dosis y frecuencia...',
    },
    {
      key: 'habitos',
      label: 'Habitos y estilo de vida',
      placeholder: 'Sueno, actividad fisica, consumo de tabaco/alcohol, alimentacion...',
    },
    {
      key: 'diagnosticosPrevios',
      label: 'Diagnosticos previos',
      placeholder: 'Diagnosticos relevantes previos y fecha aproximada...',
    },
    {
      key: 'notasClinicasGenerales',
      label: 'Notas clinicas generales',
      placeholder: 'Observaciones longitudinales, plan general y alertas medicas...',
    },
  ];

  const loadEvolucion = async () => {
    try {
      const data = await fetch(`${API_URL}/turnos/${turno.id}/evolucion`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).then(r => r.json());
      if (data.success && data.data) { setEvolucion(data.data); setNotas(data.data.contenido || ''); }
    } catch (err) { console.error(err); }
    finally { setLoadingEvolucion(false); }
  };

  const loadArchivos = async () => {
    try {
      const res = await fetch(`${API_URL}/archivos/turno/${turno.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setArchivos(data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleGuardarNotas = async () => {
    setGuardando(true);
    try {
      await fetch(`${API_URL}/turnos/${turno.id}/evolucion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ contenido: notas }),
      });
      setSavedMessage('Notas guardadas');
      setTimeout(() => setSavedMessage(''), 2500);
      onUpdate();
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', fileType);
    try {
      const res = await fetch(`${API_URL}/archivos/${turno.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) loadArchivos();
      else setModalNotice({ type: 'error', text: data.error?.message || 'Error al subir archivo' });
    } catch (err) { console.error(err); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteArchivo = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/archivos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        loadArchivos();
        setModalNotice({ type: 'success', text: 'Archivo eliminado.' });
      }
    } catch (err) { console.error(err); }
  };

  const handleActualizarEstado = async (nuevoEstado: string) => {
    try {
      const res = await fetch(`${API_URL}/turnos/${turno.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (data.success) { onUpdate(); onClose(); }
    } catch (err) { console.error(err); }
  };

  const cargarSlots = async (fecha: string) => {
    setReprogramarHora('');
    setReprogramarSlots([]);
    if (!fecha) return;
    setCargandoSlots(true);
    try {
      const slots = await api.profesionales.getSlots(turno.profesional?.id ?? '', fecha, turno.modalidad);
      setReprogramarSlots(slots.filter((s) => s.disponible));
    } catch (err) { console.error(err); }
    finally { setCargandoSlots(false); }
  };

  const handleReprogramar = async () => {
    if (!reprogramarFecha || !reprogramarHora) {
      setModalNotice({ type: 'error', text: 'Seleccioná una fecha y un horario.' });
      return;
    }
    const fechaHoraISO = `${reprogramarFecha}T${reprogramarHora}:00`;
    setReprogramando(true);
    try {
      await api.turnos.reprogramar(turno.id, { fechaHora: fechaHoraISO });
      setModalNotice({ type: 'success', text: 'Turno reprogramado. El paciente fue notificado.' });
      setShowReprogramar(false);
      onUpdate();
      setTimeout(onClose, 1200);
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo reprogramar el turno.' });
    } finally {
      setReprogramando(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const preconsultaRiskClass = (riesgo: PreconsultaTurno['riesgo']) => {
    if (riesgo === 'URGENTE') return 'badge-red';
    if (riesgo === 'ALTO') return 'badge-yellow';
    if (riesgo === 'MEDIO') return 'badge-blue';
    if (riesgo === 'BAJO') return 'badge-green';
    return 'badge-gray';
  };

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800 text-lg">{d.appointmentDetail}</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600">
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {modalNotice && (
            <div className={`alert ${modalNotice.type === 'error' ? 'alert-error' : modalNotice.type === 'success' ? 'alert-success' : 'alert-info'}`} role="status" aria-live="polite">
              <InfoIcon size={14} className="shrink-0" />
              <span>{modalNotice.text}</span>
              <button className="ml-auto text-xs underline" onClick={() => setModalNotice(null)}>Ocultar</button>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{d.dateTime}</p>
              <p className="font-semibold text-slate-800 text-sm">
                {new Date(turno.fechaHora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-blue-600 font-bold">
                {new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{d.status}</p>
              <span className={estadoBadge(turno.estado)}>{turno.estado}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{d.patient}</p>
              <p className="font-semibold text-slate-800 text-sm">
                {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Sin cuenta'}
              </p>
              {turno.paciente?.telefono && (
                <p className="text-xs text-slate-500 mt-0.5">{turno.paciente.telefono}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{t('professional').modality}</p>
              <div className="flex items-center gap-1.5">
                {turno.modalidad === 'VIRTUAL' ? (
                  <><VideoIcon size={14} className="text-blue-500" /><span className="font-semibold text-sm text-slate-800">{t('home').virtual}</span></>
                ) : (
                  <><BuildingIcon size={14} className="text-emerald-500" /><span className="font-semibold text-sm text-slate-800">{t('home').inPerson}</span></>
                )}
              </div>
              {turno.modalidad === 'VIRTUAL' && (turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
                <button
                  onClick={() => setShowVideoCall(true)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  <VideoIcon size={12} /> {d.startVideoCall}
                </button>
              )}
            </div>
          </div>

          {/* Chat pre-turno */}
          {turno.estado !== 'CANCELADO' && turno.paciente && (
            <button
              onClick={() => { setShowChat(true); setUnreadChat(0); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors relative"
            >
              <ChatIcon size={15} />
              Chat con {turno.paciente.nombre} {turno.paciente.apellido}
              {unreadChat > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadChat} nuevo{unreadChat !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          )}

          {/* Evolución clínica */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{d.preconsulta}</h4>
            </div>
            {loadingPreconsulta ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : !preconsulta?.completadaAt ? (
              <p className="text-sm text-slate-500">El paciente aun no completo el cuestionario preconsulta.</p>
            ) : (
              <div className="space-y-2.5 text-sm">
                {/* Header row: timestamp + risk badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-slate-700 text-xs">
                    Completado {new Date(preconsulta.completadaAt).toLocaleString('es-AR')}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {preconsulta.aiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                        IA
                      </span>
                    )}
                    <span className={`badge ${preconsultaRiskClass(preconsulta.riesgo)}`}>
                      Riesgo {preconsulta.riesgo}
                    </span>
                  </div>
                </div>

                {/* AI-generated summary — highlighted box */}
                {preconsulta.resumen && (
                  <div className={`rounded-lg border p-3 ${preconsulta.aiGenerated ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-xs font-semibold mb-1 ${preconsulta.aiGenerated ? 'text-violet-700' : 'text-slate-600'}`}>
                      {preconsulta.aiGenerated ? '✦ Resumen generado por IA' : 'Resumen'}
                    </p>
                    <p className={`text-sm leading-relaxed ${preconsulta.aiGenerated ? 'text-violet-900' : 'text-slate-700'}`}>
                      {preconsulta.resumen}
                    </p>
                  </div>
                )}

                {/* Scales */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">Dolor</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{preconsulta.escalaDolor}/10</p>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${(preconsulta.escalaDolor ?? 0) >= 8 ? 'bg-red-500' : (preconsulta.escalaDolor ?? 0) >= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                             style={{ width: `${((preconsulta.escalaDolor ?? 0) / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">Ansiedad</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{preconsulta.escalaAnsiedad}/10</p>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${(preconsulta.escalaAnsiedad ?? 0) >= 8 ? 'bg-red-500' : (preconsulta.escalaAnsiedad ?? 0) >= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                             style={{ width: `${((preconsulta.escalaAnsiedad ?? 0) / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <p><span className="font-medium text-slate-700">Motivo:</span> <span className="text-slate-600">{preconsulta.motivo}</span></p>
                <p><span className="font-medium text-slate-700">Síntomas:</span> <span className="text-slate-600">{preconsulta.sintomas}</span></p>
                {preconsulta.inicioSintomas && (
                  <p><span className="font-medium text-slate-700">Inicio síntomas:</span> <span className="text-slate-600">{preconsulta.inicioSintomas}</span></p>
                )}
                {typeof preconsulta.temperatura === 'number' && (
                  <p><span className="font-medium text-slate-700">Temperatura:</span> <span className="text-slate-600">{preconsulta.temperatura.toFixed(1)} °C</span></p>
                )}
                {preconsulta.flags && preconsulta.flags.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700 mb-1">
                      {preconsulta.aiGenerated ? '✦ Alertas identificadas por IA' : 'Alertas detectadas'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {preconsulta.flags.map((flag) => (
                        <span key={flag} className="badge badge-red">{flag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {preconsulta.notasPaciente && (
                  <p className="text-slate-600"><span className="font-medium text-slate-700">Notas del paciente:</span> {preconsulta.notasPaciente}</p>
                )}
              </div>
            )}
          </div>

          {/* Evolución clínica */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{d.evolution}</h4>
              {savedMessage && (
                <span className="badge badge-green ml-auto text-xs flex items-center gap-1">
                  <CheckIcon size={10} /> {savedMessage}
                </span>
              )}
            </div>
            {loadingEvolucion ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : (
              <>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas de la consulta, diagnóstico, tratamiento indicado..."
                  className="field-input resize-none h-28 text-sm"
                />
                <button
                  onClick={handleGuardarNotas}
                  disabled={guardando}
                  className="btn btn-primary btn-sm mt-2"
                >
                  {guardando ? t('common').saving : d.saveNotes}
                </button>
              </>
            )}
          </div>

          {/* Historia clinica longitudinal */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">Historia clinica longitudinal</h4>
              {historiaMessage && (
                <span className="badge badge-green ml-auto text-xs flex items-center gap-1">
                  <CheckIcon size={10} /> {historiaMessage}
                </span>
              )}
            </div>

            {!turno.paciente ? (
              <div className="alert alert-warning text-xs">
                <InfoIcon size={14} className="shrink-0" />
                <span>Este turno no esta asociado a un paciente con cuenta. No se puede construir una historia longitudinal.</span>
              </div>
            ) : loadingHistoria ? (
              <div className="space-y-2">
                <div className="skeleton h-20 rounded-lg" />
                <div className="skeleton h-20 rounded-lg" />
                <div className="skeleton h-20 rounded-lg" />
              </div>
            ) : (
              <>
                {historiaClinica && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Consultas totales</p>
                      <p className="text-lg font-bold text-slate-800">{historiaClinica.resumen.totalConsultas}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Completadas</p>
                      <p className="text-lg font-bold text-emerald-600">{historiaClinica.resumen.consultasCompletadas}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Ultima consulta</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {historiaClinica.resumen.ultimaConsulta
                          ? new Date(historiaClinica.resumen.ultimaConsulta).toLocaleDateString('es-AR')
                          : 'Sin registros'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {historiaFields.map((field) => (
                    <div key={field.key}>
                      <label className="field-label">{field.label}</label>
                      <textarea
                        value={(historiaForm[field.key] ?? '') as string}
                        onChange={(e) => setHistoriaForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="field-input resize-none min-h-[72px] text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-slate-500">
                    Este resumen se comparte en todos los turnos del paciente para este profesional.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => exportarHistoriaClinicaPDF(historiaClinica!, {
                        nombre: turno.profesional?.nombre ?? '',
                        apellido: turno.profesional?.apellido ?? '',
                        especialidad: turno.profesional?.especialidad?.nombre,
                        matricula: turno.profesional?.matricula,
                        lugarAtencion: turno.profesional?.lugarAtencion,
                      })}
                      className="btn btn-secondary btn-sm flex items-center gap-1.5"
                      title="Exportar como PDF"
                    >
                      {/* Download icon */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Exportar PDF
                    </button>
                    <button
                      onClick={handleSaveHistoriaClinica}
                      disabled={savingHistoria}
                      className="btn btn-primary btn-sm"
                    >
                      {savingHistoria ? 'Guardando...' : 'Guardar historia'}
                    </button>
                  </div>
                </div>

                {historiaClinica && historiaClinica.timeline.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h5 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">
                      Timeline de atenciones
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {historiaClinica.timeline.slice(0, 8).map((item) => (
                        <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700">
                              {new Date(item.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' · '}
                              {new Date(item.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <span className={estadoBadge(item.estado)}>{item.estado}</span>
                          </div>
                          {item.evolucion?.contenido && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.evolucion.contenido}</p>
                          )}
                          {item.archivos.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-1">{item.archivos.length} archivo(s) adjunto(s)</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Receta e indicaciones post-consulta */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">Receta e indicaciones post-consulta</h4>
              {receta?.emitidaAt && (
                <span className="badge badge-blue ml-auto text-xs">
                  Emitida {new Date(receta.emitidaAt).toLocaleDateString('es-AR')}
                </span>
              )}
            </div>

            {loadingReceta ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="field-label">Diagnostico</label>
                  <textarea
                    value={recetaForm.diagnostico}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, diagnostico: e.target.value }))}
                    className="field-input resize-none min-h-[72px] text-sm"
                    placeholder="Diagnostico principal y diferenciales..."
                  />
                </div>
                <div>
                  <label className="field-label">Plan de tratamiento</label>
                  <textarea
                    value={recetaForm.planTratamiento || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, planTratamiento: e.target.value }))}
                    className="field-input resize-none min-h-[64px] text-sm"
                    placeholder="Plan terapeutico general..."
                  />
                </div>
                <div>
                  <label className="field-label">Medicamentos</label>
                  <textarea
                    value={recetaForm.medicamentos || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, medicamentos: e.target.value }))}
                    className="field-input resize-none min-h-[72px] text-sm"
                    placeholder="Nombre, dosis, frecuencia y duracion..."
                  />
                </div>
                <div>
                  <label className="field-label">Indicaciones (obligatorio)</label>
                  <textarea
                    value={recetaForm.indicaciones}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, indicaciones: e.target.value }))}
                    className="field-input resize-none min-h-[88px] text-sm"
                    placeholder="Indicaciones para el paciente en lenguaje claro..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Estudios solicitados</label>
                    <textarea
                      value={recetaForm.estudiosSolicitados || ''}
                      onChange={(e) => setRecetaForm((prev) => ({ ...prev, estudiosSolicitados: e.target.value }))}
                      className="field-input resize-none min-h-[64px] text-sm"
                      placeholder="Laboratorio, imagenes, etc."
                    />
                  </div>
                  <div>
                    <label className="field-label">Proximo control</label>
                    <input
                      value={recetaForm.proximoControl || ''}
                      onChange={(e) => setRecetaForm((prev) => ({ ...prev, proximoControl: e.target.value }))}
                      className="field-input"
                      placeholder="Ej: en 2 semanas"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Advertencias</label>
                  <textarea
                    value={recetaForm.advertencias || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, advertencias: e.target.value }))}
                    className="field-input resize-none min-h-[64px] text-sm"
                    placeholder="Signos de alarma para consultar urgente..."
                  />
                </div>
                <div>
                  <label className="field-label">Observaciones</label>
                  <textarea
                    value={recetaForm.observaciones || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                    className="field-input resize-none min-h-[64px] text-sm"
                    placeholder="Observaciones internas o aclaraciones adicionales..."
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleSaveReceta}
                    disabled={savingReceta}
                    className="btn btn-success btn-sm"
                  >
                    {savingReceta ? 'Emitiendo...' : 'Emitir receta/indicaciones'}
                  </button>
                  <button
                    onClick={handleCopyShareText}
                    disabled={!shareText}
                    className="btn btn-secondary btn-sm"
                  >
                    Copiar para compartir
                  </button>
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
                      className="btn btn-primary btn-sm flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descargar PDF
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Certificado médico */}
          {turno.estado === 'COMPLETADO' && (
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardIcon size={15} className="text-slate-400" />
                <h4 className="font-semibold text-slate-700 text-sm">Certificado médico</h4>
                {certificado?.emitidaAt && (
                  <span className="badge badge-blue ml-auto text-xs">
                    Emitido {new Date(certificado.emitidaAt).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>

              {loadingCertificado ? (
                <div className="skeleton h-24 rounded-lg" />
              ) : certificado ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tipo</p>
                    <p className="font-semibold text-slate-700">
                      {certificado.tipo === 'REPOSO' ? 'Reposo Médico'
                        : certificado.tipo === 'CONSULTA' ? 'Justificación de Consulta'
                        : certificado.tipo === 'APTITUD' ? 'Aptitud Física'
                        : 'Certificado Médico'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => imprimirCertificado({
                        ...certificado,
                        turno: {
                          fechaHora: turno.fechaHora,
                          modalidad: turno.modalidad,
                          profesional: {
                            nombre: turno.profesional!.nombre,
                            apellido: turno.profesional!.apellido,
                            matricula: turno.profesional!.matricula ?? null,
                            fotoUrl: turno.profesional!.fotoUrl ?? null,
                            lugarAtencion: turno.profesional!.lugarAtencion ?? null,
                            telefono: turno.profesional!.telefono ?? '',
                            especialidad: { nombre: turno.profesional!.especialidad?.nombre ?? '' },
                          },
                          paciente: turno.paciente
                            ? {
                                nombre: turno.paciente.nombre,
                                apellido: turno.paciente.apellido,
                                email: turno.paciente.email,
                                dni: turno.paciente.dni ?? null,
                                fechaNacimiento: turno.paciente.fechaNacimiento ?? null,
                                obraSocial: turno.paciente.obraSocial ?? null,
                              }
                            : null,
                        },
                      })}
                      className="btn btn-primary btn-sm flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Ver/Reimprimir PDF
                    </button>
                    <button
                      onClick={() => { setShowEmitirCertificado(true); setCertificadoForm({ tipo: certificado.tipo, diagnostico: certificado.diagnostico, texto: certificado.texto, diasReposo: certificado.diasReposo || 0 }); }}
                      className="btn btn-secondary btn-sm"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEmitirCertificado(true)}
                  className="btn btn-primary btn-sm"
                >
                  Emitir Certificado
                </button>
              )}
            </div>
          )}

          {/* Archivos */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PaperclipIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{d.files}</h4>
            </div>

            <div className="flex gap-2 mb-3">
              <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="field-select text-xs">
                <option value="LABORATORIO">Laboratorio</option>
                <option value="IMAGEN">Imagen médica</option>
                <option value="EVOLUCION">Evolución</option>
                <option value="OTRO">Otro</option>
              </select>
              <label className="flex-1">
                <input type="file" onChange={handleUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" />
                <span className={`btn btn-secondary btn-sm w-full justify-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? t('common').saving : `+ ${d.uploadFile}`}
                </span>
              </label>
            </div>

            {archivos.length > 0 ? (
              <div className="space-y-2">
                {archivos.map((archivo) => (
                  <div key={archivo.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-2xl shrink-0">
                      {archivo.mimeType.includes('pdf') ? '📄' : '🖼️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{archivo.nombreOriginal}</p>
                      <p className="text-xs text-slate-400">{archivo.tipo} · {formatFileSize(archivo.tamanoBytes)}</p>
                    </div>
                    <a href={archivo.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost p-1.5 text-blue-500 hover:text-blue-700 text-xs">Ver</a>
                    <button onClick={() => handleDeleteArchivo(archivo.id)} className="btn btn-ghost p-1.5 text-red-400 hover:text-red-600">
                      <TrashIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">{d.noFiles}</p>
            )}
          </div>
        </div>

        {/* Reprogramar panel */}
        {showReprogramar && (
          <div className="mx-6 mb-4 border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                <CalendarIcon size={15} className="text-blue-600" />
                Reprogramar turno
              </h4>
              <button onClick={() => setShowReprogramar(false)} className="text-blue-400 hover:text-blue-600">
                <XIcon size={15} />
              </button>
            </div>
            <p className="text-xs text-blue-700">
              El paciente recibirá una notificación con el nuevo horario.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Nueva fecha</label>
                <input
                  type="date"
                  value={reprogramarFecha}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setReprogramarFecha(e.target.value);
                    cargarSlots(e.target.value);
                  }}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Horario disponible</label>
                {cargandoSlots ? (
                  <div className="field-input flex items-center gap-2 text-slate-400 text-sm">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Cargando slots...
                  </div>
                ) : reprogramarSlots.length === 0 ? (
                  <div className="field-input text-slate-400 text-sm">
                    {reprogramarFecha ? 'Sin disponibilidad ese día' : 'Seleccioná una fecha'}
                  </div>
                ) : (
                  <select
                    value={reprogramarHora}
                    onChange={(e) => setReprogramarHora(e.target.value)}
                    className="field-select"
                  >
                    <option value="">Seleccionar horario</option>
                    {reprogramarSlots.map((s) => (
                      <option key={s.hora} value={s.hora}>{s.hora}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowReprogramar(false)} className="btn btn-secondary btn-sm">
                Cancelar
              </button>
              <button
                onClick={handleReprogramar}
                disabled={reprogramando || !reprogramarFecha || !reprogramarHora}
                className="btn btn-primary btn-sm"
              >
                {reprogramando ? 'Reprogramando...' : 'Confirmar reprogramación'}
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3 bg-slate-50 rounded-b-2xl">
          {(turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
            <button
              onClick={() => { setShowReprogramar((v) => !v); setModalNotice(null); }}
              className="btn btn-secondary flex-1"
            >
              <CalendarIcon size={15} /> Reprogramar
            </button>
          )}
          {turno.estado !== 'COMPLETADO' && (
            <button onClick={() => handleActualizarEstado('COMPLETADO')} className="btn btn-success flex-1">
              <CheckIcon size={15} /> {d.complete}
            </button>
          )}
          {turno.estado !== 'CANCELADO' && (
            <button onClick={() => handleActualizarEstado('CANCELADO')} className="btn btn-danger flex-1">
              <XIcon size={15} /> {d.cancel}
            </button>
          )}
        </div>
      </div>
    </div>

    {showVideoCall && (
      <VideoCallModal
        turnoId={turno.id}
        profesionalNombre={turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Paciente'}
        fechaHora={turno.fechaHora}
        onClose={() => setShowVideoCall(false)}
      />
    )}

    {showChat && authUser && turno.paciente && (
      <ChatModal
        turnoId={turno.id}
        myUserId={authUser.id}
        otherName={`${turno.paciente.nombre} ${turno.paciente.apellido}`}
        onClose={() => setShowChat(false)}
      />
    )}

    {showEmitirCertificado && (
      <EmitirCertificadoModal
        form={certificadoForm}
        setForm={setCertificadoForm}
        onSave={handleSaveCertificado}
        loading={savingCertificado}
        onClose={() => setShowEmitirCertificado(false)}
      />
    )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGOS VIEW
══════════════════════════════════════════════════════════════ */
function PagosView() {
  const [data, setData] = useState<PagosDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [desde, setDesde] = useState(`${currentYear}-${currentMonth}-01`);
  const [hasta, setHasta] = useState(`${currentYear}-${currentMonth}-${new Date(currentYear, new Date().getMonth() + 1, 0).getDate()}`);
  const [estado, setEstado] = useState('TODOS');
  const [applied, setApplied] = useState({ desde: '', hasta: '', estado: 'TODOS' });

  const load = async (p = 1, filters = applied) => {
    setLoading(true);
    try {
      const res = await api.profesional.getPagos({
        desde: filters.desde || undefined,
        hasta: filters.hasta || undefined,
        estado: filters.estado !== 'TODOS' ? filters.estado : undefined,
        page: p,
        limit: 15,
      });
      setData(res);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, { desde: '', hasta: '', estado: 'TODOS' }); }, []);

  const applyFilters = () => {
    const f = { desde, hasta, estado };
    setApplied(f);
    load(1, f);
  };

  const clearFilters = () => {
    setDesde(`${currentYear}-${currentMonth}-01`);
    setHasta(`${currentYear}-${currentMonth}-${new Date(currentYear, new Date().getMonth() + 1, 0).getDate()}`);
    setEstado('TODOS');
    const f = { desde: '', hasta: '', estado: 'TODOS' };
    setApplied(f);
    load(1, f);
  };

  const [exporting, setExporting] = useState(false);
  const exportarCSV = async () => {
    setExporting(true);
    try {
      const res = await api.profesional.getPagos({
        desde: applied.desde || undefined,
        hasta: applied.hasta || undefined,
        estado: applied.estado !== 'TODOS' ? applied.estado : undefined,
        page: 1,
        limit: 1000,
      });
      const rows = [
        ['Fecha pago', 'Fecha turno', 'Paciente', 'Email', 'Modalidad', 'Monto bruto', 'Comisión %', 'Monto neto', 'Estado', 'ID pago MP'],
        ...res.pagos.map(p => [
          new Date(p.createdAt).toLocaleDateString('es-AR'),
          new Date(p.turno.fechaHora).toLocaleDateString('es-AR') + ' ' + new Date(p.turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          p.turno.paciente ? `${p.turno.paciente.nombre} ${p.turno.paciente.apellido}` : 'Sin cuenta',
          p.turno.paciente?.email ?? '',
          p.turno.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial',
          p.monto.toFixed(2),
          p.comisionPorcentaje.toFixed(1),
          p.montoNeto.toFixed(2),
          p.estado,
          p.mpPaymentId ?? '',
        ]),
      ];
      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos-medisync-${applied.desde || 'todos'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const estadoBadgeClass = (e: string) => {
    if (e === 'APROBADO') return 'badge badge-green';
    if (e === 'PENDIENTE') return 'badge badge-yellow';
    if (e === 'RECHAZADO') return 'badge badge-red';
    return 'badge badge-gray';
  };

  const estadoLabel = (e: string) => {
    const map: Record<string, string> = { APROBADO: 'Aprobado', PENDIENTE: 'Pendiente', RECHAZADO: 'Rechazado', REEMBOLSADO: 'Reembolsado' };
    return map[e] ?? e;
  };

  const modalidadIcon = (m: string) => m === 'VIRTUAL' ? '💻' : '🏥';

  // Bar chart helpers
  const maxBruto = data ? Math.max(...data.mesesResumen.map(m => m.bruto), 1) : 1;

  return (
    <div className="space-y-6">

      {/* ── Summary cards ──────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Facturado (bruto)', value: fmt(data.totales.bruto), sub: 'pagos aprobados', color: 'emerald' },
            { label: 'Neto recibido', value: fmt(data.totales.neto), sub: '-10% comisión', color: 'blue' },
            { label: 'Pendiente de cobro', value: fmt(data.totales.pendiente), sub: `${data.totales.pendientes} pago${data.totales.pendientes !== 1 ? 's' : ''}`, color: 'amber' },
            { label: 'Transacciones', value: String(data.totales.aprobados + data.totales.pendientes), sub: `${data.totales.aprobados} aprob.`, color: 'purple' },
          ].map(card => (
            <div key={card.label} className="stat-card">
              <p className="stat-label">{card.label}</p>
              <p className={`text-xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>{card.value}</p>
              <p className="stat-desc">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Monthly bar chart ───────────────────────────── */}
      {data && data.mesesResumen.some(m => m.bruto > 0) && (
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Facturación mensual — últimos 12 meses
          </p>
          <div className="flex items-end gap-1.5 h-28">
            {data.mesesResumen.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                  <p className="font-semibold">{m.mes}</p>
                  <p>{fmt(m.bruto)} bruto</p>
                  <p className="text-slate-300">{fmt(m.neto)} neto</p>
                  <p className="text-slate-400">{m.cantidad} pago{m.cantidad !== 1 ? 's' : ''}</p>
                </div>
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${m.bruto > 0 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-200 dark:bg-slate-600'}`}
                  style={{ height: `${Math.max(4, (m.bruto / maxBruto) * 96)}px` }}
                />
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">{m.mes}</span>
              </div>
            ))}
          </div>
          {/* Y-axis reference */}
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>$0</span>
            <span>{fmt(maxBruto / 2)}</span>
            <span>{fmt(maxBruto)}</span>
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
        <div>
          <label className="field-label text-xs">Desde</label>
          <input type="date" className="field-input mt-1 text-sm" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="field-label text-xs">Hasta</label>
          <input type="date" className="field-input mt-1 text-sm" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <div>
          <label className="field-label text-xs">Estado</label>
          <select className="field-select mt-1 text-sm" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="TODOS">Todos</option>
            <option value="APROBADO">Aprobado</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap">
          <button onClick={applyFilters} className="btn btn-primary text-sm">Filtrar</button>
          <button onClick={clearFilters} className="btn btn-ghost text-sm text-slate-500">Limpiar</button>
          <button
            onClick={exportarCSV}
            disabled={exporting || !data || data.pagos.length === 0}
            className="btn btn-ghost text-sm text-emerald-700 border border-emerald-200 hover:bg-emerald-50 disabled:opacity-40 flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Cargando pagos...
        </div>
      ) : !data || data.pagos.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">💳</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No hay pagos en el período seleccionado.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  {['Fecha', 'Paciente', 'Modalidad', 'Turno', 'Monto bruto', 'Neto', 'Estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.pagos.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {p.turno.paciente
                        ? <><p className="font-medium text-slate-800 dark:text-slate-100">{p.turno.paciente.nombre} {p.turno.paciente.apellido}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{p.turno.paciente.email}</p></>
                        : <span className="text-slate-400">Paciente sin cuenta</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      <span>{modalidadIcon(p.turno.modalidad)}</span>
                      <span className="ml-1">{p.turno.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(p.turno.fechaHora).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      {' '}
                      {new Date(p.turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {fmt(p.monto)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                      {p.estado === 'APROBADO' ? fmt(p.montoNeto) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={estadoBadgeClass(p.estado)}>{estadoLabel(p.estado)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {data.pagos.map(p => (
              <div key={p.id} className="card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                      {p.turno.paciente ? `${p.turno.paciente.nombre} ${p.turno.paciente.apellido}` : 'Paciente sin cuenta'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.turno.fechaHora).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      {' · '}
                      {modalidadIcon(p.turno.modalidad)} {p.turno.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                    </p>
                  </div>
                  <span className={estadoBadgeClass(p.estado)}>{estadoLabel(p.estado)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">Bruto</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{fmt(p.monto)}</p>
                  </div>
                  {p.estado === 'APROBADO' && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Neto</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.montoNeto)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {((page - 1) * 15) + 1}–{Math.min(page * 15, data.pagination.total)} de {data.pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => load(page - 1)}
                  className="btn btn-ghost text-sm disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  disabled={page >= data.pagination.pages}
                  onClick={() => load(page + 1)}
                  className="btn btn-ghost text-sm disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   RESEÑAS VIEW
══════════════════════════════════════════════════════════════ */
function ResenasView() {
  const [data, setData] = useState<{ resenas: Resena[]; stats: ResenasStats; pagination: { page: number; totalPages: number; total: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  // Per-review state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [respuestaText, setRespuestaText] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async (p = 1, rating?: number) => {
    setLoading(true);
    try {
      const res = await api.resenas.getMisResenas({ page: p, limit: 10, rating });
      setData(res as any);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, ratingFilter); }, []);

  const applyFilter = (r?: number) => {
    setRatingFilter(r);
    load(1, r);
  };

  const startEdit = (resena: Resena) => {
    setEditingId(resena.id);
    setRespuestaText(resena.respuesta ?? '');
    setNotice(null);
  };

  const cancelEdit = () => { setEditingId(null); setRespuestaText(''); };

  const handleGuardarRespuesta = async (id: string) => {
    if (respuestaText.trim().length < 5) {
      setNotice({ type: 'error', text: 'La respuesta debe tener al menos 5 caracteres.' });
      return;
    }
    setSaving(true);
    try {
      await api.resenas.responder(id, respuestaText.trim());
      setNotice({ type: 'success', text: 'Respuesta publicada.' });
      setEditingId(null);
      load(page, ratingFilter);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar.' });
    } finally { setSaving(false); }
  };

  const handleBorrarRespuesta = async (id: string) => {
    setSaving(true);
    try {
      await api.resenas.borrarRespuesta(id);
      setNotice({ type: 'success', text: 'Respuesta eliminada.' });
      load(page, ratingFilter);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Error.' });
    } finally { setSaving(false); }
  };

  const starColor = (r: number) => r >= 4 ? 'text-amber-500' : r === 3 ? 'text-blue-500' : 'text-red-500';

  return (
    <div className="space-y-5">
      {notice && (
        <div className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
          <InfoIcon size={14} className="shrink-0" />
          <span>{notice.text}</span>
          <button className="ml-auto text-xs underline" onClick={() => setNotice(null)}>Ocultar</button>
        </div>
      )}

      {/* ── Stats header ────────────────────────────────── */}
      {data?.stats && data.stats.total > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Promedio grande */}
            <div className="text-center shrink-0">
              <p className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {data.stats.promedio ?? '—'}
              </p>
              <StarRating value={data.stats.promedio ?? 0} size={16} />
              <p className="text-xs text-slate-400 mt-1">{data.stats.total} reseña{data.stats.total !== 1 ? 's' : ''}</p>
            </div>

            {/* Distribución barras */}
            {data.stats.distribucion && (
              <div className="flex-1 space-y-1.5 w-full">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = data.stats.distribucion?.[star] ?? 0;
                  const pct = data.stats.total > 0 ? (count / data.stats.total) * 100 : 0;
                  return (
                    <button
                      key={star}
                      onClick={() => applyFilter(ratingFilter === star ? undefined : star)}
                      className={`flex items-center gap-2 w-full group ${ratingFilter === star ? 'opacity-100' : 'hover:opacity-80'}`}
                    >
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-4 text-right shrink-0">{star}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${ratingFilter === star ? 'bg-amber-500' : 'bg-amber-400 dark:bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-6 text-right shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active filter badge */}
          {ratingFilter && (
            <div className="mt-3 flex items-center gap-2">
              <span className="badge badge-yellow text-xs">Filtrando: {ratingFilter}★</span>
              <button onClick={() => applyFilter(undefined)} className="text-xs text-slate-400 hover:text-red-500 underline">
                Quitar filtro
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Review list ─────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : !data || data.stats.total === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mx-auto mb-3 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          <p className="text-sm font-medium">Todavía no tenés reseñas</p>
          <p className="text-xs mt-1">Cuando un paciente califique un turno completado, aparecerá aquí.</p>
        </div>
      ) : data.resenas.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">
          No hay reseñas de {ratingFilter}★ para mostrar.
        </div>
      ) : (
        <div className="space-y-4">
          {data.resenas.map((resena) => (
            <div key={resena.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {/* Review header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden">
                      {resena.paciente?.fotoUrl
                        ? <img src={resena.paciente.fotoUrl} alt="" className="w-full h-full object-cover" />
                        : `${resena.paciente?.nombre?.[0] ?? '?'}${resena.paciente?.apellido?.[0] ?? ''}`}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {resena.paciente ? `${resena.paciente.nombre} ${resena.paciente.apellido}` : 'Paciente'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(resena.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {resena.turno && ` · ${new Date(resena.turno.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < resena.rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                    <span className={`ml-1 text-sm font-bold ${starColor(resena.rating)}`}>{resena.rating}/5</span>
                  </div>
                </div>

                {/* Comment */}
                {resena.comentario && (
                  <p className="mt-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    "{resena.comentario}"
                  </p>
                )}
              </div>

              {/* Response section */}
              <div className="border-t border-slate-100 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3">
                {editingId === resena.id ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Tu respuesta pública</p>
                    <textarea
                      value={respuestaText}
                      onChange={(e) => setRespuestaText(e.target.value)}
                      placeholder="Escribí tu respuesta... (visible para todos los pacientes)"
                      className="field-input resize-none min-h-[80px] text-sm"
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{respuestaText.length}/2000</span>
                      <div className="flex gap-2">
                        <button onClick={cancelEdit} className="btn btn-secondary btn-sm">Cancelar</button>
                        <button
                          onClick={() => handleGuardarRespuesta(resena.id)}
                          disabled={saving}
                          className="btn btn-primary btn-sm"
                        >
                          {saving ? 'Guardando...' : 'Publicar respuesta'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : resena.respuesta ? (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Tu respuesta
                        {resena.respondidaAt && (
                          <span className="text-slate-400 font-normal">· {new Date(resena.respondidaAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(resena)} className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => handleBorrarRespuesta(resena.id)} disabled={saving} className="text-xs text-red-400 hover:text-red-600 hover:underline">Eliminar</button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{resena.respuesta}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(resena)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Responder esta reseña
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <button
            disabled={page === 1}
            onClick={() => { const p = page - 1; setPage(p); load(p, ratingFilter); }}
            className="btn btn-secondary btn-sm disabled:opacity-40"
          >← Anteriores</button>
          <span className="text-sm text-slate-500">{page} / {data.pagination.totalPages}</span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p, ratingFilter); }}
            className="btn btn-secondary btn-sm disabled:opacity-40"
          >Siguientes →</button>
        </div>
      )}
    </div>
  );
}

/* ── Embed Widget Section ────────────────────────────────── */
type EmbedPlatform = 'html' | 'wordpress' | 'wix' | 'webflow';

function EmbedWidgetSection({ profesionalId }: { profesionalId: string }) {
  const [copied, setCopied]         = useState<string | null>(null);
  const [preview, setPreview]       = useState(false);
  const [platform, setPlatform]     = useState<EmbedPlatform>('html');
  const [iframeHeight, setIframeHeight] = useState(600);

  const origin     = typeof window !== 'undefined' ? window.location.origin : 'https://medisync-web.medisync.workers.dev';
  const widgetUrl  = `${origin}/widget/${profesionalId}`;

  const iframeSnippet = `<iframe
  src="${widgetUrl}"
  width="460"
  height="${iframeHeight}"
  frameborder="0"
  style="border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,.08);"
  title="Reservar turno"
></iframe>`;

  const PLATFORM_SNIPPETS: Record<EmbedPlatform, { label: string; code: string; instructions: string[] }> = {
    html: {
      label: 'HTML',
      code: iframeSnippet,
      instructions: [
        'Pegá el código en cualquier archivo .html donde quieras mostrar el widget.',
        'Podés cambiar width y height según el espacio disponible.',
        'Funciona en cualquier servidor estático (GitHub Pages, Netlify, etc.).',
      ],
    },
    wordpress: {
      label: 'WordPress',
      code: iframeSnippet,
      instructions: [
        'En el editor de bloques, agregá un bloque "HTML personalizado".',
        'Pegá el código dentro del bloque y guardá.',
        'También funciona con Elementor o Divi usando el widget de HTML.',
      ],
    },
    wix: {
      label: 'Wix',
      code: widgetUrl,
      instructions: [
        'En el editor de Wix, hacé clic en "+ Agregar" → "Más" → "HTML iframe".',
        'Hacé clic en "Ingresar código" y pegá este snippet:',
        `<iframe src="${widgetUrl}" width="460" height="${iframeHeight}" frameborder="0" style="border-radius:16px"></iframe>`,
        'O usá el modo "URL" y pegá la URL directa del widget.',
      ],
    },
    webflow: {
      label: 'Webflow',
      code: iframeSnippet,
      instructions: [
        'En el Designer, arrastrá un componente "Embed" desde el panel izquierdo.',
        'Pegá el código HTML y hacé clic en "Save & Close".',
        'Publicá tu proyecto para que los cambios se vean en vivo.',
      ],
    },
  };

  const current = PLATFORM_SNIPPETS[platform];

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  return (
    <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            Agenda embebible para tu sitio web
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Tus pacientes reservan turno sin salir de tu sitio.
          </p>
        </div>
        <button
          onClick={() => setPreview(p => !p)}
          className="btn btn-secondary btn-sm shrink-0"
        >
          {preview ? 'Ocultar preview' : 'Ver preview'}
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Direct link + copy URL */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800">URL del widget</p>
            <p className="text-xs text-blue-700 truncate mt-0.5">{widgetUrl}</p>
          </div>
          <button
            onClick={() => copyText(widgetUrl, 'url')}
            className={`btn btn-sm shrink-0 transition-all ${copied === 'url' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'btn-secondary'}`}
          >
            {copied === 'url' ? '✓ Copiada' : 'Copiar URL'}
          </button>
          <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm shrink-0">
            Abrir
          </a>
        </div>

        {/* Height customizer */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Alto del iframe</label>
          <input
            type="range" min={480} max={800} step={20}
            value={iframeHeight}
            onChange={e => setIframeHeight(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-xs font-mono text-slate-500 w-12 text-right">{iframeHeight}px</span>
        </div>

        {/* Platform tabs */}
        <div>
          <div className="flex gap-1 mb-3 bg-slate-100 rounded-xl p-1">
            {(Object.keys(PLATFORM_SNIPPETS) as EmbedPlatform[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  platform === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {PLATFORM_SNIPPETS[p].label}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all select-all">
{current.code}
            </pre>
            <button
              onClick={() => copyText(current.code, 'snippet')}
              className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                copied === 'snippet'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {copied === 'snippet' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>

          {/* Platform-specific instructions */}
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1.5">
              Instrucciones para {current.label}
            </p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              {current.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 text-xs text-center text-slate-500">
          {[
            { icon: '🔄', text: 'Sincroniza con tu agenda' },
            { icon: '📱', text: 'Responsive en móvil' },
            { icon: '🔒', text: 'Sin registro del paciente' },
          ].map(({ icon, text }) => (
            <div key={text} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="text-lg mb-1">{icon}</div>
              <p>{text}</p>
            </div>
          ))}
        </div>

        {/* Inline preview */}
        {preview && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview en vivo</p>
            <div className="flex justify-center">
              <iframe
                src={widgetUrl}
                width={460}
                height={iframeHeight}
                style={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,.08)', maxWidth: '100%' }}
                title="Preview del widget"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PLAN VIEW
══════════════════════════════════════════════════════════════ */
function PlanView({
  suscripcion,
  loading,
  onIniciarSuscripcion,
  onCancelarSuscripcion,
  redirecting,
}: {
  suscripcion: SuscripcionEstado | null;
  loading: boolean;
  onIniciarSuscripcion: () => void;
  onCancelarSuscripcion: () => void;
  redirecting: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!suscripcion) {
    return <div className="text-center text-slate-600">Cargando...</div>;
  }

  const isPro = suscripcion.plan === 'PRO';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Plan Banner */}
      <div className={`rounded-xl p-6 border-2 ${isPro ? 'bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200' : 'bg-slate-100 border-slate-300'}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-sm font-bold uppercase tracking-wider ${isPro ? 'text-blue-700' : 'text-slate-700'}`}>
              Plan actual
            </div>
            <h2 className={`text-3xl font-bold mt-2 ${isPro ? 'text-blue-900' : 'text-slate-900'}`}>
              {isPro ? 'Pro' : 'Free'}
            </h2>
            <p className={`text-sm mt-3 ${isPro ? 'text-blue-700' : 'text-slate-600'}`}>
              {isPro ? 'Turnos ilimitados + estadísticas avanzadas' : 'Hasta 20 turnos/mes'}
            </p>
          </div>
          <div className={`text-5xl font-bold opacity-20 ${isPro ? 'text-blue-500' : 'text-slate-400'}`}>
            {isPro ? '∞' : '20'}
          </div>
        </div>
      </div>

      {/* Turno Counter (for FREE) */}
      {!isPro && (
        <div className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-700">Turnos este mes</span>
            <span className="text-sm text-slate-500">{suscripcion.turnosEsteMes} / {suscripcion.limiteTurnos}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(suscripcion.turnosEsteMes / suscripcion.limiteTurnos) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Te quedan {suscripcion.turnosRestantes} turno{suscripcion.turnosRestantes !== 1 ? 's' : ''} este mes
          </p>
        </div>
      )}

      {/* Billing Info */}
      {isPro && suscripcion.planVenceAt && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
          <div className="text-sm font-medium text-emerald-900">Próximo cobro</div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {new Date(suscripcion.planVenceAt).toLocaleDateString('es-AR')}
          </div>
          <p className="text-xs text-emerald-700 mt-2">$4.990 ARS / mes</p>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3 flex-col sm:flex-row">
        {!isPro && (
          <button
            onClick={onIniciarSuscripcion}
            disabled={redirecting}
            className="btn btn-primary flex-1"
          >
            {redirecting ? 'Redirigiendo...' : 'Actualizar a Pro — $4.990/mes'}
          </button>
        )}

        {isPro && (
          <button
            onClick={onCancelarSuscripcion}
            disabled={redirecting}
            className="btn btn-secondary flex-1"
          >
            Cancelar suscripción
          </button>
        )}
      </div>

      {/* Features comparison */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Comparar planes</h3>
        <div className="space-y-3">
          {[
            { feature: 'Turnos', free: 'Hasta 20/mes', pro: 'Ilimitados' },
            { feature: 'Estadísticas', free: '❌', pro: '✅' },
            { feature: 'Cupones de descuento', free: '✅', pro: '✅' },
            { feature: 'Pagos online', free: '✅', pro: '✅' },
            { feature: 'Historia clínica', free: '✅', pro: '✅' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm font-medium text-slate-700">{row.feature}</span>
              <div className="flex gap-4 text-sm">
                <span className={isPro ? 'text-slate-500' : 'font-bold text-blue-600'}>{row.free}</span>
                <span className={isPro ? 'font-bold text-blue-600' : 'text-slate-500'}>{row.pro}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradePrompt({ feature, onViewPlans }: { feature: string; onViewPlans: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <p className="text-lg font-medium text-slate-900">Las {feature} están disponibles en el plan Pro</p>
      <p className="text-sm text-slate-600 mt-2">Suscríbete a Pro para desbloquear todas las funcionalidades</p>
      <button onClick={onViewPlans} className="btn btn-primary mt-6">
        Ver planes
      </button>
    </div>
  );
}
