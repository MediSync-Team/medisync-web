import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PagoFallidoPage from '../../app/pago-fallido/page';
import PagoPendientePage from '../../app/pago-pendiente/page';
import translations from '../../app/lib/i18n/translations';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

describe('payment result page i18n', () => {
  const push = vi.fn();
  const getSearchParam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (useRouter as any).mockReturnValue({ push });
    (useSearchParams as any).mockReturnValue({ get: getSearchParam });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders pending payment page in English and keeps dashboard redirect', async () => {
    render(<PagoPendientePage />);

    expect(screen.getByText('Payment pending')).toBeInTheDocument();
    expect(screen.getByText(/Your payment is being processed/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my appointments' })).toHaveAttribute('href', '/dashboard/paciente');
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(push).toHaveBeenCalledWith('/dashboard/paciente');
  });

  it('renders failed payment page in English and keeps retry link with turno', async () => {
    getSearchParam.mockReturnValue('turno-123');

    render(<PagoFallidoPage />);

    expect(screen.getByText('Payment rejected')).toBeInTheDocument();
    expect(screen.getByText(/could not be processed/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', '/pago?turno=turno-123');
    expect(screen.getByRole('link', { name: 'View my appointments' })).toHaveAttribute('href', '/dashboard/paciente?tab=proximos');

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(push).toHaveBeenCalledWith('/pago?turno=turno-123');
  });

  it('failed payment page falls back to upcoming appointments when turno is missing', async () => {
    getSearchParam.mockReturnValue(null);

    render(<PagoFallidoPage />);

    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', '/dashboard/paciente?tab=proximos');

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(push).toHaveBeenCalledWith('/dashboard/paciente?tab=proximos');
  });
});
