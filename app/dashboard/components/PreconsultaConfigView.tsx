'use client';

import { useEffect, useState } from 'react';
import { useLang } from '../../lib/i18n/context';
import {
  api,
  PreconsultaConfig,
  PreconsultaCustomQuestion,
  PreconsultaDefaultField,
  PreconsultaFieldType,
} from '../../lib/api';
import { cacheKeys, peekCache } from '../../lib/api/cache';
import { ClipboardIcon, TrashIcon, InfoIcon } from '../../components/icons';

const DEFAULT_FIELD_KEYS: PreconsultaDefaultField[] = [
  'escalaDolor',
  'escalaAnsiedad',
  'inicioSintomas',
  'temperatura',
  'notasPaciente',
];

const TYPE_OPTIONS: PreconsultaFieldType[] = ['text', 'textarea', 'number', 'scale', 'boolean', 'select'];

const MAX_CUSTOM = 20;

const emptyConfig = (): PreconsultaConfig => ({
  defaults: {
    escalaDolor: { enabled: true, required: false },
    escalaAnsiedad: { enabled: true, required: false },
    inicioSintomas: { enabled: true, required: false },
    temperatura: { enabled: true, required: false },
    notasPaciente: { enabled: true, required: false },
  },
  custom: [],
});

const genId = () => 'q_' + Math.random().toString(36).slice(2, 10);

export default function PreconsultaConfigView({ profesionalId }: { profesionalId: string }) {
  const { t } = useLang();
  const common = t('common');
  const pre = t('preconsulta');

  // Endpoint is cached at the api layer; peek here only to skip the loading flash on remount.
  const cached = peekCache<PreconsultaConfig>(cacheKeys.preconsultaConfig(profesionalId));
  const [config, setConfig] = useState<PreconsultaConfig>(() => cached?.data ?? emptyConfig());
  const [loading, setLoading] = useState(!cached);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.profesionales.getPreconsultaConfig(profesionalId);
        if (alive) setConfig(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [profesionalId]);

  const setDefault = (key: PreconsultaDefaultField, patch: Partial<{ enabled: boolean; required: boolean }>) => {
    setConfig((c) => ({
      ...c,
      defaults: { ...c.defaults, [key]: { ...c.defaults[key], ...patch } },
    }));
  };

  const updateCustom = (id: string, patch: Partial<PreconsultaCustomQuestion>) => {
    setConfig((c) => ({
      ...c,
      custom: c.custom.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  const addCustom = () => {
    setConfig((c) => (c.custom.length >= MAX_CUSTOM ? c : {
      ...c,
      custom: [...c.custom, { id: genId(), label: '', type: 'text', required: false }],
    }));
  };

  const removeCustom = (id: string) => {
    setConfig((c) => ({ ...c, custom: c.custom.filter((q) => q.id !== id) }));
  };

  const moveCustom = (id: string, dir: -1 | 1) => {
    setConfig((c) => {
      const idx = c.custom.findIndex((q) => q.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= c.custom.length) return c;
      const custom = [...c.custom];
      [custom[idx], custom[to]] = [custom[to], custom[idx]];
      return { ...c, custom };
    });
  };

  // Per-question select options helpers
  const setOption = (id: string, i: number, value: string) => {
    setConfig((c) => ({
      ...c,
      custom: c.custom.map((q) => {
        if (q.id !== id) return q;
        const options = [...(q.options ?? [])];
        options[i] = value;
        return { ...q, options };
      }),
    }));
  };
  const addOption = (id: string) => {
    setConfig((c) => ({
      ...c,
      custom: c.custom.map((q) => (q.id === id ? { ...q, options: [...(q.options ?? []), ''] } : q)),
    }));
  };
  const removeOption = (id: string, i: number) => {
    setConfig((c) => ({
      ...c,
      custom: c.custom.map((q) => (q.id === id ? { ...q, options: (q.options ?? []).filter((_, j) => j !== i) } : q)),
    }));
  };

  const changeType = (id: string, type: PreconsultaFieldType) => {
    setConfig((c) => ({
      ...c,
      custom: c.custom.map((q) => {
        if (q.id !== id) return q;
        if (type === 'select') return { ...q, type, options: q.options?.length ? q.options : ['', ''] };
        const { options, ...rest } = q;
        void options;
        return { ...rest, type };
      }),
    }));
  };

  const handleSave = async () => {
    setNotice(null);
    // Local validation mirrors the server so we can flag issues before the round-trip.
    for (const q of config.custom) {
      if (!q.label.trim()) {
        setNotice({ type: 'error', text: pre.errorQuestionText });
        return;
      }
      if (q.type === 'select') {
        const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
        if (opts.length < 2) {
          setNotice({ type: 'error', text: pre.errorSelectOptions.replace('{{label}}', q.label.trim()) });
          return;
        }
      }
    }

    // Clean payload: trim labels + drop empty options.
    const payload: PreconsultaConfig = {
      defaults: config.defaults,
      custom: config.custom.map((q) => ({
        ...q,
        label: q.label.trim(),
        ...(q.type === 'select'
          ? { options: (q.options ?? []).map((o) => o.trim()).filter(Boolean) }
          : {}),
      })),
    };

    setSaving(true);
    try {
      const saved = await api.profesionales.updatePreconsultaConfig(profesionalId, payload);
      setConfig(saved);
      setNotice({ type: 'success', text: pre.saved });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : pre.saveError });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center text-slate-400 dark:text-slate-500 text-sm">{common.loading}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="section-title mb-1 flex items-center gap-2">
          <ClipboardIcon size={16} className="text-slate-400 dark:text-slate-500" />
          {pre.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{pre.description}</p>
      </div>

      {notice && (
        <div className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status" aria-live="polite">
          <InfoIcon size={14} className="shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Core (always on) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">{pre.alwaysAsked}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="badge badge-blue">{pre.coreReason}</span>
          <span className="badge badge-blue">{pre.coreSymptoms}</span>
        </div>
      </div>

      {/* Default toggles */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{pre.standardFields}</p>
        <div className="space-y-2">
          {DEFAULT_FIELD_KEYS.map((key) => {
            const cfg = config.defaults[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.enabled}
                    onChange={(e) => setDefault(key, { enabled: e.target.checked, ...(e.target.checked ? {} : { required: false }) })}
                    className="size-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{pre.fields[key]}</span>
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">{pre.fieldHints[key]}</span>
                <label className={`ml-auto flex items-center gap-1.5 text-xs ${cfg.enabled ? 'text-slate-500 dark:text-slate-400 cursor-pointer' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={cfg.required}
                    disabled={!cfg.enabled}
                    onChange={(e) => setDefault(key, { required: e.target.checked })}
                    className="size-3.5 accent-blue-600"
                  />
                  {pre.required}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom questions */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{pre.ownQuestions}</p>
        {config.custom.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <p className="text-sm">{pre.noOwnQuestions}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.custom.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col pt-1">
                    <button onClick={() => moveCustom(q.id, -1)} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed leading-none" title={pre.moveUp} aria-label={pre.moveUp}>▲</button>
                    <button onClick={() => moveCustom(q.id, 1)} disabled={idx === config.custom.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed leading-none" title={pre.moveDown} aria-label={pre.moveDown}>▼</button>
                  </div>
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => updateCustom(q.id, { label: e.target.value })}
                    placeholder={pre.questionPlaceholder}
                    maxLength={120}
                    className="field-input flex-1"
                  />
                  <button
                    onClick={() => removeCustom(q.id)}
                    className="btn btn-ghost p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    title={common.delete}
                    aria-label={common.delete}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pl-6">
                  <select
                    value={q.type}
                    onChange={(e) => changeType(q.id, e.target.value as PreconsultaFieldType)}
                    className="field-select w-auto"
                  >
                    {TYPE_OPTIONS.map((ty) => <option key={ty} value={ty}>{pre.types[ty]}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateCustom(q.id, { required: e.target.checked })}
                      className="size-3.5 accent-blue-600"
                    />
                    {pre.required}
                  </label>
                </div>

                {q.type === 'select' && (
                  <div className="pl-6 space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pre.options}</p>
                    {(q.options ?? []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => setOption(q.id, i, e.target.value)}
                          placeholder={`${pre.optionPlaceholder} ${i + 1}`}
                          maxLength={60}
                          className="field-input flex-1"
                        />
                        <button
                          onClick={() => removeOption(q.id, i)}
                          className="btn btn-ghost p-1.5 text-red-400 hover:text-red-600"
                          title={common.delete}
                          aria-label={common.delete}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addOption(q.id)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {pre.addOption}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {config.custom.length < MAX_CUSTOM && (
          <button onClick={addCustom} className="btn btn-secondary btn-sm mt-3">
            {pre.addQuestion}
          </button>
        )}
      </div>

      <div className="flex justify-end border-t border-slate-200 dark:border-slate-700 pt-4">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? common.saving : common.save}
        </button>
      </div>
    </div>
  );
}
