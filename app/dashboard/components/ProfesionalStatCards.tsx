'use client';

import { useLang } from '../../lib/i18n/context';
import { getLocale } from '../../lib/date';
import { useTranslateSpecialty } from '../../lib/i18n/use-translate-specialty';
import { CalendarIcon, ChartIcon, ClipboardIcon } from '../../components/icons';

interface ProfesionalStatCardsProps {
  todayCount: number;
  todayConfirmed: number;
  monthCount: number;
  especialidadNombre: string;
}

/** Activity summary stat cards for the profesional dashboard. */
export default function ProfesionalStatCards({ todayCount, todayConfirmed, monthCount, especialidadNombre }: ProfesionalStatCardsProps) {
  const { t, lang } = useLang();
  const d = t('dashboard');
  const translateSpecialty = useTranslateSpecialty();

  return (
    <div data-onboarding="stat-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="stat-card">
        <div className="flex items-start justify-between">
          <p className="stat-label">{d.appointments} - {d.today}</p>
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <CalendarIcon size={15} className="text-blue-600" />
          </div>
        </div>
        <p className="stat-value text-blue-600">{todayCount}</p>
        <p className="stat-desc">
          {todayConfirmed} {d.confirmed}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-start justify-between">
          <p className="stat-label">{d.appointments} - {d.thisMonth}</p>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ChartIcon size={15} className="text-emerald-600" />
          </div>
        </div>
        <p className="stat-value text-emerald-600">{monthCount}</p>
        <p className="stat-desc">{new Date().toLocaleString(getLocale(lang), { month: 'long' })}</p>
      </div>

      <div className="stat-card">
        <div className="flex items-start justify-between">
          <p className="stat-label">{d.specialtyLabel}</p>
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <ClipboardIcon size={15} className="text-purple-600" />
          </div>
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 leading-tight">
          {translateSpecialty(especialidadNombre || '')}
        </p>
        <p className="stat-desc">{d.title}</p>
      </div>
    </div>
  );
}
