'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { api, Turno } from '../../../lib/api';
import { XIcon, InfoIcon } from '../../../components/icons';
import { useScrollLock } from '../../../hooks/useScrollLock';

export default function PreconsultaModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  useScrollLock();
  const { t } = useLang();
  const p = t('paciente');
  const common = t('common');
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
        setRiesgo(data.riesgo ?? null);
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
      setNotice({ type: 'error', text: p.preconsultaValidation });
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
              <div>
                <label className="field-label">{p.mainReason}</label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="field-input resize-none min-h-[72px]" placeholder={p.mainReasonPlaceholder} />
              </div>

              <div>
                <label className="field-label">{p.currentSymptoms}</label>
                <textarea value={sintomas} onChange={(e) => setSintomas(e.target.value)} className="field-input resize-none min-h-[88px]" placeholder={p.currentSymptomsPlaceholder} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{p.painLevel}: {escalaDolor}/10</label>
                  <input type="range" min={0} max={10} value={escalaDolor} onChange={(e) => setEscalaDolor(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="field-label">{p.anxietyLevel}: {escalaAnsiedad}/10</label>
                  <input type="range" min={0} max={10} value={escalaAnsiedad} onChange={(e) => setEscalaAnsiedad(Number(e.target.value))} className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{p.symptomsStart}</label>
                  <input value={inicioSintomas} onChange={(e) => setInicioSintomas(e.target.value)} className="field-input" placeholder={p.symptomsStartPlaceholder} />
                </div>
                <div>
                  <label className="field-label">{p.bodyTemperature}</label>
                  <input type="number" min="34" max="43" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className="field-input" placeholder={p.temperaturePlaceholder} />
                </div>
              </div>

              <div>
                <label className="field-label">{p.patientAdditionalNotes}</label>
                <textarea value={notasPaciente} onChange={(e) => setNotasPaciente(e.target.value)} className="field-input resize-none min-h-[72px]" placeholder={p.patientAdditionalNotesPlaceholder} />
              </div>

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
