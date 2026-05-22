import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DisponibilidadView from '../../app/dashboard/components/DisponibilidadView';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'es',
    t: (key: string) => {
      if (key === 'dashboard') {
        return {
          availability: 'Disponibilidad',
          addAvailability: 'Agregar disponibilidad',
          day: 'Dia',
          from: 'Desde',
          to: 'Hasta',
          availabilitySetup: {
            addBlocking: 'Agregar bloqueo',
            blockingsTitle: 'Bloqueos',
            blockingsDesc: 'Bloquea fechas en las que no atiendes',
            noBlockings: 'Sin bloqueos',
            startDate: 'Fecha inicio',
            endDate: 'Fecha fin',
            reason: 'Motivo',
            reasonUnspecified: 'Sin especificar',
            fullDay: 'Dia completo',
            partialBlock: 'Bloqueo parcial',
            startTime: 'Hora inicio',
            endTime: 'Hora fin',
            saving: 'Guardando...',
            location: 'Lugar',
            optional: 'opcional',
            placeholderVirtual: 'Link o sala virtual',
            placeholderInPerson: 'Consultorio',
            reasons: {
              vacations: 'Vacaciones',
              holiday: 'Feriado',
              training: 'Capacitacion',
              personal: 'Personal',
              other: 'Otro',
            },
          },
        };
      }
      if (key === 'home') {
        return {
          inPerson: 'Presencial',
          virtual: 'Virtual',
        };
      }
      if (key === 'professional') {
        return { modality: 'Modalidad' };
      }
      if (key === 'common') {
        return { noResults: 'Sin resultados', loading: 'Cargando', delete: 'Eliminar' };
      }
      return {};
    },
  }),
}));

describe('DisponibilidadView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T02:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Argentina clinic today as block date input minimum', () => {
    const { container } = render(
      <DisponibilidadView
        disponibilidades={[]}
        nuevaDisp={{ diaSemana: 1, horaInicio: '', horaFin: '', modalidad: 'PRESENCIAL', lugarAtencion: '' }}
        setNuevaDisp={vi.fn()}
        onAgregar={vi.fn()}
        onEliminar={vi.fn()}
        eliminandoId={null}
        bloqueos={[]}
        loadingBloqueos={false}
        onReloadBloqueos={vi.fn()}
      />
    );

    const dateInputs = Array.from(container.querySelectorAll('input[type="date"]')) as HTMLInputElement[];

    expect(dateInputs).toHaveLength(2);
    expect(dateInputs[0].min).toBe('2026-05-17');
    expect(dateInputs[1].min).toBe('2026-05-17');

    fireEvent.change(dateInputs[0], { target: { value: '2026-05-20' } });

    expect(dateInputs[1].min).toBe('2026-05-20');
  });
});
