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

  it('shows pending state if payment is not confirmed after 5 polling attempts', async () => {
    (api.pagos.confirmarPago as any).mockResolvedValue({ confirmed: false, estado: 'PENDIENTE' });

    render(<PagoExitosoPage />);

    // Fast-forward through all 5 polling attempts (5 * 2s = 10s total)
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500);
      });
    }

    // Should now show the pending state
    await waitFor(() => {
      expect(screen.getByText('Verificación pendiente')).toBeInTheDocument();
    });

    // Verify it polled exactly 5 times
    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(5);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('succeeds after multiple polling attempts (webhook delay simulation)', async () => {
    (api.pagos.confirmarPago as any)
      .mockResolvedValueOnce({ confirmed: false }) // Attempt 1
      .mockResolvedValueOnce({ confirmed: false }) // Attempt 2
      .mockResolvedValue({ confirmed: true });     // Attempt 3

    render(<PagoExitosoPage />);

    // Advance first delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    // Advance second delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
    });

    // Should have checked exactly 3 times before succeeding
    expect(api.pagos.confirmarPago).toHaveBeenCalledTimes(3);
  });
});
