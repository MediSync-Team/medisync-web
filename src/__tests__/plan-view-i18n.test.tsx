import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlanView from '../../app/dashboard/components/PlanView';
import type { SuscripcionEstado } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const freeSubscription: SuscripcionEstado = {
  plan: 'FREE',
  estado: 'ACTIVA',
  turnosEsteMes: 8,
  limiteTurnos: 20,
  turnosRestantes: 12,
};

const proSubscription: SuscripcionEstado = {
  plan: 'PRO',
  estado: 'ACTIVA',
  turnosEsteMes: 42,
  limiteTurnos: 999999,
  turnosRestantes: 999957,
  planVenceAt: '2026-06-15T12:00:00.000Z',
};

describe('PlanView i18n', () => {
  it('renders free plan copy in English and keeps upgrade callback behavior', () => {
    const onIniciarSuscripcion = vi.fn();

    render(
      <PlanView
        suscripcion={freeSubscription}
        loading={false}
        onIniciarSuscripcion={onIniciarSuscripcion}
        onCancelarSuscripcion={vi.fn()}
        redirecting={false}
      />
    );

    expect(screen.getByText('Current plan')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Up to 20 appointments/month')).toBeInTheDocument();
    expect(screen.getByText('Appointments this month')).toBeInTheDocument();
    expect(screen.getByText('You have 12 appointments left this month')).toBeInTheDocument();
    expect(screen.getByText('Compare plans')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Medical history')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Pro - $4,990/month' }));
    expect(onIniciarSuscripcion).toHaveBeenCalled();
  });

  it('renders pro plan copy in English and keeps cancel callback behavior', () => {
    const onCancelarSuscripcion = vi.fn();

    render(
      <PlanView
        suscripcion={proSubscription}
        loading={false}
        onIniciarSuscripcion={vi.fn()}
        onCancelarSuscripcion={onCancelarSuscripcion}
        redirecting={false}
      />
    );

    expect(screen.getByText('Current plan')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Unlimited appointments + advanced statistics')).toBeInTheDocument();
    expect(screen.getByText('Next billing date')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));
    expect(onCancelarSuscripcion).toHaveBeenCalled();
  });
});
