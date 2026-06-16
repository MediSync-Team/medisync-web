'use client';

import { useLang } from '../../../lib/i18n/context';
import { ClipboardIcon, CheckIcon } from '../../../components/icons';
import { useEvolucionNotasPanel } from './useEvolucionNotasPanel';

interface EvolucionNotasPanelProps {
  turnoId: string;
  /** Shared "saved" badge text, also flashed by the receta panel. */
  savedMessage: string;
  flashSaved: (text: string) => void;
  onUpdate: () => void;
}

/** Editable evolución clínica notes (extracted from TurnoModal). */
export default function EvolucionNotasPanel({ turnoId, savedMessage, flashSaved, onUpdate }: EvolucionNotasPanelProps) {
  const { t } = useLang();
  const d = t('dashboard');
  const modal = d.turnoModal;
  const common = t('common');
  const { notas, setNotas, loading, saving, save } = useEvolucionNotasPanel(turnoId);

  const handleSave = async () => {
    if (await save()) {
      flashSaved(modal.notices.notesSaved);
      onUpdate();
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardIcon size={15} className="text-slate-400" />
        <h4 className="font-semibold text-slate-700 text-sm">{d.evolution}</h4>
        {savedMessage && (
          <span className="badge badge-green ml-auto text-xs flex items-center gap-1">
            <CheckIcon size={10} /> {savedMessage}
          </span>
        )}
      </div>
      {loading ? (
        <div className="skeleton h-24 rounded-lg" />
      ) : (
        <>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder={modal.evolution.placeholder}
            className="field-input resize-none h-28 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm mt-2"
          >
            {saving ? common.saving : d.saveNotes}
          </button>
        </>
      )}
    </div>
  );
}
