'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/i18n/context';
import { api, AuditoriaDisponibilidad } from '../../lib/api';
import Spinner from '../../components/Spinner';
import { getLocale } from '../../lib/date';

export default function AuditoriaView({ profesionalId }: { profesionalId: string }) {
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { t, lang } = useLang();
  const d = t('dashboard');

  useEffect(() => {
    loadAuditoria();
  }, [page]);

  const loadAuditoria = async () => {
    setLoading(true);
    try {
      const response = await api.profesional.getAuditoria(profesionalId, { page, limit: 20 });
      setAuditoria(response.data ?? response.auditoria ?? []);
      setTotalPages(Math.max(1, Math.ceil((response.meta?.total ?? response.total ?? 0) / 20)));
    } catch (err) {
      console.error('Error loading auditoria:', err);
    }
    setLoading(false);
  };

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
    if (tipo.includes('CREADA') || tipo === 'BLOQUEO_CREADO') return 'bg-emerald-50 text-emerald-700';
    if (tipo.includes('ELIMINADA') || tipo === 'BLOQUEO_ELIMINADO') return 'bg-slate-50 text-slate-700';
    if (tipo.includes('CANCELADO')) return 'bg-red-50 text-red-700';
    return 'bg-blue-50 text-blue-700';
  };

  if (loading && auditoria.length === 0) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-slate-500">
        <Spinner size={20} />
        {t('common').loading}
      </div>
    );
  }

  if (auditoria.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>{d.audit.empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {auditoria.map((event) => (
          <div key={event.id} className={`p-4 rounded-lg border border-slate-200 ${getEventoColor(event.tipoEvento)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{getEventoLabel(event.tipoEvento)}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(event.creadoAt).toLocaleDateString(getLocale(lang))} {new Date(event.creadoAt).toLocaleTimeString(getLocale(lang))}
                  </span>
                </div>
                {event.detalle && (
                  <div className="text-xs text-slate-600 mt-2">
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
                  className="text-xs text-blue-600 hover:text-blue-700 ml-4"
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
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            {d.previous}
          </button>
          <span className="text-sm text-slate-600">
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
