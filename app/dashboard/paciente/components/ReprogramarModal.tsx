'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { api, Turno } from '../../../lib/api';
import { buildReprogrammingFechaHora, getReprogrammingMinDate } from '../../../lib/reprogramming';
import { XIcon, InfoIcon } from '../../../components/icons';

export default function ReprogramarModal({ turno, onClose, onSuccess }: { turno: Turno; onClose: () => void; onSuccess: () => void }) {
  const { t } = useLang();
  const p = t('paciente');
  const common = t('common');
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<{ hora: string; disponible: boolean }[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    const profesionalId = turno.profesional?.id;
    if (!fecha || !profesionalId) { setSlots([]); setHoraSeleccionada(''); return; }

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await api.profesionales.getSlots(profesionalId, fecha, turno.modalidad);
        setSlots(data.filter(s => s.disponible));
      } catch (err) { setSlots([]); }
      finally { setLoadingSlots(false); }
    };
    loadSlots();
  }, [fecha, turno.profesional?.id, turno.modalidad]);

  const handleGuardar = async () => {
    if (!fecha || !horaSeleccionada) { setNotice(p.rescheduleSelectDateTime); return; }
    const fechaHora = buildReprogrammingFechaHora(fecha, horaSeleccionada);
    if (new Date(fechaHora) <= new Date()) { setNotice(p.rescheduleFutureDate); return; }

    setGuardando(true);
    try {
      await api.turnos.reprogramar(turno.id, { fechaHora, modalidad: turno.modalidad });
      onSuccess();
    } catch (err) { setNotice(err instanceof Error ? err.message : p.rescheduleError); }
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">{p.rescheduleTitle}</h3>
          <button aria-label={p.closeModal} onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {notice && (
            <div className="alert alert-error text-sm" role="status" aria-live="polite">
              <InfoIcon size={14} className="shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            {p.rescheduleIntro} <strong>{turno.profesional?.nombre} {turno.profesional?.apellido}</strong>.
            {' '}{p.rescheduleIntroSuffix}
          </p>

          <div>
            <label className="field-label">{p.newDate}</label>
            <input
              type="date"
              value={fecha}
              min={getReprogrammingMinDate()}
              onChange={(e) => { setFecha(e.target.value); setHoraSeleccionada(''); }}
              className="field-input"
            />
          </div>

          {fecha && (
            <div>
              <label className="field-label">{p.availableSchedule}</label>
              {loadingSlots ? (
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 w-16 rounded-lg" />)}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">{p.noAvailableTimesForDate}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.hora}
                      onClick={() => setHoraSeleccionada(slot.hora)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        horaSeleccionada === slot.hora
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {slot.hora}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">{common.cancel}</button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !fecha || !horaSeleccionada}
            className="btn btn-primary flex-1"
          >
            {guardando ? common.saving : p.confirmChange}
          </button>
        </div>
      </div>
    </div>
  );
}
