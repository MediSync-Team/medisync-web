'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLang } from '../../lib/i18n/context';
import { Turno } from '../../lib/api';
import { CalendarIcon, VideoIcon, BuildingIcon, MapPinIcon, InfoIcon } from '../../components/icons';
import { estadoBadge, estadoLabel, estadoCanceladoAusenteLabel, clinicalRiskBadge, getDaysShort } from '../../lib/utils';
import { calendarDateKey, clinicDateKeyFromInstant, formatClinicDateKey, getLocale } from '../../lib/date';

export default function CalendarioView({
  selectedDate, setSelectedDate, turnos: allTurnos, turnosDelDia, onSelectTurno,
  agendaSearch, setAgendaSearch, agendaEstado, setAgendaEstado, agendaModalidad, setAgendaModalidad, agendaSoloRiesgo, setAgendaSoloRiesgo, onFetchMonth,
}: {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
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
  const hoy = typeof window !== 'undefined' ? formatClinicDateKey(new Date()) : '';

  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  useEffect(() => {
    const newMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    if (newMonth.getTime() !== calendarMonth.getTime()) setCalendarMonth(newMonth);
  }, [selectedDate]);

  const navigateMonth = (delta: number) => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1);
    setCalendarMonth(next);
    onFetchMonth(next.getFullYear(), next.getMonth());
  };

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Mon = 0
    const days: Date[] = [];
    for (let i = startPad - 1; i >= 0; i--) days.push(new Date(year, month, -i));
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
    const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7);
    for (let day = 1; day <= remaining; day++) days.push(new Date(year, month + 1, day));
    return days;
  }, [calendarMonth]);

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
        const fullName = t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}`.toLowerCase() : 'paciente sin cuenta';
        return fullName.includes(agendaSearch.toLowerCase());
      })
      .filter((t) => !agendaSoloRiesgo || t.preconsultaRiesgo === 'ALTO' || t.preconsultaRiesgo === 'URGENTE')
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }, [turnosDelDia, agendaEstado, agendaModalidad, agendaSearch, agendaSoloRiesgo]);

  return (
    <div>
      {/* Monthly calendar */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            aria-label="Mes anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
            {calendarMonth.toLocaleDateString(getLocale(lang), { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            aria-label="Mes siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDayLabels.map((label) => (
            <div key={label} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-1">
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarGrid.map((date, idx) => {
            const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
            const dayKey = calendarDateKey(date);
            const isToday = dayKey === hoy;
            const isSelected = dayKey === calendarDateKey(selectedDate);
            const dayTurnos = isCurrentMonth ? (turnosByDay.get(dayKey) || []) : [];
            const MAX_DOTS = 3;
            const visibleDots = dayTurnos.slice(0, MAX_DOTS);
            const extra = dayTurnos.length - MAX_DOTS;

            return (
              <button
                key={idx}
                onClick={() => { if (isCurrentMonth) setSelectedDate(new Date(date)); }}
                disabled={!isCurrentMonth}
                className={[
                  'flex flex-col items-center justify-start pt-1.5 pb-1.5 rounded-lg min-h-[52px] transition-colors',
                  isSelected ? 'bg-blue-600' : '',
                  !isSelected && isToday ? 'ring-2 ring-blue-400 ring-inset bg-blue-50 dark:bg-blue-950' : '',
                  !isSelected && !isToday && isCurrentMonth ? 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer' : '',
                  !isCurrentMonth ? 'cursor-default opacity-25' : '',
                ].join(' ')}
              >
                <span className={`text-sm font-semibold leading-none ${
                  isSelected ? 'text-white' :
                  isToday ? 'text-blue-700 dark:text-blue-300' :
                  'text-slate-700 dark:text-slate-200'
                }`}>
                  {date.getDate()}
                </span>
                {dayTurnos.length > 0 && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                    {visibleDots.map((turno, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white/80' : dotColor(turno.estado)}`}
                      />
                    ))}
                    {extra > 0 && (
                      <span className={`text-[9px] font-bold leading-[6px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
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
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex-wrap">
          {([
            [estadoLabel('RESERVADO', status), 'bg-amber-400'],
            [estadoLabel('CONFIRMADO', status), 'bg-blue-500'],
            [estadoLabel('COMPLETADO', status), 'bg-emerald-500'],
            [estadoCanceladoAusenteLabel(status), 'bg-slate-400'],
          ] as [string, string][]).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
          {selectedDate.toLocaleDateString(getLocale(lang), { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        <span className="badge badge-gray">{filteredTurnos.length}/{turnosDelDia.length} {d.appointments.toLowerCase()}</span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <input
          value={agendaSearch}
          onChange={(e) => setAgendaSearch(e.target.value)}
          placeholder={`${t('common').search} ${d.patient}...`}
          className="field-input"
          aria-label="Buscar paciente en agenda"
        />
        <select value={agendaEstado} onChange={(e) => setAgendaEstado(e.target.value as any)} className="field-select" aria-label="Filtrar por estado">
          <option value="TODOS">{t('status').all}</option>
          <option value="RESERVADO">{t('status').RESERVADO}</option>
          <option value="CONFIRMADO">{t('status').CONFIRMADO}</option>
          <option value="COMPLETADO">{t('status').COMPLETADO}</option>
          <option value="CANCELADO">{t('status').CANCELADO}</option>
          <option value="AUSENTE">{t('status').AUSENTE}</option>
        </select>
        <select value={agendaModalidad} onChange={(e) => setAgendaModalidad(e.target.value as any)} className="field-select" aria-label="Filtrar por modalidad">
          <option value="TODAS">{h.allModalities}</option>
          <option value="PRESENCIAL">{h.inPerson}</option>
          <option value="VIRTUAL">{h.virtual}</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-3 bg-white dark:bg-slate-700">
          <input type="checkbox" checked={agendaSoloRiesgo} onChange={(e) => setAgendaSoloRiesgo(e.target.checked)} />
          {t('status').highRisk}
        </label>
      </div>

      {/* Appointment list */}
      {filteredTurnos.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{d.noAppointments}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTurnos.map((turno) => (
              <button
                key={turno.id}
                onClick={() => onSelectTurno(turno)}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 transition-all text-left group"
              >
                {/* Time */}
                <div className="shrink-0 text-center w-14">
                  <p className="text-lg font-bold text-slate-700 group-hover:text-blue-700 leading-none">
                    {new Date(turno.fechaHora).toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="w-px h-8 bg-slate-200 group-hover:bg-blue-200" />

                {/* Patient */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 group-hover:text-blue-700 truncate">
                    {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : d.noAccount}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {turno.modalidad === 'VIRTUAL' ? (
                      <VideoIcon size={12} className="text-blue-400" />
                    ) : (
                      <BuildingIcon size={12} className="text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500">
                      {turno.modalidad === 'VIRTUAL' ? h.virtual : h.inPerson}
                    </span>
                    {turno.modalidad === 'PRESENCIAL' && turno.lugarAtencion && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-400 truncate max-w-[160px]">
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
