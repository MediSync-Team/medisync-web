'use client';

import { PreconsultaTurno } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { InfoIcon } from '../../../components/icons';
import { usePreconsultaPanel } from './usePreconsultaPanel';

const preconsultaRiskClass = (riesgo: PreconsultaTurno['riesgo']) => {
  if (riesgo === 'URGENTE') return 'badge-red';
  if (riesgo === 'ALTO') return 'badge-yellow';
  if (riesgo === 'MEDIO') return 'badge-blue';
  if (riesgo === 'BAJO') return 'badge-green';
  return 'badge-gray';
};

/** Read-only preconsulta summary (extracted from TurnoModal). */
export default function PreconsultaPanel({ turnoId }: { turnoId: string }) {
  const { t, lang } = useLang();
  const d = t('dashboard');
  const modal = d.turnoModal;
  const { preconsulta, loading } = usePreconsultaPanel(turnoId);

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <InfoIcon size={15} className="text-slate-400" />
        <h4 className="font-semibold text-slate-700 text-sm">{d.preconsulta}</h4>
      </div>
      {loading ? (
        <div className="skeleton h-24 rounded-lg" />
      ) : !preconsulta?.completadaAt ? (
        <p className="text-sm text-slate-500">{modal.preconsulta.notCompleted}</p>
      ) : (
        <div className="space-y-2.5 text-sm">
          {/* Header row: timestamp + risk badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-medium text-slate-700 text-xs">
              {modal.preconsulta.completed} {new Date(preconsulta.completadaAt).toLocaleDateString(getLocale(lang))}
            </p>
            <div className="flex items-center gap-1.5">
              {preconsulta.aiGenerated && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                  {modal.preconsulta.ai}
                </span>
              )}
              <span className={`badge ${preconsultaRiskClass(preconsulta.riesgo)}`}>
                {modal.preconsulta.risk} {preconsulta.riesgo}
              </span>
            </div>
          </div>

          {/* AI-generated summary — highlighted box */}
          {preconsulta.resumen && (
            <div className={`rounded-lg border p-3 ${preconsulta.aiGenerated ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs font-semibold mb-1 ${preconsulta.aiGenerated ? 'text-violet-700' : 'text-slate-600'}`}>
                {preconsulta.aiGenerated ? `✦ ${modal.preconsulta.aiSummary}` : modal.preconsulta.summary}
              </p>
              <p className={`text-sm leading-relaxed ${preconsulta.aiGenerated ? 'text-violet-900' : 'text-slate-700'}`}>
                {preconsulta.resumen}
              </p>
            </div>
          )}

          {/* Scales */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
              <p className="text-xs text-slate-500 mb-1">{modal.preconsulta.pain}</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{preconsulta.escalaDolor}/10</p>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${(preconsulta.escalaDolor ?? 0) >= 8 ? 'bg-red-500' : (preconsulta.escalaDolor ?? 0) >= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                       style={{ width: `${((preconsulta.escalaDolor ?? 0) / 10) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
              <p className="text-xs text-slate-500 mb-1">{modal.preconsulta.anxiety}</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{preconsulta.escalaAnsiedad}/10</p>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${(preconsulta.escalaAnsiedad ?? 0) >= 8 ? 'bg-red-500' : (preconsulta.escalaAnsiedad ?? 0) >= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                       style={{ width: `${((preconsulta.escalaAnsiedad ?? 0) / 10) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <p><span className="font-medium text-slate-700">{modal.preconsulta.reason}</span> <span className="text-slate-600">{preconsulta.motivo}</span></p>
          <p><span className="font-medium text-slate-700">{modal.preconsulta.symptoms}</span> <span className="text-slate-600">{preconsulta.sintomas}</span></p>
          {preconsulta.inicioSintomas && (
            <p><span className="font-medium text-slate-700">{modal.preconsulta.symptomsStart}</span> <span className="text-slate-600">{preconsulta.inicioSintomas}</span></p>
          )}
          {typeof preconsulta.temperatura === 'number' && (
            <p><span className="font-medium text-slate-700">{modal.preconsulta.temperature}</span> <span className="text-slate-600">{preconsulta.temperatura.toFixed(1)} °C</span></p>
          )}
          {preconsulta.flags && preconsulta.flags.length > 0 && (
            <div>
              <p className="font-medium text-slate-700 mb-1">
                {preconsulta.aiGenerated ? modal.preconsulta.aiAlerts : modal.preconsulta.alerts}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preconsulta.flags.map((flag) => (
                  <span key={flag} className="badge badge-red">{flag}</span>
                ))}
              </div>
            </div>
          )}
          {preconsulta.notasPaciente && (
            <p className="text-slate-600"><span className="font-medium text-slate-700">{modal.preconsulta.patientNotes}</span> {preconsulta.notasPaciente}</p>
          )}
        </div>
      )}
    </div>
  );
}
