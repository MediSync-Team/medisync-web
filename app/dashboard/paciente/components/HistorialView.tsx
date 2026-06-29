'use client';

import { HistorialTurno } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import HistorialCard from './HistorialCard';
import CardListSkeleton from './CardListSkeleton';
import Pagination from '../../../components/Pagination';
import { ClipboardIcon } from '../../../components/icons';

interface HistorialViewProps {
  historial: HistorialTurno[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onDownloadPDF: () => void;
  onCalificar: (turno: HistorialTurno) => void;
  onChat?: (turno: HistorialTurno) => void;
  translateSpecialty: (name?: string) => string;
}

/** Clinical history tab body (extracted from the paciente dashboard page). */
export default function HistorialView({
  historial, loading, page, totalPages, total, limit, onPageChange, onDownloadPDF, onCalificar, onChat, translateSpecialty,
}: HistorialViewProps) {
  const { t } = useLang();
  const d = t('dashboard');
  const m = t('modality');
  const s = t('status');

  if (loading) return <CardListSkeleton />;

  if (historial.length === 0) {
    return (
      <div className="py-12 text-center">
        <ClipboardIcon size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{d.noCompletedConsultations}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {d.downloadFullHistory}
        </button>
      </div>
      <div className="space-y-4">
        {historial.map((item) => (
          <HistorialCard key={item.id} item={item} onCalificar={onCalificar} onChat={onChat} d={d} m={m} s={s} translateSpecialty={translateSpecialty} />
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={onPageChange}
      />
    </>
  );
}
