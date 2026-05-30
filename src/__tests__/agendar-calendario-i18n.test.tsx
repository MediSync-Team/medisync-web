import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AgendarCalendario from '../../app/components/AgendarCalendario';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const turno = {
  turnoId: 'turno-12345678',
  fechaHora: '2026-05-18T13:00:00.000Z',
  duracionMin: 30,
  modalidad: 'VIRTUAL' as const,
  profesionalNombre: 'Ana',
  profesionalApellido: 'Garcia',
  especialidad: 'Cardiology',
  lugarAtencion: null,
};

describe('AgendarCalendario i18n', () => {
  it('renders card variant calendar save copy in English', () => {
    render(<AgendarCalendario turno={turno} />);

    expect(screen.getByText('Add to calendar')).toBeInTheDocument();
    expect(screen.getByText('Save the appointment to your favorite calendar app so you do not forget it. Includes a reminder 1 hour before.')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Google Calendar/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('href', expect.stringContaining('calendar.google.com'));
  });

  it('keeps compact variant as the Google Calendar brand link only', () => {
    render(<AgendarCalendario turno={turno} variant="compact" />);

    expect(screen.getByRole('link', { name: /Google Calendar/i })).toHaveAttribute('href', expect.stringContaining('calendar.google.com'));
    expect(screen.queryByText('Add to calendar')).not.toBeInTheDocument();
    expect(screen.queryByText(/Save the appointment/i)).not.toBeInTheDocument();
  });
});
