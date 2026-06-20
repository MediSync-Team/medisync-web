'use client';

import { useState, useCallback } from 'react';
import { api, Disponibilidad } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import { getLocale } from '../lib/date';
import { CalendarIcon, CheckIcon, ClipboardIcon, CreditCardIcon, InfoIcon, UserIcon } from './icons';

interface Props {
  profesionalId: string;
  userId: string;
  nombre: string;
  onComplete: () => void;
}

type Modalidad = 'PRESENCIAL' | 'VIRTUAL';

export default function ProfesionalOnboardingWizard({ profesionalId, userId, nombre, onComplete }: Props) {
  const { lang, t } = useLang();
  const labels = t('professionalOnboarding');
  const steps = [
    { ...labels.steps.profile, icon: '1' },
    { ...labels.steps.availability, icon: '2' },
    { ...labels.steps.price, icon: '3' },
    { ...labels.steps.done, icon: '4' },
  ];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // -- Step 0: Perfil ------------------------------------------
  const [fotoUrl, setFotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoError, setFotoError] = useState('');
  const [fotoOk, setFotoOk] = useState(false);

  // -- Step 1: Disponibilidad ----------------------------------
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [nuevaDisp, setNuevaDisp] = useState({
    diaSemana: 1,
    horaInicio: '09:00',
    horaFin: '17:00',
    modalidad: 'PRESENCIAL' as Modalidad,
  });
  const [addingDisp, setAddingDisp] = useState(false);

  // -- Step 2: Precio ------------------------------------------
  const [precio, setPrecio] = useState('');
  const [lugarAtencion, setLugarAtencion] = useState('');
  const [modalidadPerfil, setModalidadPerfil] = useState<'PRESENCIAL' | 'VIRTUAL' | 'AMBOS'>('PRESENCIAL');

  // -- Helpers -------------------------------------------------
  const inp = 'field-input mt-1';
  const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : 'https://medisync-web.medisync.workers.dev';
  const profileUrl = `${FRONTEND_URL}/profesional/${profesionalId}`;
  const modalityLabel = (modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'AMBOS') => labels.modality[modalidad];
  const profileModalityLabel = () => modalidadPerfil === 'AMBOS' ? labels.modality.PRESENCIAL_VIRTUAL : modalityLabel(modalidadPerfil);
  const progressLabel = labels.header.stepProgress
    .replace('{{current}}', String(Math.min(step + 1, steps.length)))
    .replace('{{total}}', String(steps.length));
  const availabilitySummary = disponibilidades.length === 1
    ? labels.done.availabilityConfiguredSingular
    : labels.done.availabilityConfiguredPlural.replace('{{count}}', String(disponibilidades.length));

  const saveProfile = useCallback(async () => {
    const data: Record<string, unknown> = {};
    if (fotoUrl.trim())       data.fotoUrl       = fotoUrl.trim();
    if (bio.trim())           data.bio           = bio.trim();
    if (matricula.trim())     data.matricula     = matricula.trim();
    if (telefono.trim())      data.telefono      = telefono.trim();
    if (precio && Number(precio) > 0) data.precioConsulta = Number(precio);
    if (lugarAtencion.trim()) data.lugarAtencion = lugarAtencion.trim();
    data.modalidad = modalidadPerfil;
    await api.profesional.updatePerfil(profesionalId, data as any);
  }, [fotoUrl, bio, matricula, telefono, precio, lugarAtencion, modalidadPerfil, profesionalId]);

  const handleAgregarDisp = async () => {
    if (nuevaDisp.horaInicio >= nuevaDisp.horaFin) {
      setError(labels.errors.endAfterStart);
      return;
    }
    setAddingDisp(true);
    setError('');
    try {
      const disp = await api.profesionales.crearDisponibilidad(profesionalId, nuevaDisp);
      setDisponibilidades(prev => [...prev, disp]);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.errors.addSchedule);
    } finally {
      setAddingDisp(false);
    }
  };

  const handleEliminarDisp = async (id: string) => {
    try {
      await api.profesionales.eliminarDisponibilidad(profesionalId, id);
      setDisponibilidades(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.errors.deleteSchedule);
    }
  };

  const goNext = async () => {
    setError('');
    setSaving(true);
    try {
      if (step === 0) {
        if (fotoUrl.trim() && !fotoUrl.startsWith('http')) {
          setError(labels.errors.photoUrl);
          setSaving(false);
          return;
        }
        // Save perfil fields
        const data: Record<string, unknown> = {};
        if (fotoUrl.trim())   data.fotoUrl   = fotoUrl.trim();
        if (bio.trim())       data.bio       = bio.trim();
        if (matricula.trim()) data.matricula = matricula.trim();
        if (telefono.trim())  data.telefono  = telefono.trim();
        if (Object.keys(data).length > 0) {
          await api.profesional.updatePerfil(profesionalId, data as any);
        }
      }
      if (step === 1) {
        if (disponibilidades.length === 0) {
          setError(labels.errors.scheduleRequired);
          setSaving(false);
          return;
        }
      }
      if (step === 2) {
        if (!precio || Number(precio) <= 0) {
          setError(labels.errors.validPrice);
          setSaving(false);
          return;
        }
        await saveProfile();
      }
      setStep(s => s + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(`medisync_onboarding_done_${userId}`, '1');
    onComplete();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl).catch(() => {});
  };

  const progressPct = step === 3 ? 100 : Math.round((step / (steps.length - 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* -- Header ------------------------------------------- */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
            {labels.header.welcome} {nombre}
          </p>
          <h2 className="text-lg font-bold">{labels.header.title}</h2>
          <p className="text-sm text-blue-100 mt-1">
            {labels.header.subtitle}
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-200 mb-1.5">
              <span>{progressLabel}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-blue-800/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* -- Step tabs ---------------------------------------- */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => { if (i < step) { setError(''); setStep(i); } }}
              className={`flex-1 py-2.5 text-[10px] font-medium flex flex-col items-center gap-0.5 transition-colors
                ${i === step
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-900/20'
                  : i < step
                    ? 'text-emerald-600 dark:text-emerald-400 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-500 cursor-default'
                }`}
            >
              <span className="text-base leading-none">{i < step ? <CheckIcon size={14} className="text-emerald-600" /> : s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        {/* -- Body --------------------------------------------- */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {error && (
            <div className="alert alert-error text-sm" role="alert" aria-live="polite" aria-atomic="true">{error}</div>
          )}

          {/* ═══ Step 0: Perfil ═══════════════════════════════ */}
          {step === 0 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {labels.profile.intro}
              </p>

              {/* Foto */}
              <div>
                <label className="field-label">{labels.profile.photoUrl}</label>
                <input
                  type="url"
                  className={inp}
                  placeholder={labels.profile.photoPlaceholder}
                  value={fotoUrl}
                  onChange={e => { setFotoUrl(e.target.value); setFotoOk(false); setFotoError(''); }}
                />
                {fotoUrl.trim().startsWith('http') && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt={labels.profile.photoPreviewAlt}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 shrink-0"
                      onLoad={() => setFotoOk(true)}
                      onError={() => { setFotoError(labels.errors.imageLoad); setFotoOk(false); }}
                    />
                    {fotoError && <p className="text-xs text-red-600">{fotoError}</p>}
                    {fotoOk && !fotoError && <p className="text-xs text-emerald-600">{labels.profile.photoOk}</p>}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="field-label">{labels.profile.bio}</label>
                <textarea
                  className="field-input mt-1 resize-none"
                  rows={3}
                  placeholder={labels.profile.bioPlaceholder}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={600}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/600</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Matrícula */}
                <div>
                  <label className="field-label">{labels.profile.license}</label>
                  <input
                    type="text"
                    className={inp}
                    placeholder={labels.profile.licensePlaceholder}
                    value={matricula}
                    onChange={e => setMatricula(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">{labels.profile.licenseHelp}</p>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="field-label">{labels.profile.phone}</label>
                  <input
                    type="tel"
                    className={inp}
                    placeholder={labels.profile.phonePlaceholder}
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">{labels.profile.phoneHelp}</p>
                </div>
              </div>
            </>
          )}

          {/* ═══ Step 1: Disponibilidad ═══════════════════════ */}
          {step === 1 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {labels.availability.intro}
              </p>

              {/* Form */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">{labels.availability.day}</label>
                    <select
                      className="field-select mt-1"
                      value={nuevaDisp.diaSemana}
                      onChange={e => setNuevaDisp(d => ({ ...d, diaSemana: Number(e.target.value) }))}
                    >
                      {labels.days.map((dia, i) => (
                        <option key={i} value={i}>{dia}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">{labels.availability.modality}</label>
                    <select
                      className="field-select mt-1"
                      value={nuevaDisp.modalidad}
                      onChange={e => setNuevaDisp(d => ({ ...d, modalidad: e.target.value as Modalidad }))}
                    >
                      <option value="PRESENCIAL">{labels.modality.PRESENCIAL}</option>
                      <option value="VIRTUAL">{labels.modality.VIRTUAL}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">{labels.availability.from}</label>
                    <input type="time" className={inp} value={nuevaDisp.horaInicio}
                      onChange={e => setNuevaDisp(d => ({ ...d, horaInicio: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">{labels.availability.to}</label>
                    <input type="time" className={inp} value={nuevaDisp.horaFin}
                      onChange={e => setNuevaDisp(d => ({ ...d, horaFin: e.target.value }))} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAgregarDisp}
                  disabled={addingDisp}
                  className="btn btn-secondary w-full text-sm"
                >
                  {addingDisp ? labels.availability.adding : labels.availability.add}
                </button>
              </div>

              {/* Lista */}
              {disponibilidades.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {labels.availability.configured} ({disponibilidades.length})
                  </p>
                  {disponibilidades.map(d => (
                    <div key={d.id}
                      className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                      <div className="text-sm text-emerald-800 dark:text-emerald-300">
                        <span className="font-semibold">{labels.days[d.diaSemana]}</span>
                        <span className="text-emerald-600 dark:text-emerald-500 mx-1.5">·</span>
                        {d.horaInicio}–{d.horaFin}
                        <span className="text-emerald-600 dark:text-emerald-500 mx-1.5">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                          {modalityLabel(d.modalidad)}
                        </span>
                      </div>
                      <button onClick={() => handleEliminarDisp(d.id)}
                        className="text-emerald-400 hover:text-red-500 transition-colors p-1 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <InfoIcon size={14} className="text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {labels.availability.empty}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ═══ Step 2: Precio ════════════════════════════════ */}
          {step === 2 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {labels.price.intro}
              </p>

              {/* Precio */}
              <div>
                <label className="field-label">
                  {labels.price.consultationPrice} <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                  <input
                    type="number" min={0} step={500}
                    className="field-input pl-7"
                    placeholder={labels.price.pricePlaceholder}
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {labels.price.priceHelp}
                </p>
              </div>

              {/* Modalidad */}
              <div>
                <label className="field-label">{labels.price.modality}</label>
                <div className="flex gap-2 mt-2">
                  {(['PRESENCIAL', 'VIRTUAL', 'AMBOS'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setModalidadPerfil(m)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-colors
                        ${modalidadPerfil === m
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300'}`}>
                      {modalityLabel(m)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lugar */}
              <div>
                <label className="field-label">{labels.price.location}</label>
                <input type="text" className={inp}
                  placeholder={labels.price.locationPlaceholder}
                  value={lugarAtencion}
                  onChange={e => setLugarAtencion(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {labels.price.locationHelp}
                </p>
              </div>

              {/* Preview card */}
              {precio && Number(precio) > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                    {labels.price.previewTitle}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Dr/a. {nombre}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          {profileModalityLabel()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        ${Number(precio).toLocaleString(getLocale(lang))}
                      </p>
                      <p className="text-xs text-slate-400">{labels.price.priceSuffix}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ Step 3: ¡Listo! ══════════════════════════════ */}
          {step === 3 && (
            <div className="text-center space-y-5 py-2">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-4xl">
                  <CheckIcon size={30} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {labels.done.titlePrefix} {nombre}{labels.done.titleSuffix}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {labels.done.subtitle}
                  </p>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 text-left space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  {labels.done.summaryTitle}
                </p>
                {[
                  {
                    icon: <CalendarIcon size={15} />,
                    label: labels.done.availability,
                    value: disponibilidades.length > 0
                      ? availabilitySummary
                      : labels.done.notConfigured,
                    ok: disponibilidades.length > 0,
                  },
                  {
                    icon: <CreditCardIcon size={15} />,
                    label: labels.done.consultationPrice,
                    value: precio && Number(precio) > 0
                      ? `$${Number(precio).toLocaleString(getLocale(lang))} ARS`
                      : labels.done.priceNotConfigured,
                    ok: !!(precio && Number(precio) > 0),
                  },
                  {
                    icon: <ClipboardIcon size={15} />,
                    label: labels.done.license,
                    value: matricula.trim() || labels.done.licenseMissing,
                    ok: !!matricula.trim(),
                  },
                  {
                    icon: <UserIcon size={15} />,
                    label: labels.done.profilePhoto,
                    value: fotoUrl.trim() ? labels.done.configured : labels.done.photoMissing,
                    ok: !!fotoUrl.trim(),
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-slate-500 dark:text-slate-400 flex justify-center">{item.icon}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium ${item.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {item.value}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{item.ok ? 'OK' : '--'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Link al perfil */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {labels.done.publicProfile}
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">{profileUrl}</span>
                  <button
                    onClick={copyLink}
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                  >
                    {labels.done.copy}
                  </button>
                </div>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  {labels.done.viewAsPatient}
                </a>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                   {labels.done.nextSteps}
                </p>
                <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5">→</span>
                    <span>{labels.done.shareLinkTip}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5">→</span>
                    <span>{labels.done.calendarTip}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5">→</span>
                    {!matricula.trim() && <span>{labels.done.licenseTip}</span>}
                    {matricula.trim() && <span>{labels.done.statsTip}</span>}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* -- Footer ------------------------------------------- */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div>
            {step > 0 && step < 3 ? (
              <button
                onClick={() => { setError(''); setStep(s => s - 1); }}
                className="btn btn-ghost text-sm text-slate-600 dark:text-slate-300"
              >
                {labels.footer.previous}
              </button>
            ) : step === 0 ? (
              <span className="text-xs text-slate-400">{labels.footer.firstStep}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Skip step 0 (perfil) — but not step 1 (disponibilidad required) */}
            {step === 0 && (
              <button
                onClick={() => { setError(''); setStep(1); }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                {labels.footer.completeLater}
              </button>
            )}

            {step < 3 ? (
              <button onClick={goNext} disabled={saving} className="btn btn-primary text-sm">
                {saving
                  ? labels.footer.saving
                  : step === 2
                    ? labels.footer.saveAndSummary
                    : labels.footer.next}
              </button>
            ) : (
              <button onClick={handleFinish} className="btn btn-primary text-sm px-6">
                {labels.footer.openDashboard}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
