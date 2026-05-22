import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useParams } from 'next/navigation';
import WidgetPage from '../../app/widget/[profesionalId]/page';
import { api } from '../../app/lib/api';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({ lang: 'es' }),
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
          modalidad: 'PRESENCIAL',
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
});
