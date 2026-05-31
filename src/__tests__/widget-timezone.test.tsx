import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useParams } from 'next/navigation';
import WidgetPage from '../../app/widget/[profesionalId]/page';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

const mockLanguage = vi.hoisted(() => ({ lang: 'es' as 'es' | 'en' }));
const testTranslations = {
  es: translations.es,
  en: {
    ...translations.en,
    modality: {
      ...translations.en.modality,
      PRESENCIAL: 'Shared in person',
      VIRTUAL: 'Shared virtual',
    },
  },
};

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: mockLanguage.lang,
    t: (section: keyof typeof translations.es) => testTranslations[mockLanguage.lang][section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    profesionales: {
      getById: vi.fn(),
      getSlots: vi.fn(),
    },
  },
}));

describe('WidgetPage timezone behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-18T02:30:00.000Z'));
    vi.clearAllMocks();
    mockLanguage.lang = 'es';

    (useParams as any).mockReturnValue({ profesionalId: 'prof-1' });
    (api.profesionales.getById as any).mockResolvedValue({
      id: 'prof-1',
      nombre: 'Ana',
      apellido: 'Lopez',
      telefono: null,
      genero: 'NO_ESPECIFICADO',
      precioConsulta: 1000,
      lugarAtencion: 'Consultorio 1',
      especialidad: { id: 'esp-1', nombre: 'Clinica medica' },
      disponibilidades: [
        {
          id: 'disp-1',
          diaSemana: 0,
          horaInicio: '10:00',
          horaFin: '12:00',
          modalidad: 'AMBOS',
          activo: true,
          lugarAtencion: 'Consultorio 1',
        },
      ],
    });
    (api.profesionales.getSlots as any).mockResolvedValue([
      { hora: '10:00', disponible: true, lugarAtencion: 'Consultorio 1' },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads slots with the selected Argentina clinic date key', async () => {
    render(<WidgetPage />);

    const todayButton = await screen.findByRole('button', { name: /hoy/i });
    expect(todayButton).toHaveTextContent('17');

    fireEvent.click(todayButton);

    await waitFor(() => {
      expect(api.profesionales.getSlots).toHaveBeenCalledWith(
        'prof-1',
        '2026-05-17',
        'PRESENCIAL'
      );
    });

    expect(await screen.findByText('10:00')).toBeInTheDocument();
    expect(screen.getByText(/Horarios/i)).toHaveTextContent('17 de mayo');
  });

  it('renders widget labels in Spanish', async () => {
    render(<WidgetPage />);

    expect(await screen.findByText('Seleccioná un día')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Horario')).toBeInTheDocument();
    expect(screen.getByText('Cuenta')).toBeInTheDocument();
    expect(screen.getByText(/Seleccioná un día para ver los horarios disponibles/i)).toBeInTheDocument();
  });

  it('renders widget labels in English', async () => {
    mockLanguage.lang = 'en';

    render(<WidgetPage />);

    expect(await screen.findByText('Select a day')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Shared in person')).toBeInTheDocument();
    expect(screen.getByText('Shared virtual')).toBeInTheDocument();
    expect(screen.getByText(/Select a day to see available times/i)).toBeInTheDocument();
  });
});
