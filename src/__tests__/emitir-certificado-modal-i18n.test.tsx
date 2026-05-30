import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EmitirCertificadoModal from '../../app/dashboard/components/EmitirCertificadoModal';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const baseForm = {
  tipo: 'CONSULTA' as const,
  diagnostico: '',
  texto: '',
  diasReposo: 0,
};

describe('EmitirCertificadoModal i18n', () => {
  it('renders certificate modal labels in English', () => {
    render(
      <EmitirCertificadoModal
        form={baseForm}
        setForm={vi.fn()}
        onSave={vi.fn()}
        loading={false}
        onClose={vi.fn()}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
    expect(screen.getByText('Issue medical certificate')).toBeInTheDocument();
    expect(screen.getByText('Certificate type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medical rest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Consultation justification' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fitness certificate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Free-form certificate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save certificate' })).toBeInTheDocument();
  });

  it('keeps certificate enum values while inserting translated templates', () => {
    const setForm = vi.fn();

    render(
      <EmitirCertificadoModal
        form={baseForm}
        setForm={setForm}
        onSave={vi.fn()}
        loading={false}
        onClose={vi.fn()}
        translateSpecialty={(name) => name ?? ''}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Medical rest' }));
    expect(setForm).toHaveBeenCalledWith({
      ...baseForm,
      tipo: 'REPOSO',
      texto: 'The patient has been seen and, after clinical examination, medical rest is prescribed.',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Free-form certificate' }));
    expect(setForm).toHaveBeenLastCalledWith({
      ...baseForm,
      tipo: 'LIBRE',
      texto: '',
    });
  });
});
