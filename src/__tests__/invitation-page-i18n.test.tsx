import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useParams } from 'next/navigation';
import InvitacionPage from '../../app/invitacion/[token]/page';
import { clinicasApi } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

const routerPush = vi.fn();
const mockAuth = vi.hoisted(() => ({
  user: null as any,
  loading: false,
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
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

vi.mock('../../app/lib/auth-context', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('../../app/lib/api', () => ({
  clinicasApi: {
    getInvitacion: vi.fn(),
    aceptarInvitacion: vi.fn(),
    rechazarInvitacion: vi.fn(),
  },
}));

const invitation = {
  id: 'inv-1',
  email: 'doctor@example.com',
  estado: 'PENDIENTE',
  expiresAt: '2026-07-15T12:00:00.000Z',
  createdAt: '2026-07-01T12:00:00.000Z',
  clinica: {
    nombre: 'Central Clinic',
    descripcion: 'Primary care',
    logoUrl: null,
    direccion: 'Main St 123',
  },
};

describe('invitation acceptance page i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.user = null;
    mockAuth.loading = false;
    (useParams as any).mockReturnValue({ token: 'token-123' });
    (clinicasApi.getInvitacion as any).mockResolvedValue(invitation);
    (clinicasApi.aceptarInvitacion as any).mockResolvedValue({ accepted: true, clinica: 'Central Clinic' });
    (clinicasApi.rechazarInvitacion as any).mockResolvedValue({ rejected: true });
  });

  it('renders ready state in English and redirects unauthenticated users to login', async () => {
    render(<InvitacionPage />);

    expect(await screen.findByText('Clinic invitation')).toBeInTheDocument();
    expect(screen.getByText('You were invited to join as a professional')).toBeInTheDocument();
    expect(screen.getByText('The invitation was sent to doctor@example.com and expires on July 15, 2026.')).toBeInTheDocument();
    expect(screen.getByText('You need to log in')).toBeInTheDocument();
    expect(screen.getByText(/associated with doctor@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Log in to accept' }));

    expect(routerPush).toHaveBeenCalledWith('/login?redirect=/invitacion/token-123');
  });

  it('shows translated professional-account error for non-professional users', async () => {
    mockAuth.user = { email: 'doctor@example.com', rol: 'PACIENTE' };

    render(<InvitacionPage />);

    await screen.findByText('You were invited to join as a professional');
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText('You need a professional account to accept this invitation.')).toBeInTheDocument();
    expect(clinicasApi.aceptarInvitacion).not.toHaveBeenCalled();
  });

  it('renders translated email mismatch warning and disables actions', async () => {
    mockAuth.user = { email: 'other@example.com', rol: 'PROFESIONAL' };

    render(<InvitacionPage />);

    expect(await screen.findByText('Wrong email')).toBeInTheDocument();
    expect(screen.getByText(/logged in as other@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Accept invitation' })).toBeDisabled();
  });

  it('renders translated accepted and rejected states after actions', async () => {
    mockAuth.user = { email: 'doctor@example.com', rol: 'PROFESIONAL' };
    const { rerender } = render(<InvitacionPage />);

    await screen.findByText('You were invited to join as a professional');
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText('You joined Central Clinic')).toBeInTheDocument();
    expect(screen.getByText(/You are now part of the clinic/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to dashboard' })).toHaveAttribute('href', '/dashboard');

    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ token: 'token-456' });
    rerender(<InvitacionPage />);

    await screen.findByText('You were invited to join as a professional');
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(await screen.findByText('Invitation rejected')).toBeInTheDocument();
    expect(screen.getByText(/You rejected the invitation/i)).toBeInTheDocument();
  });

  it('renders translated not-found and expired states', async () => {
    (clinicasApi.getInvitacion as any).mockRejectedValueOnce(new Error('not found'));
    const { unmount } = render(<InvitacionPage />);

    expect(await screen.findByText('Invitation not found')).toBeInTheDocument();
    expect(screen.getByText('This link is invalid or has already been processed.')).toBeInTheDocument();
    unmount();

    (clinicasApi.getInvitacion as any).mockRejectedValueOnce(new Error('expirada'));
    render(<InvitacionPage />);

    expect(await screen.findByText('Invitation expired')).toBeInTheDocument();
    expect(screen.getByText(/Ask the clinic administrator/i)).toBeInTheDocument();
  });

  it('shows translated fallback errors when accept or reject fails without backend message', async () => {
    mockAuth.user = { email: 'doctor@example.com', rol: 'PROFESIONAL' };
    (clinicasApi.aceptarInvitacion as any).mockRejectedValueOnce({});

    const { rerender } = render(<InvitacionPage />);

    await screen.findByText('You were invited to join as a professional');
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText('Could not accept the invitation')).toBeInTheDocument();

    (useParams as any).mockReturnValue({ token: 'token-456' });
    (clinicasApi.rechazarInvitacion as any).mockRejectedValueOnce({});
    rerender(<InvitacionPage />);

    await screen.findByText('You were invited to join as a professional');
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(await screen.findByText('Error rejecting invitation')).toBeInTheDocument();
  });
});
