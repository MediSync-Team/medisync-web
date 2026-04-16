'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Profesional, Slot, ListaEsperaItem } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  MediSyncLogo, ArrowLeftIcon, MapPinIcon, PhoneIcon, VideoIcon,
  BuildingIcon, CalendarIcon, ClockIcon, CheckIcon, XIcon, UserIcon, InfoIcon,
  StarIcon, SearchIcon,
} from '../../components/icons';
import { DIAS_SEMANA, estadoBadge } from '../../lib/utils';

export default function ProfesionalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
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

  useEffect(() => { loadProfesional(); }, [params.id]);
  useEffect(() => { loadListaEsperaActiva(); }, [params.id, user?.paciente?.id]);
  useEffect(() => { if (selectedDate) loadSlots(selectedDate); }, [selectedDate, modalidad]);

  const loadProfesional = async () => {
    try {
      const data = await api.profesionales.getById(params.id as string);
      setProfesional(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

  const handleReservar = async () => {
    if (!selectedSlot || !selectedDate || !profesional) return;
    if (!user) { router.push('/login'); return; }

    setReservando(true);
    setError('');

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const [hora, minuto] = selectedSlot.split(':').map(Number);
      const fechaHora = new Date(year, month, day, hora, minuto, 0, 0);

      const reservaData: Parameters<typeof api.turnos.reservar>[0] = {
        profesionalId: profesional.id,
        fechaHora: fechaHora.toISOString(),
        modalidad,
      };

      if (user.paciente) {
        reservaData.paciente = {
          nombre: user.paciente.nombre,
          apellido: user.paciente.apellido,
          email: user.paciente.email,
          telefono: user.paciente.telefono,
          dni: user.paciente.dni,
        };
      }

      const reserva = await api.turnos.reservar(reservaData);

      if (profesional.precioConsulta > 0) {
        router.push(`/pago?turno=${reserva.turno.id}`);
        return;
      }

      setSuccessMessage('¡Turno reservado con éxito!');
      setInlineNotice({ type: 'success', text: 'Reserva completada. Redirigiendo a tu panel...' });
      setTimeout(() => router.push('/dashboard/paciente'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar');
      setInlineNotice({ type: 'error', text: err instanceof Error ? err.message : 'Error al reservar turno' });
    } finally {
      setReservando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-50">
      {/* ── Navbar ──────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
              <ArrowLeftIcon size={16} />
              <span className="text-sm font-medium">Volver</span>
            </Link>
            <div className="flex items-center gap-2">
              <MediSyncLogo size={24} />
              <span className="text-sm font-bold text-slate-700">MediSync</span>
            </div>
            {user ? (
              <Link href={user.paciente ? '/dashboard/paciente' : '/dashboard'} className="btn btn-ghost text-sm text-slate-600">
                Mi panel
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">Iniciar sesión</Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Success banner ──────────────────────────────── */}
      {successMessage && (
        <div className="bg-emerald-600 text-white">
          <div className="page-container py-3 flex items-center gap-2.5 text-sm">
            <CheckIcon size={16} />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      <main className="page-container py-6 max-w-4xl mx-auto">
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

                {/* Rating placeholder */}
                <div className="flex items-center gap-0.5 mt-2 text-amber-400">
                  {[1,2,3,4].map(i => <StarIcon key={i} size={13} />)}
                  <StarIcon size={13} className="text-slate-200" />
                  <span className="text-xs text-slate-500 ml-1.5">4.0</span>
                </div>
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
          </div>

          {/* ── Right: Booking ────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="card p-5">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Reservar turno</h2>

              <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
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
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
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
                              ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed line-through'
                              : selectedSlot === slot.hora
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400'
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
                <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4 mt-2" aria-live="polite">
                  <p className="text-sm text-blue-800 mb-3 font-medium">
                    Reservando turno con <strong>{profesional.nombre} {profesional.apellido}</strong>
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-blue-700 mb-4">
                    <span className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1 border border-blue-200">
                      <CalendarIcon size={13} />
                      {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1 border border-blue-200">
                      <ClockIcon size={13} />
                      {selectedSlot}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1 border border-blue-200">
                      {modalidad === 'VIRTUAL' ? <VideoIcon size={13} /> : <BuildingIcon size={13} />}
                      {modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                    </span>
                  </div>

                   {profesional.precioConsulta > 0 && (
                     <p className="text-sm text-blue-700 mb-3">
                       Se te pedira el pago de <strong>${Number(profesional.precioConsulta).toLocaleString('es-AR')}</strong> via Mercado Pago al confirmar.
                     </p>
                   )}

                  <button
                    onClick={handleReservar}
                    disabled={reservando}
                    className="btn btn-success btn-lg w-full"
                  >
                    {reservando ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        Reservando...
                      </>
                    ) : (
                      <><CheckIcon size={16} /> Confirmar reserva</>
                    )}
                  </button>

                  {!user && (
                    <p className="text-xs text-blue-600 mt-2.5 text-center">
                      Necesitás{' '}
                      <Link href="/login" className="font-semibold underline">iniciar sesión</Link>
                      {' '}para completar la reserva.
                    </p>
                  )}
                </div>
              )}

              {!selectedDate && (
                <div className="text-center py-6 text-slate-400">
                  <CalendarIcon size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Seleccioná un día para ver los horarios disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
