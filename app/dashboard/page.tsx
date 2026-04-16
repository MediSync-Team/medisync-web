'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, Turno, Disponibilidad, Evolucion, HistoriaClinicaPaciente, HistoriaClinicaEditableFields, PreconsultaTurno, RecetaIndicacionInput, RecetaIndicacion } from '../lib/api';
import StatsPanel from '../components/StatsPanel';
import ProfileModal from '../components/ProfileModal';
import {
  MediSyncLogo, CalendarIcon, ClockIcon, UserIcon, LogOutIcon,
  BellIcon, ChartIcon, TrashIcon, ClipboardIcon, PaperclipIcon,
  XIcon, CheckIcon, VideoIcon, BuildingIcon, MapPinIcon, InfoIcon,
} from '../components/icons';
import { DIAS_SEMANA, estadoBadge, clinicalRiskBadge } from '../lib/utils';

interface StatsData {
  turnosPorMes: any[];
  ingresosPorMes: any[];
  resumen: { totalTurnos: number; totalPacientes: number };
}

export default function ProfesionalDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendario' | 'disponibilidad' | 'stats'>('calendario');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [turnosDelDia, setTurnosDelDia] = useState<Turno[]>([]);
  const [nuevaDisp, setNuevaDisp] = useState({ diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', modalidad: 'PRESENCIAL' as const });
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

  useEffect(() => { if (!selectedDate) setSelectedDate(new Date()); }, [selectedDate]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.paciente) { router.push('/dashboard/paciente'); return; }
    if (user?.profesional) { loadData(); loadRecordatorios(); }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!selectedDate) return;
    const delDia = turnos.filter(t => new Date(t.fechaHora).toDateString() === selectedDate.toDateString());
    setTurnosDelDia(delDia);
  }, [turnos, selectedDate]);

  useEffect(() => {
    if (activeTab === 'stats') loadStats();
  }, [activeTab]);

  const loadData = async () => {
    if (!user?.profesional) return;
    try {
      const [turnosData, dispData] = await Promise.all([
        api.turnos.getByProfesional(user.profesional.id, {
          desde: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          hasta: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        }),
        api.profesionales.getById(user.profesional.id),
      ]);
      setTurnos(turnosData);
      setDisponibilidades(dispData.disponibilidades || []);
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

  const handleAgregarDisponibilidad = async () => {
    if (!user?.profesional) return;
    try {
      await api.profesionales.crearDisponibilidad(user.profesional.id, nuevaDisp);
      loadData();
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

  return (
    <div className="min-h-screen bg-slate-50">
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <MediSyncLogo size={28} />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">MediSync</p>
                <p className="text-xs text-slate-400 leading-none mt-0.5">Panel profesional</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowProfileModal(true)}
                className="btn btn-ghost text-slate-600 text-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <p className="stat-label">Turnos hoy</p>
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
              <p className="stat-label">Turnos del mes</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ChartIcon size={15} className="text-emerald-600" />
              </div>
            </div>
            <p className="stat-value text-emerald-600">{turnosMes.length}</p>
            <p className="stat-desc">{mesActual.toLocaleString('es-AR', { month: 'long' })}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between">
              <p className="stat-label">Especialidad</p>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <ClipboardIcon size={15} className="text-purple-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-800 mt-1 leading-tight">
              {user.profesional.especialidad?.nombre || '—'}
            </p>
            <p className="stat-desc">Panel profesional</p>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="tab-nav px-1 pt-1">
            {([
              { id: 'calendario', label: 'Agenda', icon: <CalendarIcon size={14} /> },
              { id: 'disponibilidad', label: 'Disponibilidad', icon: <ClockIcon size={14} /> },
              { id: 'stats', label: 'Estadísticas', icon: <ChartIcon size={14} /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
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
              <DisponibilidadView
                disponibilidades={disponibilidades}
                nuevaDisp={nuevaDisp}
                setNuevaDisp={setNuevaDisp}
                onAgregar={handleAgregarDisponibilidad}
                onEliminar={handleEliminarDisponibilidad}
              />
            )}
            {activeTab === 'stats' && (
              <div>
                {loadingStats ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-slate-500">
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Cargando estadísticas...
                  </div>
                ) : (
                  <StatsPanel stats={stats} />
                )}
              </div>
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
          placeholder="Buscar paciente..."
          className="field-input"
          aria-label="Buscar paciente en agenda"
        />
        <select value={agendaEstado} onChange={(e) => setAgendaEstado(e.target.value as any)} className="field-select" aria-label="Filtrar por estado">
          <option value="TODOS">Todos los estados</option>
          <option value="RESERVADO">Reservado</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="COMPLETADO">Completado</option>
          <option value="CANCELADO">Cancelado</option>
          <option value="AUSENTE">Ausente</option>
        </select>
        <select value={agendaModalidad} onChange={(e) => setAgendaModalidad(e.target.value as any)} className="field-select" aria-label="Filtrar por modalidad">
          <option value="TODAS">Todas las modalidades</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="VIRTUAL">Virtual</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 bg-white">
          <input type="checkbox" checked={agendaSoloRiesgo} onChange={(e) => setAgendaSoloRiesgo(e.target.checked)} />
          Riesgo alto/urgente
        </label>
      </div>

      {/* Appointment list */}
      {filteredTurnos.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay turnos para los filtros seleccionados</p>
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
function DisponibilidadView({
  disponibilidades, nuevaDisp, setNuevaDisp, onAgregar, onEliminar,
}: {
  disponibilidades: Disponibilidad[];
  nuevaDisp: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' };
  setNuevaDisp: (d: any) => void;
  onAgregar: () => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Current schedules */}
      <div>
        <h3 className="section-title mb-3">Horarios configurados</h3>
        {disponibilidades.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <ClockIcon size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay horarios configurados</p>
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

      {/* Add schedule form */}
      <div>
        <h3 className="section-title mb-3">Agregar horario</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="field-label">Día</label>
              <select
                value={nuevaDisp.diaSemana}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, diaSemana: parseInt(e.target.value) })}
                className="field-select"
              >
                {DIAS_SEMANA.map((dia, i) => <option key={i} value={i}>{dia}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Desde</label>
              <input
                type="time" value={nuevaDisp.horaInicio}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaInicio: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Hasta</label>
              <input
                type="time" value={nuevaDisp.horaFin}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Modalidad</label>
              <select
                value={nuevaDisp.modalidad}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, modalidad: e.target.value as any })}
                className="field-select"
              >
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>
          <button onClick={onAgregar} className="btn btn-primary mt-4">
            + Agregar horario
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
  const [receta, setReceta] = useState<RecetaIndicacion | null>(null);
  const [recetaForm, setRecetaForm] = useState<RecetaIndicacionInput>({ diagnostico: '', indicaciones: '' });
  const [loadingReceta, setLoadingReceta] = useState(true);
  const [savingReceta, setSavingReceta] = useState(false);
  const [shareText, setShareText] = useState('');
  const [modalNotice, setModalNotice] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => { loadEvolucion(); loadArchivos(); }, [turno.id]);
  useEffect(() => { loadPreconsulta(); }, [turno.id]);
  useEffect(() => { loadReceta(); }, [turno.id]);
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800 text-lg">Detalle del turno</h3>
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
              <p className="text-xs text-slate-500 mb-1">Fecha y hora</p>
              <p className="font-semibold text-slate-800 text-sm">
                {new Date(turno.fechaHora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-blue-600 font-bold">
                {new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">Estado</p>
              <span className={estadoBadge(turno.estado)}>{turno.estado}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">Paciente</p>
              <p className="font-semibold text-slate-800 text-sm">
                {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Sin cuenta'}
              </p>
              {turno.paciente?.telefono && (
                <p className="text-xs text-slate-500 mt-0.5">{turno.paciente.telefono}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">Modalidad</p>
              <div className="flex items-center gap-1.5">
                {turno.modalidad === 'VIRTUAL' ? (
                  <><VideoIcon size={14} className="text-blue-500" /><span className="font-semibold text-sm text-slate-800">Virtual</span></>
                ) : (
                  <><BuildingIcon size={14} className="text-emerald-500" /><span className="font-semibold text-sm text-slate-800">Presencial</span></>
                )}
              </div>
              {turno.modalidad === 'VIRTUAL' && turno.linkVideollamada && (
                <a href={turno.linkVideollamada} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block truncate">
                  Abrir videollamada
                </a>
              )}
            </div>
          </div>

          {/* Evolución clínica */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">Cuestionario preconsulta</h4>
            </div>
            {loadingPreconsulta ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : !preconsulta?.completadaAt ? (
              <p className="text-sm text-slate-500">El paciente aun no completo el cuestionario preconsulta.</p>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-700">Completado {new Date(preconsulta.completadaAt).toLocaleString('es-AR')}</p>
                  <span className={`badge ${preconsultaRiskClass(preconsulta.riesgo)}`}>Riesgo {preconsulta.riesgo}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">Dolor</p>
                    <p className="font-semibold text-slate-800">{preconsulta.escalaDolor}/10</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">Ansiedad</p>
                    <p className="font-semibold text-slate-800">{preconsulta.escalaAnsiedad}/10</p>
                  </div>
                </div>
                <p><span className="font-medium text-slate-700">Motivo:</span> <span className="text-slate-600">{preconsulta.motivo}</span></p>
                <p><span className="font-medium text-slate-700">Sintomas:</span> <span className="text-slate-600">{preconsulta.sintomas}</span></p>
                {preconsulta.inicioSintomas && (
                  <p><span className="font-medium text-slate-700">Inicio sintomas:</span> <span className="text-slate-600">{preconsulta.inicioSintomas}</span></p>
                )}
                {typeof preconsulta.temperatura === 'number' && (
                  <p><span className="font-medium text-slate-700">Temperatura:</span> <span className="text-slate-600">{preconsulta.temperatura.toFixed(1)} C</span></p>
                )}
                {preconsulta.flags && preconsulta.flags.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700">Alertas detectadas</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
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
              <h4 className="font-semibold text-slate-700 text-sm">Evolución clínica</h4>
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
                  {guardando ? 'Guardando...' : 'Guardar notas'}
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

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Este resumen se comparte en todos los turnos del paciente para este profesional.
                  </p>
                  <button
                    onClick={handleSaveHistoriaClinica}
                    disabled={savingHistoria}
                    className="btn btn-primary btn-sm shrink-0"
                  >
                    {savingHistoria ? 'Guardando...' : 'Guardar historia'}
                  </button>
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
                </div>
              </div>
            )}
          </div>

          {/* Archivos */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PaperclipIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">Archivos adjuntos</h4>
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
                  {uploading ? 'Subiendo...' : '+ Subir archivo'}
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
              <p className="text-xs text-slate-400 text-center py-3">No hay archivos adjuntos</p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-2xl">
          {turno.estado !== 'COMPLETADO' && (
            <button onClick={() => handleActualizarEstado('COMPLETADO')} className="btn btn-success flex-1">
              <CheckIcon size={15} /> Marcar completado
            </button>
          )}
          {turno.estado !== 'CANCELADO' && (
            <button onClick={() => handleActualizarEstado('CANCELADO')} className="btn btn-danger flex-1">
              <XIcon size={15} /> Cancelar turno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
