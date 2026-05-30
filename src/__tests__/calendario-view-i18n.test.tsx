import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CalendarioView from '../../app/dashboard/components/CalendarioView';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const anonymousTurno = {
  id: 'turno-1',
  fechaHora: '2026-05-18T13:00:00.000Z',
  estado: 'CONFIRMADO',
  modalidad: 'VIRTUAL',
  paciente: null,
  preconsultaRiesgo: null,
};

const baseProps = {
  selectedDate: new Date(2026, 4, 18, 12, 0, 0),
  setSelectedDate: vi.fn(),
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
  it('renders calendar navigation and filter accessibility labels in English', () => {
    render(<CalendarioView {...(baseProps as any)} />);

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search patient in schedule' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter by modality' })).toBeInTheDocument();
  });

  it('uses localized anonymous-patient fallback for search without changing rendered no-account label', () => {
    render(
      <CalendarioView
        {...(baseProps as any)}
        agendaSearch="patient without account"
      />
    );

    expect(screen.getByText('No account')).toBeInTheDocument();
    expect(screen.queryByText('No appointments for this day')).not.toBeInTheDocument();
  });
});
