'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/i18n/context';
import { api, Resena, ResenasStats } from '../../lib/api';
import { InfoIcon } from '../../components/icons';
import StarRating from '../../components/StarRating';
import { formatClinicInstantDate, getLocale } from '../../lib/date';
import { Notice } from '../../lib/ui-notice';

export default function ResenasView() {
  const { lang, t } = useLang();
  const d = t('dashboard');
  const reviews = d.reviewsView;
  const [data, setData] = useState<{ resenas: Resena[]; stats: ResenasStats; pagination: { page: number; totalPages: number; total: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  // Per-review state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [respuestaText, setRespuestaText] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = async (p = 1, rating?: number) => {
    setLoading(true);
    try {
      const res = await api.resenas.getMisResenas({ page: p, limit: 10, rating });
      setData(res as any);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, ratingFilter); }, []);

  const applyFilter = (r?: number) => {
    setRatingFilter(r);
    load(1, r);
  };

  const startEdit = (resena: Resena) => {
    setEditingId(resena.id);
    setRespuestaText(resena.respuesta ?? '');
    setNotice(null);
  };

  const cancelEdit = () => { setEditingId(null); setRespuestaText(''); };
  const fill = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);
  const reviewCountLabel = (count: number) =>
    fill(count === 1 ? reviews.reviewCountSingular : reviews.reviewCountPlural, { count });

  const handleGuardarRespuesta = async (id: string) => {
    if (respuestaText.trim().length < 5) {
      setNotice({ type: 'error', text: reviews.replyTooShort });
      return;
    }
    setSaving(true);
    try {
      await api.resenas.responder(id, respuestaText.trim());
      setNotice({ type: 'success', text: reviews.replyPublished });
      setEditingId(null);
      load(page, ratingFilter);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : reviews.saveError });
    } finally { setSaving(false); }
  };

  const handleBorrarRespuesta = async (id: string) => {
    setSaving(true);
    try {
      await api.resenas.borrarRespuesta(id);
      setNotice({ type: 'success', text: reviews.replyDeleted });
      load(page, ratingFilter);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : reviews.deleteError });
    } finally { setSaving(false); }
  };

  const starColor = (r: number) => r >= 4 ? 'text-amber-500' : r === 3 ? 'text-blue-500' : 'text-red-500';

  return (
    <div className="space-y-5">
      {notice && (
        <div className={`alert ${notice.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
          <InfoIcon size={14} className="shrink-0" />
          <span>{notice.text}</span>
          <button className="ml-auto text-xs underline" onClick={() => setNotice(null)}>{d.hide}</button>
        </div>
      )}

      {/* -- Stats header ------------------------------------------- */}
      {data?.stats && data.stats.total > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Promedio grande */}
            <div className="text-center shrink-0">
              <p className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {data.stats.promedio ?? '-'}
              </p>
              <StarRating value={data.stats.promedio ?? 0} size={16} />
              <p className="text-xs text-slate-400 mt-1">
                {reviewCountLabel(data.stats.total)}
              </p>
            </div>

            {/* Distribución barras */}
            {data.stats.distribucion && (
              <div className="flex-1 space-y-1.5 w-full">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = data.stats.distribucion?.[star] ?? 0;
                  const pct = data.stats.total > 0 ? (count / data.stats.total) * 100 : 0;
                  return (
                    <button
                      key={star}
                      onClick={() => applyFilter(ratingFilter === star ? undefined : star)}
                      className={`flex items-center gap-2 w-full group ${ratingFilter === star ? 'opacity-100' : 'hover:opacity-80'}`}
                    >
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-4 text-right shrink-0">{star}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${ratingFilter === star ? 'bg-amber-500' : 'bg-amber-400 dark:bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-6 text-right shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active filter badge */}
          {ratingFilter && (
            <div className="mt-3 flex items-center gap-2">
              <span className="badge badge-yellow text-xs">{reviews.filtering}: {ratingFilter}★</span>
              <button onClick={() => applyFilter(undefined)} className="text-xs text-slate-400 hover:text-red-500 underline">
                {reviews.clearFilter}
              </button>
            </div>
          )}
        </div>
      )}

      {/* -- Review list ------------------------------------------ */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : !data || data.stats.total === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mx-auto mb-3 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          <p className="text-sm font-medium">{reviews.noReviewsTitle}</p>
          <p className="text-xs mt-1">
            {reviews.noReviewsDesc}
          </p>
        </div>
      ) : data.resenas.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">
          {fill(reviews.noFilteredReviews, { rating: ratingFilter ?? '' })}
        </div>
      ) : (
        <div className="space-y-4">
          {data.resenas.map((resena) => (
            <div key={resena.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {/* Review header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden">
                      {resena.paciente?.fotoUrl
                        ? <img src={resena.paciente.fotoUrl} alt="" className="w-full h-full object-cover" />
                        : `${resena.paciente?.nombre?.[0] ?? '?'}${resena.paciente?.apellido?.[0] ?? ''}`}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {resena.paciente ? `${resena.paciente.nombre} ${resena.paciente.apellido}` : reviews.unknownPatient}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(resena.createdAt).toLocaleDateString(getLocale(lang), { day: 'numeric', month: 'long', year: 'numeric' })}
                        {resena.turno && ` · ${formatClinicInstantDate(resena.turno.fechaHora, getLocale(lang), { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < resena.rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                    <span className={`ml-1 text-sm font-bold ${starColor(resena.rating)}`}>{resena.rating}/5</span>
                  </div>
                </div>

                {/* Comment */}
                {resena.comentario && (
                  <p className="mt-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    &quot;{resena.comentario}&quot;
                  </p>
                )}
              </div>

              {/* Response section */}
              <div className="border-t border-slate-100 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3">
                {editingId === resena.id ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{reviews.publicReply}</p>
                    <textarea
                      value={respuestaText}
                      onChange={(e) => setRespuestaText(e.target.value)}
                      placeholder={reviews.replyPlaceholder}
                      className="field-input resize-none min-h-[80px] text-sm"
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{respuestaText.length}/2000</span>
                      <div className="flex gap-2">
                        <button onClick={cancelEdit} className="btn btn-secondary btn-sm">{reviews.cancel}</button>
                        <button
                          onClick={() => handleGuardarRespuesta(resena.id)}
                          disabled={saving}
                          className="btn btn-primary btn-sm"
                        >
                          {saving ? reviews.saving : reviews.publishReply}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : resena.respuesta ? (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {reviews.yourReply}
                        {resena.respondidaAt && (
                          <span className="text-slate-400 font-normal">· {new Date(resena.respondidaAt).toLocaleDateString(getLocale(lang), { day: 'numeric', month: 'short' })}</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(resena)} className="text-xs text-blue-600 hover:underline">{reviews.edit}</button>
                        <button onClick={() => handleBorrarRespuesta(resena.id)} disabled={saving} className="text-xs text-red-400 hover:text-red-600 hover:underline">{reviews.delete}</button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{resena.respuesta}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(resena)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    {reviews.replyAction}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -- Pagination ------------------------------------------- */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <button
            disabled={page === 1}
            onClick={() => { const p = page - 1; setPage(p); load(p, ratingFilter); }}
            className="btn btn-secondary btn-sm disabled:opacity-40"
          >{d.previous}</button>
          <span className="text-sm text-slate-500">{page} / {data.pagination.totalPages}</span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p, ratingFilter); }}
            className="btn btn-secondary btn-sm disabled:opacity-40"
          >{d.next}</button>
        </div>
      )}
    </div>
  );
}
