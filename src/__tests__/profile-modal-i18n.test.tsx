import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileModal from '../../app/components/ProfileModal';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/components/GoogleCalendarConnect', () => ({
  default: () => <div>Calendar connect</div>,
}));

vi.mock('../../app/lib/obras-sociales', () => ({
  loadObrasSociales: vi.fn().mockResolvedValue(['OSDE', 'Swiss Medical']),
  getObrasSociales: vi.fn(() => ['OSDE', 'Swiss Medical']),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    notifications: {
      getPreferences: vi.fn(),
      updatePreferences: vi.fn(),
    },
    profesional: {
      updatePerfil: vi.fn(),
    },
    pacientes: {
      updatePerfil: vi.fn(),
    },
  },
}));

const notificationPrefs = {
  notifEmail: true,
  notifWhatsapp: false,
  aceptaRecordatorios: true,
  notifRecordatorio24h: true,
  notifRecordatorio2h: false,
};

const professionalUser = {
  profesional: {
    id: 'prof-1',
    nombre: 'Ana',
    apellido: 'Perez',
    email: 'ana@example.com',
    telefono: '+54 11 1234 5678',
    genero: 'FEMENINO',
    precioConsulta: 20000,
    lugarAtencion: 'Office 1',
    bio: 'Clinical doctor',
    fotoUrl: '',
    obrasSociales: ['OSDE'],
  },
};

const patientUser = {
  paciente: {
    id: 'pac-1',
    nombre: 'Bruno',
    apellido: 'Gomez',
    email: 'bruno@example.com',
    telefono: '+54 11 5555 5555',
    genero: 'MASCULINO',
    fechaNacimiento: '1990-01-01T00:00:00.000Z',
    dni: '12345678',
    obraSocial: 'OSDE',
    fotoUrl: '',
  },
};

describe('ProfileModal i18n', () => {
  const submitProfileForm = () => {
    const form = screen.getByRole('button', { name: 'Save changes' }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.notifications.getPreferences as any).mockResolvedValue(notificationPrefs);
    (api.notifications.updatePreferences as any).mockResolvedValue(notificationPrefs);
    (api.profesional.updatePerfil as any).mockResolvedValue({});
    (api.pacientes.updatePerfil as any).mockResolvedValue({});
  });

  it('renders professional profile fields in English', async () => {
    render(
      <ProfileModal
        isOpen
        userType="profesional"
        user={professionalUser as any}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Consultation Fee ($)')).toBeInTheDocument();
    expect(screen.getByText('Practice Location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Practice address')).toBeInTheDocument();
    expect(screen.getByText('Biography')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Short professional bio...')).toBeInTheDocument();
    expect(screen.getByText('Accepted health insurance providers')).toBeInTheDocument();
    expect(screen.getByText('Select accepted coverages. Patients will be able to filter by insurance.')).toBeInTheDocument();
    expect(screen.getByText('1 coverage selected')).toBeInTheDocument();
    expect(await screen.findByText('Email notifications')).toBeInTheDocument();
  });

  it('renders patient placeholders and validation messages in English', async () => {
    render(
      <ProfileModal
        isOpen
        userType="paciente"
        user={patientUser as any}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTitle('Only numbers, spaces, +, - and parentheses (8-20 characters)')).toBeInTheDocument();
    expect(screen.getByTitle('7 or 8 numeric digits')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Insurance provider name (optional)')).toBeInTheDocument();

    fireEvent.change(screen.getByTitle('Only numbers, spaces, +, - and parentheses (8-20 characters)'), {
      target: { value: 'bad' },
    });
    submitProfileForm();

    expect(await screen.findByText('Phone must be 8-20 characters long (numbers, spaces, +, - and parentheses only)')).toBeInTheDocument();

    fireEvent.change(screen.getByTitle('Only numbers, spaces, +, - and parentheses (8-20 characters)'), {
      target: { value: '+54 11 5555 5555' },
    });
    fireEvent.change(screen.getByTitle('7 or 8 numeric digits'), {
      target: { value: '123' },
    });
    submitProfileForm();

    expect(await screen.findByText('ID must be 7-8 numeric digits')).toBeInTheDocument();
  });

  it('shows translated success after saving and keeps the professional update payload', async () => {
    render(
      <ProfileModal
        isOpen
        userType="profesional"
        user={professionalUser as any}
        onClose={vi.fn()}
      />
    );

    submitProfileForm();

    await waitFor(() => {
      expect(api.profesional.updatePerfil).toHaveBeenCalledWith(
        'prof-1',
        expect.objectContaining({
          nombre: 'Ana',
          apellido: 'Perez',
          precioConsulta: 20000,
          lugarAtencion: 'Office 1',
          obrasSociales: ['OSDE'],
        })
      );
    });
    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
  });

  it('shows translated notification preference error', async () => {
    (api.notifications.updatePreferences as any).mockRejectedValueOnce(new Error('boom'));

    render(
      <ProfileModal
        isOpen
        userType="profesional"
        user={professionalUser as any}
        onClose={vi.fn()}
      />
    );

    await screen.findByText('Email notifications');
    fireEvent.click(screen.getAllByRole('switch')[0]);

    expect(await screen.findByText('Error saving preferences')).toBeInTheDocument();
  });
});
