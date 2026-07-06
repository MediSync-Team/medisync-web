'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { api, Turno, PreconsultaConfig, PreconsultaRespuestas } from '../../../lib/api';
import { XIcon, InfoIcon } from '../../../components/icons';
import { useScrollLock } from '../../../hooks/useScrollLock';

// Fallback when the API hasn't returned a config yet: mirror the historical form.
const ALL_ENABLED: PreconsultaConfig = {
  defaults: {
    escalaDolor: { enabled: true, required: false },
    escalaAnsiedad: { enabled: true, required: false },
    inicioSintomas: { enabled: true, required: false },
    temperatura: { enabled: true, required: false },
    notasPaciente: { enabled: true, required: false },
  },
  custom: [],
};

export default function PreconsultaModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  useScrollLock();
  const { t } = useLang();
  const p = t('paciente');
  const common = t('common');
  const pre = t('preconsulta');
  const [motivo, setMotivo] = useState('');
  const [sintomas, setSintomas] = useState('');
  const [escalaDolor, setEscalaDolor] = useState(0);
  const [escalaAnsiedad, setEscalaAnsiedad] = useState(0);
  const [inicioSintomas, setInicioSintomas] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [notasPaciente, setNotasPaciente] = useState('');
  const [config, setConfig] = useState<PreconsultaConfig>(ALL_ENABLED);
  const [respuestas, setRespuestas] = useState<PreconsultaRespuestas>({});
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
        setRiesgo(data.riesgo ?? null);
        setFlags(data.flags || []);
        if (data.config) setConfig(data.config);
        if (data.respuestas) setRespuestas(data.respuestas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPreconsulta();
  }, [turno.id]);

  const setRespuesta = (id: string, value: string | number | boolean) =>
    setRespuestas((prev) => ({ ...prev, [id]: value }));

  const handleGuardar = async () => {
    if (motivo.trim().length < 5 || sintomas.trim().length < 5) {
      setNotice({ type: 'error', text: p.preconsultaValidation });
      return;
    }

    // Required built-in fields (only the enabled ones can be required).
    const d = config.defaults;
    if (d.inicioSintomas.enabled && d.inicioSintomas.required && !inicioSintomas.trim()) {
      setNotice({ type: 'error', text: `${p.symptomsStart}: ${pre.requiredField}` });
      return;
    }
    if (d.temperatura.enabled && d.temperatura.required && !temperatura.trim()) {
      setNotice({ type: 'error', text: `${p.bodyTemperature}: ${pre.requiredField}` });
      return;
    }
    if (d.notasPaciente.enabled && d.notasPaciente.required && !notasPaciente.trim()) {
      setNotice({ type: 'error', text: `${p.patientAdditionalNotes}: ${pre.requiredField}` });
      return;
    }

    // Required custom questions.
    for (const q of config.custom) {
      if (q.required && q.type !== 'boolean') {
        const v = respuestas[q.id];
        if (v === undefined || v === null || String(v).trim() === '') {
          setNotice({ type: 'error', text: `${q.label}: ${pre.requiredField}` });
          return;
        }
      }
    }

    setGuardando(true);
    try {
      const data = await api.turnos.updatePreconsulta(turno.id, {
        motivo: motivo.trim(),
        sintomas: sintomas.trim(),
        escalaDolor: d.escalaDolor.enabled ? escalaDolor : null,
        escalaAnsiedad: d.escalaAnsiedad.enabled ? escalaAnsiedad : null,
        inicioSintomas: d.inicioSintomas.enabled ? (inicioSintomas.trim() || null) : null,
        temperatura: d.temperatura.enabled ? (temperatura.trim() ? Number(temperatura) : null) : null,
        notasPaciente: d.notasPaciente.enabled ? (notasPaciente.trim() || null) : null,
        respuestas,
      });

      setRiesgo(data.riesgo ?? null);
      setFlags(data.flags || []);
      setNotice({ type: 'success', text: p.preconsultaSaved });
      onSuccess();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : p.preconsultaSaveError });
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

  const req = (required: boolean) => (required ? <span className="text-red-500"> *</span> : null);
  const d = config.defaults;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
          <h3 className="font-bold text-foreground">{p.preconsultaTitle}</h3>
          <button aria-label={p.closeModal} onClick={onClose} className="btn btn-ghost p-2 text-muted-foreground"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {notice && (
            <div className={`alert ${notice.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status" aria-live="polite">
              <InfoIcon size={14} className="shrink-0" />
              <span>{notice.text}</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {p.preconsultaIntro}
          </p>

          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-20 rounded-lg" />
              <div className="skeleton h-20 rounded-lg" />
            </div>
          ) : (
            <>
              {/* Core — always required */}
              <div>
                <label className="field-label">{p.mainReason}{req(true)}</label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="field-input resize-none min-h-[72px]" placeholder={p.mainReasonPlaceholder} />
              </div>

              <div>
                <label className="field-label">{p.currentSymptoms}{req(true)}</label>
                <textarea value={sintomas} onChange={(e) => setSintomas(e.target.value)} className="field-input resize-none min-h-[88px]" placeholder={p.currentSymptomsPlaceholder} />
              </div>

              {/* Built-in fields the professional left enabled */}
              {(d.escalaDolor.enabled || d.escalaAnsiedad.enabled) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {d.escalaDolor.enabled && (
                    <div>
                      <label className="field-label">{p.painLevel}: {escalaDolor}/10</label>
                      <input type="range" min={0} max={10} value={escalaDolor} onChange={(e) => setEscalaDolor(Number(e.target.value))} className="w-full" />
                    </div>
                  )}
                  {d.escalaAnsiedad.enabled && (
                    <div>
                      <label className="field-label">{p.anxietyLevel}: {escalaAnsiedad}/10</label>
                      <input type="range" min={0} max={10} value={escalaAnsiedad} onChange={(e) => setEscalaAnsiedad(Number(e.target.value))} className="w-full" />
                    </div>
                  )}
                </div>
              )}

              {(d.inicioSintomas.enabled || d.temperatura.enabled) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {d.inicioSintomas.enabled && (
                    <div>
                      <label className="field-label">{p.symptomsStart}{req(d.inicioSintomas.required)}</label>
                      <input value={inicioSintomas} onChange={(e) => setInicioSintomas(e.target.value)} className="field-input" placeholder={p.symptomsStartPlaceholder} />
                    </div>
                  )}
                  {d.temperatura.enabled && (
                    <div>
                      <label className="field-label">{p.bodyTemperature}{req(d.temperatura.required)}</label>
                      <input type="number" min="34" max="43" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className="field-input" placeholder={p.temperaturePlaceholder} />
                    </div>
                  )}
                </div>
              )}

              {d.notasPaciente.enabled && (
                <div>
                  <label className="field-label">{p.patientAdditionalNotes}{req(d.notasPaciente.required)}</label>
                  <textarea value={notasPaciente} onChange={(e) => setNotasPaciente(e.target.value)} className="field-input resize-none min-h-[72px]" placeholder={p.patientAdditionalNotesPlaceholder} />
                </div>
              )}

              {/* Professional's custom questions */}
              {config.custom.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4">
                  {config.custom.map((q) => {
                    const value = respuestas[q.id];
                    return (
                      <div key={q.id}>
                        {q.type === 'boolean' ? (
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value === true}
                              onChange={(e) => setRespuesta(q.id, e.target.checked)}
                              className="size-4 accent-blue-600"
                            />
                            <span className="text-sm font-medium text-foreground">{q.label}</span>
                          </label>
                        ) : (
                          <>
                            <label className="field-label">{q.label}{req(q.required)}</label>
                            {q.type === 'textarea' && (
                              <textarea
                                value={(value as string) ?? ''}
                                onChange={(e) => setRespuesta(q.id, e.target.value)}
                                className="field-input resize-none min-h-[72px]"
                              />
                            )}
                            {q.type === 'text' && (
                              <input
                                value={(value as string) ?? ''}
                                onChange={(e) => setRespuesta(q.id, e.target.value)}
                                className="field-input"
                              />
                            )}
                            {q.type === 'number' && (
                              <input
                                type="number"
                                value={value === undefined || value === null ? '' : String(value)}
                                onChange={(e) => setRespuesta(q.id, e.target.value === '' ? '' : Number(e.target.value))}
                                className="field-input"
                              />
                            )}
                            {q.type === 'scale' && (
                              <div>
                                <span className="text-xs text-muted-foreground">{typeof value === 'number' ? value : 0}/10</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={10}
                                  value={typeof value === 'number' ? value : 0}
                                  onChange={(e) => setRespuesta(q.id, Number(e.target.value))}
                                  className="w-full"
                                />
                              </div>
                            )}
                            {q.type === 'select' && (
                              <select
                                value={(value as string) ?? ''}
                                onChange={(e) => setRespuesta(q.id, e.target.value)}
                                className="field-select"
                              >
                                <option value="">—</option>
                                {(q.options ?? []).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {riesgo && (
                <div className="alert alert-info text-xs">
                  <InfoIcon size={14} className="shrink-0" />
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">{p.detectedRisk}: <span className={`badge ${riskClass}`}>{riesgo}</span></p>
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

        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">{common.cancel}</button>
          <button onClick={handleGuardar} disabled={guardando || loading} className="btn btn-primary flex-1">
            {guardando ? common.saving : p.savePreconsulta}
          </button>
        </div>
      </div>
    </div>
  );
}
