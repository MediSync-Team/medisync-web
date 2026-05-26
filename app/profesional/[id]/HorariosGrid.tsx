'use client';

import { useLang } from '../../lib/i18n/context';
import { ClockIcon } from '../../components/icons';

type Disponibilidad = {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: string;
};

export default function HorariosGrid({ disponibilidades }: { disponibilidades: Disponibilidad[] }) {
  const { t } = useLang();
  const p = t('professional');

  type Block = { horaInicio: string; horaFin: string; modalidad: string };
  const byDay = new Map<number, Block[]>();
  for (const d of disponibilidades) {
    if (!byDay.has(d.diaSemana)) byDay.set(d.diaSemana, []);
    byDay.get(d.diaSemana)!.push(d);
  }

  const activeDays = [1, 2, 3, 4, 5, 6, 0].filter(d => byDay.has(d));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
        <ClockIcon size={14} className="text-slate-400" />
        {p.regularSchedule}
      </h3>
      <div className="space-y-2">
        {activeDays.map((dia) => (
          <div key={dia} className="flex items-start gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-8 pt-0.5 shrink-0">{p.daysShort[dia]}</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {byDay.get(dia)!.map((b, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    b.modalidad === 'VIRTUAL'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                      : b.modalidad === 'AMBOS'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {b.horaInicio}&ndash;{b.horaFin}
                  <span className="opacity-60 text-[10px]">
                    {b.modalidad === 'VIRTUAL' ? 'VIR' : b.modalidad === 'AMBOS' ? 'AMB' : 'PRE'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
