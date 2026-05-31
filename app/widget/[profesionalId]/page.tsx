'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, Profesional, Slot } from '../../lib/api';
import { useLang } from '../../lib/i18n/context';
import type { Translations } from '../../lib/i18n/translations';
import {
  buildUpcomingClinicDateKeys,
  clinicDateKeyFromInstant,
  formatClinicDateKeyForDisplay,
  formatClinicInstantTime,
  getLocale,
  todayInputValue,
} from '../../lib/date';
import { getProfessionalBookingLoginPath, getProfessionalProfilePath } from '../../lib/auth-redirects';
import { BuildingIcon, VideoIcon, MapPinIcon } from '../../components/icons';
import Spinner from '../../components/Spinner';

const FRONTEND_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'https://medisync-web.medisync.workers.dev';

type Step = 'date' | 'slot' | 'guest' | 'done';
const STEPS: Step[] = ['date', 'slot', 'guest', 'done'];
type WidgetTranslations = Translations['widget'];

/* -- Stepper ----------------------------------------------- */
function Stepper({ current, labels }: { current: Step; labels: WidgetTranslations['steps'] }) {
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
              }`}>{labels[s]}</span>
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

/* -- Main component ---------------------------------------- */
export default function WidgetPage() {
  const params = useParams();
  const profId = params.profesionalId as string;
  const { t, lang } = useLang();
  const widget = t('widget');
  const modalityLabels = t('modality');
  const locale = getLocale(lang);
  const formatDateKey = (dateKey: string, opts: Intl.DateTimeFormatOptions) =>
    formatClinicDateKeyForDisplay(dateKey, locale, opts);

  const [profesional, setProfesional]   = useState<Profesional | null>(null);
  const [loadingProf, setLoadingProf]   = useState(true);

  const [step, setStep]                         = useState<Step>('date');
  const [days]                                  = useState<string[]>(() => buildUpcomingClinicDateKeys(30));
  const [selectedDateKey, setSelectedDateKey]   = useState<string | null>(null);
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
    if (!selectedDateKey) return;
    setSlots([]);
    setSelectedSlot(null);
    setLoadingSlots(true);
    api.profesionales.getSlots(profId, selectedDateKey, modalidad)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDateKey, modalidad, profId]);

  const profileUrl = `${FRONTEND_URL}${getProfessionalProfilePath(profId)}`;
  const loginUrl = `${FRONTEND_URL}${getProfessionalBookingLoginPath(profId)}`;

  /* -- Loading -- */
  if (loadingProf) {
    return (
      <div className="widget-shell flex items-center justify-center min-h-[260px]">
        <Spinner size={24} />
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="widget-shell flex items-center justify-center min-h-[180px]">
        <p className="text-slate-500 text-sm">{widget.notFound}</p>
      </div>
    );
  }

  const availableSlots  = slots.filter(s => s.disponible);
  const supportsVirtual = profesional.disponibilidades?.some(d =>
    d.modalidad === 'VIRTUAL' || d.modalidad === 'AMBOS'
  );

  /* -- DONE -- */
  if (step === 'done' && confirmed) {
    const confirmedDateKey = clinicDateKeyFromInstant(confirmed.fechaHora);
    return (
      <div className="widget-shell flex flex-col">
        <Stepper current="done" labels={widget.steps} />
        <div className="p-5 flex flex-col items-center gap-4 text-center flex-1">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">{widget.reservedTitle}</p>
            <p className="text-sm text-slate-600 mt-1">
              {formatDateKey(confirmedDateKey, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatClinicInstantTime(confirmed.fechaHora, locale)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {widget.withProfessional} {profesional.nombre} {profesional.apellido}
            </p>
            <p className="text-xs text-slate-500 inline-flex items-center gap-1">
              {modalidad === 'VIRTUAL' ? <VideoIcon size={11} className="text-blue-600" /> : <MapPinIcon size={11} className="text-slate-500" />}
              {modalidad === 'VIRTUAL' ? modalityLabels.VIRTUAL : (profesional.lugarAtencion ?? widget.inPersonFallback)}
            </p>
          </div>

          {/* Summary box */}
          <div className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-left space-y-1.5 text-xs text-slate-600">
            <Row label={widget.patient} value={`${guest.nombre} ${guest.apellido}`} />
            <Row label={widget.email} value={guest.email} />
            {guest.telefono && <Row label={widget.phone} value={guest.telefono} />}
            {Number(profesional.precioConsulta) > 0 && (
              <Row label={widget.price} value={`$${Number(profesional.precioConsulta).toLocaleString(locale)}`} />
            )}
          </div>

          {confirmed.needsPago && (
            <a
              href={`${FRONTEND_URL}/pago?turno=${confirmed.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="widget-btn-primary w-full text-center"
            >
              {widget.completePayment}
            </a>
          )}

          <a
            href={`${FRONTEND_URL}/profesional/${profId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {widget.viewFullProfile}
          </a>
          <WidgetBranding label={widget.poweredBy} />
        </div>
      </div>
    );
  }

  /* -- GUEST FORM -- */
  if (step === 'guest') {
    return (
      <div className="widget-shell flex flex-col">
        <Stepper current="guest" labels={widget.steps} />
        <div className="p-4 space-y-3 flex-1">
          {/* Summary pill */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="font-medium text-slate-700">
              {selectedDateKey && formatDateKey(selectedDateKey, { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span>·</span>
            <span>{selectedSlot}h</span>
            <span>·</span>
            <span>{modalityLabels[modalidad]}</span>
            <button onClick={() => setStep('slot')} className="ml-auto text-blue-600 hover:underline">{widget.change}</button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            <p className="font-semibold">{widget.guestLoginTitle}</p>
            <p className="text-xs mt-1">
              {widget.guestLoginDesc}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep('slot')} className="widget-btn-secondary flex-1">{widget.back}</button>
            <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="widget-btn-primary flex-1 text-center">
              {widget.login}
            </a>
          </div>

          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-blue-600 hover:underline">
            {widget.viewFullProfile}
          </a>

          <WidgetBranding label={widget.poweredBy} />
        </div>
      </div>
    );
  }

  /* -- DATE + SLOT PICKER -- */
  return (
    <div className="widget-shell flex flex-col">
      <Stepper current={selectedDateKey ? 'slot' : 'date'} labels={widget.steps} />
      <div className="p-4 space-y-4 flex-1">
        <ProfHeader profesional={profesional} locale={locale} labels={widget} />

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
                  {modalityLabels[m]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Day strip */}
        <div>
          <p className="widget-section-label">{widget.selectDay}</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {days.map(dayKey => {
              const active  = selectedDateKey === dayKey;
              const isToday = dayKey === todayInputValue();
              return (
                <button
                  key={dayKey}
                  onClick={() => { setSelectedDateKey(dayKey); setSelectedSlot(null); }}
                  className={`shrink-0 flex flex-col items-center py-2 px-2.5 rounded-xl border text-center transition-all ${
                    active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold opacity-70">
                    {isToday ? widget.today : formatDateKey(dayKey, { weekday: 'short' })}
                  </span>
                  <span className="text-base font-bold leading-none mt-0.5">
                    {formatDateKey(dayKey, { day: 'numeric' })}
                  </span>
                  <span className="text-[10px] opacity-70">{formatDateKey(dayKey, { month: 'short' })}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot grid */}
        {selectedDateKey && (
          <div>
            <p className="widget-section-label">
              {widget.schedules} — {formatDateKey(selectedDateKey, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {loadingSlots ? (
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-8 w-14 rounded-lg" />)}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">{widget.noSlots}</p>
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
            {widget.continueWith.replace('{{time}}', selectedSlot)}
          </button>
        )}

        {!selectedDateKey && (
          <p className="text-xs text-slate-400 text-center">{widget.selectDayFirst}</p>
        )}

        <WidgetBranding label={widget.poweredBy} />
      </div>
    </div>
  );
}

/* -- Sub-components ---------------------------------------- */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right truncate">{value}</span>
    </div>
  );
}

function ProfHeader({ profesional, locale, labels }: { profesional: Profesional; locale: string; labels: WidgetTranslations }) {
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
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {profesional.nombre} {profesional.apellido}
        </p>
        <p className="text-xs text-blue-600">{profesional.especialidad?.nombre}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {Number(profesional.precioConsulta) > 0 && (
            <span className="text-xs text-slate-500">
              ${Number(profesional.precioConsulta).toLocaleString(locale)} / {labels.consultationSuffix}
            </span>
          )}
          {obrasSociales && obrasSociales.length > 0 && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-1.5 py-0.5 font-medium">
              {obrasSociales.length === 1 ? obrasSociales[0] : `${obrasSociales.length} ${labels.insurancePlural}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WidgetBranding({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-1">
      <span className="text-[10px] text-slate-400">{label}</span>
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
