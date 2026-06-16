'use client';

import { useState } from 'react';
import { Turno, HistoriaClinicaEditableFields } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../../lib/date';
import { exportarHistoriaClinicaPDF } from '../../../lib/historia-clinica-pdf';
import { estadoBadge, estadoLabel } from '../../../lib/utils';
import { InfoIcon, CheckIcon } from '../../../components/icons';
import { Notice } from '../../../lib/ui-notice';
import { useHistoriaClinicaPanel } from './useHistoriaClinicaPanel';

interface HistoriaClinicaPanelProps {
  turno: Turno;
  translateSpecialty: (name?: string) => string;
  onNotice: (notice: Notice) => void;
}

/** Historia clínica longitudinal (extracted from TurnoModal). */
export default function HistoriaClinicaPanel({ turno, translateSpecialty, onNotice }: HistoriaClinicaPanelProps) {
  const { t, lang } = useLang();
  const d = t('dashboard');
  const modal = d.turnoModal;
  const status = t('status');
  const [message, setMessage] = useState('');
  const { historia, form, setForm, loading, saving, save } = useHistoriaClinicaPanel(turno.paciente?.id);

  const historiaFields: { key: keyof HistoriaClinicaEditableFields; label: string; placeholder: string }[] = [
    {
      key: 'antecedentesPersonales',
      label: modal.history.fields.antecedentesPersonales.label,
      placeholder: modal.history.fields.antecedentesPersonales.placeholder,
    },
    {
      key: 'antecedentesFamiliares',
      label: modal.history.fields.antecedentesFamiliares.label,
      placeholder: modal.history.fields.antecedentesFamiliares.placeholder,
    },
    {
      key: 'alergias',
      label: modal.history.fields.alergias.label,
      placeholder: modal.history.fields.alergias.placeholder,
    },
    {
      key: 'medicacionActual',
      label: modal.history.fields.medicacionActual.label,
      placeholder: modal.history.fields.medicacionActual.placeholder,
    },
    {
      key: 'habitos',
      label: modal.history.fields.habitos.label,
      placeholder: modal.history.fields.habitos.placeholder,
    },
    {
      key: 'diagnosticosPrevios',
      label: modal.history.fields.diagnosticosPrevios.label,
      placeholder: modal.history.fields.diagnosticosPrevios.placeholder,
    },
    {
      key: 'notasClinicasGenerales',
      label: modal.history.fields.notasClinicasGenerales.label,
      placeholder: modal.history.fields.notasClinicasGenerales.placeholder,
    },
  ];

  const handleSave = async () => {
    const res = await save();
    if (res.ok) {
      setMessage(modal.notices.historySaved);
      setTimeout(() => setMessage(''), 3000);
    } else if (res.message !== undefined) {
      onNotice({ type: 'error', text: res.message ?? modal.notices.historyError });
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <InfoIcon size={15} className="text-slate-400" />
        <h4 className="font-semibold text-slate-700 text-sm">{modal.history.title}</h4>
        {message && (
          <span className="badge badge-green ml-auto text-xs flex items-center gap-1">
            <CheckIcon size={10} /> {message}
          </span>
        )}
      </div>

      {!turno.paciente ? (
        <div className="alert alert-warning text-xs">
          <InfoIcon size={14} className="shrink-0" />
          <span>{modal.history.noLinkedPatient}</span>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
        </div>
      ) : (
        <>
          {historia && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{modal.history.totalConsults}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{historia.resumen.totalConsultas}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{modal.history.completed}</p>
                <p className="text-lg font-bold text-emerald-600">{historia.resumen.consultasCompletadas}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{modal.history.lastConsult}</p>
                <p className="text-sm font-semibold text-slate-700">
                  {historia.resumen.ultimaConsulta
                    ? formatClinicInstantDate(historia.resumen.ultimaConsulta, getLocale(lang))
                    : modal.history.noRecords}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {historiaFields.map((field) => (
              <div key={field.key}>
                <label className="field-label">{field.label}</label>
                <textarea
                  value={(form[field.key] ?? '') as string}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="field-input resize-none min-h-[72px] text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-500">
              {modal.history.sharedNote}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => exportarHistoriaClinicaPDF(historia!, {
                  nombre: turno.profesional?.nombre ?? '',
                  apellido: turno.profesional?.apellido ?? '',
                  especialidad: translateSpecialty(turno.profesional?.especialidad?.nombre),
                  matricula: turno.profesional?.matricula,
                  lugarAtencion: turno.profesional?.lugarAtencion,
                }, lang)}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                title={modal.history.exportTitle}
              >
                {/* Download icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {modal.history.exportPdf}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? modal.history.saving : modal.history.save}
              </button>
            </div>
          </div>

          {historia && historia.timeline.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h5 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">
                {modal.history.timeline}
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historia.timeline.slice(0, 8).map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {formatClinicInstantDate(item.fechaHora, getLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {formatClinicInstantTime(item.fechaHora, getLocale(lang))}
                      </p>
                      <span className={estadoBadge(item.estado)}>{estadoLabel(item.estado, status)}</span>
                    </div>
                    {item.evolucion?.contenido && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.evolucion.contenido}</p>
                    )}
                    {item.archivos.length > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1">{item.archivos.length} {modal.history.attachedFiles}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
