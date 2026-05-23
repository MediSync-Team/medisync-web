'use client';

import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, getLocale } from '../../../lib/date';
import { RecetaPaciente } from '../../../lib/api';

export default function RecetaCard({
  receta,
  onDescargar,
}: {
  receta: RecetaPaciente;
  onDescargar: () => void;
}) {
  const { t, lang } = useLang();
  const p = t('paciente');
  const s = t('status');
  const locale = getLocale(lang);
  const isActive = !receta.receta.proximoControl || new Date(receta.receta.proximoControl) >= new Date();

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Dr/a. {receta.profesional.nombre} {receta.profesional.apellido}
          </p>
          <p className="text-xs text-blue-600 font-medium">{receta.profesional.especialidad}</p>
          <p className="text-xs text-slate-500 mt-1">
            {formatClinicInstantDate(receta.fechaHora, locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {isActive && (
          <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold whitespace-nowrap">
            {s.ACTIVA}
          </span>
        )}
      </div>

      <div className="border-t border-slate-100 pt-3 mb-3 space-y-2">
        <div>
          <p className="text-xs font-semibold text-slate-600">{p.diagnosisLabel}</p>
          <p className="text-sm text-slate-700 line-clamp-2">{receta.receta.diagnostico}</p>
        </div>
        {receta.receta.medicamentos && (
          <div>
            <p className="text-xs font-semibold text-slate-600">{p.medicinesLabel}</p>
            <p className="text-sm text-slate-700 line-clamp-2">{receta.receta.medicamentos}</p>
          </div>
        )}
      </div>

      <button
        onClick={onDescargar}
        className="btn btn-primary btn-sm w-full"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {p.downloadPrescription}
      </button>
    </div>
  );
}
