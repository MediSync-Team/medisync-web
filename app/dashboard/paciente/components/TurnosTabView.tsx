'use client';

import Link from 'next/link';
import { Turno } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import TurnoCard from './TurnoCard';
import Pagination from '../../../components/Pagination';
import { CalendarIcon, SearchIcon } from '../../../components/icons';

interface TurnosTabViewProps {
  turnos: Turno[];
  loading: boolean;
  tab: 'proximos' | 'pasados';
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  pagosPendientes: Record<string, { necesitaPago: boolean; initPoint?: string }>;
  horasMinCancelacion: number;
  cancellingTurnoId: string | null;
  canCancel: (fechaHora: string) => boolean;
  onPageChange: (page: number) => void;
  translateSpecialty: (name?: string) => string;
  onPagar: (turno: Turno) => void;
  onCancelar: (turno: Turno) => void;
  onReprogramar: (turno: Turno) => void;
  onCompletarPreconsulta: (turno: Turno) => void;
  onVerReceta: (turno: Turno) => void;
  onCalificar: (turno: Turno) => void;
  onVideoCall: (turno: Turno) => void;
  onChat: (turno: Turno) => void;
}

/** Upcoming / past turnos tab body (extracted from the paciente dashboard page). */
export default function TurnosTabView(props: TurnosTabViewProps) {
  const {
    turnos, loading, tab, page, totalPages, total, limit, pagosPendientes,
    horasMinCancelacion, cancellingTurnoId, canCancel, onPageChange, translateSpecialty,
    onPagar, onCancelar, onReprogramar, onCompletarPreconsulta, onVerReceta, onCalificar, onVideoCall, onChat,
  } = props;
  const { t } = useLang();
  const p = t('paciente');
  const d = t('dashboard');
  const s = t('status');

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-8 w-32 rounded-lg mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'proximos' && turnos.length === 0) {
    return (
      <div className="py-12 text-center">
        <CalendarIcon size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">{p.noUpcoming}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 max-w-sm mx-auto">
          {d.firstAppointment}
        </p>
        <Link href="/" className="btn btn-primary btn-sm">
          <SearchIcon size={13} /> {p.searchProfessional}
        </Link>
      </div>
    );
  }

  if (tab === 'pasados' && turnos.length === 0) {
    return (
      <div className="py-12 text-center">
        <CalendarIcon size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{p.noPast}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {turnos.map((turno) => (
          <TurnoCard
            key={turno.id}
            turno={turno}
            pagoInfo={pagosPendientes[turno.id]}
            horasMinCancelacion={horasMinCancelacion}
            canCancel={canCancel(turno.fechaHora)}
            isCancelling={cancellingTurnoId === turno.id}
            onPagar={() => onPagar(turno)}
            onCancelar={() => onCancelar(turno)}
            onReprogramar={() => onReprogramar(turno)}
            onCompletarPreconsulta={() => onCompletarPreconsulta(turno)}
            onVerReceta={() => onVerReceta(turno)}
            onCalificar={() => onCalificar(turno)}
            onVideoCall={() => onVideoCall(turno)}
            onChat={() => onChat(turno)}
            d={d}
            s={s}
            translateSpecialty={translateSpecialty}
          />
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
