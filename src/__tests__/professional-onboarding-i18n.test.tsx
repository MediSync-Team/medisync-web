import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfesionalOnboardingWizard from '../../app/components/ProfesionalOnboardingWizard';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    profesional: {
      updatePerfil: vi.fn(),
    },
    profesionales: {
      crearDisponibilidad: vi.fn(),
      eliminarDisponibilidad: vi.fn(),
    },
  },
}));

describe('professional onboarding wizard i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
    });
    (api.profesional.updatePerfil as any).mockResolvedValue({});
    (api.profesionales.crearDisponibilidad as any).mockResolvedValue({
      id: 'disp-1',
      diaSemana: 1,
      horaInicio: '09:00',
      horaFin: '17:00',
      modalidad: 'PRESENCIAL',
    });
  });

  it('renders profile step labels in English', () => {
    render(
      <ProfesionalOnboardingWizard
        profesionalId="prof-1"
        userId="user-1"
        nombre="Ana"
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Welcome, Dr. Ana')).toBeInTheDocument();
    expect(screen.getByText('Set up your professional profile')).toBeInTheDocument();
    expect(screen.getAllByText('Step 1 of 4')).toHaveLength(2);
    expect(screen.getByText('Your profile')).toBeInTheDocument();
    expect(screen.getByText('Profile photo URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com/your-photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('Professional biography')).toBeInTheDocument();
    expect(screen.getByText('Complete later')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument();
  });

  it('shows translated validation and walks through availability, price, and completion', async () => {
    const onComplete = vi.fn();

    render(
      <ProfesionalOnboardingWizard
        profesionalId="prof-1"
        userId="user-1"
        nombre="Ana"
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));

    await waitFor(() => {
      expect(screen.getByText('Define the days and times when you see patients. Patients can only book inside these blocks. You can add more from your dashboard later.')).toBeInTheDocument();
    });

    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Modality')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add schedule' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    expect(await screen.findByText('Add at least one appointment schedule to continue.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Add schedule' }));

    await waitFor(() => {
      expect(api.profesionales.crearDisponibilidad).toHaveBeenCalledWith('prof-1', {
        diaSemana: 1,
        horaInicio: '09:00',
        horaFin: '17:00',
        modalidad: 'PRESENCIAL',
      });
    });

    expect(await screen.findByText('Configured schedules (1)')).toBeInTheDocument();
    expect(screen.getAllByText('Monday').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In person').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));

    await waitFor(() => {
      expect(screen.getByText(/Consultation fee/)).toBeInTheDocument();
    });

    expect(screen.getByText('Care modality')).toBeInTheDocument();
    expect(screen.getByText('Practice location')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save and view summary →' }));
    expect(await screen.findByText('Enter a valid consultation fee')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('20000'), { target: { value: '20000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and view summary →' }));

    await waitFor(() => {
      expect(api.profesional.updatePerfil).toHaveBeenCalledWith(
        'prof-1',
        expect.objectContaining({
          precioConsulta: 20000,
          modalidad: 'PRESENCIAL',
        })
      );
    });

    expect(await screen.findByText('Your profile is ready, Dr. Ana!')).toBeInTheDocument();
    expect(screen.getByText('Setup summary')).toBeInTheDocument();
    expect(screen.getByText('1 block configured')).toBeInTheDocument();
    expect(screen.getByText('Your public profile')).toBeInTheDocument();
    expect(screen.getByText('View my profile as patients see it')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '✓ Open my dashboard' }));

    expect(localStorage.getItem('medisync_onboarding_done_user-1')).toBe('1');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows translated photo URL validation', async () => {
    render(
      <ProfesionalOnboardingWizard
        profesionalId="prof-1"
        userId="user-1"
        nombre="Ana"
        onComplete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('https://example.com/your-photo.jpg'), { target: { value: 'bad-url' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));

    expect(await screen.findByText('The photo URL must start with http or https')).toBeInTheDocument();
  });
});
