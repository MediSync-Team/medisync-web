'use client';

import { TipoDescuento } from '../../lib/api';
import { useLang } from '../../lib/i18n/context';
import { XIcon } from '../../components/icons';
import { useScrollLock } from '../../hooks/useScrollLock';

export interface CuponFormState {
  codigo: string;
  tipo: TipoDescuento;
  valor: string;
  descripcion: string;
  maxUsos: string;
  expiresAt: string;
}

interface NuevoCuponModalProps {
  form: CuponFormState;
  setForm: (form: CuponFormState) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

/** New coupon creation modal (extracted from the profesional dashboard page). */
export default function NuevoCuponModal({ form, setForm, onClose, onSave, saving }: NuevoCuponModalProps) {
  useScrollLock();
  const { t } = useLang();
  const d = t('dashboard');

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-foreground text-lg">{d.couponModal.title}</h3>
          <button onClick={onClose} className="btn btn-ghost p-2 text-muted-foreground hover:text-foreground">
            <XIcon size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="field-label">{d.couponModal.codeLabel}</label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder={d.couponModal.codePlaceholder}
              className="field-input"
              disabled={saving}
            />
          </div>
          <div>
            <label className="field-label mb-2">{d.couponModal.discountType}</label>
            <div className="flex gap-2">
              {(['PORCENTAJE', 'MONTO_FIJO'] as TipoDescuento[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setForm({ ...form, tipo })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo === tipo
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-foreground border hover:border-primary/40'
                  }`}
                >
                  {tipo === 'PORCENTAJE' ? '%' : '$'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">
              {d.couponModal.amountLabel} {form.tipo === 'PORCENTAJE' ? '(%)' : '($ARS)'}
            </label>
            <input
              type="number"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder={d.couponModal.amountPlaceholder}
              className="field-input"
              disabled={saving}
            />
          </div>
          <div>
            <label className="field-label">{d.couponModal.descriptionLabel}</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder={d.couponModal.descriptionPlaceholder}
              className="field-input"
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{d.couponModal.maxUsesLabel}</label>
              <input
                type="number"
                value={form.maxUsos}
                onChange={(e) => setForm({ ...form, maxUsos: e.target.value })}
                placeholder={d.couponModal.maxUsesPlaceholder}
                className="field-input"
                disabled={saving}
              />
            </div>
            <div>
              <label className="field-label">{d.couponModal.expiresLabel}</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="field-input"
                disabled={saving}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn btn-secondary flex-1" disabled={saving}>
            {d.couponModal.cancel}
          </button>
          <button onClick={onSave} className="btn btn-primary flex-1" disabled={saving}>
            {saving ? d.couponModal.creating : d.couponModal.create}
          </button>
        </div>
      </div>
    </div>
  );
}
