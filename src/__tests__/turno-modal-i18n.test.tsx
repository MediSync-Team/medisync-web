import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TurnoModal from '../../app/dashboard/components/TurnoModal';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-prof-1' },
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    chat: {
      getUnread: vi.fn(),
    },
    turnos: {
      getEvolucion: vi.fn(),
      guardarEvolucion: vi.fn(),
      getPreconsulta: vi.fn(),
      getReceta: vi.fn(),
      guardarReceta: vi.fn(),
      updateEstado: vi.fn(),
      reprogramar: vi.fn(),
    },
    certificados: {
      getByTurno: vi.fn(),
      emitir: vi.fn(),
    },
    pacientes: {
      getHistoriaClinica: vi.fn(),
      updateHistoriaClinica: vi.fn(),
    },
    archivos: {
      getByTurno: vi.fn(),
      subir: vi.fn(),
      eliminar: vi.fn(),
    },
    profesionales: {
      getSlots: vi.fn(),
    },
  },
}));

vi.mock('../../app/lib/receta-pdf', () => ({
  imprimirReceta: vi.fn(),
}));

vi.mock('../../app/lib/certificado-pdf', () => ({
  imprimirCertificado: vi.fn(),
}));

vi.mock('../../app/lib/historia-clinica-pdf', () => ({
  exportarHistoriaClinicaPDF: vi.fn(),
}));

const baseTurno = {
  id: 'turno-1',
  fechaHora: '2026-06-01T13:00:00.000Z',
  modalidad: 'PRESENCIAL',
  lugarAtencion: 'Office',
  estado: 'COMPLETADO',
  paciente: {
    id: 'pac-1',
    nombre: 'John',
    apellido: 'Doe',
    email: 'john@example.com',
    telefono: '123',
  },
  profesional: {
    id: 'prof-1',
    nombre: 'Ana',
    apellido: 'Garcia',
    matricula: 'MN 123',
    telefono: '555',
    lugarAtencion: 'Office',
    especialidad: { id: 'esp-1', nombre: 'Cardiologia' },
  },
} as any;

describe('doctor TurnoModal i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.chat.getUnread as any).mockResolvedValue({ count: 2 });
    (api.turnos.getEvolucion as any).mockResolvedValue(null);
    (api.turnos.getPreconsulta as any).mockResolvedValue({
      completadaAt: '2026-06-01T12:00:00.000Z',
      aiGenerated: true,
      riesgo: 'ALTO',
      resumen: 'Needs follow-up',
      escalaDolor: 4,
      escalaAnsiedad: 6,
      motivo: 'Checkup',
      sintomas: 'Headache',
      inicioSintomas: 'Yesterday',
      temperatura: 37.2,
      flags: ['fever'],
      notasPaciente: 'Patient note',
    });
    (api.turnos.getReceta as any).mockResolvedValue({
      id: 'receta-1',
      diagnostico: 'Control',
      indicaciones: 'Rest',
      emitidaAt: '2026-06-01T13:00:00.000Z',
    });
    (api.certificados.getByTurno as any).mockResolvedValue({
      id: 'cert-1',
      tipo: 'REPOSO',
      diagnostico: 'Control',
      texto: 'Rest',
      diasReposo: 3,
      emitidaAt: '2026-06-01T13:00:00.000Z',
    });
    (api.pacientes.getHistoriaClinica as any).mockResolvedValue({
      paciente: {
        antecedentesPersonales: '',
        antecedentesFamiliares: '',
        alergias: '',
        medicacionActual: '',
        habitos: '',
        diagnosticosPrevios: '',
        notasClinicasGenerales: '',
      },
      resumen: {
        totalConsultas: 3,
        consultasCompletadas: 2,
        ultimaConsulta: '2026-06-01T13:00:00.000Z',
      },
      timeline: [
        {
          id: 'timeline-1',
          fechaHora: '2026-06-01T13:00:00.000Z',
          estado: 'COMPLETADO',
          evolucion: { contenido: 'Prior note' },
          archivos: [{ id: 'file-timeline-1' }],
        },
      ],
    });
    (api.archivos.getByTurno as any).mockResolvedValue([
      {
        id: 'file-1',
        nombreOriginal: 'lab.pdf',
        url: '#',
        tipo: 'LABORATORIO',
        mimeType: 'application/pdf',
        tamanoBytes: 2048,
      },
    ]);
    (api.profesionales.getSlots as any).mockResolvedValue([{ hora: '10:00', disponible: true }]);
  });

  it('renders clinical, document, and file labels in English', async () => {
    render(
      <TurnoModal
        turno={baseTurno}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/AI-generated summary/)).toBeInTheDocument();
    });

    expect(screen.getByText('Chat with John Doe')).toBeInTheDocument();
    expect(screen.getByText('2 new')).toBeInTheDocument();
    expect(screen.getByText('Pain')).toBeInTheDocument();
    expect(screen.getByText('Symptoms:')).toBeInTheDocument();
    expect(screen.getByText('Longitudinal medical history')).toBeInTheDocument();
    expect(screen.getByText('Total consultations')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Previous conditions, surgeries, relevant hospitalizations...')).toBeInTheDocument();
    expect(screen.getByText('Prescription and post-consultation instructions')).toBeInTheDocument();
    expect(screen.getByText('Requested studies')).toBeInTheDocument();
    expect(screen.getByText('Copy to share')).toBeInTheDocument();
    expect(screen.getByText('Medical certificate')).toBeInTheDocument();
    expect(screen.getByText('Medical Rest')).toBeInTheDocument();
    expect(screen.getByText('View/Reprint PDF')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lab test' })).toBeInTheDocument();
    expect(screen.getByText(/Lab test · 2.0 KB/)).toBeInTheDocument();
  });

  it('renders reprogramming panel labels in English', async () => {
    render(
      <TurnoModal
        turno={{ ...baseTurno, estado: 'RESERVADO' }}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Reschedule/i }));

    expect(await screen.findByText('Reschedule appointment')).toBeInTheDocument();
    expect(screen.getByText('The patient will receive a notification with the new schedule.')).toBeInTheDocument();
    expect(screen.getByText('New date')).toBeInTheDocument();
    expect(screen.getByText('Available time')).toBeInTheDocument();
    expect(screen.getByText('Select a date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm reschedule' })).toBeInTheDocument();
  });
});
