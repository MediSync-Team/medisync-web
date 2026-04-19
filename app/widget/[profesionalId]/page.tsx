'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, Profesional, Slot } from '../../lib/api';
import { BuildingIcon, VideoIcon, MapPinIcon } from '../../components/icons';

const FRONTEND_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'https://medisync-web.medisync.workers.dev';

/* ── Helpers ─────────────────────────────────────────────── */
function fmt(d: Date, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString('es-AR', opts);
}
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function buildDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

type Step = 'date' | 'slot' | 'guest' | 'done';
const STEPS: Step[] = ['date', 'slot', 'guest', 'done'];
const STEP_LABELS: Record<Step, string> = {
  date:  'Fecha',
  slot:  'Horario',
  guest: 'Datos',
  done:  '¡Listo!',
};

/* ── Stepper ─────────────────────────────────────────────── */
function Stepper({ current }: { current: Step }) {
  const currentIdx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0 px-4 pt-4 pb-2">
      {STEPS.filter(s => s !== 'done').map((s, i) => {
        const idx   = STEPS.indexOf(s);
        const done  = idx < currentIdx;
        const active = s === current;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'bg-blue-600 text-white ring-2 ring-blue-200' :
                         'bg-slate-100 text-slate-400'
              }`}>
                {done
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1
                }
              </div>
              <span className={`text-[9px] mt-0.5 font-semibold whitespace-nowrap ${
                active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400'
              }`}>{STEP_LABELS[s]}</span>
            </div>
            {i < STEPS.filter(s => s !== 'done').length - 1 && (
              <div className={`h-px flex-1 mx-1 mb-3 transition-colors ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function WidgetPage() {
  const params = useParams();
  const profId = params.profesionalId as string;

  const [profesional, setProfesional]   = useState<Profesional | null>(null);
  const [loadingProf, setLoadingProf]   = useState(true);

  const [step, setStep]                         = useState<Step>('date');
  const [days]                                  = useState<Date[]>(buildDays(30));
  const [selectedDay, setSelectedDay]           = useState<Date | null>(null);
  const [modalidad, setModalidad]               = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [slots, setSlots]                       = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots]         = useState(false);
  const [selectedSlot, setSelectedSlot]         = useState<string | null>(null);

  const [guest, setGuest]         = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [guestError, setGuestError] = useState('');
  const [reservando, setReservando] = useState(false);

  const [confirmed, setConfirmed]   = useState<{ id: string; fechaHora: string; needsPago: boolean } | null>(null);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    api.profesionales.getById(profId)
      .then(setProfesional)
      .catch(() => setProfesional(null))
      .finally(() => setLoadingProf(false));
  }, [profId]);

  useEffect(() => {
    if (!selectedDay) return;
    setSlots([]);
    setSelectedSlot(null);
    setLoadingSlots(true);
    api.profesionales.getSlots(profId, dateKey(selectedDay), modalidad)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDay, modalidad, profId]);

  const handleReservar = async () => {
    const { nombre, apellido, email } = guest;
    if (!nombre.trim() || !apellido.trim()) { setGuestError('Nombre y apellido son requeridos.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setGuestError('Email inválido.'); return; }
    if (!selectedDay || !selectedSlot || !profesional) return;

    setReservando(true);
    setGuestError('');
    setBookingError('');
    try {
      const [h, m] = selectedSlot.split(':').map(Number);
      const fechaHora = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), h, m);
      const res = await api.turnos.reservar({
        profesionalId: profId,
        fechaHora: fechaHora.toISOString(),
        modalidad,
        paciente: { nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim().toLowerCase(), telefono: guest.telefono.trim() || undefined },
      });
      setConfirmed({
        id: res.turno.id,
        fechaHora: res.turno.fechaHora,
        needsPago: Number(profesional.precioConsulta) > 0,
      });
      setStep('done');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'No se pudo reservar. Intentá de nuevo.');
    } finally {
      setReservando(false);
    }
  };

  /* ── Loading ── */
  if (loadingProf) {
    return (
      <div className="widget-shell flex items-center justify-center min-h-[260px]">
        <Spinner />
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="widget-shell flex items-center justify-center min-h-[180px]">
        <p className="text-slate-500 text-sm">Profesional no encontrado.</p>
      </div>
    );
  }

  const availableSlots  = slots.filter(s => s.disponible);
  const supportsVirtual = profesional.disponibilidades?.some(d =>
    d.modalidad === 'VIRTUAL' || d.modalidad === 'AMBOS'
  );

  /* ── DONE ── */
  if (step === 'done' && confirmed) {
    const fh = new Date(confirmed.fechaHora);
    return (
      <div className="widget-shell flex flex-col">
        <Stepper current="done" />
        <div className="p-5 flex flex-col items-center gap-4 text-center flex-1">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">¡Turno reservado!</p>
            <p className="text-sm text-slate-600 mt-1">
              {fmt(fh, { weekday: 'long', day: 'numeric', month: 'long' })} · {fh.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              con {profesional.nombre} {profesional.apellido}
            </p>
            <p className="text-xs text-slate-500 inline-flex items-center gap-1">
              {modalidad === 'VIRTUAL' ? <VideoIcon size={11} className="text-blue-600" /> : <MapPinIcon size={11} className="text-slate-500" />}
              {modalidad === 'VIRTUAL' ? 'Modalidad virtual' : (profesional.lugarAtencion ?? 'Presencial')}
            </p>
          </div>

          {/* Summary box */}
          <div className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-left space-y-1.5 text-xs text-slate-600">
            <Row label="Paciente" value={`${guest.nombre} ${guest.apellido}`} />
            <Row label="Email"    value={guest.email} />
            {guest.telefono && <Row label="Teléfono" value={guest.telefono} />}
            {Number(profesional.precioConsulta) > 0 && (
              <Row label="Precio" value={`$${Number(profesional.precioConsulta).toLocaleString('es-AR')}`} />
            )}
          </div>

          {confirmed.needsPago && (
            <a
              href={`${FRONTEND_URL}/pago?turno=${confirmed.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="widget-btn-primary w-full text-center"
            >
              Completar pago →
            </a>
          )}

          <a
            href={`${FRONTEND_URL}/profesional/${profId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Ver perfil completo en MediSync
          </a>
          <WidgetBranding />
        </div>
      </div>
    );
  }

  /* ── GUEST FORM ── */
  if (step === 'guest') {
    return (
      <div className="widget-shell flex flex-col">
        <Stepper current="guest" />
        <div className="p-4 space-y-3 flex-1">
          {/* Summary pill */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="font-medium text-slate-700">{selectedDay && fmt(selectedDay, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span>·</span>
            <span>{selectedSlot}h</span>
            <span>·</span>
            <span>{modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}</span>
            <button onClick={() => setStep('slot')} className="ml-auto text-blue-600 hover:underline">Cambiar</button>
          </div>

          <p className="text-sm font-semibold text-slate-700">Tus datos de contacto</p>

          {(bookingError || guestError) && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {bookingError || guestError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="widget-label">Nombre *</label>
              <input className="widget-input" value={guest.nombre} onChange={e => setGuest(g => ({ ...g, nombre: e.target.value }))} placeholder="Juan" />
            </div>
            <div>
              <label className="widget-label">Apellido *</label>
              <input className="widget-input" value={guest.apellido} onChange={e => setGuest(g => ({ ...g, apellido: e.target.value }))} placeholder="García" />
            </div>
          </div>
          <div>
            <label className="widget-label">Email *</label>
            <input className="widget-input" type="email" value={guest.email} onChange={e => setGuest(g => ({ ...g, email: e.target.value }))} placeholder="juan@email.com" />
          </div>
          <div>
            <label className="widget-label">Teléfono <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input className="widget-input" value={guest.telefono} onChange={e => setGuest(g => ({ ...g, telefono: e.target.value }))} placeholder="+54 11 1234 5678" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep('slot')} className="widget-btn-secondary flex-1">← Volver</button>
            <button onClick={handleReservar} disabled={reservando} className="widget-btn-primary flex-1">
              {reservando ? <Spinner sm /> : 'Confirmar turno'}
            </button>
          </div>

          <WidgetBranding />
        </div>
      </div>
    );
  }

  /* ── DATE + SLOT PICKER ── */
  return (
    <div className="widget-shell flex flex-col">
      <Stepper current={selectedDay ? 'slot' : 'date'} />
      <div className="p-4 space-y-4 flex-1">
        <ProfHeader profesional={profesional} />

        {/* Modalidad toggle */}
        {supportsVirtual && (
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
            {(['PRESENCIAL', 'VIRTUAL'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setModalidad(m); setSelectedSlot(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${modalidad === m ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  {m === 'PRESENCIAL' ? <BuildingIcon size={11} /> : <VideoIcon size={11} />}
                  {m === 'PRESENCIAL' ? 'Presencial' : 'Virtual'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Day strip */}
        <div>
          <p className="widget-section-label">Seleccioná un día</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {days.map(d => {
              const active  = selectedDay && dateKey(d) === dateKey(selectedDay);
              const isToday = dateKey(d) === dateKey(new Date());
              return (
                <button
                  key={dateKey(d)}
                  onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}
                  className={`shrink-0 flex flex-col items-center py-2 px-2.5 rounded-xl border text-center transition-all ${
                    active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold opacity-70">
                    {isToday ? 'Hoy' : fmt(d, { weekday: 'short' })}
                  </span>
                  <span className="text-base font-bold leading-none mt-0.5">
                    {fmt(d, { day: 'numeric' })}
                  </span>
                  <span className="text-[10px] opacity-70">{fmt(d, { month: 'short' })}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot grid */}
        {selectedDay && (
          <div>
            <p className="widget-section-label">
              Horarios — {fmt(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {loadingSlots ? (
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-8 w-14 rounded-lg" />)}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Sin horarios disponibles este día.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableSlots.map(s => (
                  <button
                    key={s.hora}
                    onClick={() => setSelectedSlot(s.hora === selectedSlot ? null : s.hora)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedSlot === s.hora
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {s.hora}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {selectedSlot && (
          <button
            onClick={() => setStep('guest')}
            className="widget-btn-primary w-full"
          >
            Continuar con {selectedSlot}h →
          </button>
        )}

        {!selectedDay && (
          <p className="text-xs text-slate-400 text-center">Seleccioná un día para ver los horarios disponibles</p>
        )}

        <WidgetBranding />
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right truncate">{value}</span>
    </div>
  );
}

function ProfHeader({ profesional }: { profesional: Profesional }) {
  const initials = `${profesional.nombre[0]}${profesional.apellido[0]}`.toUpperCase();
  const obrasSociales = (profesional as any).obrasSociales as string[] | undefined;
  return (
    <div className="flex items-start gap-3 pb-1 border-b border-slate-100">
      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 overflow-hidden">
        {profesional.fotoUrl
          ? <img src={profesional.fotoUrl} alt="" className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800">
          {profesional.nombre} {profesional.apellido}
        </p>
        <p className="text-xs text-blue-600">{profesional.especialidad?.nombre}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {Number(profesional.precioConsulta) > 0 && (
            <span className="text-xs text-slate-500">
              ${Number(profesional.precioConsulta).toLocaleString('es-AR')} / consulta
            </span>
          )}
          {obrasSociales && obrasSociales.length > 0 && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 font-medium">
              {obrasSociales.length === 1 ? obrasSociales[0] : `${obrasSociales.length} obras sociales`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WidgetBranding() {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      <span className="text-[10px] text-slate-400">Powered by</span>
      <a
        href="https://medisync-web.medisync.workers.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-semibold text-blue-600 hover:underline"
      >
        MediSync
      </a>
    </div>
  );
}

function Spinner({ sm }: { sm?: boolean }) {
  const s = sm ? 14 : 24;
  return (
    <svg className="animate-spin" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}
