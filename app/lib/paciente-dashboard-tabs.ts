export type PacienteDashboardTab =
  | 'resumen'
  | 'proximos'
  | 'pasados'
  | 'listaEspera'
  | 'historial'
  | 'recetas'
  | 'certificados'
  | 'datosMedicos'
  | 'estadisticas';

export function getTurnosTabRequest(tab: PacienteDashboardTab): { tipo: 'proximos' | 'pasados'; page: 1 } | null {
  if (tab === 'proximos' || tab === 'pasados') {
    return { tipo: tab, page: 1 };
  }

  return null;
}
