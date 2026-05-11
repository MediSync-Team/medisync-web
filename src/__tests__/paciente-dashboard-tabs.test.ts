import { describe, expect, it } from 'vitest';
import { getTurnosTabRequest, type PacienteDashboardTab } from '../../app/lib/paciente-dashboard-tabs';

describe('patient dashboard tab loading', () => {
  it('requests upcoming appointments page 1 when switching to upcoming', () => {
    expect(getTurnosTabRequest('proximos')).toEqual({ tipo: 'proximos', page: 1 });
  });

  it('requests past appointments page 1 when switching to past', () => {
    expect(getTurnosTabRequest('pasados')).toEqual({ tipo: 'pasados', page: 1 });
  });

  it('does not request appointments for non-appointment tabs', () => {
    const tabs: PacienteDashboardTab[] = [
      'resumen',
      'listaEspera',
      'historial',
      'recetas',
      'certificados',
      'datosMedicos',
      'estadisticas',
    ];

    for (const tab of tabs) {
      expect(getTurnosTabRequest(tab)).toBeNull();
    }
  });
});
