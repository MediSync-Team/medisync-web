'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { api, Turno, Resena } from '../../../lib/api';
import { formatClinicInstantDate, getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';
import { XIcon, InfoIcon, UserIcon } from '../../../components/icons';
import StarRating from '../../../components/StarRating';

export default function CalificarModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  const { t, lang } = useLang();
  const translateSpecialty = useTranslateSpecialty();
  const p = t('paciente');
  const common = t('common');
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resenaExistente, setResenaExistente] = useState<Resena | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    api.resenas.getMiResena(turno.id)
      .then((r) => { setResenaExistente(r); if (r) { setRating(r.rating); setComentario(r.comentario || ''); } })
      .catch(() => setResenaExistente(null));
  }, [turno.id]);

  const handleGuardar = async () => {
    if (rating === 0) { setNotice({ type: 'error', text: p.ratingRequired }); return; }
    setGuardando(true);
    try {
      await api.resenas.crear({ turnoId: turno.id, rating, comentario: comentario.trim() || undefined });
      onSuccess();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : p.ratingSaveError });
    } finally {
      setGuardando(false);
    }
  };

  const labels = p.ratingLabels;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">{p.rateTitle}</h3>
          <button aria-label={p.closeModal} onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {notice && (
            <div className={`alert ${notice.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              <InfoIcon size={14} className="shrink-0" /><span>{notice.text}</span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg shrink-0">
              {turno.profesional?.fotoUrl
                ? <img src={turno.profesional.fotoUrl} className="w-full h-full rounded-full object-cover" alt="" />
                : <UserIcon size={18} className="text-blue-700" />}
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Dr/a. {turno.profesional?.nombre} {turno.profesional?.apellido}</p>
              <p className="text-xs text-blue-600">{translateSpecialty(turno.profesional?.especialidad?.nombre)}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatClinicInstantDate(turno.fechaHora, getLocale(lang), { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {resenaExistente !== undefined && (
            resenaExistente ? (
              <div className="alert alert-info text-sm">
                <InfoIcon size={14} className="shrink-0" />
                <span>{p.alreadyRated} ({resenaExistente.rating}/5).</span>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-slate-600">{p.ratingPrompt}</p>
                  <StarRating value={rating} onChange={setRating} size={36} />
                  {rating > 0 && (
                    <p className="text-sm font-semibold text-amber-600">{labels[rating]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    {p.rateComment}
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={p.ratePlaceholder}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-slate-800 dark:text-slate-200"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{comentario.length}/500</p>
                </div>
              </>
            )
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">{common.cancel}</button>
          {!resenaExistente && (
            <button
              onClick={handleGuardar}
              disabled={guardando || rating === 0 || resenaExistente === undefined}
              className="btn btn-primary flex-1"
            >
              {guardando ? common.saving : p.rateSubmit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
