'use client';

import { useMemo, useState } from 'react';
import { useLang } from '../../lib/i18n/context';
import { api } from '../../lib/api';
import { useCachedAsync } from '../../hooks/useCachedAsync';
import { cacheKeys, TTL } from '../../lib/api/cache';
import Spinner from '../../components/Spinner';
import { getLocale, formatClinicInstantDate, formatClinicInstantTime } from '../../lib/date';

export default function AuditoriaView({ profesionalId }: { profesionalId: string }) {
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { t, lang } = useLang();
  const d = t('dashboard');

  const { data: response, loading } = useCachedAsync(
    cacheKeys.auditoria(profesionalId, page),
    () => api.profesional.getAuditoria(profesionalId, { page, limit: 20 }),
    TTL.short
  );

  const auditoria = useMemo<any[]>(() => (response as any)?.data ?? (response as any)?.auditoria ?? [], [response]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((((response as any)?.meta?.total ?? (response as any)?.total ?? 0)) / 20)),
    [response]
  );

  const getEventoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      DISPONIBILIDAD_CREADA: d.audit.createdAvailability,
      DISPONIBILIDAD_ELIMINADA: d.audit.removedAvailability,
      BLOQUEO_CREADO: d.audit.createdBlocking,
      BLOQUEO_ELIMINADO: d.audit.removedBlocking,
      TURNO_CANCELADO_POR_BLOQUEO: d.audit.appointmentCanceledByBlocking,
      TURNO_CANCELADO_POR_PROFESIONAL: d.audit.appointmentCanceledByProfessional,
    };
    return labels[tipo] || tipo;
  };

  const getEventoColor = (tipo: string): string => {
    if (tipo.includes('CREADA') || tipo === 'BLOQUEO_CREADO') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    if (tipo.includes('ELIMINADA') || tipo === 'BLOQUEO_ELIMINADO') return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    if (tipo.includes('CANCELADO')) return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
  };

  if (loading && auditoria.length === 0) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Spinner size={20} />
        {t('common').loading}
      </div>
    );
  }

  if (auditoria.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400">
        <p>{d.audit.empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {auditoria.map((event) => (
          <div key={event.id} className={`p-4 rounded-lg border border-slate-200 dark:border-slate-700 ${getEventoColor(event.tipoEvento)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{getEventoLabel(event.tipoEvento)}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatClinicInstantDate(event.creadoAt, getLocale(lang))} {formatClinicInstantTime(event.creadoAt, getLocale(lang))}
                  </span>
                </div>
                {event.detalle && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    {event.tipoEvento === 'DISPONIBILIDAD_CREADA' && event.detalle.diaSemana && (
                      <p>{d.audit.day}: {event.detalle.diaSemana} | {event.detalle.horaInicio || '-'} - {event.detalle.horaFin || '-'}</p>
                    )}
                    {event.tipoEvento === 'BLOQUEO_CREADO' && (
                      <p>
                        {d.audit.reason}: {event.detalle.motivo || d.audit.unspecified}<br/>
                        {event.detalle.turnosCancelados && `${d.audit.canceledAppointments}: ${event.detalle.turnosCancelados}`}
                      </p>
                    )}
                    {event.tipoEvento === 'TURNO_CANCELADO_POR_PROFESIONAL' && event.detalle.razon && (
                      <p>{d.audit.professionalReason}: {event.detalle.razon}</p>
                    )}
                  </div>
                )}
              </div>
              {event.detalle && Object.keys(event.detalle).length > 0 && (
                <button
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-4"
                >
                  {selectedEvent === event.id ? d.audit.hide : d.audit.viewDetails}
                </button>
              )}
            </div>
            {selectedEvent === event.id && event.detalle && (
              <div className="mt-3 pt-3 border-t border-current opacity-50 text-xs overflow-auto max-h-40">
                <pre>{JSON.stringify(event.detalle, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            {d.previous}
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {d.page} {page} {d.of} {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            {d.next}
          </button>
        </div>
      )}
    </div>
  );
}
