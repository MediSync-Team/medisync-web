import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CalendarioView from '../../app/dashboard/components/CalendarioView';
import type { Turno } from '../../app/lib/api';
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

const anonymousTurno: Turno = {
  id: 'turno-1',
  pacienteId: 'paciente-1',
  profesionalId: 'profesional-1',
  fechaHora: '2026-05-18T13:00:00.000Z',
  duracionMin: 30,
  estado: 'CONFIRMADO',
  modalidad: 'VIRTUAL',
  precio: 1000,
  createdAt: '2026-05-01T13:00:00.000Z',
  updatedAt: '2026-05-01T13:00:00.000Z',
  paciente: null,
};

const baseProps = {
  selectedDateKey: '2026-05-18',
  setSelectedDateKey: vi.fn(),
  turnos: [anonymousTurno],
  turnosDelDia: [anonymousTurno],
  onSelectTurno: vi.fn(),
  agendaSearch: '',
  setAgendaSearch: vi.fn(),
  agendaEstado: 'TODOS' as const,
  setAgendaEstado: vi.fn(),
  agendaModalidad: 'TODAS' as const,
  setAgendaModalidad: vi.fn(),
  agendaSoloRiesgo: false,
  setAgendaSoloRiesgo: vi.fn(),
  onFetchMonth: vi.fn(),
};

describe('CalendarioView i18n', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders calendar navigation and filter accessibility labels in English', () => {
    render(<CalendarioView {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search patient in schedule' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by modality' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shared in person' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shared virtual' })).toBeInTheDocument();
  });

  it('uses localized anonymous-patient fallback for search without changing rendered no-account label', () => {
    render(
      <CalendarioView
        {...baseProps}
        agendaSearch="patient without account"
      />
    );

    expect(screen.getByText('No account')).toBeInTheDocument();
    expect(screen.getAllByText('Shared virtual').length).toBeGreaterThan(0);
    expect(screen.queryByText('Legacy virtual')).not.toBeInTheDocument();
    expect(screen.queryByText('No appointments for this day')).not.toBeInTheDocument();
  });

  it('renders Argentina clinic today and selected day when UTC has crossed into the next date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T02:30:00.000Z'));

    const boundaryTurno = {
      ...anonymousTurno,
      id: 'turno-boundary',
      fechaHora: '2026-06-01T02:30:00.000Z',
    };

    render(
      <CalendarioView
        {...baseProps}
        selectedDateKey="2026-05-31"
        turnos={[boundaryTurno]}
        turnosDelDia={[boundaryTurno]}
      />
    );

    expect(screen.getByText('Sunday, May 31')).toBeInTheDocument();
    expect(screen.getByText('No account')).toBeInTheDocument();
    expect(screen.queryByText('No appointments for this day')).not.toBeInTheDocument();
  });

  it('keeps zero-based month fetch contract when navigating months', () => {
    const onFetchMonth = vi.fn();
    const { unmount } = render(
      <CalendarioView {...baseProps} onFetchMonth={onFetchMonth} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onFetchMonth).toHaveBeenCalledWith(2026, 5);

    unmount();
    onFetchMonth.mockClear();
    render(<CalendarioView {...baseProps} onFetchMonth={onFetchMonth} />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(onFetchMonth).toHaveBeenCalledWith(2026, 3);
  });

  it('selects clinic date keys when clicking calendar days', () => {
    const setSelectedDateKey = vi.fn();

    render(
      <CalendarioView
        {...baseProps}
        setSelectedDateKey={setSelectedDateKey}
      />
    );

    const day18 = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.trim() === '18');

    expect(day18).toBeDefined();
    fireEvent.click(day18!);
    expect(setSelectedDateKey).toHaveBeenCalledWith('2026-05-18');
  });
});
