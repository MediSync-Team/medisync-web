'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLang } from '../../lib/i18n/context';
import { Turno } from '../../lib/api';
import { CalendarIcon, VideoIcon, BuildingIcon, MapPinIcon, InfoIcon } from '../../components/icons';
import { estadoBadge, estadoLabel, estadoCanceladoAusenteLabel, clinicalRiskBadge, getDaysShort } from '../../lib/utils';
import {
  clinicDateKeyFromInstant,
  formatClinicDateKeyForDisplay,
  formatClinicInstantTime,
  getClinicMonthGridDateKeys,
  getLocale,
  todayInputValue,
} from '../../lib/date';

export default function CalendarioView({
  selectedDateKey, setSelectedDateKey, turnos: allTurnos, turnosDelDia, onSelectTurno,
  agendaSearch, setAgendaSearch, agendaEstado, setAgendaEstado, agendaModalidad, setAgendaModalidad, agendaSoloRiesgo, setAgendaSoloRiesgo, onFetchMonth,
}: {
  selectedDateKey: string;
  setSelectedDateKey: (dateKey: string) => void;
  turnos: Turno[];
  turnosDelDia: Turno[];
  onSelectTurno: (t: Turno) => void;
  agendaSearch: string;
  setAgendaSearch: (v: string) => void;
  agendaEstado: 'TODOS' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
  setAgendaEstado: (v: 'TODOS' | 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE') => void;
  agendaModalidad: 'TODAS' | 'PRESENCIAL' | 'VIRTUAL';
  setAgendaModalidad: (v: 'TODAS' | 'PRESENCIAL' | 'VIRTUAL') => void;
  agendaSoloRiesgo: boolean;
  setAgendaSoloRiesgo: (v: boolean) => void;
  onFetchMonth: (year: number, month: number) => void;
}) {
  const { t, lang } = useLang();
  const d = t('dashboard');
  const h = t('home');
  const status = t('status');
  const modality = t('modality');
  const calendar = d.calendarView;
  const hoy = todayInputValue();
  const selectedMonthParts = selectedDateKey.split('-').map(Number);
  const selectedMonth = {
    year: selectedMonthParts[0],
    month: selectedMonthParts[1] - 1,
  };

  const [calendarMonth, setCalendarMonth] = useState(() => selectedMonth);

  useEffect(() => {
    if (selectedMonth.year !== calendarMonth.year || selectedMonth.month !== calendarMonth.month) {
      setCalendarMonth(selectedMonth);
    }
  }, [selectedDateKey]);

  const navigateMonth = (delta: number) => {
    const next = new Date(Date.UTC(calendarMonth.year, calendarMonth.month + delta, 1, 12, 0, 0, 0));
    const nextMonth = { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    setCalendarMonth(nextMonth);
    onFetchMonth(nextMonth.year, nextMonth.month);
  };

  const calendarGrid = useMemo(
    () => getClinicMonthGridDateKeys(calendarMonth.year, calendarMonth.month),
    [calendarMonth]
  );

  const turnosByDay = useMemo(() => {
    const map = new Map<string, Turno[]>();
    for (const turno of allTurnos) {
      const key = clinicDateKeyFromInstant(turno.fechaHora);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(turno);
    }
    return map;
  }, [allTurnos]);

  const dotColor = (estado: string) => {
    switch (estado) {
      case 'RESERVADO':  return 'bg-amber-400';
      case 'CONFIRMADO': return 'bg-blue-500';
      case 'COMPLETADO': return 'bg-emerald-500';
      default:           return 'bg-slate-400';
    }
  };

  const weekDayLabels = [...getDaysShort(lang).slice(1), getDaysShort(lang)[0]];

  const filteredTurnos = useMemo(() => {
    return turnosDelDia
      .filter((t) => agendaEstado === 'TODOS' || t.estado === agendaEstado)
      .filter((t) => agendaModalidad === 'TODAS' || t.modalidad === agendaModalidad)
      .filter((t) => {
        if (!agendaSearch.trim()) return true;
        const fullName = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}`.toLowerCase() : calendar.anonymousPatientSearchFallback;
        return fullName.includes(agendaSearch.toLowerCase());
      })
      .filter((t) => !agendaSoloRiesgo || t.preconsultaRiesgo === 'ALTO' || t.preconsultaRiesgo === 'URGENTE')
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }, [turnosDelDia, agendaEstado, agendaModalidad, agendaSearch, agendaSoloRiesgo]);

  return (
    <div>
      {/* Monthly calendar */}
      <div className="mb-6 rounded-2xl border bg-card p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label={calendar.previousMonth}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-semibold text-foreground capitalize">
            {formatClinicDateKeyForDisplay(
              `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-01`,
              getLocale(lang),
              { month: 'long', year: 'numeric' }
            )}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label={calendar.nextMonth}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDayLabels.map((label) => (
            <div key={label} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide py-1">
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarGrid.map((dayKey, idx) => {
            const [, month, day] = dayKey.split('-').map(Number);
            const isCurrentMonth = month - 1 === calendarMonth.month;
            const isToday = dayKey === hoy;
            const isSelected = dayKey === selectedDateKey;
            const dayTurnos = isCurrentMonth ? (turnosByDay.get(dayKey) || []) : [];
            const MAX_DOTS = 3;
            const visibleDots = dayTurnos.slice(0, MAX_DOTS);
            const extra = dayTurnos.length - MAX_DOTS;

            return (
              <button
                key={idx}
                onClick={() => { if (isCurrentMonth) setSelectedDateKey(dayKey); }}
                disabled={!isCurrentMonth}
                className={[
                  'flex flex-col items-center justify-start pt-1.5 pb-1.5 rounded-lg min-h-[52px] transition-colors',
                  isSelected ? 'bg-primary' : '',
                  !isSelected && isToday ? 'ring-2 ring-primary/50 ring-inset bg-accent' : '',
                  !isSelected && !isToday && isCurrentMonth ? 'hover:bg-muted cursor-pointer' : '',
                  !isCurrentMonth ? 'cursor-default opacity-25' : '',
                ].join(' ')}
              >
                <span className={`text-sm font-semibold leading-none ${
                  isSelected ? 'text-primary-foreground' :
                  isToday ? 'text-primary' :
                  'text-foreground'
                }`}>
                  {day}
                </span>
                {dayTurnos.length > 0 && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                    {visibleDots.map((turno, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-primary-foreground/80' : dotColor(turno.estado)}`}
                      />
                    ))}
                    {extra > 0 && (
                      <span className={`text-[9px] font-bold leading-[6px] ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        +{extra}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dot legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t flex-wrap">
          {([
            [estadoLabel('RESERVADO', status), 'bg-amber-400'],
            [estadoLabel('CONFIRMADO', status), 'bg-blue-500'],
            [estadoLabel('COMPLETADO', status), 'bg-emerald-500'],
            [estadoCanceladoAusenteLabel(status), 'bg-slate-400'],
          ] as [string, string][]).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground capitalize">
          {formatClinicDateKeyForDisplay(selectedDateKey, getLocale(lang), { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        <span className="badge badge-gray">{filteredTurnos.length}/{turnosDelDia.length} {d.appointments.toLowerCase()}</span>
      </div>

      <div className="bg-muted/30 border rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <input
          value={agendaSearch}
          onChange={(e) => setAgendaSearch(e.target.value)}
          placeholder={`${t('common').search} ${d.patient}...`}
          className="field-input"
          aria-label={calendar.searchPatientAria}
        />
        <select value={agendaEstado} onChange={(e) => setAgendaEstado(e.target.value as any)} className="field-select" aria-label={calendar.filterStatusAria}>
          <option value="TODOS">{t('status').all}</option>
          <option value="RESERVADO">{t('status').RESERVADO}</option>
          <option value="CONFIRMADO">{t('status').CONFIRMADO}</option>
          <option value="COMPLETADO">{t('status').COMPLETADO}</option>
          <option value="CANCELADO">{t('status').CANCELADO}</option>
          <option value="AUSENTE">{t('status').AUSENTE}</option>
        </select>
        <select value={agendaModalidad} onChange={(e) => setAgendaModalidad(e.target.value as any)} className="field-select" aria-label={calendar.filterModalityAria}>
          <option value="TODAS">{h.allModalities}</option>
          <option value="PRESENCIAL">{modality.PRESENCIAL}</option>
          <option value="VIRTUAL">{modality.VIRTUAL}</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-foreground border rounded-lg px-3 bg-card">
          <input type="checkbox" checked={agendaSoloRiesgo} onChange={(e) => setAgendaSoloRiesgo(e.target.checked)} />
          {t('status').highRisk}
        </label>
      </div>

      {/* Appointment list */}
      {filteredTurnos.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{d.noAppointments}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTurnos.map((turno) => (
              <button
                key={turno.id}
                onClick={() => onSelectTurno(turno)}
                className="w-full flex items-center gap-4 p-4 bg-muted/30 hover:bg-accent rounded-xl border border-transparent hover:border-primary/20 transition-all text-left group"
              >
                {/* Time */}
                <div className="shrink-0 text-center w-14">
                  <p className="text-lg font-bold text-foreground group-hover:text-primary leading-none">
                    {formatClinicInstantTime(turno.fechaHora, getLocale(lang))}
                  </p>
                </div>

                <div className="w-px h-8 bg-border group-hover:bg-primary/30" />

                {/* Patient */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground group-hover:text-primary truncate">
                    {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : d.noAccount}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {turno.modalidad === 'VIRTUAL' ? (
                      <VideoIcon size={12} className="text-primary" />
                    ) : (
                      <BuildingIcon size={12} className="text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {turno.modalidad === 'VIRTUAL' ? modality.VIRTUAL : modality.PRESENCIAL}
                    </span>
                    {turno.modalidad === 'PRESENCIAL' && turno.lugarAtencion && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground truncate max-w-[160px]">
                        <MapPinIcon size={10} className="shrink-0" />
                        {turno.lugarAtencion}
                      </span>
                    )}
                    {turno.preconsultaRiesgo && (
                      <span className={clinicalRiskBadge(turno.preconsultaRiesgo)}>
                        {turno.preconsultaRiesgo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span className={estadoBadge(turno.estado)}>
                  {estadoLabel(turno.estado, status)}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
