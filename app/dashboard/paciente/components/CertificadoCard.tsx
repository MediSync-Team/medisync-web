'use client';

import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, getLocale } from '../../../lib/date';
import { CertificadoPaciente } from '../../../lib/api';

export default function CertificadoCard({
  certificado,
  onDescargar,
}: {
  certificado: CertificadoPaciente;
  onDescargar: () => void;
}) {
  const { t, lang } = useLang();
  const p = t('paciente');
  const d = t('dashboard');
  const locale = getLocale(lang);
  const tipoLabel: Record<string, string> = {
    REPOSO: p.certificateTypeRest,
    CONSULTA: p.certificateTypeConsultation,
    APTITUD: p.certificateTypeFitness,
    LIBRE: p.certificateTypeGeneric,
  };

  const tipoColor: Record<string, string> = {
    REPOSO: 'bg-red-50 text-red-700 border-red-100',
    CONSULTA: 'bg-blue-50 text-blue-700 border-blue-100',
    APTITUD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    LIBRE: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Dr/a. {certificado.profesional.nombre} {certificado.profesional.apellido}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {formatClinicInstantDate(certificado.fechaHora, locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className={`badge border text-[10px] font-bold whitespace-nowrap ${tipoColor[certificado.certificado.tipo]}`}>
          {tipoLabel[certificado.certificado.tipo] ?? p.certificateTypeGeneric}
        </span>
      </div>

      <div className="border-t border-slate-100 pt-3 mb-3 space-y-2">
        <div>
          <p className="text-xs font-semibold text-slate-600">{d.certificate.diagnosisLabel}</p>
          <p className="text-sm text-slate-700">{certificado.certificado.diagnostico}</p>
        </div>
        {certificado.certificado.diasReposo && (
          <div className="bg-red-50 rounded px-2 py-1.5 border border-red-100">
            <p className="text-xs font-semibold text-red-700">{d.certificate.restLabel}: {certificado.certificado.diasReposo}</p>
          </div>
        )}
      </div>

      <button
        onClick={onDescargar}
        className="btn btn-primary btn-sm w-full"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {p.downloadCertificate}
      </button>
    </div>
  );
}
