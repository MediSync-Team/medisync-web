import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import PagoExitosoPage from '../../app/pago-exitoso/page';
import { api } from '../../app/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js routing and search params
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock the API client
vi.mock('../../app/lib/api', () => ({
  api: {
    pagos: {
      confirmarPago: vi.fn(),
    },
  },
}));

describe('PagoExitosoPage Component', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    (useRouter as any).mockReturnValue({ push: mockPush });
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue('mock-turno-id'),
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows success state immediately and redirects if confirmed on first try', async () => {
    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: true, estado: 'APROBADO' });

    render(<PagoExitosoPage />);

    // Wait for the success UI to appear
    await waitFor(() => {
      expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
    });

    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(1);
    
    // Fast-forward 8 seconds to trigger the auto-redirect
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard/paciente?tab=proximos');
  });

  it('keeps verifying after the old 5-attempt window if payment is not confirmed yet', async () => {
    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: false, estado: 'PENDIENTE' });

    render(<PagoExitosoPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });

    expect(screen.getByText('Confirmando pago...')).toBeInTheDocument();
    expect(screen.queryByText('Verificación pendiente')).not.toBeInTheDocument();
    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(6);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows pending state only after the longer polling timeout', async () => {
    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: false, estado: 'PENDIENTE' });

    render(<PagoExitosoPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(121000);
    });

    await waitFor(() => {
      expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();
    });

    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(41);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('succeeds after more than 5 polling attempts (webhook delay simulation)', async () => {
    (api.pagos.confirmarPago as any)
      .mockResolvedValueOnce({ confirmed: false })
      .mockResolvedValueOnce({ confirmed: false })
      .mockResolvedValueOnce({ confirmed: false })
      .mockResolvedValueOnce({ confirmed: false })
      .mockResolvedValueOnce({ confirmed: false })
      .mockResolvedValueOnce({ confirmed: false })
      .mockResolvedValue({ confirmed: true });

    render(<PagoExitosoPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(18000);
    });
    
    await waitFor(() => {
      expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
    });

    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(7);
  });

  it('manual retry restarts polling and can recover to success', async () => {
    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: false });

    render(<PagoExitosoPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(121000);
    });

    await waitFor(() => {
      expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();
    });

    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: true, estado: 'APROBADO' });

    screen.getByRole('button', { name: 'Volver a intentar' }).click();

    await waitFor(() => {
      expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
    });
  });

  it('stops polling after unmount', async () => {
    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: false });

    const { unmount } = render(<PagoExitosoPage />);

    await waitFor(() => {
      expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(1);
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(1);
  });
});
