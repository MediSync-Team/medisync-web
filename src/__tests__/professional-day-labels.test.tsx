import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HorariosGrid from '../../app/profesional/[id]/HorariosGrid';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

describe('professional page day labels', () => {
  it('uses translated short day labels for availability day indexes', () => {
    render(
      <HorariosGrid
        disponibilidades={[
          { diaSemana: 0, horaInicio: '09:00', horaFin: '10:00', modalidad: 'VIRTUAL' },
          { diaSemana: 1, horaInicio: '10:00', horaFin: '11:00', modalidad: 'PRESENCIAL' },
        ]}
      />
    );

    expect(screen.getByText('Regular schedule')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.queryByText('Dom')).not.toBeInTheDocument();
    expect(screen.queryByText('Lun')).not.toBeInTheDocument();
  });
});
