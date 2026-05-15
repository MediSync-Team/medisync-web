'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, Turno, Disponibilidad, BloqueoDisponibilidad, Cupon, TipoDescuento, SuscripcionEstado } from '../lib/api';
import { getLocale } from '../lib/date';
import StatsPanel from '../components/StatsPanel';
import ProfileModal from '../components/ProfileModal';
import OnboardingTour from '../components/OnboardingTour';
import ThemeLangToggle from '../components/ThemeLangToggle';
import Spinner from '../components/Spinner';
import { useLang } from '../lib/i18n/context';
import { useTranslateSpecialty } from '../lib/i18n/use-translate-specialty';
import { NotificationBell } from '../components/NotificationBell';
import ProfesionalOnboardingWizard from '../components/ProfesionalOnboardingWizard';
import {
  MediSyncLogo, CalendarIcon, ClockIcon, UserIcon, LogOutIcon,
  BellIcon, ChartIcon, ClipboardIcon, StarIcon, CheckIcon, XIcon, InfoIcon,
} from '../components/icons';

import CalendarioView from './components/CalendarioView';
import DisponibilidadView from './components/DisponibilidadView';
import PagosView from './components/PagosView';
import ResenasView from './components/ResenasView';
import CuponesView from './components/CuponesView';
import PlanView from './components/PlanView';
import AuditoriaView from './components/AuditoriaView';
import EmbedWidgetSection from './components/EmbedWidgetSection';
import TurnoModal from './components/TurnoModal';
import UpgradePrompt from './components/UpgradePrompt';

interface StatsData {
  turnosPorMes: any[];
  ingresosPorMes: any[];
  resumen: { totalTurnos: number; totalPacientes: number };
}

export default function ProfesionalDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, lang } = useLang();
  const d = t('dashboard');
  const profTourSteps = [
    { selector: '[data-onboarding="stat-cards"]', title: d.tour.activitySummaryTitle, description: d.tour.activitySummaryDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="tab-calendario"]', title: d.tour.dailyAgendaTitle, description: d.tour.dailyAgendaDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="tab-disponibilidad"]', title: d.tour.scheduleTitle, description: d.tour.scheduleDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="tab-stats"]', title: d.tour.statsTitle, description: d.tour.statsDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="profile-btn"]', title: d.tour.profileTitle, description: d.tour.profileDesc, position: 'bottom' as const },
  ];
  const translateSpecialty = useTranslateSpecialty();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendario' | 'disponibilidad' | 'stats' | 'pagos' | 'resenas' | 'cupones' | 'plan' | 'auditoria'>('calendario');
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
  const loadedMonths = useRef<Set<string>>(new Set());

  useEffect(() => { if (!selectedDate) setSelectedDate(new Date()); }, [selectedDate]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.rol === 'ADMIN') { router.push('/dashboard/admin'); return; }
    if (!authLoading && user?.rol === 'CLINICA') { router.push('/dashboard/clinica'); return; }
    if (!authLoading && user?.paciente) { router.push('/dashboard/paciente'); return; }
    if (!authLoading && user?.rol === 'PROFESIONAL' && !user.profesional) {
      setShowOnboarding(true);
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    if (activeTab === 'cupones') loadCupones();
    if (activeTab === 'plan') loadSuscripcion();
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
      const now = new Date();
      [-1, 0, 1].forEach(delta => {
        const d = new Date(now.getFullYear(), now.getMonth() + delta, 1);
        loadedMonths.current.add(`${d.getFullYear()}-${d.getMonth()}`);
      });
      const disps = dispData.disponibilidades || [];
      setDisponibilidades(disps);
      if (checkOnboarding) {
        const done = localStorage.getItem(`medisync_onboarding_done_${user.id}`);
        if (!done && disps.length === 0) setShowOnboarding(true);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFetchMonth = async (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (loadedMonths.current.has(key) || !user?.profesional) return;
    loadedMonths.current.add(key);
    try {
      const desde = new Date(year, month, 1).toISOString();
      const hasta = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const data = await api.turnos.getByProfesional(user.profesional.id, { desde, hasta, limit: '200' });
      setTurnos(prev => {
        const ids = new Set(prev.map(t => t.id));
        const fresh = data.turnos.filter(t => !ids.has(t.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    } catch {
      loadedMonths.current.delete(key);
    }
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
      setInlineFeedback({ type: 'success', text: d.addScheduleSuccess });
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : d.addScheduleError });
    }
  };

  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const handleEliminarDisponibilidad = async (id: string) => {
    if (!user?.profesional || eliminandoId === id) return;
    setEliminandoId(id);
    try {
      await api.profesionales.eliminarDisponibilidad(user.profesional.id, id);
      loadData();
      setInlineFeedback({ type: 'success', text: d.deleteScheduleSuccess });
    } catch (err) {
      setEliminandoId(null);
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : d.deleteScheduleError });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} className="text-blue-600" />
          <p className="text-slate-500 text-sm">{d.loadingPanel}</p>
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
      setInlineFeedback({ type: 'error', text: d.loadCouponsError });
    } finally {
      setLoadingCupones(false);
    }
  };

  const handleCrearCupon = async () => {
    if (!nuevosCuponForm.codigo.trim() || !nuevosCuponForm.valor) {
      setInlineFeedback({ type: 'error', text: d.couponCodeRequired });
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
      setInlineFeedback({ type: 'success', text: d.couponCreated });
      setTimeout(() => setInlineFeedback(null), 3000);
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : d.couponCreateError });
    } finally {
      setSavingCupon(false);
    }
  };

  const handleToggleCupon = async (id: string, activo: boolean) => {
    try {
      const res = await api.cupones.actualizar(id, { activo: !activo });
      setCupones(cupones.map(c => c.id === id ? res : c));
    } catch (err) {
      setInlineFeedback({ type: 'error', text: d.couponUpdateError });
    }
  };

  const handleEliminarCupon = async (id: string) => {
    try {
      await api.cupones.eliminar(id);
      setCupones(cupones.filter(c => c.id !== id));
      setInlineFeedback({ type: 'success', text: d.couponDeleted });
      setTimeout(() => setInlineFeedback(null), 2000);
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : d.couponDeleteError });
    }
  };

  const loadSuscripcion = async () => {
    setLoadingSuscripcion(true);
    try {
      const data = await api.suscripciones.estado();
      setSuscripcion(data);
    } catch (err) {
      console.error(err);
      setInlineFeedback({ type: 'error', text: d.loadPlanError });
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
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : d.startPlanError });
      setRedirectingToMP(false);
    }
  };

  const handleCancelarSuscripcion = async () => {
    if (!confirm(d.cancelPlanConfirm)) return;
    try {
      await api.suscripciones.cancelar();
      setInlineFeedback({ type: 'success', text: d.cancelPlanSuccess });
      await loadSuscripcion();
    } catch (err) {
      setInlineFeedback({ type: 'error', text: err instanceof Error ? err.message : d.cancelPlanError });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {showOnboarding && (
        <ProfesionalOnboardingWizard
          profesionalId={user.profesional.id}
          userId={user.id}
          nombre={user.profesional.nombre}
          onComplete={() => { setShowOnboarding(false); loadData(); }}
        />
      )}

      {recordatorios.length > 0 && (
        <div className="bg-blue-600 text-white">
          <div className="page-container py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <BellIcon size={15} className="shrink-0" />
              <span className="font-medium">
                {recordatorios.length} {recordatorios.length > 1 ? d.reminder.upcomingPlural : d.reminder.upcoming} {d.reminder.next24h}
              </span>
              <button
                onClick={() => setShowRecordatorios(!showRecordatorios)}
                className="underline underline-offset-2 text-blue-100 hover:text-white text-xs"
              >
                {showRecordatorios ? d.reminder.hide : d.reminder.detail}
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
                      {new Date(rec.fechaHora).toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {rec.paciente?.nombre} {rec.paciente?.apellido}
                    </span>
                    {rec.modalidad === 'VIRTUAL' && (
                      <span className="badge badge-blue text-[10px]">{d.virtual}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                title={d.shareProfileTitle}
                className="btn btn-ghost text-slate-600 dark:text-slate-300 text-sm relative"
              >
                {profileCopied ? (
                  <>
                    <CheckIcon size={15} className="text-emerald-500" />
                    <span className="hidden sm:inline text-emerald-600 text-xs">{d.copied}</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span className="hidden sm:inline">{d.shareProfile}</span>
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
                <span className="hidden sm:inline">{d.logout}</span>
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
            <button className="ml-auto text-xs underline" onClick={() => setInlineFeedback(null)}>{d.hide}</button>
          </div>
        )}

        {loading ? (
          <>
            <div data-onboarding="stat-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="stat-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton w-8 h-8 rounded-lg" />
                  </div>
                  <div className="skeleton h-7 w-16 rounded mb-2" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="tab-nav px-1 pt-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="skeleton h-9 w-24 rounded mx-1" />
                ))}
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-5/6 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div data-onboarding="stat-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <p className="stat-label">{d.appointments} - {d.today}</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CalendarIcon size={15} className="text-blue-600" />
                  </div>
                </div>
                <p className="stat-value text-blue-600">{hoyTurnos.length}</p>
                <p className="stat-desc">
                  {hoyTurnos.filter(t => t.estado === 'CONFIRMADO').length} {d.confirmed}
                </p>
              </div>

              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <p className="stat-label">{d.appointments} - {d.thisMonth}</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ChartIcon size={15} className="text-emerald-600" />
                  </div>
                </div>
                <p className="stat-value text-emerald-600">{turnosMes.length}</p>
                <p className="stat-desc">{mesActual.toLocaleString(getLocale(lang), { month: 'long' })}</p>
              </div>

              <div className="stat-card">
                <div className="flex items-start justify-between">
                  <p className="stat-label">{d.specialtyLabel}</p>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <ClipboardIcon size={15} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-800 mt-1 leading-tight">
                  {translateSpecialty(user.profesional.especialidad?.nombre || '')}
                </p>
                <p className="stat-desc">{d.title}</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="tab-nav px-1 pt-1">
                {([
                  { id: 'calendario', label: d.agenda, icon: <CalendarIcon size={14} />, onboarding: 'tab-calendario' },
                  { id: 'disponibilidad', label: d.availability, icon: <ClockIcon size={14} />, onboarding: 'tab-disponibilidad' },
                  { id: 'stats', label: d.stats, icon: <ChartIcon size={14} />, onboarding: 'tab-stats' },
                  { id: 'pagos', label: d.payments, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>, onboarding: 'tab-pagos' },
                  { id: 'resenas', label: d.reviews, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>, onboarding: 'tab-resenas' },
                  { id: 'cupones', label: d.coupons, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>, onboarding: 'tab-cupones' },
                  { id: 'plan', label: d.planCurrent ?? 'Plan', icon: <StarIcon size={14} />, onboarding: 'tab-plan' },
                  { id: 'auditoria', label: d.history ?? (lang === 'es' ? 'Historial' : 'History'), icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, onboarding: 'tab-auditoria' },
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
                    turnos={turnos}
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
                    onFetchMonth={handleFetchMonth}
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
                      eliminandoId={eliminandoId}
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
                        <Spinner size={20} />
                        {t('common').loading}
                      </div>
                    ) : (
                      <StatsPanel stats={stats} />
                    )}
                  </div>
                )}
                {activeTab === 'pagos' && <PagosView />}
                {activeTab === 'resenas' && <ResenasView />}
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
                {activeTab === 'auditoria' && (
                  <AuditoriaView profesionalId={user.profesional!.id} />
                )}
                {activeTab === 'stats' && suscripcion?.plan === 'FREE' && (
                  <UpgradePrompt feature={d.stats} onViewPlans={() => setActiveTab('plan')} />
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {slotActual && (
        <TurnoModal turno={slotActual} onClose={() => setSlotActual(null)} onUpdate={loadData} translateSpecialty={translateSpecialty} />
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
              <h3 className="font-bold text-slate-800 text-lg">{d.couponModal.title}</h3>
              <button onClick={() => setShowNuevoCupon(false)} className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600">
                <XIcon size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="field-label">{d.couponModal.codeLabel}</label>
                <input
                  type="text"
                  value={nuevosCuponForm.codigo}
                  onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, codigo: e.target.value.toUpperCase() })}
                  placeholder={d.couponModal.codePlaceholder}
                  className="field-input"
                  disabled={savingCupon}
                />
              </div>
              <div>
                <label className="field-label mb-2">{d.couponModal.discountType}</label>
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
                <label className="field-label">
                  {d.couponModal.amountLabel} {nuevosCuponForm.tipo === 'PORCENTAJE' ? '(%)' : '($ARS)'}
                </label>
                <input
                  type="number"
                  value={nuevosCuponForm.valor}
                  onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, valor: e.target.value })}
                  placeholder={d.couponModal.amountPlaceholder}
                  className="field-input"
                  disabled={savingCupon}
                />
              </div>
              <div>
                <label className="field-label">{d.couponModal.descriptionLabel}</label>
                <input
                  type="text"
                  value={nuevosCuponForm.descripcion}
                  onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, descripcion: e.target.value })}
                  placeholder={d.couponModal.descriptionPlaceholder}
                  className="field-input"
                  disabled={savingCupon}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{d.couponModal.maxUsesLabel}</label>
                  <input
                    type="number"
                    value={nuevosCuponForm.maxUsos}
                    onChange={(e) => setNuevosCuponForm({ ...nuevosCuponForm, maxUsos: e.target.value })}
                    placeholder={d.couponModal.maxUsesPlaceholder}
                    className="field-input"
                    disabled={savingCupon}
                  />
                </div>
                <div>
                  <label className="field-label">{d.couponModal.expiresLabel}</label>
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
                {d.couponModal.cancel}
              </button>
              <button onClick={handleCrearCupon} className="btn btn-primary flex-1" disabled={savingCupon}>
                {savingCupon ? d.couponModal.creating : d.couponModal.create}
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardingTour storageKey="medisync-prof-tour-v1" steps={profTourSteps} delay={1000} />
    </div>
  );
}
