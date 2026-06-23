'use client';

import { Turno } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, getLocale } from '../../../lib/date';
// Lazy-load the PDF generator so it ships only when the user actually prints.
const imprimirReceta = (...args: Parameters<typeof import('../../../lib/receta-pdf').imprimirReceta>) =>
  import('../../../lib/receta-pdf').then((m) => m.imprimirReceta(...args));
import { ClipboardIcon } from '../../../components/icons';
import { Notice } from '../../../lib/ui-notice';
import { useRecetaPanel } from './useRecetaPanel';

interface RecetaPanelProps {
  turno: Turno;
  translateSpecialty: (name?: string) => string;
  onNotice: (notice: Notice) => void;
  flashSaved: (text: string) => void;
}

/** Receta e indicaciones post-consulta (extracted from TurnoModal). */
export default function RecetaPanel({ turno, translateSpecialty, onNotice, flashSaved }: RecetaPanelProps) {
  const { t, lang } = useLang();
  const modal = t('dashboard').turnoModal;
  const { receta, form, setForm, loading, saving, shareText, save } = useRecetaPanel(turno.id);

  const handleSave = async () => {
    if (form.diagnostico.trim().length < 5 || form.indicaciones.trim().length < 5) {
      onNotice({ type: 'error', text: modal.notices.completePrescription });
      return;
    }
    const res = await save();
    if (res.ok) {
      flashSaved(modal.notices.prescriptionSavedBadge);
      onNotice({ type: 'success', text: modal.notices.prescriptionSaved });
    } else {
      onNotice({ type: 'error', text: res.message ?? modal.notices.prescriptionError });
    }
  };

  const handleCopy = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      flashSaved(modal.notices.prescriptionCopied);
    } catch {
      onNotice({ type: 'error', text: modal.notices.clipboardError });
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardIcon size={15} className="text-slate-400 dark:text-slate-500" />
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{modal.prescription.title}</h4>
        {receta?.emitidaAt && (
          <span className="badge badge-blue ml-auto text-xs">
            {modal.prescription.emitted} {formatClinicInstantDate(receta.emitidaAt, getLocale(lang))}
          </span>
        )}
      </div>

      {loading ? (
        <div className="skeleton h-24 rounded-lg" />
      ) : (
        <div className="space-y-3">
          <div>
            <label className="field-label">{modal.prescription.diagnosisLabel}</label>
            <textarea
              value={form.diagnostico}
              onChange={(e) => setForm((prev) => ({ ...prev, diagnostico: e.target.value }))}
              className="field-input resize-none min-h-[72px] text-sm"
              placeholder={modal.prescription.diagnosisPlaceholder}
            />
          </div>
          <div>
            <label className="field-label">{modal.prescription.treatmentPlanLabel}</label>
            <textarea
              value={form.planTratamiento || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, planTratamiento: e.target.value }))}
              className="field-input resize-none min-h-[64px] text-sm"
              placeholder={modal.prescription.treatmentPlanPlaceholder}
            />
          </div>
          <div>
            <label className="field-label">{modal.prescription.medicinesLabel}</label>
            <textarea
              value={form.medicamentos || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, medicamentos: e.target.value }))}
              className="field-input resize-none min-h-[72px] text-sm"
              placeholder={modal.prescription.medicinesPlaceholder}
            />
          </div>
          <div>
            <label className="field-label">{modal.prescription.indicationsLabel}</label>
            <textarea
              value={form.indicaciones}
              onChange={(e) => setForm((prev) => ({ ...prev, indicaciones: e.target.value }))}
              className="field-input resize-none min-h-[88px] text-sm"
              placeholder={modal.prescription.indicationsPlaceholder}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{modal.prescription.studiesLabel}</label>
              <textarea
                value={form.estudiosSolicitados || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, estudiosSolicitados: e.target.value }))}
                className="field-input resize-none min-h-[64px] text-sm"
                placeholder={modal.prescription.studiesPlaceholder}
              />
            </div>
            <div>
              <label className="field-label">{modal.prescription.nextControlLabel}</label>
              <input
                value={form.proximoControl || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, proximoControl: e.target.value }))}
                className="field-input"
                placeholder={modal.prescription.nextControlPlaceholder}
              />
            </div>
          </div>
          <div>
            <label className="field-label">{modal.prescription.warningsLabel}</label>
            <textarea
              value={form.advertencias || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, advertencias: e.target.value }))}
              className="field-input resize-none min-h-[64px] text-sm"
              placeholder={modal.prescription.warningsPlaceholder}
            />
          </div>
          <div>
            <label className="field-label">{modal.prescription.observationsLabel}</label>
            <textarea
              value={form.observaciones || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              className="field-input resize-none min-h-[64px] text-sm"
              placeholder={modal.prescription.observationsPlaceholder}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-success btn-sm"
            >
              {saving ? modal.prescription.issuing : modal.prescription.issue}
            </button>
            <button
              onClick={handleCopy}
              disabled={!shareText}
              className="btn btn-secondary btn-sm"
            >
              {modal.prescription.copy}
            </button>
            {receta && turno.profesional && (
              <button
                onClick={() => imprimirReceta({
                  receta,
                  profesional: {
                    nombre: turno.profesional!.nombre,
                    apellido: turno.profesional!.apellido,
                    especialidad: translateSpecialty(turno.profesional!.especialidad?.nombre ?? ''),
                    matricula: turno.profesional!.matricula,
                    lugarAtencion: turno.profesional!.lugarAtencion,
                    telefono: turno.profesional!.telefono,
                    fotoUrl: turno.profesional!.fotoUrl,
                  },
                  paciente: turno.paciente
                    ? { nombre: turno.paciente.nombre, apellido: turno.paciente.apellido, email: turno.paciente.email }
                    : null,
                  fechaHora: turno.fechaHora,
                  modalidad: turno.modalidad,
                }, lang)}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {modal.prescription.downloadPdf}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
