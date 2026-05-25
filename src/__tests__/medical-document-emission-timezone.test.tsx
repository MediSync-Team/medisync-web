import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HistorialCard from '../../app/dashboard/paciente/components/HistorialCard';
import RecetaModal from '../../app/dashboard/paciente/components/RecetaModal';
import { api } from '../../app/lib/api';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'es',
    t: () => ({}),
  }),
}));

vi.mock('../../app/lib/i18n/use-translate-specialty', () => ({
  useTranslateSpecialty: () => (name?: string) => name ?? '',
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    turnos: {
      getReceta: vi.fn(),
    },
    certificados: {
      getByTurno: vi.fn(),
    },
  },
}));

vi.mock('../../app/lib/receta-pdf', () => ({
  imprimirReceta: vi.fn(),
}));

vi.mock('../../app/lib/certificado-pdf', () => ({
  imprimirCertificado: vi.fn(),
}));

describe('medical document emission timezone display', () => {
  it('renders HistorialCard certificate emission date in Argentina clinic time', () => {
    render(
      <HistorialCard
        item={{
          id: 'turno-1',
          fechaHora: '2026-06-01T13:00:00.000Z',
          estado: 'COMPLETADO',
          modalidad: 'PRESENCIAL',
          lugarAtencion: 'Consultorio',
          profesional: {
            id: 'prof-1',
            nombre: 'Ana',
            apellido: 'Garcia',
            especialidad: { id: 'esp-1', nombre: 'Cardiologia' },
          },
          certificado: {
            id: 'cert-1',
            tipo: 'CONSULTA',
            emitidaAt: '2026-06-01T02:30:00.000Z',
          },
          archivos: [],
        } as any}
        onCalificar={vi.fn()}
        d={{ clinicalEvolution: 'Evolucion', noClinicalEvolution: 'Sin evolucion' }}
        m={{ PRESENCIAL: 'Presencial', VIRTUAL: 'Virtual' }}
        s={{ COMPLETADO: 'Completado' }}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    expect(screen.getByText(/Emitido el 31\/5\/2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Emitido el 1\/6\/2026/)).not.toBeInTheDocument();
  });

  it('renders RecetaModal emission date and time in Argentina clinic time', async () => {
    (api.turnos.getReceta as any).mockResolvedValue({
      id: 'receta-1',
      diagnostico: 'Control',
      indicaciones: 'Reposo',
      emitidaAt: '2026-06-01T02:30:00.000Z',
      createdAt: '2026-06-01T03:00:00.000Z',
    });

    render(
      <RecetaModal
        turno={{
          id: 'turno-1',
          fechaHora: '2026-06-01T13:00:00.000Z',
          modalidad: 'PRESENCIAL',
          profesional: {
            nombre: 'Ana',
            apellido: 'Garcia',
            especialidad: { nombre: 'Cardiologia' },
          },
        } as any}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Emitida:.*31\/5\/2026.*11:30/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Emitida:.*1\/6\/2026/)).not.toBeInTheDocument();
  });
});
