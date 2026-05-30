import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PacienteDashboard from '../../app/dashboard/paciente/page';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

const routerPush = vi.fn();
const logout = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/i18n/use-translate-specialty', () => ({
  useTranslateSpecialty: () => (name?: string) => name ?? '',
}));

vi.mock('../../app/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-patient-1',
      paciente: {
        id: 'patient-1',
        nombre: 'Jane',
        apellido: 'Patient',
        email: 'jane@example.com',
      },
    },
    loading: false,
    logout,
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    turnos: {
      getMisTurnos: vi.fn(),
      getPoliticaCancelacion: vi.fn(),
      updateEstado: vi.fn(),
      miHistorial: vi.fn(),
    },
    recordatorios: {
      getPaciente: vi.fn(),
    },
    listaEspera: {
      misSuscripciones: vi.fn(),
      cancelar: vi.fn(),
    },
    pacientes: {
      getMisRecetas: vi.fn(),
      getMisCertificados: vi.fn(),
      getMisStats: vi.fn(),
      getPerfil: vi.fn(),
      updatePerfil: vi.fn(),
    },
    pagos: {
      getEstado: vi.fn(),
    },
  },
}));

vi.mock('../../app/components/OnboardingTour', () => ({
  default: ({ steps }: any) => (
    <div data-testid="onboarding-tour">
      {steps.map((step: any) => (
        <section key={step.selector}>
          <h2>{step.title}</h2>
          <p>{step.description}</p>
        </section>
      ))}
    </div>
  ),
}));

vi.mock('../../app/components/ChatModal', () => ({
  default: ({ otherName }: any) => <div>Chat with {otherName}</div>,
}));

vi.mock('../../app/components/VideoCallModal', () => ({
  default: ({ profesionalNombre }: any) => <div>Video call with {profesionalNombre}</div>,
}));

vi.mock('../../app/components/ProfileModal', () => ({ default: () => null }));
vi.mock('../../app/components/NotificationBell', () => ({ NotificationBell: () => null }));
vi.mock('../../app/components/GlobalChatHub', () => ({ GlobalChatHub: () => null }));
vi.mock('../../app/components/ThemeLangToggle', () => ({ default: () => null }));
vi.mock('../../app/components/Pagination', () => ({ default: () => null }));
vi.mock('../../app/dashboard/paciente/components/ResumenPacienteView', () => ({ default: () => <div>Summary view</div> }));
vi.mock('../../app/dashboard/paciente/components/EstadisticasPaciente', () => ({ default: () => <div>Stats view</div> }));
vi.mock('../../app/dashboard/paciente/components/HistorialCard', () => ({ default: () => <div>History card</div> }));
vi.mock('../../app/dashboard/paciente/components/RecetaCard', () => ({ default: () => <div>Prescription card</div> }));
vi.mock('../../app/dashboard/paciente/components/CertificadoCard', () => ({ default: () => <div>Certificate card</div> }));
vi.mock('../../app/dashboard/paciente/components/TurnoCard', () => ({
  default: ({ onCalificar, onVideoCall, onChat }: any) => (
    <div>
      <button onClick={onCalificar}>Rate appointment</button>
      <button onClick={onVideoCall}>Video call</button>
      <button onClick={onChat}>Chat</button>
    </div>
  ),
}));
vi.mock('../../app/dashboard/paciente/components/RecetaModal', () => ({ default: () => null }));
vi.mock('../../app/dashboard/paciente/components/PreconsultaModal', () => ({ default: () => null }));
vi.mock('../../app/dashboard/paciente/components/ReprogramarModal', () => ({ default: () => null }));
vi.mock('../../app/dashboard/paciente/components/CalificarModal', () => ({
  default: ({ onSuccess }: any) => <button onClick={onSuccess}>Submit mocked rating</button>,
}));
vi.mock('../../app/lib/receta-pdf', () => ({ imprimirReceta: vi.fn() }));
vi.mock('../../app/lib/historial-pdf', () => ({ imprimirHistorial: vi.fn() }));
vi.mock('../../app/lib/certificado-pdf', () => ({ imprimirCertificado: vi.fn() }));

const waitlistItem = {
  id: 'waitlist-1',
  fecha: '2026-05-18T00:00:00.000Z',
  modalidad: 'VIRTUAL',
  estado: 'ACTIVA',
  profesional: {
    nombre: 'Ana',
    apellido: 'Garcia',
    especialidad: { nombre: 'Cardiology' },
  },
};

const appointmentWithoutProfessional = {
  id: 'turno-1',
  fechaHora: '2026-05-18T13:00:00.000Z',
  estado: 'CONFIRMADO',
  modalidad: 'VIRTUAL',
  profesional: null,
};

function mockApiDefaults() {
  (api.turnos.getMisTurnos as any).mockResolvedValue({
    turnos: [],
    pagination: { total: 0, totalPages: 1 },
  });
  (api.turnos.getPoliticaCancelacion as any).mockResolvedValue({ horasMinimas: 24 });
  (api.turnos.updateEstado as any).mockResolvedValue({});
  (api.turnos.miHistorial as any).mockResolvedValue({ turnos: [], pagination: { total: 0, totalPages: 1 } });
  (api.recordatorios.getPaciente as any).mockResolvedValue({
    turnos: [
      {
        id: 'reminder-1',
        fechaHora: '2026-05-18T13:00:00.000Z',
        profesional: { nombre: 'Ana', apellido: 'Garcia' },
      },
    ],
  });
  (api.listaEspera.misSuscripciones as any).mockResolvedValue([waitlistItem]);
  (api.listaEspera.cancelar as any).mockResolvedValue({});
  (api.pacientes.getMisRecetas as any).mockResolvedValue({ recetas: [] });
  (api.pacientes.getMisCertificados as any).mockResolvedValue({ certificados: [] });
  (api.pacientes.getMisStats as any).mockResolvedValue(null);
  (api.pacientes.getPerfil as any).mockResolvedValue({});
  (api.pacientes.updatePerfil as any).mockResolvedValue({});
  (api.pagos.getEstado as any).mockResolvedValue({});
}

function renderDashboard(search = '') {
  window.history.pushState({}, '', `/dashboard/paciente${search}`);
  return render(<PacienteDashboard />);
}

describe('patient dashboard page i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiDefaults();
    window.history.pushState({}, '', '/dashboard/paciente');
  });

  it('renders patient tour and reminder shell copy in English', async () => {
    renderDashboard();

    expect(await screen.findByText('Your upcoming appointments')).toBeInTheDocument();
    expect(screen.getByText('Here you will see all your future appointments. You can pay, reschedule, or cancel from here.')).toBeInTheDocument();
    expect(screen.getByText('Find more professionals')).toBeInTheDocument();
    expect(await screen.findByText('1 appointment in the next 24h')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('renders waitlist date as a date-only clinic key and shows translated removal notice', async () => {
    renderDashboard('?tab=listaEspera');

    expect(await screen.findByText('Ana Garcia')).toBeInTheDocument();
    expect(screen.getByText('5/18/2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(api.listaEspera.cancelar).toHaveBeenCalledWith('waitlist-1');
    });
    expect(await screen.findByText('You left the waitlist.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('shows translated waitlist removal fallback error', async () => {
    (api.listaEspera.cancelar as any).mockRejectedValueOnce({});
    renderDashboard('?tab=listaEspera');

    expect(await screen.findByText('Ana Garcia')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Could not leave the waitlist')).toBeInTheDocument();
  });

  it('uses translated rating success', async () => {
    (api.turnos.getMisTurnos as any).mockResolvedValue({
      turnos: [appointmentWithoutProfessional],
      pagination: { total: 1, totalPages: 1 },
    });

    renderDashboard('?tab=proximos');

    fireEvent.click(await screen.findByRole('button', { name: 'Rate appointment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit mocked rating' }));
    expect(await screen.findByText('Rating submitted!')).toBeInTheDocument();
  });

  it('uses translated professional fallback for video calls', async () => {
    (api.turnos.getMisTurnos as any).mockResolvedValue({
      turnos: [appointmentWithoutProfessional],
      pagination: { total: 1, totalPages: 1 },
    });

    renderDashboard('?tab=proximos');

    fireEvent.click(await screen.findByRole('button', { name: 'Video call' }));
    expect(screen.getByText('Video call with Professional')).toBeInTheDocument();
  });

  it('uses translated professional fallback for chat', async () => {
    (api.turnos.getMisTurnos as any).mockResolvedValue({
      turnos: [appointmentWithoutProfessional],
      pagination: { total: 1, totalPages: 1 },
    });

    renderDashboard('?tab=proximos');

    fireEvent.click(await screen.findByRole('button', { name: 'Chat' }));
    expect(screen.getByText('Chat with Professional')).toBeInTheDocument();
  });
});
