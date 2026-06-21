'use client';

import { ListaEsperaItem } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { clinicDateKeyFromDateOnly, formatClinicDateKeyForDisplay, getLocale } from '../../../lib/date';
import { CalendarIcon, WaitlistIcon } from '../../../components/icons';

interface ListaEsperaViewProps {
  items: ListaEsperaItem[];
  onCancelar: (id: string) => void;
  translateSpecialty: (name?: string) => string;
}

/** "Lista de espera" tab body (extracted from the paciente dashboard page). */
export default function ListaEsperaView({ items, onCancelar, translateSpecialty }: ListaEsperaViewProps) {
  const { t, lang } = useLang();
  const p = t('paciente');
  const s = t('status');
  const locale = getLocale(lang);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <WaitlistIcon size={32} className="mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm font-medium">{p.noWaitlist}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border bg-card p-4 shadow-sm flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">
              {item.profesional?.nombre} {item.profesional?.apellido}
            </p>
            <p className="text-sm text-primary font-medium">{translateSpecialty(item.profesional?.especialidad?.nombre)}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarIcon size={11} />{formatClinicDateKeyForDisplay(clinicDateKeyFromDateOnly(item.fecha), locale, { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
              <span>{item.modalidad}</span>
            </div>
            <span className="badge badge-yellow mt-2">{(s as any)[item.estado] || item.estado}</span>
          </div>
          <button onClick={() => onCancelar(item.id)} className="btn btn-secondary btn-sm">
            {p.cancel}
          </button>
        </div>
      ))}
    </div>
  );
}
