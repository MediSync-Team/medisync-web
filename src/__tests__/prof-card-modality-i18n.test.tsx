import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfCard from '../../app/components/ProfCard';
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

describe('ProfCard modality labels', () => {
  it('uses shared modality labels for modality badges', () => {
    render(
      <ProfCard
        prof={{
          id: 'prof-1',
          nombre: 'Ana',
          apellido: 'Garcia',
          telefono: null,
          genero: 'NO_ESPECIFICADO',
          precioConsulta: 0,
          lugarAtencion: null,
          bio: null,
          especialidad: { id: 'esp-1', nombre: 'Cardiology' },
          obrasSociales: [],
          disponibilidades: [
            { id: 'disp-1', diaSemana: 1, horaInicio: '09:00', horaFin: '10:00', modalidad: 'PRESENCIAL', activo: true },
            { id: 'disp-2', diaSemana: 2, horaInicio: '10:00', horaFin: '11:00', modalidad: 'VIRTUAL', activo: true },
          ],
        } as any}
      />
    );

    expect(screen.getByText('Shared in person')).toBeInTheDocument();
    expect(screen.getByText('Shared virtual')).toBeInTheDocument();
    expect(screen.queryByText('Legacy in person')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy virtual')).not.toBeInTheDocument();
  });
});
