'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, Turno, Disponibilidad, BloqueoDisponibilidad, Cupon, SuscripcionEstado } from '../lib/api';
import { cachedFetch, cacheKeys, TTL } from '../lib/api/cache';
import { Notice } from '../lib/ui-notice';
import { clinicDateKeyFromInstant, formatClinicDateKey, formatClinicInstantTime, getClinicMonthFetchBounds, getLocale, todayInputValue } from '../lib/date';
import StatsPanel from '../components/StatsPanel';
import ProfileModal from '../components/ProfileModal';
import OnboardingTour from '../components/OnboardingTour';
import ThemeLangToggle from '../components/ThemeLangToggle';
import Spinner from '../components/Spinner';
import { useLang } from '../lib/i18n/context';
import { useTranslateSpecialty } from '../lib/i18n/use-translate-specialty';
import { NotificationBell } from '../components/NotificationBell';
import { GlobalChatHub } from '../components/GlobalChatHub';
import ProfesionalOnboardingWizard from '../components/ProfesionalOnboardingWizard';
import {
  CalendarIcon, ClockIcon, UserIcon, LogOutIcon,
  BellIcon, ChartIcon, StarIcon, CheckIcon, XIcon, InfoIcon,
} from '../components/icons';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

import CalendarioView from './components/CalendarioView';
import DisponibilidadView from './components/DisponibilidadView';
import TiposConsultaView from './components/TiposConsultaView';
import PreconsultaConfigView from './components/PreconsultaConfigView';
import PagosView from './components/PagosView';
import ResenasView from './components/ResenasView';
import CuponesView from './components/CuponesView';
import PlanView from './components/PlanView';
import AuditoriaView from './components/AuditoriaView';
import EmbedWidgetSection from './components/EmbedWidgetSection';
import UpgradePrompt from './components/UpgradePrompt';
import NuevoCuponModal, { CuponFormState } from './components/NuevoCuponModal';
import InicioProfView from './components/InicioProfView';
import { CalendarDays, CheckCheck, Users as UsersIcon, Sparkles, Star, Home as HomeIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Appointment detail modal pulls in clinical panels + (lazily) WebRTC video & chat.
// Only mounts when a turno is selected, so keep it out of the dashboard's initial chunk.
const TurnoModal = dynamic(() => import('./components/TurnoModal'));

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
  const i = t('inicio');
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
  const [activeTab, setActiveTab] = useState<'inicio' | 'calendario' | 'disponibilidad' | 'preconsulta' | 'stats' | 'pagos' | 'resenas' | 'cupones' | 'plan' | 'auditoria'>('inicio');
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayInputValue());
  const [turnosDelDia, setTurnosDelDia] = useState<Turno[]>([]);
  const [nuevaDisp, setNuevaDisp] = useState({ diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', modalidad: 'PRESENCIAL' as const, lugarAtencion: '' });
  const [slotActual, setSlotActual] = useState<Turno | null>(null);
  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [showRecordatorios, setShowRecordatorios] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [resenasStats, setResenasStats] = useState<{ promedio: number | null; total: number } | null>(null);
  const [resenasRecientes, setResenasRecientes] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<Notice | null>(null);
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
  const [nuevosCuponForm, setNuevosCuponForm] = useState<CuponFormState>({
    codigo: '',
    tipo: 'PORCENTAJE',
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
    if (user?.profesional) { loadData(true); loadRecordatorios(); loadInicioData(); }
  }, [user, authLoading, router]);

  useEffect(() => {
    const delDia = turnos.filter(t => clinicDateKeyFromInstant(t.fechaHora) === selectedDateKey);
    setTurnosDelDia(delDia);
  }, [turnos, selectedDateKey]);

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
    const [clinicYear, clinicMonth] = formatClinicDateKey(new Date()).split('-').map(Number);
    const initialStart = getClinicMonthFetchBounds(clinicYear, clinicMonth - 2);
    const initialEnd = getClinicMonthFetchBounds(clinicYear, clinicMonth);
    try {
      const [turnosData, dispData] = await Promise.all([
        cachedFetch(
          cacheKeys.turnosProf(user.profesional.id, initialStart.desde, initialEnd.hasta),
          () => api.turnos.getByProfesional(user.profesional!.id, {
            desde: initialStart.desde,
            hasta: initialEnd.hasta,
            limit: '200',
          }),
          TTL.short
        ),
        api.profesionales.getById(user.profesional.id),
      ]);
      setTurnos(turnosData.turnos);
      [-1, 0, 1].forEach(delta => {
        const d = new Date(Date.UTC(clinicYear, clinicMonth - 1 + delta, 1, 12, 0, 0, 0));
        loadedMonths.current.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
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
      const { desde, hasta } = getClinicMonthFetchBounds(year, month);
      const data = await cachedFetch(
        cacheKeys.turnosProf(user.profesional.id, desde, hasta),
        () => api.turnos.getByProfesional(user.profesional!.id, { desde, hasta, limit: '200' }),
        TTL.short
      );
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
      const data = await cachedFetch(cacheKeys.recordatoriosProfesional, () => api.recordatorios.getProfesional(), TTL.short);
      setRecordatorios(data.turnos || []);
    } catch (err) { console.error(err); }
  };

  const loadStats = async () => {
    if (!stats) setLoadingStats(true);
    try {
      const data = await cachedFetch(cacheKeys.statsProfesional, () => api.profesional.getStats(), TTL.short);
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoadingStats(false); }
  };

  // Datos del tab "Inicio": ingresos (stats) + reseñas recientes para rating/lista.
  const loadInicioData = async () => {
    try {
      const [statsData, resenasData] = await Promise.all([
        cachedFetch(cacheKeys.statsProfesional, () => api.profesional.getStats(), TTL.short).catch(() => null),
        cachedFetch(cacheKeys.misResenas(1, 5), () => api.resenas.getMisResenas({ page: 1, limit: 5 }), TTL.short).catch(() => null),
      ]);
      if (statsData) setStats(statsData);
      if (resenasData) {
        setResenasStats(resenasData.stats);
        setResenasRecientes(resenasData.resenas);
      }
    } catch (err) { console.error(err); }
  };

  const loadBloqueos = async () => {
    if (bloqueos.length === 0) setLoadingBloqueos(true);
    try {
      const data = await cachedFetch(cacheKeys.bloqueos, () => api.bloqueos.getMisBloqueos(), TTL.short);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} className="text-primary" />
          <p className="text-muted-foreground text-sm">{d.loadingPanel}</p>
        </div>
      </div>
    );
  }

  if (!user?.profesional) return null;

  const hoyTurnos = turnos.filter(t =>
    clinicDateKeyFromInstant(t.fechaHora) === todayInputValue() && t.estado !== 'CANCELADO'
  );
  const clinicMonthPrefix = formatClinicDateKey(new Date()).slice(0, 7); // "YYYY-MM"
  const turnosMes = turnos.filter(t =>
    clinicDateKeyFromInstant(t.fechaHora).startsWith(clinicMonthPrefix) && t.estado !== 'CANCELADO'
  );
  const confirmadosHoy = hoyTurnos.filter(t => t.estado === 'CONFIRMADO').length;
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? i.greetingMorning : horaActual < 20 ? i.greetingAfternoon : i.greetingEvening;

  const loadCupones = async () => {
    if (cupones.length === 0) setLoadingCupones(true);
    try {
      const data = await cachedFetch(cacheKeys.cupones, () => api.cupones.listar(), TTL.medium);
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
    if (!suscripcion) setLoadingSuscripcion(true);
    try {
      const data = await cachedFetch(cacheKeys.suscripcionEstado, () => api.suscripciones.estado(), TTL.medium);
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
    <div className="min-h-screen bg-muted/30">
      {showOnboarding && (
        <ProfesionalOnboardingWizard
          profesionalId={user.profesional.id}
          userId={user.id}
          nombre={user.profesional.nombre}
          onComplete={() => { setShowOnboarding(false); loadData(); }}
        />
      )}

      {recordatorios.length > 0 && (
        <div className="bg-primary text-primary-foreground">
          <div className="page-container py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <BellIcon size={15} className="shrink-0" />
              <span className="font-medium">
                {recordatorios.length} {recordatorios.length > 1 ? d.reminder.upcomingPlural : d.reminder.upcoming} {d.reminder.next24h}
              </span>
              <button
                onClick={() => setShowRecordatorios(!showRecordatorios)}
                className="underline underline-offset-2 text-primary-foreground/80 hover:text-primary-foreground text-xs"
              >
                {showRecordatorios ? d.reminder.hide : d.reminder.detail}
              </button>
            </div>
            <button onClick={() => setRecordatorios([])} className="text-primary-foreground/70 hover:text-primary-foreground">
              <XIcon size={14} />
            </button>
          </div>
          {showRecordatorios && (
            <div className="page-container pb-3">
              <div className="bg-primary-foreground/10 rounded-lg p-3 space-y-1.5">
                {recordatorios.map((rec: any) => (
                  <div key={rec.id} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                    <ClockIcon size={13} className="shrink-0 text-primary-foreground/70" />
                    <span>
                      {formatClinicInstantTime(rec.fechaHora, getLocale(lang))}
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

      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Logo href="/" />
              <span className="hidden text-xs text-muted-foreground sm:block">{d.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <GlobalChatHub user={user} />
              <NotificationBell />
              <ThemeLangToggle compact />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/profesional/${user.profesional!.id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setProfileCopied(true);
                    setTimeout(() => setProfileCopied(false), 2500);
                  });
                }}
                title={d.shareProfileTitle}
                className="relative"
              >
                {profileCopied ? (
                  <>
                    <CheckIcon size={15} className="text-success" />
                    <span className="hidden sm:inline text-success text-xs">{d.copied}</span>
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
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-onboarding="profile-btn"
                onClick={() => setShowProfileModal(true)}
              >
                <UserIcon size={15} />
                <span className="hidden sm:inline">
                  Dr/a. {user.profesional.nombre} {user.profesional.apellido}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { logout(); router.push('/'); }}
              >
                <LogOutIcon size={15} />
                <span className="hidden sm:inline">{d.logout}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* -- Hero band ------------------------------------- */}
      <section className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="page-container py-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> MediSync
          </p>
          <h1 className="font-display mt-1.5 text-3xl font-medium tracking-tight sm:text-4xl">
            {saludo}, Dr/a. {user.profesional.nombre}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {i.profSub.replace('{count}', String(hoyTurnos.length)).replace('{confirmed}', String(confirmadosHoy))}
          </p>
        </div>
      </section>

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
                <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="skeleton w-10 h-10 rounded-xl mb-3" />
                  <div className="skeleton h-7 w-16 rounded mb-2" />
                  <div className="skeleton h-4 w-32 rounded mb-1" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex gap-1 overflow-x-auto border-b px-2 pt-1.5">
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
            <div data-onboarding="stat-cards" className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
              {[
                { icon: CalendarDays, value: String(hoyTurnos.length), label: i.turnosHoy, hint: `${confirmadosHoy} ${i.confirmados.toLowerCase()}` },
                { icon: CheckCheck, value: String(confirmadosHoy), label: i.confirmados, hint: `${i.turnosHoy.toLowerCase()}` },
                { icon: UsersIcon, value: String(turnosMes.length), label: i.turnosMes, hint: new Date().toLocaleString(getLocale(lang), { month: 'long' }) },
                { icon: Star, value: resenasStats?.promedio != null ? String(resenasStats.promedio) : '—', label: i.rating, hint: resenasStats?.total ? i.ratingHint.replace('{count}', String(resenasStats.total)) : i.sinResenas },
              ].map((m) => (
                <Card key={m.label} className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <m.icon className="size-5" />
                    </div>
                    <span className="font-display text-3xl font-medium leading-none tracking-tight">{m.value}</span>
                    <div>
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs capitalize text-muted-foreground">{m.hint}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex gap-1 overflow-x-auto border-b px-2 pt-1.5">
                {([
                  { id: 'inicio', label: i.tab, icon: <HomeIcon size={14} />, onboarding: 'tab-inicio' },
                  { id: 'calendario', label: d.agenda, icon: <CalendarIcon size={14} />, onboarding: 'tab-calendario' },
                  { id: 'disponibilidad', label: d.availability, icon: <ClockIcon size={14} />, onboarding: 'tab-disponibilidad' },
                  { id: 'preconsulta', label: d.preconsultaTab ?? 'Preconsulta', icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>, onboarding: 'tab-preconsulta' },
                  { id: 'stats', label: d.stats, icon: <ChartIcon size={14} />, onboarding: 'tab-stats' },
                  { id: 'pagos', label: d.payments, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>, onboarding: 'tab-pagos' },
                  { id: 'resenas', label: d.reviews, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>, onboarding: 'tab-resenas' },
                  { id: 'cupones', label: d.coupons, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>, onboarding: 'tab-cupones' },
                  { id: 'plan', label: d.planCurrent ?? 'Plan', icon: <StarIcon size={14} />, onboarding: 'tab-plan' },
                  { id: 'auditoria', label: d.history, icon: <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, onboarding: 'tab-auditoria' },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    data-onboarding={tab.onboarding}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'inicio' && (
                  <InicioProfView
                    hoyTurnos={hoyTurnos}
                    ingresosPorMes={(stats?.ingresosPorMes ?? []) as any}
                    resenas={resenasRecientes}
                    ratingPromedio={resenasStats?.promedio ?? null}
                    ratingTotal={resenasStats?.total ?? 0}
                    onSelectTurno={setSlotActual}
                    translateSpecialty={translateSpecialty}
                  />
                )}
                {activeTab === 'calendario' && (
                  <CalendarioView
                    selectedDateKey={selectedDateKey}
                    setSelectedDateKey={setSelectedDateKey}
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
                    <TiposConsultaView profesionalId={user.profesional!.id} />
                    <EmbedWidgetSection profesionalId={user.profesional!.id} />
                  </>
                )}
                {activeTab === 'preconsulta' && (
                  <PreconsultaConfigView profesionalId={user.profesional!.id} />
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
        <NuevoCuponModal
          form={nuevosCuponForm}
          setForm={setNuevosCuponForm}
          onClose={() => setShowNuevoCupon(false)}
          onSave={handleCrearCupon}
          saving={savingCupon}
        />
      )}

      <OnboardingTour storageKey={`medisync-prof-tour-v1-${user.id}`} steps={profTourSteps} delay={1000} enabled={!showOnboarding} />
    </div>
  );
}
