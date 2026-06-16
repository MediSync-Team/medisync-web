import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TurnoCard from '../../app/dashboard/paciente/components/TurnoCard';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (key: string) => {
      if (key === 'home') return { virtual: 'Virtual', inPerson: 'In person' };
      if (key === 'paciente') {
        return {
          cancelReasonLabel: 'Cancellation reason',
          joinVideoCall: 'Join video call',
          paid: 'Paid',
          pay: 'Pay',
          reschedule: 'Reschedule',
          cancel: 'Cancel',
          viewProfessional: 'View professional',
          chatLabel: 'Chat',
          preconsulta: 'Pre-appointment',
          viewPrescription: 'View prescription',
          rate: 'Rate',
        };
      }
      if (key === 'dashboard') return { preconsulta: 'Pre-appointment' };
      if (key === 'common') return { saving: 'Saving' };
      return {};
    },
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    chat: {
      getUnread: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock('../../app/components/AgendarCalendario', () => ({
  default: () => <div data-testid="calendar-button" />,
}));

describe('TurnoCard i18n', () => {
  it('renders the cancellation reason label from patient translations', () => {
    render(
      <TurnoCard
        turno={{
          id: 'turno-cancelled',
          fechaHora: '2026-05-18T13:00:00.000Z',
          estado: 'CANCELADO',
          modalidad: 'PRESENCIAL',
          duracionMin: 30,
          notasCancelacion: 'Doctor unavailable',
          profesionalId: 'prof-1',
          profesional: {
            id: 'prof-1',
            nombre: 'Ana',
            apellido: 'Garcia',
            especialidad: { id: 'esp-1', nombre: 'Cardiology' },
            lugarAtencion: 'Office',
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
        d={{} as any}
        s={{ CANCELADO: 'Cancelled' } as any}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    expect(screen.getByText('Cancellation reason')).toBeInTheDocument();
    expect(screen.getByText('Doctor unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Motivo de cancelación')).not.toBeInTheDocument();
  });
});
