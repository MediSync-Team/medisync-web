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
      <div className="bg-card rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-foreground text-lg">{certificate.title}</h3>
          <button aria-label={certificate.closeAria} onClick={onClose} className="btn btn-ghost p-2 text-muted-foreground hover:text-foreground">
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tipo de certificado */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">{certificate.typeLabel}</label>
            <div className="flex flex-wrap gap-2">
              {(['CONSULTA', 'REPOSO', 'APTITUD', 'LIBRE'] as TipoCertificado[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    setForm({ ...form, tipo, texto: certificate.templates[tipo] });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo === tipo
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-foreground border hover:border-primary/40'
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

        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3 rounded-b-2xl">
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
