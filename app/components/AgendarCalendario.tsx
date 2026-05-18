'use client';

import { urlGoogleCalendar, TurnoCalendarInfo, turnoToCalendarEvent } from '../lib/calendar';
interface Props {
  turno: TurnoCalendarInfo;
  /** compact = botones pequeños inline; default = tarjeta con título */
  variant?: 'card' | 'compact';
}

export default function AgendarCalendario({ turno, variant = 'card' }: Props) {
  const ev = turnoToCalendarEvent(turno);


  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        <a
          href={urlGoogleCalendar(ev)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
        >
          <GoogleCalIcon />
          Google Calendar
        </a>
      </div>
    );
  }

  // card variant
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📅</span>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Agregar al calendario</p>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Guardá el turno en tu app de calendario favorita para no olvidarlo. Incluye recordatorio 1 hora antes.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={urlGoogleCalendar(ev)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300 shadow-sm transition-colors"
        >
          <GoogleCalIcon />
          Google Calendar
        </a>
      </div>
    </div>
  );
}

// -- Inline SVG icons ---------------------------------------------------------

function GoogleCalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 2v4M8 2v4M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 13h2v2H8zM13 13h3v2h-3zM8 17h2v2H8z" fill="currentColor" />
    </svg>
  );
}

