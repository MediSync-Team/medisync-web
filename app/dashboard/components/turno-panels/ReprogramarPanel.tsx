'use client';

import { Turno } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { buildReprogrammingFechaHora, getReprogrammingMinDate } from '../../../lib/reprogramming';
import { CalendarIcon, XIcon } from '../../../components/icons';
import Spinner from '../../../components/Spinner';
import { Notice } from '../../../lib/ui-notice';
import { useReprogramarPanel } from './useReprogramarPanel';

interface ReprogramarPanelProps {
  turno: Turno;
  onNotice: (notice: Notice) => void;
  /** Close the inline panel (without closing the modal). */
  onClose: () => void;
  /** Called after a successful reschedule (refresh + close the modal). */
  onRescheduled: () => void;
}

/** Inline reprogramar panel (extracted from TurnoModal). */
export default function ReprogramarPanel({ turno, onNotice, onClose, onRescheduled }: ReprogramarPanelProps) {
  const { t } = useLang();
  const modal = t('dashboard').turnoModal;
  const { fecha, setFecha, slots, hora, setHora, cargandoSlots, reprogramando, cargarSlots, reprogramar } = useReprogramarPanel(turno);

  const handleReprogramar = async () => {
    if (!fecha || !hora) {
      onNotice({ type: 'error', text: modal.notices.rescheduleMissingFields });
      return;
    }
    const res = await reprogramar(buildReprogrammingFechaHora(fecha, hora));
    if (res.ok) {
      onNotice({ type: 'success', text: modal.notices.rescheduleSaved });
      onClose();
      onRescheduled();
    } else {
      onNotice({ type: 'error', text: res.message ?? modal.notices.rescheduleError });
    }
  };

  return (
    <div className="mx-6 mb-4 border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
          <CalendarIcon size={15} className="text-blue-600" />
          {modal.reschedule.title}
        </h4>
        <button onClick={onClose} className="text-blue-400 hover:text-blue-600">
          <XIcon size={15} />
        </button>
      </div>
      <p className="text-xs text-blue-700">
        {modal.reschedule.patientNotified}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label">{modal.reschedule.newDate}</label>
          <input
            type="date"
            value={fecha}
            min={getReprogrammingMinDate()}
            onChange={(e) => {
              setFecha(e.target.value);
              cargarSlots(e.target.value);
            }}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">{modal.reschedule.availableTime}</label>
          {cargandoSlots ? (
            <div className="field-input flex items-center gap-2 text-slate-400 text-sm">
              <Spinner size={16} />
              {modal.reschedule.loadingSlots}
            </div>
          ) : slots.length === 0 ? (
            <div className="field-input text-slate-400 text-sm">
              {fecha ? modal.reschedule.noAvailability : modal.reschedule.selectDate}
            </div>
          ) : (
            <select
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="field-select"
            >
              <option value="">{modal.reschedule.selectTime}</option>
              {slots.map((s) => (
                <option key={s.hora} value={s.hora}>{s.hora}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onClose} className="btn btn-secondary btn-sm">
          {modal.reschedule.cancel}
        </button>
        <button
          onClick={handleReprogramar}
          disabled={reprogramando || !fecha || !hora}
          className="btn btn-primary btn-sm"
        >
          {reprogramando ? modal.reschedule.reprogramming : modal.reschedule.confirm}
        </button>
      </div>
    </div>
  );
}
