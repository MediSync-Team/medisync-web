'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api, Turno, ListaEsperaItem, RecetaIndicacion, Resena } from '../../lib/api';
import ProfileModal from '../../components/ProfileModal';
import OnboardingTour from '../../components/OnboardingTour';
import Pagination from '../../components/Pagination';
import StarRating from '../../components/StarRating';

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
  XIcon, SearchIcon, WaitlistIcon, CheckIcon, InfoIcon, ClipboardIcon,
} from '../../components/icons';
import { estadoBadge } from '../../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proximos' | 'pasados' | 'listaEspera'>('proximos');
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
  const [inlineNotice, setInlineNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      if (user.paciente) {
        loadTurnos('proximos', 1);
        loadRecordatorios();
        loadPoliticaCancelacion();
        loadListaEspera();
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

  const loadListaEspera = async () => {
    try {
      const data = await api.listaEspera.misSuscripciones();
      setListaEspera(data);
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
        loadTurnos(activeTab === 'listaEspera' ? 'proximos' : activeTab, page);
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

  const handleTabChange = (tab: 'proximos' | 'pasados' | 'listaEspera') => {
    setActiveTab(tab);
    if (tab !== 'listaEspera') {
      setPage(1);
      loadTurnos(tab, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadTurnos(activeTab === 'listaEspera' ? 'proximos' : activeTab, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <MediSyncLogo size={28} />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">MediSync</p>
                <p className="text-xs text-slate-400 leading-none mt-0.5">Mi panel</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href="/" data-onboarding="pac-buscar-link" className="btn btn-ghost text-slate-600 text-sm hidden sm:inline-flex">
                <SearchIcon size={15} />
                Buscar profesionales
              </Link>
              <button data-onboarding="pac-profile-btn" onClick={() => setShowProfileModal(true)} className="btn btn-ghost text-slate-600 text-sm">
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
              data-onboarding="pac-tab-proximos"
              onClick={() => handleTabChange('proximos')}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === 'proximos' ? 'tab-btn-active' : ''}`}
            >
              <CalendarIcon size={13} />
              Próximos
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
              Pasados
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
              Lista de espera
              {listaEspera.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {listaEspera.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'listaEspera' ? (
              /* ── Lista de espera ────────────────── */
              listaEspera.length === 0 ? (
                <div className="py-12 text-center">
                  <WaitlistIcon size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">No estás en ninguna lista de espera</p>
                  <p className="text-slate-400 text-xs mt-1">Cuando no haya turnos disponibles, podés anotarte en lista de espera desde el perfil del profesional.</p>
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
                        Salir de lista
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
                  {activeTab === 'proximos' ? 'No tenés turnos próximos' : 'No tenés turnos pasados'}
                </p>
                {activeTab === 'proximos' && (
                  <Link href="/" className="btn btn-primary btn-sm mt-4">
                    <SearchIcon size={13} /> Buscar profesional
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
          onSuccess={() => { setTurnoReprogramar(null); loadTurnos(activeTab === 'listaEspera' ? 'proximos' : activeTab, page); loadRecordatorios(); }}
        />
      )}

      {turnoPreconsulta && (
        <PreconsultaModal
          turno={turnoPreconsulta}
          onClose={() => setTurnoPreconsulta(null)}
          onSuccess={() => {
            setTurnoPreconsulta(null);
            loadTurnos(activeTab === 'listaEspera' ? 'proximos' : activeTab, page);
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
          }}
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
  turno, pagoInfo, canCancel, onPagar, onCancelar, onReprogramar, onCompletarPreconsulta, onVerReceta, onCalificar, horasMinCancelacion,
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
}) {
  const isActive = turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO';
  const isFuture = new Date(turno.fechaHora) >= new Date();
  const preconsultaCompletada = Boolean(turno.preconsultaCompletadaAt);

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
          <span className="flex items-center gap-1"><VideoIcon size={11} /> Virtual</span>
        ) : (
          <span className="flex items-center gap-1"><BuildingIcon size={11} /> Presencial</span>
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

        {/* Video link */}
        {turno.modalidad === 'VIRTUAL' && turno.linkVideollamada && (
          <a
            href={turno.linkVideollamada}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-sm mt-3 w-full"
          >
            <VideoIcon size={13} /> Unirse a la videollamada
          </a>
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
                  ? 'Pago registrado'
                  : `Pagar $${Number(turno.profesional.precioConsulta).toLocaleString('es-AR')}`}
              </button>
            )}

            {/* Reschedule */}
            <button
              onClick={onReprogramar}
              disabled={!canCancel}
              className="btn btn-secondary btn-sm"
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <RefreshIcon size={13} /> Reprogramar
            </button>

            {/* Cancel */}
            <button
              onClick={onCancelar}
              disabled={!canCancel}
              className={`btn btn-sm ${canCancel ? 'btn-ghost text-red-500 hover:bg-red-50' : 'btn-ghost text-slate-400 cursor-not-allowed'}`}
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <XIcon size={13} /> Cancelar
            </button>

            <Link href={`/profesional/${turno.profesional?.id}`} className="btn btn-ghost btn-sm text-slate-500">
              Ver profesional
            </Link>

            {!preconsultaCompletada ? (
              <button onClick={onCompletarPreconsulta} className="btn btn-primary btn-sm">
                <ClipboardIcon size={13} /> Completar preconsulta
              </button>
            ) : (
              <span className="badge badge-green">Preconsulta lista</span>
            )}

            {(turno.estado === 'COMPLETADO' || turno.estado === 'CONFIRMADO') && (
              <button onClick={onVerReceta} className="btn btn-secondary btn-sm">
                <ClipboardIcon size={13} /> Ver receta/indicaciones
              </button>
            )}

            {turno.estado === 'COMPLETADO' && (
              <button onClick={onCalificar} className="btn btn-ghost btn-sm text-amber-600 hover:bg-amber-50">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                Calificar
              </button>
            )}
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

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="btn btn-secondary w-full">Cerrar</button>
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
          <h3 className="font-bold text-slate-800">Calificar consulta</h3>
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
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
          {!resenaExistente && (
            <button
              onClick={handleGuardar}
              disabled={guardando || rating === 0 || resenaExistente === undefined}
              className="btn btn-primary flex-1"
            >
              {guardando ? 'Guardando...' : 'Enviar calificación'}
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
