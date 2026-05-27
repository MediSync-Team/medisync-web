import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CertificadoCard from '../../app/dashboard/paciente/components/CertificadoCard';
import type { CertificadoPaciente, TipoCertificado } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const buildCertificate = (tipo: TipoCertificado): CertificadoPaciente => ({
  id: `cert-${tipo}`,
  turnoId: 'turno-1',
  fechaHora: '2026-06-01T13:00:00.000Z',
  certificado: {
    id: `inner-${tipo}`,
    turnoId: 'turno-1',
    tipo,
    diagnostico: 'Clinical diagnosis',
    texto: 'Certificate text',
    diasReposo: tipo === 'REPOSO' ? 3 : undefined,
    emitidaAt: '2026-06-01T13:00:00.000Z',
    createdAt: '2026-06-01T13:00:00.000Z',
  },
  profesional: {
    nombre: 'Ana',
    apellido: 'Garcia',
    especialidad: { nombre: 'Clinical medicine' },
  },
});

describe('CertificadoCard i18n', () => {
  it('renders certificate type labels from patient translations', () => {
    const { rerender } = render(
      <CertificadoCard certificado={buildCertificate('REPOSO')} onDescargar={vi.fn()} />
    );

    expect(screen.getByText('Medical rest')).toBeInTheDocument();

    rerender(<CertificadoCard certificado={buildCertificate('CONSULTA')} onDescargar={vi.fn()} />);

    expect(screen.getByText('Consultation justification')).toBeInTheDocument();
  });

  it('keeps the download callback unchanged', () => {
    const onDescargar = vi.fn();

    render(<CertificadoCard certificado={buildCertificate('REPOSO')} onDescargar={onDescargar} />);

    fireEvent.click(screen.getByRole('button', { name: /Download certificate/i }));

    expect(onDescargar).toHaveBeenCalledTimes(1);
  });
});
