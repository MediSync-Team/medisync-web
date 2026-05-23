import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TurnoCard from '../../app/dashboard/paciente/components/TurnoCard';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'es',
    t: (key: string) => {
      if (key === 'home') return { virtual: 'Virtual', inPerson: 'Presencial' };
      if (key === 'paciente') {
        return {
          joinVideoCall: 'Unirse',
          paid: 'Pagado',
          pay: 'Pagar',
          reschedule: 'Reprogramar',
          cancel: 'Cancelar',
          viewProfessional: 'Ver profesional',
          chatLabel: 'Chat',
          preconsulta: 'Preconsulta',
          viewPrescription: 'Ver receta',
          rate: 'Calificar',
        };
      }
      if (key === 'dashboard') return { preconsulta: 'Preconsulta' };
      if (key === 'common') return { saving: 'Guardando' };
      return {};
    },
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    chat: {
      getUnread: vi.fn(),
    },
  },
}));

vi.mock('../../app/components/AgendarCalendario', () => ({
  default: () => <div data-testid="calendar-button" />,
}));

describe('TurnoCard timezone display', () => {
  it('renders appointment date and time in Argentina clinic time', () => {
    render(
      <TurnoCard
        turno={{
          id: 'turno-1',
          fechaHora: '2026-06-01T02:30:00.000Z',
          estado: 'CANCELADO',
          modalidad: 'PRESENCIAL',
          duracionMin: 30,
          profesionalId: 'prof-1',
          profesional: {
            id: 'prof-1',
            nombre: 'Ana',
            apellido: 'Garcia',
            especialidad: { id: 'esp-1', nombre: 'Cardiologia' },
            lugarAtencion: 'Consultorio',
          },
        } as any}
        canCancel={false}
        horasMinCancelacion={24}
        onPagar={vi.fn()}
        onCancelar={vi.fn()}
        onReprogramar={vi.fn()}
        onCompletarPreconsulta={vi.fn()}
        onVerReceta={vi.fn()}
        onCalificar={vi.fn()}
        onVideoCall={vi.fn()}
        onChat={vi.fn()}
        d={{}}
        s={{ CANCELADO: 'Cancelado' }}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    expect(screen.getByText(/31 may/i)).toBeInTheDocument();
    expect(screen.getByText(/11:30/)).toBeInTheDocument();
  });
});
