export interface CalendarEventData {
  turnoId: string;
  titulo: string;           // "Consulta con Dr/a. Nombre Apellido"
  descripcion: string;      // especialidad, modalidad, lugar
  fechaHora: string;        // ISO string
  duracionMin?: number;     // default 30
  lugarAtencion?: string;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function toICSDate(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    '00Z'
  );
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// -- .ics file ----------------------------------------------------------------

export function generarICS(ev: CalendarEventData): string {
  const start = new Date(ev.fechaHora);
  const end   = new Date(start.getTime() + (ev.duracionMin ?? 30) * 60_000);
  const now   = new Date();

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediSync//MediSync//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:turno-${ev.turnoId}@medisync`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(ev.titulo)}`,
    `DESCRIPTION:${escapeICS(ev.descripcion)}`,
    ev.lugarAtencion ? `LOCATION:${escapeICS(ev.lugarAtencion)}` : '',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Recordatorio: ${escapeICS(ev.titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function descargarICS(ev: CalendarEventData) {
  const ics = generarICS(ev);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `turno-medisync-${ev.turnoId.slice(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -- Google Calendar URL -------------------------------------------------------

export function urlGoogleCalendar(ev: CalendarEventData): string {
  const start = new Date(ev.fechaHora);
  const end   = new Date(start.getTime() + (ev.duracionMin ?? 30) * 60_000);

  const fmt = (d: Date) =>
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    '00Z';

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     ev.titulo,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  ev.descripcion,
    ...(ev.lugarAtencion ? { location: ev.lugarAtencion } : {}),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// -- Outlook Web URL -----------------------------------------------------------

export function urlOutlookCalendar(ev: CalendarEventData): string {
  const start = new Date(ev.fechaHora);
  const end   = new Date(start.getTime() + (ev.duracionMin ?? 30) * 60_000);

  const params = new URLSearchParams({
    path:      '/calendar/action/compose',
    rru:       'addevent',
    startdt:   start.toISOString(),
    enddt:     end.toISOString(),
    subject:   ev.titulo,
    body:      ev.descripcion,
    ...(ev.lugarAtencion ? { location: ev.lugarAtencion } : {}),
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

// -- Helpers para armar CalendarEventData desde un turno ---------------------

export interface TurnoCalendarInfo {
  turnoId: string;
  fechaHora: string;
  duracionMin?: number;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  profesionalNombre: string;
  profesionalApellido: string;
  especialidad: string;
  lugarAtencion?: string;
}

export function turnoToCalendarEvent(t: TurnoCalendarInfo): CalendarEventData {
  const modLabel = t.modalidad === 'VIRTUAL' ? 'Virtual (videollamada)' : 'Presencial';
  return {
    turnoId:      t.turnoId,
    titulo:       `Consulta con Dr/a. ${t.profesionalNombre} ${t.profesionalApellido} — ${t.especialidad}`,
    descripcion:  `Especialidad: ${t.especialidad}\nModalidad: ${modLabel}${t.lugarAtencion ? `\nLugar: ${t.lugarAtencion}` : ''}\n\nGestionado con MediSync`,
    fechaHora:    t.fechaHora,
    duracionMin:  t.duracionMin ?? 30,
    lugarAtencion: t.modalidad === 'VIRTUAL' ? 'Videollamada online' : t.lugarAtencion,
  };
}
