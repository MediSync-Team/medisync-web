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
      <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarIcon size={18} />
        </div>
        <p className="font-heading text-3xl font-bold leading-none tracking-tight text-foreground">{todayCount}</p>
        <p className="mt-2 text-sm font-medium text-foreground">{d.appointments} - {d.today}</p>
        <p className="text-xs text-muted-foreground">{todayConfirmed} {d.confirmed}</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
          <ChartIcon size={18} />
        </div>
        <p className="font-heading text-3xl font-bold leading-none tracking-tight text-foreground">{monthCount}</p>
        <p className="mt-2 text-sm font-medium text-foreground">{d.appointments} - {d.thisMonth}</p>
        <p className="text-xs capitalize text-muted-foreground">{new Date().toLocaleString(getLocale(lang), { month: 'long' })}</p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardIcon size={18} />
        </div>
        <p className="font-heading mt-0.5 text-xl font-bold leading-tight tracking-tight text-foreground">
          {translateSpecialty(especialidadNombre || '')}
        </p>
        <p className="mt-1.5 text-sm font-medium text-foreground">{d.specialtyLabel}</p>
        <p className="text-xs text-muted-foreground">{d.title}</p>
      </div>
    </div>
  );
}
