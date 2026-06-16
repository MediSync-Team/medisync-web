import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CalificarModal from '../../app/dashboard/paciente/components/CalificarModal';
import HistorialCard from '../../app/dashboard/paciente/components/HistorialCard';
import PreconsultaModal from '../../app/dashboard/paciente/components/PreconsultaModal';
import RecetaModal from '../../app/dashboard/paciente/components/RecetaModal';
import ReprogramarModal from '../../app/dashboard/paciente/components/ReprogramarModal';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/i18n/use-translate-specialty', () => ({
  useTranslateSpecialty: () => (name?: string) => name ?? '',
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    profesionales: {
      getSlots: vi.fn(),
    },
    turnos: {
      getPreconsulta: vi.fn(),
      updatePreconsulta: vi.fn(),
      getReceta: vi.fn(),
    },
    certificados: {
      getByTurno: vi.fn(),
    },
    resenas: {
      getMiResena: vi.fn(),
      crear: vi.fn(),
    },
  },
}));

vi.mock('../../app/lib/receta-pdf', () => ({
  imprimirReceta: vi.fn(),
}));

vi.mock('../../app/lib/certificado-pdf', () => ({
  imprimirCertificado: vi.fn(),
}));

const baseTurno = {
  id: 'turno-1',
  fechaHora: '2026-06-01T13:00:00.000Z',
  modalidad: 'PRESENCIAL',
  profesional: {
    id: 'prof-1',
    nombre: 'Ana',
    apellido: 'Garcia',
    especialidad: { id: 'esp-1', nombre: 'Cardiologia' },
  },
} as any;

describe('patient modal i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.profesionales.getSlots as any).mockResolvedValue([]);
    (api.turnos.getPreconsulta as any).mockResolvedValue({});
    (api.turnos.getReceta as any).mockResolvedValue(null);
    (api.resenas.getMiResena as any).mockResolvedValue(null);
  });

  it('renders reschedule modal labels in English', () => {
    render(<ReprogramarModal turno={baseTurno} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText('Reschedule appointment')).toBeInTheDocument();
    expect(screen.getByText('New date')).toBeInTheDocument();
    expect(screen.getByText(/You are rescheduling your appointment with/i)).toBeInTheDocument();
  });

  it('renders pre-appointment modal labels and placeholders in English', async () => {
    render(<PreconsultaModal turno={baseTurno} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText('Pre-appointment questionnaire')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Main reason for consultation')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Describe the main reason in a few lines...')).toBeInTheDocument();
    expect(screen.getByText('Pain level: 0/10')).toBeInTheDocument();
    expect(screen.getByText('Save questionnaire')).toBeInTheDocument();
  });

  it('renders prescription modal empty and loaded states in English', async () => {
    const { unmount } = render(<RecetaModal turno={baseTurno} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No prescription/instructions have been issued for this appointment yet.')).toBeInTheDocument();
    });
    unmount();

    (api.turnos.getReceta as any).mockResolvedValue({
      id: 'receta-1',
      diagnostico: 'Control',
      indicaciones: 'Rest',
      planTratamiento: 'Plan',
      medicamentos: 'Medicine',
      estudiosSolicitados: 'Study',
      proximoControl: 'Next month',
      advertencias: 'Warning',
      observaciones: 'Observation',
      emitidaAt: '2026-06-01T02:30:00.000Z',
      createdAt: '2026-06-01T03:00:00.000Z',
    });

    render(<RecetaModal turno={baseTurno} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Diagnosis')).toBeInTheDocument();
    });
    expect(screen.getByText('Treatment plan')).toBeInTheDocument();
    expect(screen.getByText('Requested studies')).toBeInTheDocument();
    expect(screen.getByText('Next follow-up')).toBeInTheDocument();
  });

  it('renders history card document and review labels in English', () => {
    render(
      <HistorialCard
        item={{
          ...baseTurno,
          estado: 'COMPLETADO',
          lugarAtencion: 'Office',
          recetaIndicacion: {
            id: 'receta-1',
            diagnostico: 'Control',
            medicamentos: 'Medicine',
            proximoControl: 'Next month',
          },
          certificado: {
            id: 'cert-1',
            tipo: 'CONSULTA',
            emitidaAt: '2026-06-01T02:30:00.000Z',
          },
          archivos: [{ id: 'file-1', nombreOriginal: 'study.pdf', url: '#' }],
          resena: {
            rating: 5,
            comentario: 'Great',
            respuesta: 'Thanks',
            respondidaAt: '2026-06-02T13:00:00.000Z',
          },
        } as any}
        onCalificar={vi.fn()}
        d={{ clinicalEvolution: 'Clinical evolution', noClinicalEvolution: 'No evolution', rateConsultation: 'Rate consultation' } as any}
        m={{ PRESENCIAL: 'In person', VIRTUAL: 'Virtual' } as any}
        s={{ COMPLETADO: 'Completed' } as any}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    expect(screen.getByText('Prescription and instructions')).toBeInTheDocument();
    expect(screen.getByText(/Medicines:/)).toBeInTheDocument();
    expect(screen.getByText(/Next follow-up:/)).toBeInTheDocument();
    expect(screen.getByText('Medical certificate')).toBeInTheDocument();
    expect(screen.getByText('Consultation justification')).toBeInTheDocument();
    expect(screen.getByText(/Issued on/)).toBeInTheDocument();
    expect(screen.getByText('Attached documents')).toBeInTheDocument();
    expect(screen.getByText('Your rating')).toBeInTheDocument();
    expect(screen.getByText(/Response from Dr\./)).toBeInTheDocument();
  });

  it('renders rating modal prompt and validation copy in English', async () => {
    render(<CalificarModal turno={baseTurno} onClose={vi.fn()} onSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('How was your experience?')).toBeInTheDocument();
    });
    expect(screen.getByText('Comment (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your experience...')).toBeInTheDocument();
    expect(translations.en.paciente.ratingRequired).toBe('Select at least 1 star.');
  });
});
