import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DisponibilidadView from '../../app/dashboard/components/DisponibilidadView';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

const englishTranslations = {
  ...translations.en,
  home: {
    ...translations.en.home,
    inPerson: 'Legacy in person',
    virtual: 'Legacy virtual',
  },
  modality: {
    ...translations.en.modality,
    PRESENCIAL: 'Shared in person',
    VIRTUAL: 'Shared virtual',
  },
};

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => englishTranslations[section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    bloqueos: {
      crear: vi.fn(),
      eliminar: vi.fn(),
    },
  },
}));

const defaultProps = {
  disponibilidades: [],
  nuevaDisp: { diaSemana: 1, horaInicio: '', horaFin: '', modalidad: 'PRESENCIAL' as const, lugarAtencion: '' },
  setNuevaDisp: vi.fn(),
  onAgregar: vi.fn(),
  onEliminar: vi.fn(),
  eliminandoId: null,
  bloqueos: [],
  loadingBloqueos: false,
  onReloadBloqueos: vi.fn(),
};

describe('DisponibilidadView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T02:30:00.000Z'));
    (api.bloqueos.crear as any).mockResolvedValue({});
    (api.bloqueos.eliminar as any).mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Argentina clinic today as block date input minimum', () => {
    const { container } = render(
      <DisponibilidadView {...defaultProps} />
    );

    const dateInputs = Array.from(container.querySelectorAll('input[type="date"]')) as HTMLInputElement[];

    expect(dateInputs).toHaveLength(2);
    expect(dateInputs[0].min).toBe('2026-05-17');
    expect(dateInputs[1].min).toBe('2026-05-17');

    fireEvent.change(dateInputs[0], { target: { value: '2026-05-20' } });

    expect(dateInputs[1].min).toBe('2026-05-20');
  });

  it('shows translated validation and fallback messages for block creation', async () => {
    (api.bloqueos.crear as any).mockRejectedValueOnce({});

    const { container } = render(<DisponibilidadView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Add new blocking' }));
    expect(screen.getByText('Start and end date are required.')).toBeInTheDocument();

    const dateInputs = Array.from(container.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
    fireEvent.change(dateInputs[0], { target: { value: '2026-05-20' } });
    fireEvent.click(screen.getByLabelText('Partial block (time range only)'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add new blocking' }));
    expect(screen.getByText('Enter start and end times for a partial block.')).toBeInTheDocument();

    const timeInputs = Array.from(container.querySelectorAll('input[type="time"]')) as HTMLInputElement[];
    fireEvent.change(timeInputs[2], { target: { value: '10:00' } });
    fireEvent.change(timeInputs[3], { target: { value: '11:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+ Add new blocking' }));
    });

    expect(screen.getByText('Could not save blocking')).toBeInTheDocument();
  });

  it('saves blocks with translated success text and unchanged stored reason values', async () => {
    const onReloadBloqueos = vi.fn();
    const { container } = render(
      <DisponibilidadView
        {...defaultProps}
        onReloadBloqueos={onReloadBloqueos}
      />
    );

    const dateInputs = Array.from(container.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
    fireEvent.change(dateInputs[0], { target: { value: '2026-05-20' } });
    const selects = Array.from(container.querySelectorAll('select')) as HTMLSelectElement[];
    const reasonSelect = selects[selects.length - 1];
    fireEvent.change(reasonSelect, { target: { value: 'Capacitación' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '+ Add new blocking' }));
    });

    expect(api.bloqueos.crear).toHaveBeenCalledWith({
      fechaInicio: '2026-05-20',
      fechaFin: '2026-05-20',
      horaInicio: undefined,
      horaFin: undefined,
      motivo: 'Capacitación',
    });
    expect(screen.getByText('Blocking saved successfully.')).toBeInTheDocument();
    expect(onReloadBloqueos).toHaveBeenCalled();
  });

  it('uses translated schedule delete title and no-location fallback', () => {
    render(
      <DisponibilidadView
        {...defaultProps}
        disponibilidades={[
          { id: 'disp-1', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', modalidad: 'PRESENCIAL', lugarAtencion: null } as any,
          { id: 'disp-2', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00', modalidad: 'PRESENCIAL', lugarAtencion: 'Office 2' } as any,
          { id: 'disp-3', diaSemana: 3, horaInicio: '11:00', horaFin: '12:00', modalidad: 'PRESENCIAL', lugarAtencion: 'Office 3' } as any,
        ]}
      />
    );

    expect(screen.getAllByTitle('Delete schedule')).toHaveLength(3);
    expect(screen.getByText('No location assigned')).toBeInTheDocument();
    expect(screen.getAllByText('Shared in person').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText('Legacy in person')).not.toBeInTheDocument();
  });

  it('uses shared modality labels for availability select options', () => {
    render(<DisponibilidadView {...defaultProps} />);

    expect(screen.getByRole('option', { name: 'Shared in person' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shared virtual' })).toBeInTheDocument();
  });
});
