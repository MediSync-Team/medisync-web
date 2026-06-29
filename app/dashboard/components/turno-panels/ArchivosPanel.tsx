'use client';

import { useState } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { PaperclipIcon, TrashIcon } from '../../../components/icons';
import { Notice } from '../../../lib/ui-notice';
import { useArchivosPanel } from './useArchivosPanel';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

interface ArchivosPanelProps {
  turnoId: string;
  onNotice?: (notice: Notice) => void;
  /** Read-only mode: hides the upload control and per-file delete (e.g. a patient
   *  reviewing the files of a past/cancelled turno). */
  readOnly?: boolean;
}

/** Archivos adjuntos del turno (extracted from TurnoModal). */
export default function ArchivosPanel({ turnoId, onNotice, readOnly = false }: ArchivosPanelProps) {
  const { t } = useLang();
  const d = t('dashboard');
  const common = t('common');
  const modal = d.turnoModal;
  const [fileType, setFileType] = useState('OTRO');
  const { archivos, uploading, upload, remove } = useArchivosPanel(turnoId);

  const fileTypeLabel = (tipo?: string | null) => {
    if (tipo === 'LABORATORIO') return modal.files.types.LABORATORIO;
    if (tipo === 'IMAGEN') return modal.files.types.IMAGEN;
    if (tipo === 'EVOLUCION') return modal.files.types.EVOLUCION;
    return modal.files.types.OTRO;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file, fileType);
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (await remove(id)) onNotice?.({ type: 'success', text: modal.notices.fileDeleted });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <PaperclipIcon size={15} className="text-slate-400 dark:text-slate-500" />
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{d.files}</h4>
      </div>

      {!readOnly && (
      <div className="flex gap-2 mb-3">
        <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="field-select text-xs">
          <option value="LABORATORIO">{modal.files.types.LABORATORIO}</option>
          <option value="IMAGEN">{modal.files.types.IMAGEN}</option>
          <option value="EVOLUCION">{modal.files.types.EVOLUCION}</option>
          <option value="OTRO">{modal.files.types.OTRO}</option>
        </select>
        <label className="flex-1">
          <input type="file" onChange={handleUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" />
          <span className={`btn btn-secondary btn-sm w-full justify-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? common.saving : `+ ${d.uploadFile}`}
          </span>
        </label>
      </div>
      )}

      {archivos.length > 0 ? (
        <div className="space-y-2">
          {archivos.map((archivo) => (
            <div key={archivo.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
              <span className="text-2xl shrink-0">
                {archivo.mimeType?.includes('pdf') ? '📄' : '🖼️'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{archivo.nombreOriginal}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{fileTypeLabel(archivo.tipo)} · {formatFileSize(archivo.tamanoBytes ?? 0)}</p>
              </div>
              <a href={archivo.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost p-1.5 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs">{modal.files.view}</a>
              {!readOnly && (
                <button onClick={() => handleDelete(archivo.id)} className="btn btn-ghost p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300">
                  <TrashIcon size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">{d.noFiles}</p>
      )}
    </div>
  );
}
