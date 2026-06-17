'use client';

import { useLang } from '../../../lib/i18n/context';

export interface DatosMedicos {
  antecedentesPersonales: string;
  antecedentesFamiliares: string;
  alergias: string;
  medicacionActual: string;
  habitos: string;
  diagnosticosPrevios: string;
}

interface DatosMedicosViewProps {
  datos: DatosMedicos;
  onChange: (patch: Partial<DatosMedicos>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

/** Patient medical-data tab body (extracted from the paciente dashboard page). */
export default function DatosMedicosView({ datos, onChange, onSave, saving, saved }: DatosMedicosViewProps) {
  const { t } = useLang();
  const d = t('dashboard');

  const fields: { key: keyof DatosMedicos; title: string; desc: string; placeholder: string; rows: number }[] = [
    { key: 'antecedentesPersonales', title: d.personalHistory, desc: d.personalHistoryDesc, placeholder: d.placeholder.personalHistory, rows: 3 },
    { key: 'antecedentesFamiliares', title: d.familyHistory, desc: d.familyHistoryDesc, placeholder: d.placeholder.familyHistory, rows: 3 },
    { key: 'alergias', title: d.allergies, desc: d.allergiesDesc, placeholder: d.placeholder.allergies, rows: 2 },
    { key: 'medicacionActual', title: d.currentMedication, desc: d.currentMedicationDesc, placeholder: d.placeholder.currentMedication, rows: 3 },
    { key: 'habitos', title: d.habits, desc: d.habitsDesc, placeholder: d.placeholder.habits, rows: 2 },
    { key: 'diagnosticosPrevios', title: d.previousDiagnoses, desc: d.previousDiagnosesDesc, placeholder: d.placeholder.previousDiagnoses, rows: 2 },
  ];

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.key}>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">{field.title}</h3>
          <p className="text-xs text-slate-400 mb-2">{field.desc}</p>
          <textarea
            value={datos[field.key]}
            onChange={(e) => onChange({ [field.key]: e.target.value })}
            rows={field.rows}
            placeholder={field.placeholder}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={onSave} disabled={saving} className="btn btn-primary text-sm">
          {saving ? d.saving : d.saveMedicalData}
        </button>
        {saved && (
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {d.savedMedicalData}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">{d.medicalDataVisibility}</p>
    </div>
  );
}
