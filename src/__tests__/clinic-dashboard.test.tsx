import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClinicaDashboard from '../../app/dashboard/clinica/page';
import { clinicasApi } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../app/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', rol: 'CLINICA' },
    loading: false,
    logout: vi.fn(),
  }),
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

vi.mock('../../app/components/ThemeLangToggle', () => ({
  default: () => null,
}));

vi.mock('../../app/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../app/lib/api')>();
  return {
    ...actual,
    clinicasApi: {
      getMe: vi.fn(),
      updateMe: vi.fn(),
      getStats: vi.fn(),
      getAgenda: vi.fn(),
      invitar: vi.fn(),
      cancelarInvitacion: vi.fn(),
      removerProfesional: vi.fn(),
    },
  };
});

const emptyClinic = {
  id: 'clinic-1',
  nombre: 'Central Clinic',
  descripcion: '',
  direccion: '',
  telefono: '',
  email: 'admin@clinic.test',
  website: '',
  logoUrl: '',
  profesionales: [],
  invitaciones: [],
};

const stats = {
  turnosHoy: 0,
  turnosMes: 0,
  ingresosMes: 0,
  profesionalesActivos: 0,
  cancelacionesMes: 0,
};

const professional = {
  id: 'prof-1',
  nombre: 'Ana',
  apellido: 'Garcia',
  fotoUrl: null,
  activo: true,
  precioConsulta: 12000,
  especialidad: { nombre: 'Cardiology' },
  disponibilidades: [],
};

const invitation = {
  id: 'invite-1',
  email: 'doctor@example.com',
  estado: 'PENDIENTE',
  expiresAt: '2026-12-31T03:00:00.000Z',
  createdAt: '2026-05-01T03:00:00.000Z',
};

async function renderClinicDashboard() {
  render(<ClinicaDashboard />);
  await screen.findByText('Clinic dashboard');
}

describe('ClinicaDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clinicasApi.getMe as any).mockResolvedValue(emptyClinic);
    (clinicasApi.getStats as any).mockResolvedValue(stats);
    (clinicasApi.getAgenda as any).mockResolvedValue([]);
    (clinicasApi.invitar as any).mockResolvedValue({ id: 'invite-2', email: 'newdoctor@example.com', expiresAt: '2026-12-31T03:00:00.000Z' });
    (clinicasApi.cancelarInvitacion as any).mockResolvedValue({ cancelled: true });
    (clinicasApi.removerProfesional as any).mockResolvedValue({ removed: true });
    (clinicasApi.updateMe as any).mockResolvedValue(emptyClinic);
  });

  it('renders English tabs and overview empty state', async () => {
    await renderClinicDashboard();

    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Professionals (0)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invitations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText("You don't have professionals in your clinic yet.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite the first one' })).toBeInTheDocument();
  });

  it('renders English agenda and invitation empty states', async () => {
    await renderClinicDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(await screen.findByText('No appointments for this day')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Invitations' }));
    expect(screen.getByText('No pending invitations')).toBeInTheDocument();
  });

  it('renders invitation statuses and shows fallback cancellation errors', async () => {
    (clinicasApi.getMe as any).mockResolvedValue({
      ...emptyClinic,
      invitaciones: [invitation],
    });
    (clinicasApi.cancelarInvitacion as any).mockRejectedValueOnce({});

    await renderClinicDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Invitations' }));

    expect(screen.getByText('Pending')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(await screen.findByText('Error cancelling invitation')).toBeInTheDocument();
  });

  it('validates and submits the invite modal with English feedback', async () => {
    await renderClinicDashboard();

    fireEvent.click(screen.getAllByRole('button', { name: /\+ Invite professional|Invite the first one/i })[0]);

    expect(screen.getByText('Invite professional')).toBeInTheDocument();
    expect(screen.getByText(/The professional will receive an email/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));
    expect(screen.getByText('Enter an email')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('dr.smith@example.com'), {
      target: { value: 'newdoctor@example.com' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));
    });

    expect(clinicasApi.invitar).toHaveBeenCalledWith('newdoctor@example.com');
    expect(await screen.findByText('Invitation sent to newdoctor@example.com')).toBeInTheDocument();

    (clinicasApi.invitar as any).mockRejectedValueOnce({});
    fireEvent.change(screen.getByPlaceholderText('dr.smith@example.com'), {
      target: { value: 'other@example.com' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));
    });

    expect(await screen.findByText('Error inviting professional')).toBeInTheDocument();
  });

  it('renders remove modal copy and shows fallback removal errors', async () => {
    (clinicasApi.getMe as any).mockResolvedValue({
      ...emptyClinic,
      profesionales: [professional],
    });
    (clinicasApi.removerProfesional as any).mockRejectedValueOnce({});

    await renderClinicDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Professionals (1)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unlink' }));

    expect(screen.getByText('Unlink professional?')).toBeInTheDocument();
    expect(screen.getByText(/Ana Garcia will no longer be managed from this clinic/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, unlink' }));
    });

    expect(await screen.findByText('Error unlinking professional')).toBeInTheDocument();
  });

  it('renders config feedback with success and error styling', async () => {
    await renderClinicDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByText('Clinic profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Central Clinic')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123 Main St, New York')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+1 555 123 4567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://myclinic.com')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    const success = await screen.findByText('Changes saved');
    expect(success).toHaveClass('text-emerald-600');

    (clinicasApi.updateMe as any).mockRejectedValueOnce({});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    const error = await screen.findByText('Error saving');
    expect(error).toHaveClass('text-red-600');
  });
});
