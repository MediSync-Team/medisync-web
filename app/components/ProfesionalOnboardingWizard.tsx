'use client';

import { useState, useCallback } from 'react';
import { api, Disponibilidad } from '../lib/api';
import { DIAS_SEMANA } from '../lib/utils';
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

const STEPS = [
  { label: 'Tu perfil',      icon: '1', desc: 'Foto y presentacion' },
  { label: 'Disponibilidad', icon: '2', desc: 'Dias y horarios' },
  { label: 'Precio',         icon: '3', desc: 'Tarifa y modalidad' },
  { label: 'Listo',          icon: '4', desc: 'Comenza a recibir turnos' },
];

export default function ProfesionalOnboardingWizard({ profesionalId, userId, nombre, onComplete }: Props) {
  const { lang } = useLang();
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
      setError('La hora de fin debe ser mayor a la de inicio');
      return;
    }
    setAddingDisp(true);
    setError('');
    try {
      const disp = await api.profesionales.crearDisponibilidad(profesionalId, nuevaDisp);
      setDisponibilidades(prev => [...prev, disp]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar horario');
    } finally {
      setAddingDisp(false);
    }
  };

  const handleEliminarDisp = async (id: string) => {
    try {
      await api.profesionales.eliminarDisponibilidad(profesionalId, id);
      setDisponibilidades(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const goNext = async () => {
    setError('');
    setSaving(true);
    try {
      if (step === 0) {
        if (fotoUrl.trim() && !fotoUrl.startsWith('http')) {
          setError('La URL de la foto debe comenzar con http o https');
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
          setError('Agregá al menos un horario de atención para continuar.');
          setSaving(false);
          return;
        }
      }
      if (step === 2) {
        if (!precio || Number(precio) <= 0) {
          setError('Ingresá un precio de consulta válido');
          setSaving(false);
          return;
        }
        await saveProfile();
      }
      setStep(s => s + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
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

  const progressPct = step === 3 ? 100 : Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* -- Header ------------------------------------------- */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
            Bienvenido/a, Dr/a. {nombre}
          </p>
          <h2 className="text-lg font-bold">Configurá tu perfil profesional</h2>
          <p className="text-sm text-blue-100 mt-1">
            Solo 3 pasos para empezar a recibir turnos de tus pacientes.
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-200 mb-1.5">
              <span>Paso {Math.min(step + 1, STEPS.length)} de {STEPS.length}</span>
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
          {STEPS.map((s, i) => (
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
                Una foto y una buena presentación generan más confianza. Podés completar estos datos ahora o después desde tu perfil.
              </p>

              {/* Foto */}
              <div>
                <label className="field-label">URL de foto de perfil</label>
                <input
                  type="url"
                  className={inp}
                  placeholder="https://ejemplo.com/tu-foto.jpg"
                  value={fotoUrl}
                  onChange={e => { setFotoUrl(e.target.value); setFotoOk(false); setFotoError(''); }}
                />
                {fotoUrl.trim().startsWith('http') && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 shrink-0"
                      onLoad={() => setFotoOk(true)}
                      onError={() => { setFotoError('No se pudo cargar la imagen.'); setFotoOk(false); }}
                    />
                    {fotoError && <p className="text-xs text-red-600">{fotoError}</p>}
                    {fotoOk && !fotoError && <p className="text-xs text-emerald-600">✓ Vista previa correcta</p>}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="field-label">Biografía profesional</label>
                <textarea
                  className="field-input mt-1 resize-none"
                  rows={3}
                  placeholder="Contá brevemente tu experiencia, especialización y enfoque de atención…"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={600}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/600</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Matrícula */}
                <div>
                  <label className="field-label">Matrícula profesional</label>
                  <input
                    type="text"
                    className={inp}
                    placeholder="MN 123456"
                    value={matricula}
                    onChange={e => setMatricula(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Se muestra en recetas y perfil.</p>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="field-label">Teléfono de contacto</label>
                  <input
                    type="tel"
                    className={inp}
                    placeholder="+54 11 4567-8901"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Para recordatorios y contacto.</p>
                </div>
              </div>
            </>
          )}

          {/* ═══ Step 1: Disponibilidad ═══════════════════════ */}
          {step === 1 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Definí en qué días y horarios atendés. Los pacientes solo podrán reservar dentro de estos bloques.
                Podés agregar más desde tu panel después.
              </p>

              {/* Form */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Día</label>
                    <select
                      className="field-select mt-1"
                      value={nuevaDisp.diaSemana}
                      onChange={e => setNuevaDisp(d => ({ ...d, diaSemana: Number(e.target.value) }))}
                    >
                      {DIAS_SEMANA.map((dia, i) => (
                        <option key={i} value={i}>{dia}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Modalidad</label>
                    <select
                      className="field-select mt-1"
                      value={nuevaDisp.modalidad}
                      onChange={e => setNuevaDisp(d => ({ ...d, modalidad: e.target.value as Modalidad }))}
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="VIRTUAL">Virtual</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Desde</label>
                    <input type="time" className={inp} value={nuevaDisp.horaInicio}
                      onChange={e => setNuevaDisp(d => ({ ...d, horaInicio: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Hasta</label>
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
                  {addingDisp ? 'Agregando…' : '+ Agregar horario'}
                </button>
              </div>

              {/* Lista */}
              {disponibilidades.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Horarios configurados ({disponibilidades.length})
                  </p>
                  {disponibilidades.map(d => (
                    <div key={d.id}
                      className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                      <div className="text-sm text-emerald-800 dark:text-emerald-300">
                        <span className="font-semibold">{DIAS_SEMANA[d.diaSemana]}</span>
                        <span className="text-emerald-600 dark:text-emerald-500 mx-1.5">·</span>
                        {d.horaInicio}–{d.horaFin}
                        <span className="text-emerald-600 dark:text-emerald-500 mx-1.5">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                          {d.modalidad === 'PRESENCIAL' ? 'Presencial' : 'Virtual'}
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
                    Sin horarios los pacientes no pueden reservarte. Agregá al menos uno para continuar.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ═══ Step 2: Precio ════════════════════════════════ */}
          {step === 2 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                El precio y la modalidad son lo primero que ven los pacientes al buscar profesionales.
              </p>

              {/* Precio */}
              <div>
                <label className="field-label">
                  Precio de consulta (ARS) <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                  <input
                    type="number" min={0} step={500}
                    className="field-input pl-7"
                    placeholder="20000"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Consultá rangos típicos de tu especialidad. Podés cambiarlo después.
                </p>
              </div>

              {/* Modalidad */}
              <div>
                <label className="field-label">Modalidad de atención</label>
                <div className="flex gap-2 mt-2">
                  {(['PRESENCIAL', 'VIRTUAL', 'AMBOS'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setModalidadPerfil(m)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-semibold transition-colors
                        ${modalidadPerfil === m
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300'}`}>
                      {m === 'PRESENCIAL' ? 'Presencial' : m === 'VIRTUAL' ? 'Virtual' : 'Ambas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lugar */}
              <div>
                <label className="field-label">Lugar de atención</label>
                <input type="text" className={inp}
                  placeholder="Av. Corrientes 1234, CABA"
                  value={lugarAtencion}
                  onChange={e => setLugarAtencion(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Aparece en tu perfil y en la confirmación de cada turno presencial.
                </p>
              </div>

              {/* Preview card */}
              {precio && Number(precio) > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                    Así te verán los pacientes
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Dr/a. {nombre}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          {modalidadPerfil === 'PRESENCIAL' ? 'Presencial' : modalidadPerfil === 'VIRTUAL' ? 'Virtual' : 'Presencial y virtual'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        ${Number(precio).toLocaleString(getLocale(lang))}
                      </p>
                      <p className="text-xs text-slate-400">por consulta</p>
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
                    ¡Tu perfil está listo, Dr/a. {nombre}!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ya podés recibir turnos de tus pacientes.
                  </p>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 text-left space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Resumen de configuración
                </p>
                {[
                  {
                    icon: <CalendarIcon size={15} />,
                    label: 'Disponibilidad',
                    value: disponibilidades.length > 0
                      ? `${disponibilidades.length} bloque${disponibilidades.length > 1 ? 's' : ''} configurado${disponibilidades.length > 1 ? 's' : ''}`
                      : 'No configurada',
                    ok: disponibilidades.length > 0,
                  },
                  {
                    icon: <CreditCardIcon size={15} />,
                    label: 'Precio de consulta',
                    value: precio && Number(precio) > 0
                      ? `$${Number(precio).toLocaleString(getLocale(lang))} ARS`
                      : 'No configurado',
                    ok: !!(precio && Number(precio) > 0),
                  },
                  {
                    icon: <ClipboardIcon size={15} />,
                    label: 'Matrícula',
                    value: matricula.trim() || 'No completada',
                    ok: !!matricula.trim(),
                  },
                  {
                    icon: <UserIcon size={15} />,
                    label: 'Foto de perfil',
                    value: fotoUrl.trim() ? 'Configurada' : 'No completada',
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
                  Tu perfil público
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">{profileUrl}</span>
                  <button
                    onClick={copyLink}
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Ver mi perfil como lo ven los pacientes
                </a>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                   Proximos pasos recomendados
                </p>
                <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5">→</span>
                    <span>Compartí tu link de perfil con tus pacientes actuales para que reserven online.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5">→</span>
                    <span>Configurá tu Google Calendar para sincronizar los turnos automáticamente.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5">→</span>
                    {!matricula.trim() && <span>Completá tu matrícula profesional en tu perfil — aparece en las recetas.</span>}
                    {matricula.trim() && <span>Explorá las estadísticas de tu panel para seguir tus ingresos y métricas.</span>}
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
                ← Anterior
              </button>
            ) : step === 0 ? (
              <span className="text-xs text-slate-400">Paso 1 de 4</span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Skip step 0 (perfil) — but not step 1 (disponibilidad required) */}
            {step === 0 && (
              <button
                onClick={() => { setError(''); setStep(1); }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Completar después
              </button>
            )}

            {step < 3 ? (
              <button onClick={goNext} disabled={saving} className="btn btn-primary text-sm">
                {saving
                  ? 'Guardando…'
                  : step === 2
                    ? 'Guardar y ver resumen →'
                    : 'Siguiente →'}
              </button>
            ) : (
              <button onClick={handleFinish} className="btn btn-primary text-sm px-6">
                ✓ Abrir mi panel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
