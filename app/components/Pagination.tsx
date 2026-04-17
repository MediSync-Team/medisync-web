'use client';

import { useLang } from '../lib/i18n/context';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const { t } = useLang();
  const p = t('pagination');
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page number list with ellipsis
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {p.showing} <span className="font-medium text-slate-700 dark:text-slate-200">{from}–{to}</span> {p.of}{' '}
        <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span> {p.results}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← {p.prev}
        </button>

        {pages.map((pg, i) =>
          pg === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 dark:text-slate-500 select-none">…</span>
          ) : (
            <button
              key={pg}
              onClick={() => onPageChange(pg)}
              className={`w-9 h-9 text-sm rounded-md border transition-colors ${
                pg === page
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {pg}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {p.next} →
        </button>
      </div>
    </div>
  );
}
