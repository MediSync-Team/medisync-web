'use client';

import { useState, useCallback } from 'react';
import { api, Disponibilidad } from '../lib/api';
import { DIAS_SEMANA } from '../lib/utils';

interface Props {
  profesionalId: string;
  userId: string;
  nombre: string;
  onComplete: () => void;
}

type Modalidad = 'PRESENCIAL' | 'VIRTUAL';

const STEPS = [
  { label: 'Perfil', icon: '📸' },
  { label: 'Precio', icon: '💰' },
  { label: 'Horarios', icon: '🗓️' },
];

export default function ProfesionalOnboardingWizard({ profesionalId, userId, nombre, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Foto + bio
  const [fotoUrl, setFotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [fotoError, setFotoError] = useState('');
  const [fotoPreview, setFotoPreview] = useState(false);

  // Step 2 — Precio + lugar + modalidad
  const [precio, setPrecio] = useState('');
  const [lugarAtencion, setLugarAtencion] = useState('');
  const [modalidadPerfil, setModalidadPerfil] = useState<'PRESENCIAL' | 'VIRTUAL' | 'AMBOS'>('PRESENCIAL');

  // Step 3 — Disponibilidad
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [nuevaDisp, setNuevaDisp] = useState({
    diaSemana: 1,
    horaInicio: '09:00',
    horaFin: '17:00',
    modalidad: 'PRESENCIAL' as Modalidad,
  });
  const [addingDisp, setAddingDisp] = useState(false);

  const saveProfile = useCallback(async () => {
    const data: Record<string, unknown> = {};
    if (fotoUrl.trim()) data.fotoUrl = fotoUrl.trim();
    if (bio.trim()) data.bio = bio.trim();
    if (precio && Number(precio) > 0) data.precioConsulta = Number(precio);
    if (lugarAtencion.trim()) data.lugarAtencion = lugarAtencion.trim();
    data.modalidad = modalidadPerfil;
    if (Object.keys(data).length > 0) {
      await api.profesional.updatePerfil(profesionalId, data as any);
    }
  }, [fotoUrl, bio, precio, lugarAtencion, modalidadPerfil, profesionalId]);

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
        // Validate foto URL if provided
        if (fotoUrl.trim() && !fotoUrl.startsWith('http')) {
          setError('La URL de la foto debe comenzar con http o https');
          return;
        }
      }
      if (step === 1) {
        if (!precio || Number(precio) <= 0) {
          setError('Ingresá un precio de consulta válido');
          return;
        }
        await saveProfile();
      }
      if (step < STEPS.length - 1) {
        setStep(s => s + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (disponibilidades.length === 0) {
      setError('Agregá al menos un horario de atención para que los pacientes puedan reservarte.');
      return;
    }
    setSaving(true);
    try {
      // Save foto/bio if filled and not yet saved (step 0 can be skipped)
      const data: Record<string, unknown> = {};
      if (fotoUrl.trim()) data.fotoUrl = fotoUrl.trim();
      if (bio.trim()) data.bio = bio.trim();
      if (Object.keys(data).length > 0) {
        await api.profesional.updatePerfil(profesionalId, data as any);
      }
      localStorage.setItem(`medisync_onboarding_done_${userId}`, '1');
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al finalizar');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'field-input mt-1';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">Bienvenido/a, Dr/a. {nombre}</p>
          <h2 className="text-lg font-bold">Configurá tu perfil en 3 pasos</h2>
          <p className="text-sm text-blue-100 mt-1">
            Completar tu perfil permite que los pacientes te encuentren y reserven turnos.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => { if (i < step) setStep(i); }}
              className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors
                ${i === step
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : i < step
                    ? 'text-emerald-600 dark:text-emerald-400 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-500 cursor-default'
                }`}
            >
              <span className="text-base">{i < step ? '✅' : s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">

          {error && (
            <div className="alert alert-error text-sm">{error}</div>
          )}

          {/* ── Step 0: Foto + Bio ────────────────────────── */}
          {step === 0 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Una foto profesional y una breve bio generan más confianza en los pacientes.
                Podés completar esto más tarde desde tu perfil.
              </p>

              <div>
                <label className="field-label">URL de foto de perfil</label>
                <input
                  type="url"
                  className={inp}
                  placeholder="https://ejemplo.com/tu-foto.jpg"
                  value={fotoUrl}
                  onChange={e => { setFotoUrl(e.target.value); setFotoPreview(false); setFotoError(''); }}
                />
                {fotoUrl.trim().startsWith('http') && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={fotoUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                      onLoad={() => setFotoPreview(true)}
                      onError={() => setFotoError('No se pudo cargar la imagen. Verificá la URL.')}
                    />
                    {fotoError && <p className="text-xs text-red-600">{fotoError}</p>}
                    {fotoPreview && !fotoError && <p className="text-xs text-emerald-600">Vista previa correcta</p>}
                  </div>
                )}
              </div>

              <div>
                <label className="field-label">Biografía profesional</label>
                <textarea
                  className="field-input mt-1 resize-none"
                  rows={3}
                  placeholder="Contá brevemente tu experiencia y especialización…"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={600}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/600</p>
              </div>
            </>
          )}

          {/* ── Step 1: Precio + Lugar ────────────────────── */}
          {step === 1 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                El precio y la modalidad se muestran en tu perfil público y son lo primero que ven los pacientes.
              </p>

              <div>
                <label className="field-label">Precio de consulta (ARS) <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    className="field-input pl-7"
                    placeholder="15000"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Modalidad de atención</label>
                <div className="flex gap-3 mt-2">
                  {(['PRESENCIAL', 'VIRTUAL', 'AMBOS'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModalidadPerfil(m)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${modalidadPerfil === m
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                        }`}
                    >
                      {m === 'PRESENCIAL' ? '🏥 Presencial' : m === 'VIRTUAL' ? '💻 Virtual' : '🔀 Ambas'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Lugar de atención</label>
                <input
                  type="text"
                  className={inp}
                  placeholder="Av. Corrientes 1234, CABA"
                  value={lugarAtencion}
                  onChange={e => setLugarAtencion(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">Se muestra en tu perfil y en la confirmación del turno.</p>
              </div>
            </>
          )}

          {/* ── Step 2: Disponibilidad ────────────────────── */}
          {step === 2 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Agregá al menos un bloque horario. Podés sumar más desde el panel después.
                Los pacientes solo podrán reservar en estos horarios.
              </p>

              {/* Form para agregar */}
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
                    <input
                      type="time"
                      className={inp}
                      value={nuevaDisp.horaInicio}
                      onChange={e => setNuevaDisp(d => ({ ...d, horaInicio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="field-label">Hasta</label>
                    <input
                      type="time"
                      className={inp}
                      value={nuevaDisp.horaFin}
                      onChange={e => setNuevaDisp(d => ({ ...d, horaFin: e.target.value }))}
                    />
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

              {/* Lista de agregados */}
              {disponibilidades.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Horarios agregados ({disponibilidades.length})
                  </p>
                  {disponibilidades.map(d => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2"
                    >
                      <div className="text-sm text-emerald-800 dark:text-emerald-300">
                        <span className="font-medium">{DIAS_SEMANA[d.diaSemana]}</span>
                        {' · '}
                        {d.horaInicio} – {d.horaFin}
                        {' · '}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {d.modalidad === 'PRESENCIAL' ? 'Presencial' : 'Virtual'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleEliminarDisp(d.id)}
                        className="text-emerald-500 hover:text-red-500 transition-colors p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {disponibilidades.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <span className="text-amber-500 text-base">⚠️</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Sin horarios, los pacientes no pueden reservarte. Agregá al menos uno.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            {step > 0 ? (
              <button
                onClick={() => { setError(''); setStep(s => s - 1); }}
                className="btn btn-ghost text-sm text-slate-600 dark:text-slate-300"
              >
                ← Anterior
              </button>
            ) : (
              <span className="text-xs text-slate-400">Paso {step + 1} de {STEPS.length}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Skip link only on step 2 (last step) */}
            {step === 2 && disponibilidades.length === 0 && (
              <button
                onClick={() => {
                  localStorage.setItem(`medisync_onboarding_done_${userId}`, '1');
                  onComplete();
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Completar después
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={saving}
                className="btn btn-primary text-sm"
              >
                {saving ? 'Guardando…' : step === 0 ? 'Siguiente →' : 'Guardar y continuar →'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || disponibilidades.length === 0}
                className="btn btn-primary text-sm"
              >
                {saving ? 'Guardando…' : '✓ Finalizar y abrir mi panel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
