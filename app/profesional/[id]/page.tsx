'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Profesional, Slot, ListaEsperaItem, ResenasResponse } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLang } from '../../lib/i18n/context';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import {
  MediSyncLogo, ArrowLeftIcon, MapPinIcon, PhoneIcon, VideoIcon,
  BuildingIcon, CalendarIcon, ClockIcon, CheckIcon, XIcon, UserIcon, InfoIcon,
  SearchIcon,
} from '../../components/icons';
import StarRating from '../../components/StarRating';
import AgendarCalendario from '../../components/AgendarCalendario';
import { DIAS_SEMANA, estadoBadge } from '../../lib/utils';

export default function ProfesionalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState('');
  const [suscribiendoLista, setSuscribiendoLista] = useState(false);
  const [suscripcionesLista, setSuscripcionesLista] = useState<ListaEsperaItem[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [inlineNotice, setInlineNotice] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [turnoReservado, setTurnoReservado] = useState<{ id: string; fechaHora: string; duracionMin: number } | null>(null);
  const [resenas, setResenas] = useState<ResenasResponse | null>(null);
  const [resenaPage, setResenaPage] = useState(1);
  // Guest booking form
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [guestFormError, setGuestFormError] = useState('');
  const [guestTurnoReservado, setGuestTurnoReservado] = useState<{ id: string; fechaHora: string; duracionMin: number; needsPago: boolean } | null>(null);

  useEffect(() => { loadProfesional(); loadResenas(1); }, [params.id]);
  useEffect(() => { loadListaEsperaActiva(); }, [params.id, user?.paciente?.id]);
  useEffect(() => { if (selectedDate) loadSlots(selectedDate); }, [selectedDate, modalidad]);

  const loadProfesional = async () => {
    try {
      const data = await api.profesionales.getById(params.id as string);
      setProfesional(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadResenas = async (p: number) => {
    try {
      const data = await api.resenas.getByProfesional(params.id as string, { page: p, limit: 5 });
      setResenas(data);
      setResenaPage(p);
    } catch (err) { console.error(err); }
  };

  const loadSlots = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;
      const data = await api.profesionales.getSlots(params.id as string, fecha, modalidad);
      setSlots(data);
    } catch (err) { console.error(err); setSlots([]); }
  };

  const loadListaEsperaActiva = async () => {
    if (!user?.paciente) { setSuscripcionesLista([]); return; }
    try {
      const data = await api.listaEspera.misSuscripciones();
      setSuscripcionesLista(data.filter(x => x.profesionalId === (params.id as string)));
    } catch (err) { console.error(err); }
  };

  const selectedDateKey = selectedDate ? (() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })() : null;
  const selectedWaitlistItem = selectedDateKey
    ? suscripcionesLista.find(x => x.modalidad === modalidad && new Date(x.fecha).toISOString().split('T')[0] === selectedDateKey)
    : null;

  const handleUnirseListaEspera = async () => {
    if (!user) { router.push('/login'); return; }
    if (!selectedDate) {
      setInlineNotice({ type: 'warning', text: 'Primero selecciona un dia para sumarte a la lista de espera.' });
      return;
    }
    if (selectedWaitlistItem) {
      setInlineNotice({ type: 'info', text: `Ya estas en lista de espera para ${selectedDate.toLocaleDateString('es-AR')} (${modalidad.toLowerCase()}).` });
      return;
    }

    setSuscribiendoLista(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;
      await api.listaEspera.suscribirme({ profesionalId: params.id as string, fecha, modalidad });
      setSuccessMessage('Te anotamos en lista de espera. Te avisamos si se libera un turno.');
      setTimeout(() => setSuccessMessage(''), 4000);
      setInlineNotice({ type: 'success', text: 'Quedaste anotado en lista de espera.' });
      await loadListaEsperaActiva();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar en lista de espera';
      if (msg.toLowerCase().includes('ya estas en la lista')) {
        setInlineNotice({ type: 'info', text: `Ya estabas anotado para ${selectedDate?.toLocaleDateString('es-AR')} en modalidad ${modalidad.toLowerCase()}.` });
      } else {
        setInlineNotice({ type: 'error', text: msg });
      }
    } finally { setSuscribiendoLista(false); }
  };

  const handleSalirListaEspera = async () => {
    if (!selectedWaitlistItem) return;
    setSuscribiendoLista(true);
    try {
      await api.listaEspera.cancelar(selectedWaitlistItem.id);
      await loadListaEsperaActiva();
      setInlineNotice({ type: 'success', text: 'Salida de lista de espera confirmada.' });
    } catch (err) {
      setInlineNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo cancelar la suscripcion' });
    }
    finally { setSuscribiendoLista(false); }
  };

  const getProximosDias = () => {
    const dias = [];
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const f = new Date(hoy);
      f.setDate(hoy.getDate() + i);
      dias.push(f);
    }
    return dias;
  };

  const buildFechaHora = () => {
    if (!selectedDate || !selectedSlot) return null;
    const [hora, minuto] = selectedSlot.split(':').map(Number);
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hora, minuto, 0, 0);
  };

  const doReservar = async (pacienteData?: { nombre: string; apellido: string; email: string; telefono?: string }) => {
    if (!selectedSlot || !selectedDate || !profesional) return;

    setReservando(true);
    setError('');
    setGuestFormError('');

    try {
      const fechaHora = buildFechaHora()!;

      const reservaData: Parameters<typeof api.turnos.reservar>[0] = {
        profesionalId: profesional.id,
        fechaHora: fechaHora.toISOString(),
        modalidad,
        paciente: pacienteData,
      };

      const reserva = await api.turnos.reservar(reservaData);

      // Persist turno info for calendar event
      const calInfo = {
        turnoId: reserva.turno.id,
        fechaHora: reserva.turno.fechaHora,
        duracionMin: reserva.turno.duracionMin,
        modalidad,
        profesionalNombre: profesional.nombre,
        profesionalApellido: profesional.apellido,
        especialidad: profesional.especialidad?.nombre ?? '',
        lugarAtencion: profesional.lugarAtencion,
      };
      localStorage.setItem('medisync_last_turno_cal', JSON.stringify(calInfo));

      const needsPago = Number(profesional.precioConsulta) > 0;

      if (needsPago && user) {
        router.push(`/pago?turno=${reserva.turno.id}`);
        return;
      }

      if (needsPago && !user) {
        // Guest + paid: turno created, redirect to register so they can complete payment
        setGuestTurnoReservado({ id: reserva.turno.id, fechaHora: reserva.turno.fechaHora, duracionMin: reserva.turno.duracionMin, needsPago: true });
        return;
      }

      // Free turno — show success screen with calendar buttons
      if (user) {
        setTurnoReservado({ id: reserva.turno.id, fechaHora: reserva.turno.fechaHora, duracionMin: reserva.turno.duracionMin });
      } else {
        setGuestTurnoReservado({ id: reserva.turno.id, fechaHora: reserva.turno.fechaHora, duracionMin: reserva.turno.duracionMin, needsPago: false });
      }
      setSuccessMessage('¡Turno reservado con éxito!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al reservar';
      setError(msg);
      setGuestFormError(msg);
      setInlineNotice({ type: 'error', text: msg });
    } finally {
      setReservando(false);
    }
  };

  const handleReservar = async () => {
    if (!selectedSlot || !selectedDate || !profesional) return;

    if (!user) {
      // Show guest form instead of redirecting to login
      setShowGuestForm(true);
      return;
    }

    await doReservar(
      user.paciente
        ? { nombre: user.paciente.nombre, apellido: user.paciente.apellido, email: user.paciente.email, telefono: user.paciente.telefono ?? undefined }
        : undefined
    );
  };

  const handleReservarInvitado = async () => {
    const { nombre, apellido, email, telefono } = guestForm;
    if (!nombre.trim() || !apellido.trim() || !email.trim()) {
      setGuestFormError('Completá nombre, apellido y email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGuestFormError('El email no es válido.');
      return;
    }
    await doReservar({ nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim().toLowerCase(), telefono: telefono.trim() || undefined });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="bg-white border-b border-slate-200">
          <div className="page-container py-3">
            <div className="skeleton h-5 w-24 rounded" />
          </div>
        </header>
        <div className="page-container py-8 max-w-4xl mx-auto space-y-4">
          <div className="card p-6">
            <div className="flex gap-5">
              <div className="skeleton w-20 h-20 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="skeleton h-6 w-48 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center card p-10">
          <UserIcon size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600 font-medium">Profesional no encontrado</p>
          <Link href="/" className="btn btn-primary btn-sm mt-4"><SearchIcon size={13} /> Buscar otros</Link>
        </div>
      </div>
    );
  }

  const initials = `${profesional.nombre[0]}${profesional.apellido[0]}`.toUpperCase();
  const availableSlots = slots.filter(s => s.disponible);
  const hasSlots = selectedDate && availableSlots.length > 0;
  const bookingStep = !selectedDate ? 1 : !selectedSlot ? 2 : 3;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
              <ArrowLeftIcon size={16} />
              <span className="text-sm font-medium">{t('common').back}</span>
            </Link>
            <div className="flex items-center gap-2">
              <MediSyncLogo size={24} />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">MediSync</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeLangToggle compact />
              {user ? (
                <Link href={user.paciente ? '/dashboard/paciente' : '/dashboard'} className="btn btn-ghost text-sm text-slate-600 dark:text-slate-300">
                  {t('nav').dashboard}
                </Link>
              ) : (
                <Link href="/login" className="btn btn-primary btn-sm">{t('auth').login}</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="page-container py-6 max-w-4xl mx-auto">
        {/* ── Guest confirmation (no account) ────────────── */}
        {guestTurnoReservado && profesional ? (
          <GuestConfirmacion
            turno={guestTurnoReservado}
            profesional={profesional}
            modalidad={modalidad}
            email={guestForm.email}
          />
        ) : turnoReservado && profesional ? (
          /* ── Confirmation card (logged in, free turno) ── */
          <ConfirmacionTurno
            turno={turnoReservado}
            profesional={profesional}
            modalidad={modalidad}
            onContinuar={() => router.push('/dashboard/paciente')}
          />
        ) : (
        <>
        {inlineNotice && (
          <div className={`alert mb-4 ${
            inlineNotice.type === 'success' ? 'alert-success' :
            inlineNotice.type === 'warning' ? 'alert-warning' :
            inlineNotice.type === 'error' ? 'alert-error' : 'alert-info'
          }`} role="status" aria-live="polite">
            <InfoIcon size={15} className="shrink-0" />
            <span>{inlineNotice.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ── Left: Professional profile ────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center">
                {profesional.fotoUrl ? (
                  <img
                    src={profesional.fotoUrl}
                    alt={`${profesional.nombre} ${profesional.apellido}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-3"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-3 border-4 border-white">
                    {initials}
                  </div>
                )}

                <h1 className="text-xl font-bold text-slate-800">
                  {profesional.nombre} {profesional.apellido}
                </h1>
                {profesional.especialidad?.nombre && (
                  <span className="badge badge-blue mt-1.5">{profesional.especialidad.nombre}</span>
                )}

                {/* Rating */}
                {resenas && resenas.stats.total > 0 ? (
                  <div className="flex items-center gap-1.5 mt-2">
                    <StarRating value={resenas.stats.promedio ?? 0} size={15} />
                    <span className="text-sm font-semibold text-slate-700">{resenas.stats.promedio}</span>
                    <span className="text-xs text-slate-400">({resenas.stats.total} reseña{resenas.stats.total !== 1 ? 's' : ''})</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">Sin calificaciones aún</p>
                )}
              </div>

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                {profesional.precioConsulta > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Consulta desde</span>
                    <span className="font-bold text-emerald-600">
                      ${Number(profesional.precioConsulta).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                {profesional.lugarAtencion && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPinIcon size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{profesional.lugarAtencion}</span>
                  </div>
                )}
                {profesional.telefono && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <PhoneIcon size={14} className="text-slate-400" />
                    <span>{profesional.telefono}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profesional.bio && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">{profesional.bio}</p>
                </div>
              )}
            </div>

            {/* Weekly availability (read-only) */}
            {profesional.disponibilidades && profesional.disponibilidades.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <ClockIcon size={14} className="text-slate-400" />
                  Horarios habituales
                </h3>
                <div className="space-y-1.5">
                  {profesional.disponibilidades.map((disp: any) => (
                    <div key={disp.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium w-20">{DIAS_SEMANA[disp.diaSemana]}</span>
                      <span className="text-slate-500">{disp.horaInicio} — {disp.horaFin}</span>
                      <span className={`badge ${disp.modalidad === 'VIRTUAL' ? 'badge-blue' : 'badge-green'}`}>
                        {disp.modalidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* ── Reseñas ──────────────────────────────── */}
            {resenas && resenas.stats.total > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" className="shrink-0"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                  Calificaciones
                </h3>

                {/* Summary bar */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                  <div className="text-center shrink-0">
                    <p className="text-3xl font-extrabold text-slate-800">{resenas.stats.promedio}</p>
                    <StarRating value={resenas.stats.promedio ?? 0} size={12} />
                    <p className="text-xs text-slate-400 mt-0.5">{resenas.stats.total} reseña{resenas.stats.total !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Reviews list */}
                <div className="space-y-3">
                  {resenas.resenas.map((r) => (
                    <div key={r.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                            {r.paciente?.nombre?.[0]}{r.paciente?.apellido?.[0]}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {r.paciente?.nombre} {r.paciente?.apellido}
                          </span>
                        </div>
                        <StarRating value={r.rating} size={12} />
                      </div>
                      {r.comentario && (
                        <p className="text-xs text-slate-500 ml-9 leading-relaxed">{r.comentario}</p>
                      )}
                      <p className="text-[10px] text-slate-400 ml-9 mt-1">
                        {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {resenas.pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                    <button
                      disabled={resenaPage === 1}
                      onClick={() => loadResenas(resenaPage - 1)}
                      className="text-xs text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:underline"
                    >
                      ← Anteriores
                    </button>
                    <span className="text-xs text-slate-400">{resenaPage} / {resenas.pagination.totalPages}</span>
                    <button
                      disabled={resenaPage === resenas.pagination.totalPages}
                      onClick={() => loadResenas(resenaPage + 1)}
                      className="text-xs text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:underline"
                    >
                      Siguientes →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Booking ────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="card p-5">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Reservar turno</h2>

              <div className="mb-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  {[
                    { n: 1, label: 'Elegir dia' },
                    { n: 2, label: 'Elegir horario' },
                    { n: 3, label: 'Confirmar reserva' },
                  ].map((step) => (
                    <div key={step.n} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold ${bookingStep >= step.n ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {step.n}
                      </span>
                      <span className={`${bookingStep >= step.n ? 'text-slate-800' : 'text-slate-500'} font-medium`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modalidad toggle */}
              <div className="mb-5">
                <p className="field-label mb-2">Modalidad de atención</p>
                <div className="flex gap-3">
                  {[
                    { value: 'PRESENCIAL' as const, icon: <BuildingIcon size={14} />, label: 'Presencial' },
                    { value: 'VIRTUAL' as const, icon: <VideoIcon size={14} />, label: 'Virtual' },
                  ].map(({ value, icon, label }) => (
                    <label key={value} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer flex-1 justify-center font-medium text-sm transition-all ${
                      modalidad === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}>
                      <input type="radio" name="modalidad" value={value} checked={modalidad === value} onChange={() => { setModalidad(value); setSelectedSlot(null); }} className="sr-only" />
                      {icon}
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Date picker strip */}
              <div className="mb-5">
                <p className="field-label mb-2">Seleccioná un día</p>
                <div className="flex gap-1.5 flex-wrap">
                  {getProximosDias().map((fecha) => {
                    const isSelected = selectedDate?.toDateString() === fecha.toDateString();
                    const isToday = fecha.toDateString() === new Date().toDateString();
                    return (
                      <button
                        key={fecha.toISOString()}
                        onClick={() => { setSelectedDate(fecha); setSelectedSlot(null); }}
                        className={`flex flex-col items-center justify-center rounded-xl p-2 min-w-[50px] border-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : isToday
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-wide">
                          {DIAS_SEMANA[fecha.getDay()].slice(0, 3)}
                        </span>
                        <span className="text-base font-bold leading-none mt-0.5">{fecha.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot selection */}
              {selectedDate && (
                <div className="mb-5">
                  <p className="field-label mb-2">
                    Horarios para el {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>

                  {slots.length === 0 ? (
                    // No availability configured for this day
                    <div className="alert alert-warning">
                      <InfoIcon size={16} className="shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Sin disponibilidad para este día</p>
                        {selectedWaitlistItem ? (
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                            <span className="text-xs">Ya estás en lista de espera ({selectedWaitlistItem.estado})</span>
                            <button
                              onClick={handleSalirListaEspera}
                              disabled={suscribiendoLista}
                              className="btn btn-secondary btn-sm text-xs"
                            >
                              {suscribiendoLista ? 'Procesando...' : 'Salir de lista'}
                            </button>
                          </div>
                        ) : (
                           <button
                             onClick={handleUnirseListaEspera}
                             disabled={suscribiendoLista}
                             className="btn btn-sm mt-2 bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                           >
                            {suscribiendoLista ? 'Guardando...' : 'Anotarme en lista de espera'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {slots.map((slot) => (
                        <button
                          key={slot.hora}
                          onClick={() => slot.disponible && setSelectedSlot(slot.hora)}
                          disabled={!slot.disponible}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                            !slot.disponible
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 cursor-not-allowed line-through'
                              : selectedSlot === slot.hora
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                          }`}
                        >
                          {slot.hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="alert alert-error mb-4 text-sm">
                  <XIcon size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Booking summary + CTA */}
              {selectedSlot && selectedDate && (
                <div className="border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-2" aria-live="polite">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-3 font-medium">
                    Reservando turno con <strong>{profesional.nombre} {profesional.apellido}</strong>
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-blue-700 dark:text-blue-300 mb-4">
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-lg px-2.5 py-1 border border-blue-200 dark:border-blue-700">
                      <CalendarIcon size={13} />
                      {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-lg px-2.5 py-1 border border-blue-200 dark:border-blue-700">
                      <ClockIcon size={13} />
                      {selectedSlot}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-lg px-2.5 py-1 border border-blue-200 dark:border-blue-700">
                      {modalidad === 'VIRTUAL' ? <VideoIcon size={13} /> : <BuildingIcon size={13} />}
                      {modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                    </span>
                  </div>

                  {profesional.precioConsulta > 0 && (
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Se te pedirá el pago de <strong>${Number(profesional.precioConsulta).toLocaleString('es-AR')}</strong> via Mercado Pago al confirmar.
                    </p>
                  )}

                  {/* Guest form — shown when not logged in and user clicked "Confirmar" */}
                  {!user && showGuestForm ? (
                    <div className="space-y-3 mb-4 border-t border-blue-200 dark:border-blue-700 pt-4">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Tus datos para la reserva</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label">Nombre *</label>
                          <input
                            value={guestForm.nombre}
                            onChange={(e) => setGuestForm((p) => ({ ...p, nombre: e.target.value }))}
                            placeholder="Juan"
                            className="field-input"
                          />
                        </div>
                        <div>
                          <label className="field-label">Apellido *</label>
                          <input
                            value={guestForm.apellido}
                            onChange={(e) => setGuestForm((p) => ({ ...p, apellido: e.target.value }))}
                            placeholder="García"
                            className="field-input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="field-label">Email * <span className="text-slate-400 font-normal">(recibirás la confirmación aquí)</span></label>
                        <input
                          type="email"
                          value={guestForm.email}
                          onChange={(e) => setGuestForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="juan@email.com"
                          className="field-input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Teléfono <span className="text-slate-400 font-normal">(opcional)</span></label>
                        <input
                          type="tel"
                          value={guestForm.telefono}
                          onChange={(e) => setGuestForm((p) => ({ ...p, telefono: e.target.value }))}
                          placeholder="+54 9 11 1234-5678"
                          className="field-input"
                        />
                      </div>
                      {guestFormError && (
                        <p className="text-xs text-red-600 font-medium">{guestFormError}</p>
                      )}
                      <button
                        onClick={handleReservarInvitado}
                        disabled={reservando}
                        className="btn btn-success btn-lg w-full"
                      >
                        {reservando ? (
                          <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Reservando...</>
                        ) : (
                          <><CheckIcon size={16} />Confirmar como invitado</>
                        )}
                      </button>
                      <p className="text-xs text-center text-blue-600 dark:text-blue-400">
                        ¿Tenés cuenta?{' '}
                        <Link href="/login" className="font-semibold underline">Iniciá sesión</Link>
                        {' '}para acceder a tu historial.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleReservar}
                      disabled={reservando}
                      className="btn btn-success btn-lg w-full"
                    >
                      {reservando ? (
                        <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Reservando...</>
                      ) : (
                        <><CheckIcon size={16} />Confirmar reserva</>
                      )}
                    </button>
                  )}

                  {!user && !showGuestForm && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2.5 text-center">
                      ¿Ya tenés cuenta?{' '}
                      <Link href="/login" className="font-semibold underline">Iniciá sesión</Link>
                    </p>
                  )}
                </div>
              )}

              {!selectedDate && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                  <CalendarIcon size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t('professional').selectDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}

/* ── Guest confirmation screen ───────────────────────────────────────────── */
function GuestConfirmacion({
  turno, profesional, modalidad, email,
}: {
  turno: { id: string; fechaHora: string; duracionMin: number; needsPago: boolean };
  profesional: Profesional;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  email: string;
}) {
  const fecha = new Date(turno.fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const horaStr  = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8 text-center space-y-5">
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${turno.needsPago ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
            {turno.needsPago ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {turno.needsPago ? 'Turno reservado — pendiente de pago' : '¡Turno reservado!'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {turno.needsPago
              ? 'Tu lugar está guardado. Para confirmarlo, completá el pago iniciando sesión.'
              : `Enviamos la confirmación a ${email}.`}
          </p>
        </div>

        {/* Turno details */}
        <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Profesional</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">Dr/a. {profesional.nombre} {profesional.apellido}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Especialidad</span>
            <span className="text-slate-700 dark:text-slate-300">{profesional.especialidad?.nombre}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Fecha</span>
            <span className="text-slate-700 dark:text-slate-300 capitalize">{fechaStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Horario</span>
            <span className="text-slate-700 dark:text-slate-300">{horaStr} h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Modalidad</span>
            <span className={`badge ${modalidad === 'VIRTUAL' ? 'badge-blue' : 'badge-gray'}`}>
              {modalidad === 'VIRTUAL' ? '💻 Virtual' : '🏥 Presencial'}
            </span>
          </div>
        </div>

        {/* Calendar buttons — only for free turnos */}
        {!turno.needsPago && (
          <AgendarCalendario
            turno={{
              turnoId: turno.id,
              fechaHora: turno.fechaHora,
              duracionMin: turno.duracionMin,
              modalidad,
              profesionalNombre: profesional.nombre,
              profesionalApellido: profesional.apellido,
              especialidad: profesional.especialidad?.nombre ?? '',
              lugarAtencion: profesional.lugarAtencion,
            }}
          />
        )}

        {turno.needsPago ? (
          <div className="space-y-2">
            <Link href="/login" className="btn btn-primary w-full">
              Iniciar sesión para pagar
            </Link>
            <Link href="/register" className="btn btn-secondary w-full">
              Crear cuenta en MediSync
            </Link>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">¿Querés acceder a tu historial de turnos?</p>
            <p className="text-xs mb-2">Creá una cuenta gratis con el mismo email para gestionar tus consultas.</p>
            <Link href="/register" className="btn btn-primary btn-sm w-full">
              Crear cuenta en MediSync
            </Link>
          </div>
        )}

        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 block">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

/* ── Confirmation screen after free booking ─────────────────────────────── */
function ConfirmacionTurno({
  turno, profesional, modalidad, onContinuar,
}: {
  turno: { id: string; fechaHora: string; duracionMin: number };
  profesional: Profesional;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  onContinuar: () => void;
}) {
  const fecha = new Date(turno.fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const horaStr  = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8 text-center space-y-5">
        {/* Check circle */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">¡Turno confirmado!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tu consulta fue reservada exitosamente.
          </p>
        </div>

        {/* Turno details */}
        <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Profesional</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              Dr/a. {profesional.nombre} {profesional.apellido}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Especialidad</span>
            <span className="text-slate-700 dark:text-slate-300">{profesional.especialidad?.nombre}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Fecha</span>
            <span className="text-slate-700 dark:text-slate-300 capitalize">{fechaStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Horario</span>
            <span className="text-slate-700 dark:text-slate-300">{horaStr} h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Modalidad</span>
            <span className={`badge ${modalidad === 'VIRTUAL' ? 'badge-blue' : 'badge-gray'}`}>
              {modalidad === 'VIRTUAL' ? '💻 Virtual' : '🏥 Presencial'}
            </span>
          </div>
          {profesional.lugarAtencion && modalidad === 'PRESENCIAL' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0">Lugar</span>
              <span className="text-slate-700 dark:text-slate-300">{profesional.lugarAtencion}</span>
            </div>
          )}
        </div>

        {/* Calendar buttons */}
        <AgendarCalendario
          turno={{
            turnoId: turno.id,
            fechaHora: turno.fechaHora,
            duracionMin: turno.duracionMin,
            modalidad,
            profesionalNombre: profesional.nombre,
            profesionalApellido: profesional.apellido,
            especialidad: profesional.especialidad?.nombre ?? '',
            lugarAtencion: profesional.lugarAtencion,
          }}
        />

        <button onClick={onContinuar} className="btn btn-primary w-full">
          Ir a mis turnos
        </button>
      </div>
    </div>
  );
}
