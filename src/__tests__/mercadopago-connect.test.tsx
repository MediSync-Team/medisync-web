import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MercadoPagoConnect from '../../app/components/MercadoPagoConnect';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    mercadopago: {
      getStatus: vi.fn(),
      getAuthUrl: vi.fn(),
      disconnect: vi.fn(),
    },
  },
}));

describe('MercadoPagoConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub location so the connect redirect (window.location.href = ...) is a no-op
    // and the `?mp=` param read on mount is deterministic.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { search: '', pathname: '/dashboard', href: '' },
    });
    (api.mercadopago.getAuthUrl as any).mockResolvedValue({ url: 'https://mp.test/authorize' });
    (api.mercadopago.disconnect as any).mockResolvedValue({ disconnected: true });
  });

  it('renders the linked state when the professional has connected MP', async () => {
    (api.mercadopago.getStatus as any).mockResolvedValue({ connected: true, vendedorId: '123' });

    render(<MercadoPagoConnect />);

    expect(
      await screen.findByText('Payments for your consultations are credited to your Mercado Pago account'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlink' })).toBeInTheDocument();
    expect(screen.getByText('Linked — payments go to your Mercado Pago account')).toBeInTheDocument();
  });

  it('renders the unlinked state and starts the OAuth flow on click', async () => {
    (api.mercadopago.getStatus as any).mockResolvedValue({ connected: false, vendedorId: null });

    render(<MercadoPagoConnect />);

    const linkBtn = await screen.findByRole('button', { name: 'Link' });
    expect(screen.getByText('Not linked — payments go to the platform account')).toBeInTheDocument();

    fireEvent.click(linkBtn);

    await waitFor(() => {
      expect(api.mercadopago.getAuthUrl).toHaveBeenCalledTimes(1);
    });
  });

  it('falls back to the disconnected state when the status check fails', async () => {
    (api.mercadopago.getStatus as any).mockRejectedValue(new Error('network'));

    render(<MercadoPagoConnect />);

    expect(await screen.findByRole('button', { name: 'Link' })).toBeInTheDocument();
  });
});
