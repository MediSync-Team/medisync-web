'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api, Turno, ListaEsperaItem, HistorialTurno, PacienteStats, RecetaPaciente, CertificadoPaciente } from '../../lib/api';
import ProfileModal from '../../components/ProfileModal';
import OnboardingTour from '../../components/OnboardingTour';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import { useLang } from '../../lib/i18n/context';
import { NotificationBell } from '../../components/NotificationBell';
import { GlobalChatHub } from '../../components/GlobalChatHub';
import { getTurnosTabRequest, PacienteDashboardTab } from '../../lib/paciente-dashboard-tabs';
import { Notice } from '../../lib/ui-notice';
import Spinner from '../../components/Spinner';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../lib/date';
import { useTranslateSpecialty } from '../../lib/i18n/use-translate-specialty';
import RecetaModal from './components/RecetaModal';
import PreconsultaModal from './components/PreconsultaModal';
import CalificarModal from './components/CalificarModal';
import ReprogramarModal from './components/ReprogramarModal';
import ResumenPacienteView from './components/ResumenPacienteView';

// Conditionally-rendered heavy children — keep out of the dashboard's initial chunk.
const ChatModal = dynamic(() => import('../../components/ChatModal'), { ssr: false });
const VideoCallModal = dynamic(() => import('../../components/VideoCallModal'), { ssr: false });
// Recharts-backed stats tab; only mounts when the user opens the statistics tab.
const EstadisticasPaciente = dynamic(() => import('./components/EstadisticasPaciente'), {
  loading: () => <Spinner />,
});
import DatosMedicosView, { DatosMedicos } from './components/DatosMedicosView';
import RecetasView from './components/RecetasView';
import CertificadosView from './components/CertificadosView';
import ListaEsperaView from './components/ListaEsperaView';
import HistorialView from './components/HistorialView';
import TurnosTabView from './components/TurnosTabView';
import {
  CalendarIcon, ClockIcon, UserIcon, LogOutIcon,
  BellIcon, XIcon, SearchIcon, WaitlistIcon, InfoIcon, ClipboardIcon,
} from '../../components/icons';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Pill, FileText, Activity, Video, MapPin, Stethoscope, ArrowRight, Sparkles } from 'lucide-react';

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, lang } = useLang();
  const p = t('paciente');
  const d = t('dashboard');
  const c = t('common');
  const i = t('inicio');
  const m = t('modality');
  const locale = getLocale(lang);
  const pageText = p.page;
  const pacienteTourSteps = [
    {
      selector: '[data-onboarding="pac-tab-proximos"]',
      title: p.tour.upcomingTitle,
      description: p.tour.upcomingDesc,
      position: 'bottom' as const,
    },
    {
      selector: '[data-onboarding="pac-tab-lista-espera"]',
      title: p.tour.waitlistTitle,
      description: p.tour.waitlistDesc,
      position: 'bottom' as const,
    },
    {
      selector: '[data-onboarding="pac-buscar-link"]',
      title: p.tour.searchTitle,
      description: p.tour.searchDesc,
      position: 'bottom' as const,
    },
    {
      selector: '[data-onboarding="pac-profile-btn"]',
      title: p.tour.profileTitle,
      description: p.tour.profileDesc,
      position: 'bottom' as const,
    },
  ];
  const translateSpecialty = useTranslateSpecialty();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PacienteDashboardTab>('resumen');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as PacienteDashboardTab;
      if (tab && ['resumen', 'proximos', 'pasados', 'listaEspera', 'historial', 'recetas', 'certificados', 'datosMedicos', 'estadisticas'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);
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
  const [inlineNotice, setInlineNotice] = useState<Notice | null>(null);
  const [cancellingTurnoId, setCancellingTurnoId] = useState<string | null>(null);

  // Datos médicos
  const [datosMedicos, setDatosMedicos] = useState<DatosMedicos>({ antecedentesPersonales: '', antecedentesFamiliares: '', alergias: '', medicacionActual: '', habitos: '', diagnosticosPrevios: '' });
  const [savingDatos, setSavingDatos] = useState(false);
  const [datosSaved, setDatosSaved] = useState(false);

  // Recetas y certificados
  const [misRecetas, setMisRecetas] = useState<RecetaPaciente[]>([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [misCertificados, setMisCertificados] = useState<CertificadoPaciente[]>([]);
  const [loadingCertificados, setLoadingCertificados] = useState(false);
  // Próximos turnos (estable, independiente del tab activo) para hero + métricas
  const [proximosTurnos, setProximosTurnos] = useState<Turno[]>([]);
  const [proximosTotal, setProximosTotal] = useState(0);

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
        loadProximos();
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

  const loadProximos = async () => {
    try {
      const data = await api.turnos.getMisTurnos({ tipo: 'proximos', page: 1, limit: 5 });
      setProximosTurnos(data.turnos.filter(tn => tn.estado === 'RESERVADO' || tn.estado === 'CONFIRMADO'));
      setProximosTotal(data.pagination.total);
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
      const [data, perfil, { imprimirHistorial }] = await Promise.all([
        api.turnos.miHistorial({ page: 1, limit: 100 }),
        api.pacientes.getPerfil(),
        import('../../lib/historial-pdf'),
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
      }, lang);
    } catch (err) { console.error(err); }
  };

  const cancelarListaEspera = async (id: string) => {
    try {
      await api.listaEspera.cancelar(id);
      await loadListaEspera();
      setInlineNotice({ type: 'success', text: pageText.waitlistRemoved });
    } catch (err) {
      setInlineNotice({ type: 'error', text: err instanceof Error ? err.message : pageText.waitlistRemoveError });
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
      setInlineNotice({ type: 'success', text: pageText.appointmentCancelled });
    } catch {
      setInlineNotice({ type: 'error', text: pageText.cancelAppointmentError });
    } finally {
      setCancellingTurnoId(null);
    }
  };

  const canCancel = (fechaHora: string) =>
    new Date(fechaHora).getTime() - Date.now() >= horasMinCancelacion * 3_600_000;

  if (authLoading || !user || !user.paciente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} className="text-primary" />
          <p className="text-muted-foreground text-sm">{c.loading}</p>
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

  const proximoTurno = proximosTurnos[0] ?? null;
  const diasHastaProximo = proximoTurno
    ? Math.ceil((new Date(proximoTurno.fechaHora).getTime() - Date.now()) / 86_400_000)
    : null;
  const pacSub = !proximoTurno
    ? i.pacSubNone
    : diasHastaProximo !== null && diasHastaProximo <= 0
      ? i.pacSubToday
      : diasHastaProximo === 1
        ? i.pacSubTomorrow
        : i.pacSubDays.replace('{days}', String(diasHastaProximo));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* -- Reminder banner ------------------------------- */}
      {recordatorios.length > 0 && (
        <div className="bg-warning text-warning-foreground">
          <div className="page-container py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <BellIcon size={15} className="shrink-0" />
              <span className="font-medium">
                {pageText.reminderNext24h
                  .replace('{{count}}', String(recordatorios.length))
                  .replace('{{plural}}', recordatorios.length === 1 ? '' : 's')}
              </span>
              <button onClick={() => setShowRecordatorios(!showRecordatorios)} className="underline underline-offset-2 text-warning-foreground/80 hover:text-warning-foreground text-xs">
                {showRecordatorios ? pageText.reminderToggleHide : pageText.reminderToggleShow}
              </button>
            </div>
            <button onClick={() => setRecordatorios([])} className="text-warning-foreground/70 hover:text-warning-foreground">
              <XIcon size={14} />
            </button>
          </div>
          {showRecordatorios && (
            <div className="page-container pb-3">
              <div className="bg-warning-foreground/10 rounded-lg p-3 space-y-1.5">
                {recordatorios.map((rec: any) => (
                  <div key={rec.id} className="flex items-center gap-3 text-sm text-warning-foreground/90">
                    <CalendarIcon size={13} className="shrink-0 text-warning-foreground/70" />
                    <span>
                      {formatClinicInstantDate(rec.fechaHora, locale)} {p.atTime}{' '}
                      {formatClinicInstantTime(rec.fechaHora, locale)}
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
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Logo href="/dashboard/paciente" />
              <span className="hidden text-xs text-muted-foreground sm:block">{d.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <GlobalChatHub user={user} />
              <NotificationBell />
              <ThemeLangToggle compact />
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" render={<Link href="/" data-onboarding="pac-buscar-link" />}>
                <SearchIcon size={15} />
                {d.searchProfessionals}
              </Button>
              <Button variant="ghost" size="sm" data-onboarding="pac-profile-btn" onClick={() => setShowProfileModal(true)}>
                <UserIcon size={15} />
                <span className="hidden sm:inline">{user.paciente.nombre} {user.paciente.apellido}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { logout(); router.push('/'); }}>
                <LogOutIcon size={15} />
                <span className="hidden sm:inline">{d.logout}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* -- Hero band ------------------------------------- */}
      <section className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="page-container max-w-5xl mx-auto py-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> MediSync
          </p>
          <h1 className="font-display mt-1.5 text-3xl font-medium tracking-tight sm:text-4xl">
            {i.pacGreetingName}, {user.paciente.nombre}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{pacSub}</p>
        </div>
      </section>

      <main className="page-container py-6 max-w-5xl mx-auto">
        {inlineNotice && (
          <div className={`alert mb-4 ${inlineNotice.type === 'success' ? 'alert-success' : inlineNotice.type === 'error' ? 'alert-error' : 'alert-info'}`} role="status" aria-live="polite">
            <InfoIcon size={15} className="shrink-0" />
            <span>{inlineNotice.text}</span>
            <button className="ml-auto text-xs underline" onClick={() => setInlineNotice(null)}>{pageText.hideNotice}</button>
          </div>
        )}

        {/* -- Cancellation policy notice ----------------- */}
        <div className="alert alert-info mb-4 text-xs">
          <InfoIcon size={15} className="shrink-0" />
          <span>
            {d.cancellationPolicy}: {d.cancellationPolicyText.replace('{horas}', String(horasMinCancelacion))}
          </span>
        </div>

        {/* -- Próximo turno destacado -------------------- */}
        {proximoTurno && (
          <Card className="mb-5 overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.06] to-card shadow-sm">
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                  {(proximoTurno.profesional?.nombre?.[0] ?? '')}{proximoTurno.profesional?.apellido?.[0] ?? ''}
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">{i.proximoTurno}</p>
                  <h2 className="font-heading mt-0.5 text-xl font-semibold">
                    {proximoTurno.profesional?.nombre} {proximoTurno.profesional?.apellido}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Stethoscope className="size-4 text-primary" /> {translateSpecialty(proximoTurno.profesional?.especialidad?.nombre)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                    <span className="font-display text-lg font-medium capitalize">
                      {formatClinicInstantDate(proximoTurno.fechaHora, locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="font-display text-lg font-medium tabular-nums">
                      {formatClinicInstantTime(proximoTurno.fechaHora, locale)} hs
                    </span>
                    <Badge variant="outline" className="gap-1 border-border/70">
                      {proximoTurno.modalidad === 'VIRTUAL' ? <Video className="text-primary" /> : <MapPin className="text-success" />}
                      {proximoTurno.modalidad === 'VIRTUAL' ? m.VIRTUAL : m.PRESENCIAL}
                    </Badge>
                  </div>
                  {(proximoTurno.lugarAtencion ?? proximoTurno.profesional?.lugarAtencion) && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {proximoTurno.lugarAtencion ?? proximoTurno.profesional?.lugarAtencion}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 md:flex-col md:items-stretch">
                <Button onClick={() => handleTabChange('proximos')}>
                  {i.verDetalles} <ArrowRight data-icon="inline-end" />
                </Button>
                <Button variant="outline" onClick={() => setTurnoReprogramar(proximoTurno)}>
                  {i.reprogramar}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* -- Métricas ----------------------------------- */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: CalendarDays, value: String(proximosTotal), label: i.proximos },
            { icon: Pill, value: String(misRecetas.length), label: i.recetasActivas },
            { icon: FileText, value: String(misCertificados.length), label: i.certificados },
            { icon: Activity, value: String(pacienteStats?.completados ?? 0), label: i.completados },
          ].map((mt) => (
            <Card key={mt.label} className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <mt.icon className="size-5" />
                </div>
                <span className="font-display text-3xl font-medium leading-none tracking-tight">{mt.value}</span>
                <p className="text-sm font-medium">{mt.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* -- Tabs -------------------------------------- */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex gap-1 overflow-x-auto border-b px-2 pt-1.5">
            <button
              onClick={() => handleTabChange('resumen')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='resumen' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
{p.summary}
            </button>
            <button
              data-onboarding="pac-tab-proximos"
              onClick={() => handleTabChange('proximos')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='proximos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <CalendarIcon size={13} />
              {p.upcoming}
              {activeTab === 'proximos' && paginationMeta.total > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {paginationMeta.total}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('pasados')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='pasados' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <ClockIcon size={13} />
              {p.past}
              {activeTab === 'pasados' && paginationMeta.total > 0 && (
                <span className="ml-1 bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {paginationMeta.total}
                </span>
              )}
            </button>
            <button
              data-onboarding="pac-tab-lista-espera"
              onClick={() => handleTabChange('listaEspera')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='listaEspera' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <WaitlistIcon size={13} />
              {p.waitlist}
              {listaEspera.length > 0 && (
                <span className="ml-1 bg-warning/15 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {listaEspera.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('historial')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='historial' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
<ClipboardIcon size={13} />
              {d.medicalHistory}
            </button>
            <button
              onClick={() => handleTabChange('recetas')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='recetas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {d.recipes}
            </button>
            <button
              onClick={() => handleTabChange('certificados')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='certificados' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="19" x2="12" y2="13"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
              {d.certificates_}
              {misCertificados.length > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {misCertificados.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('datosMedicos')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='datosMedicos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              {d.myMedicalData}
            </button>
            <button
              onClick={() => handleTabChange('estadisticas')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activeTab ==='estadisticas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
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
              <HistorialView
                historial={historial}
                loading={loadingHistorial}
                page={historialPage}
                totalPages={historialPagination.totalPages}
                total={historialPagination.total}
                limit={HISTORIAL_LIMIT}
                onPageChange={(p) => { setHistorialPage(p); loadHistorial(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onDownloadPDF={downloadHistorialPDF}
                onCalificar={(turno) => setTurnoCalificar(turno as any)}
                onChat={(turno) => setTurnoChat(turno)}
                translateSpecialty={translateSpecialty}
              />
            ) : activeTab === 'recetas' ? (
              <RecetasView recetas={misRecetas} loading={loadingRecetas} />
            ) : activeTab === 'certificados' ? (
              <CertificadosView certificados={misCertificados} loading={loadingCertificados} paciente={user.paciente} />
            ) : activeTab === 'datosMedicos' ? (
              <DatosMedicosView
                datos={datosMedicos}
                onChange={(patch) => setDatosMedicos(prev => ({ ...prev, ...patch }))}
                onSave={saveDatosMedicos}
                saving={savingDatos}
                saved={datosSaved}
              />
            ) : activeTab === 'listaEspera' ? (
              <ListaEsperaView items={listaEspera} onCancelar={cancelarListaEspera} translateSpecialty={translateSpecialty} />
            ) : (activeTab === 'proximos' || activeTab === 'pasados') ? (
              <TurnosTabView
                turnos={turnos}
                loading={loading}
                tab={activeTab}
                page={page}
                totalPages={paginationMeta.totalPages}
                total={paginationMeta.total}
                limit={TURNOS_LIMIT}
                pagosPendientes={pagosPendientes}
                horasMinCancelacion={horasMinCancelacion}
                cancellingTurnoId={cancellingTurnoId}
                canCancel={canCancel}
                onPageChange={handlePageChange}
                translateSpecialty={translateSpecialty}
                onPagar={(turno) => router.push(`/pago?turno=${turno.id}`)}
                onCancelar={(turno) => handleCancelar(turno.id)}
                onReprogramar={setTurnoReprogramar}
                onCompletarPreconsulta={setTurnoPreconsulta}
                onVerReceta={setTurnoReceta}
                onCalificar={setTurnoCalificar}
                onVideoCall={setTurnoVideoCall}
                onChat={setTurnoChat}
              />
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
            setInlineNotice({ type: 'success', text: p.rateSuccess });
            if (activeTab === 'historial') loadHistorial(historialPage);
          }}
        />
      )}

      {turnoVideoCall && (
        <VideoCallModal
          turnoId={turnoVideoCall.id}
          participantName={turnoVideoCall.profesional ? `${turnoVideoCall.profesional.nombre} ${turnoVideoCall.profesional.apellido}` : pageText.professionalFallback}
          participantRoleLabel="Dr/a."
          fechaHora={turnoVideoCall.fechaHora}
          onClose={() => setTurnoVideoCall(null)}
        />
      )}

      {turnoChat && user.paciente && (
        <ChatModal
          turnoId={turnoChat.id}
          readOnly={turnoChat.estado !== 'RESERVADO' && turnoChat.estado !== 'CONFIRMADO'}
          myUserId={user.id}
          otherName={turnoChat.profesional ? `${turnoChat.profesional.nombre} ${turnoChat.profesional.apellido}` : pageText.professionalFallback}
          onClose={() => setTurnoChat(null)}
        />
      )}

      <OnboardingTour
        storageKey="medisync-paciente-tour-v1"
        steps={pacienteTourSteps}
        delay={1000}
      />
    </div>
  );
}
