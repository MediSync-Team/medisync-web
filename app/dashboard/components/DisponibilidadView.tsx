'use client';

import { useState } from 'react';
import { useLang } from '../../lib/i18n/context';
import { api, Disponibilidad, BloqueoDisponibilidad } from '../../lib/api';
import { ClockIcon, TrashIcon, MapPinIcon } from '../../components/icons';
import { getDaysLong } from '../../lib/utils';
import { formatClinicDateKeyForDisplay, getLocale, todayInputValue } from '../../lib/date';

export default function DisponibilidadView({
  disponibilidades, nuevaDisp, setNuevaDisp, onAgregar, onEliminar, eliminandoId,
  bloqueos, loadingBloqueos, onReloadBloqueos,
}: {
  disponibilidades: Disponibilidad[];
  nuevaDisp: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL'; lugarAtencion: string };
  setNuevaDisp: (d: any) => void;
  onAgregar: () => void;
  onEliminar: (id: string) => void;
  eliminandoId: string | null;
  bloqueos: BloqueoDisponibilidad[];
  loadingBloqueos: boolean;
  onReloadBloqueos: () => void;
}) {
  const { t, lang } = useLang();
  const d = t('dashboard');
  const modality = t('modality');

  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
    esHoraParcial: false,
  });
  const [savingBloqueo, setSavingBloqueo] = useState(false);
  const [bloqueoError, setBloqueoError] = useState('');
  const [bloqueoOk, setBloqueoOk] = useState('');

  const handleCrearBloqueo = async () => {
    setBloqueoError('');
    setBloqueoOk('');
    if (!nuevoBloqueo.fechaInicio || !nuevoBloqueo.fechaFin) {
      setBloqueoError(d.availabilitySetup.missingDateRange);
      return;
    }
    if (nuevoBloqueo.esHoraParcial && (!nuevoBloqueo.horaInicio || !nuevoBloqueo.horaFin)) {
      setBloqueoError(d.availabilitySetup.partialTimeRequired);
      return;
    }
    setSavingBloqueo(true);
    try {
      await api.bloqueos.crear({
        fechaInicio: nuevoBloqueo.fechaInicio,
        fechaFin: nuevoBloqueo.fechaFin,
        horaInicio: nuevoBloqueo.esHoraParcial ? nuevoBloqueo.horaInicio : undefined,
        horaFin: nuevoBloqueo.esHoraParcial ? nuevoBloqueo.horaFin : undefined,
        motivo: nuevoBloqueo.motivo || undefined,
      });
      setBloqueoOk(d.availabilitySetup.blockingSaved);
      setNuevoBloqueo({ fechaInicio: '', fechaFin: '', horaInicio: '', horaFin: '', motivo: '', esHoraParcial: false });
      onReloadBloqueos();
    } catch (err) {
      setBloqueoError(err instanceof Error ? err.message : d.availabilitySetup.saveBlockingError);
    } finally {
      setSavingBloqueo(false);
    }
  };

  const handleEliminarBloqueo = async (id: string) => {
    try {
      await api.bloqueos.eliminar(id);
      onReloadBloqueos();
    } catch (err) {
      setBloqueoError(err instanceof Error ? err.message : d.availabilitySetup.deleteBlockingError);
    }
  };

  const formatFechaBloqueo = (b: BloqueoDisponibilidad) => {
    const fmt = (dateKey: string) =>
      formatClinicDateKeyForDisplay(dateKey, getLocale(lang), { day: '2-digit', month: 'short', year: 'numeric' });
    if (b.fechaInicio === b.fechaFin) return fmt(b.fechaInicio);
    return `${fmt(b.fechaInicio)} → ${fmt(b.fechaFin)}`;
  };

  return (
    <div className="space-y-8">
      {/* -- Horarios recurrentes -- */}
      <div>
        <h3 className="section-title mb-3">{d.availability}</h3>
        {disponibilidades.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <ClockIcon size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('common').noResults}</p>
          </div>
        ) : (() => {
          // Build location groups: null key = no location assigned
          const locKeys: (string | null)[] = [];
          const locMap: Record<string, Disponibilidad[]> = {};
          const NULL_KEY = '__sin_lugar__';
          for (const disp of disponibilidades) {
            const k = disp.lugarAtencion ?? null;
            const mapK = k ?? NULL_KEY;
            if (!locMap[mapK]) { locMap[mapK] = []; locKeys.push(k); }
            locMap[mapK].push(disp);
          }
          const uniqueKeys = [...new Set(locKeys.map(k => k ?? NULL_KEY))];
          const multipleLocations = uniqueKeys.filter(k => k !== NULL_KEY).length >= 2;

          const DispRow = ({ disp }: { disp: Disponibilidad }) => (
            <div key={disp.id} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-24 shrink-0">
                <p className="font-semibold text-slate-700 text-sm">{getDaysLong(lang)[disp.diaSemana]}</p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                <ClockIcon size={13} className="text-slate-400" />
                <span>{disp.horaInicio} - {disp.horaFin}</span>
              </div>
              <span className={`ml-1 badge ${disp.modalidad === 'VIRTUAL' ? 'badge-blue' : disp.modalidad === 'PRESENCIAL' ? 'badge-green' : 'badge-purple'}`}>
                {disp.modalidad === 'VIRTUAL' ? modality.VIRTUAL : disp.modalidad === 'PRESENCIAL' ? modality.PRESENCIAL : modality.AMBOS}
              </span>
              {!multipleLocations && disp.lugarAtencion && (
                <span className="flex items-center gap-1 text-xs text-slate-500 truncate max-w-[180px]">
                  <MapPinIcon size={11} className="shrink-0 text-slate-400" />
                  {disp.lugarAtencion}
                </span>
              )}
              <button
                onClick={() => onEliminar(disp.id)}
                disabled={eliminandoId === disp.id}
                className={`ml-auto btn btn-ghost p-1.5 ${eliminandoId === disp.id ? 'text-slate-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                title={d.availabilitySetup.deleteSchedule}
              >
                <TrashIcon size={15} />
              </button>
            </div>
          );

          return (
            <div className="space-y-4">
              {uniqueKeys.map((mapK) => (
                <div key={mapK}>
                  {multipleLocations && (
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon size={13} className="text-slate-400 shrink-0" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {mapK === NULL_KEY ? d.availabilitySetup.noLocationAssigned : mapK}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {locMap[mapK].map((disp) => <DispRow key={disp.id} disp={disp} />)}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* -- Agregar horario -- */}
      <div>
        <h3 className="section-title mb-3">{d.addAvailability}</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="field-label">{d.day}</label>
              <select
                value={nuevaDisp.diaSemana}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, diaSemana: parseInt(e.target.value) })}
                className="field-select"
              >
                {getDaysLong(lang).map((dia, i) => <option key={i} value={i}>{dia}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">{d.from}</label>
              <input
                type="time" value={nuevaDisp.horaInicio}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaInicio: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{d.to}</label>
              <input
                type="time" value={nuevaDisp.horaFin}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{t('professional').modality}</label>
              <select
                value={nuevaDisp.modalidad}
                onChange={(e) => setNuevaDisp({ ...nuevaDisp, modalidad: e.target.value as any })}
                className="field-select"
              >
                <option value="PRESENCIAL">{modality.PRESENCIAL}</option>
                <option value="VIRTUAL">{modality.VIRTUAL}</option>
              </select>
            </div>
          </div>
          {/* Lugar de atención por horario */}
          <div className="mt-3">
            <label className="field-label flex items-center gap-1">
              <MapPinIcon size={12} className="text-slate-400" />
              {d.availabilitySetup.location}
              <span className="text-slate-400 font-normal ml-1">- {d.availabilitySetup.optional}</span>
            </label>
            <input
              type="text"
              placeholder={nuevaDisp.modalidad === 'VIRTUAL' ? d.availabilitySetup.placeholderVirtual : d.availabilitySetup.placeholderInPerson}
              value={nuevaDisp.lugarAtencion}
              onChange={(e) => setNuevaDisp({ ...nuevaDisp, lugarAtencion: e.target.value })}
              className="field-input"
            />
          </div>
          <button onClick={onAgregar} className="btn btn-primary mt-4">
            + {d.addAvailability}
          </button>
        </div>
      </div>

      {/* ══ Bloqueos de días ══ */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center gap-2 mb-1">
          {/* Calendar-off icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
          <h3 className="section-title">{d.availabilitySetup.blockingsTitle}</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">{d.availabilitySetup.blockingsDesc}</p>

        {/* Lista de bloqueos activos */}
        {loadingBloqueos ? (
          <div className="py-6 flex justify-center text-slate-400 text-sm">{t('common').loading}</div>
        ) : bloqueos.length === 0 ? (
          <div className="py-6 text-center text-slate-400 border-2 border-dashed border-amber-100 rounded-xl mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-30 text-amber-400">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="text-sm">{d.availabilitySetup.noBlockings}</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {bloqueos.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-amber-500">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm">{formatFechaBloqueo(b)}</p>
                  <p className="text-xs text-slate-500">
                    {b.horaInicio && b.horaFin ? `${b.horaInicio}–${b.horaFin}` : d.availabilitySetup.fullDay}
                    {b.motivo ? ` · ${
                      b.motivo === 'Vacaciones' ? d.availabilitySetup.reasons.vacations :
                      b.motivo === 'Feriado' ? d.availabilitySetup.reasons.holiday :
                      b.motivo === 'Capacitación' ? d.availabilitySetup.reasons.training :
                      b.motivo === 'Personal' ? d.availabilitySetup.reasons.personal :
                      b.motivo === 'Otro' ? d.availabilitySetup.reasons.other :
                      b.motivo
                    }` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleEliminarBloqueo(b.id)}
                  className="btn btn-ghost text-red-400 hover:text-red-600 p-1.5 shrink-0"
                  title={t('common').delete}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario nuevo bloqueo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-3">{d.availabilitySetup.addBlocking}</h4>
          {bloqueoError && <p className="text-xs text-red-600 mb-2">{bloqueoError}</p>}
          {bloqueoOk && <p className="text-xs text-emerald-600 mb-2">{bloqueoOk}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="field-label">{d.availabilitySetup.startDate}</label>
              <input
                type="date"
                value={nuevoBloqueo.fechaInicio}
                min={todayInputValue()}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fechaInicio: e.target.value, fechaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{d.availabilitySetup.endDate}</label>
              <input
                type="date"
                value={nuevoBloqueo.fechaFin}
                min={nuevoBloqueo.fechaInicio || todayInputValue()}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fechaFin: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{d.availabilitySetup.reason}</label>
              <select
                value={nuevoBloqueo.motivo}
                onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, motivo: e.target.value })}
                className="field-select"
              >
                <option value="">{d.availabilitySetup.reasonUnspecified}</option>
                <option value="Vacaciones">{d.availabilitySetup.reasons.vacations}</option>
                <option value="Feriado">{d.availabilitySetup.reasons.holiday}</option>
                <option value="Capacitación">{d.availabilitySetup.reasons.training}</option>
                <option value="Personal">{d.availabilitySetup.reasons.personal}</option>
                <option value="Otro">{d.availabilitySetup.reasons.other}</option>
              </select>
            </div>
          </div>

          {/* Toggle bloqueo parcial */}
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={nuevoBloqueo.esHoraParcial}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, esHoraParcial: e.target.checked })}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-600">{d.availabilitySetup.partialBlock}</span>
          </label>

          {nuevoBloqueo.esHoraParcial && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="field-label">{d.availabilitySetup.startTime}</label>
                <input
                  type="time"
                  value={nuevoBloqueo.horaInicio}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: e.target.value })}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">{d.availabilitySetup.endTime}</label>
                <input
                  type="time"
                  value={nuevoBloqueo.horaFin}
                  onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaFin: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleCrearBloqueo}
            disabled={savingBloqueo}
            className="btn btn-primary bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700"
          >
            {savingBloqueo ? d.availabilitySetup.saving : `+ ${d.availabilitySetup.addBlocking}`}
          </button>
        </div>
      </div>
    </div>
  );
}
