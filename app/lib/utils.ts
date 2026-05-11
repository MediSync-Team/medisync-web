export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function getDaysLong(lang: string = 'es') {
  if (lang === 'en') return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
}

export function getDaysShort(lang: string = 'es') {
  if (lang === 'en') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
}

export function estadoBadge(estado: string): string {
  const map: Record<string, string> = {
    CONFIRMADO: 'badge badge-green',
    RESERVADO: 'badge badge-yellow',
    COMPLETADO: 'badge badge-blue',
    CANCELADO: 'badge badge-red',
    AUSENTE: 'badge badge-gray',
  };
  return map[estado] || 'badge badge-gray';
}

type StatusTranslations = Partial<Record<string, string>>;

export function estadoLabel(estado: string, statusTranslations: StatusTranslations = {}): string {
  return statusTranslations[estado] || estado;
}

export function estadoCanceladoAusenteLabel(statusTranslations: StatusTranslations = {}): string {
  return `${estadoLabel('CANCELADO', statusTranslations)}/${estadoLabel('AUSENTE', statusTranslations)}`;
}

export function clinicalRiskBadge(riesgo: string | null | undefined): string {
  const map: Record<string, string> = {
    BAJO: 'badge badge-green',
    MEDIO: 'badge badge-blue',
    ALTO: 'badge badge-yellow',
    URGENTE: 'badge badge-red',
  };

  if (!riesgo) return 'badge badge-gray';
  return map[riesgo] || 'badge badge-gray';
}
