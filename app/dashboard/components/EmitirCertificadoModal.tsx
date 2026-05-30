'use client';

import { useLang } from '../../lib/i18n/context';
import { XIcon } from '../../components/icons';
import { TipoCertificado } from '../../lib/api';

interface EmitirCertificadoModalProps {
  form: { tipo: TipoCertificado; diagnostico: string; texto: string; diasReposo: number };
  setForm: (f: any) => void;
  onSave: () => void;
  loading: boolean;
  onClose: () => void;
  translateSpecialty: (name?: string) => string;
}

export default function EmitirCertificadoModal({
  form,
  setForm,
  onSave,
  loading,
  onClose,
  translateSpecialty,
}: EmitirCertificadoModalProps) {
  const { t } = useLang();
  const d = t('dashboard');
  const certificate = d.certificate;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{certificate.title}</h3>
          <button aria-label={certificate.closeAria} onClick={onClose} className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600">
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tipo de certificado */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{certificate.typeLabel}</label>
            <div className="flex flex-wrap gap-2">
              {(['CONSULTA', 'REPOSO', 'APTITUD', 'LIBRE'] as TipoCertificado[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    setForm({ ...form, tipo, texto: certificate.templates[tipo] });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo === tipo
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {certificate.types[tipo]}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="field-label">{certificate.diagnosisLabel}</label>
            <textarea
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
              placeholder={certificate.diagnosisPlaceholder}
              className="field-input resize-none min-h-[64px] text-sm"
            />
          </div>

          {/* Texto del certificado */}
          <div>
            <label className="field-label">{certificate.textLabel}</label>
            <textarea
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder={certificate.textPlaceholder}
              className="field-input resize-none min-h-[80px] text-sm"
            />
          </div>

          {/* Días de reposo (solo si REPOSO) */}
          {form.tipo === 'REPOSO' && (
            <div>
              <label className="field-label">{certificate.restLabel}</label>
              <input
                type="number"
                min="1"
                max="90"
                value={form.diasReposo}
                onChange={(e) => setForm({ ...form, diasReposo: parseInt(e.target.value) || 0 })}
                className="field-input"
                placeholder={certificate.restPlaceholder}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
            {certificate.cancel}
          </button>
          <button onClick={onSave} className="btn btn-primary flex-1" disabled={loading}>
            {loading ? certificate.saving : certificate.save}
          </button>
        </div>
      </div>
    </div>
  );
}
