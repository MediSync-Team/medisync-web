'use client';

import { useState, useEffect } from 'react';
import { api, Turno } from '../../../lib/api';
import { XIcon, InfoIcon } from '../../../components/icons';

export default function PreconsultaModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
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
          <button aria-label="Cerrar modal" onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
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
