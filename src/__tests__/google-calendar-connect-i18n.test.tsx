import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GoogleCalendarConnect from '../../app/components/GoogleCalendarConnect';
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
    google: {
      getStatus: vi.fn(),
      getAuthUrl: vi.fn(),
      disconnect: vi.fn(),
    },
  },
}));

describe('GoogleCalendarConnect i18n', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/profile');
    (api.google.getStatus as any).mockResolvedValue({ connected: false });
    (api.google.getAuthUrl as any).mockResolvedValue({ url: 'https://google.test/oauth' });
    (api.google.disconnect as any).mockResolvedValue(undefined);
  });

  it('renders connected state in English', async () => {
    (api.google.getStatus as any).mockResolvedValueOnce({ connected: true });

    render(<GoogleCalendarConnect />);

    expect(await screen.findByText('Appointments sync automatically with your calendar')).toBeInTheDocument();
    expect(screen.getByText('Connected — new appointments will appear in your calendar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
  });

  it('renders disconnected state in English', async () => {
    render(<GoogleCalendarConnect />);

    expect(await screen.findByText('Sync your appointments with Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('shows translated OAuth success and cleans the URL', async () => {
    window.history.replaceState({}, '', '/profile?google=connected');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    render(<GoogleCalendarConnect />);

    expect(await screen.findByText('Google Calendar connected successfully!')).toBeInTheDocument();
    expect(replaceSpy).toHaveBeenCalledWith({}, '', '/profile');
  });

  it('shows translated OAuth error and cleans the URL', async () => {
    window.history.replaceState({}, '', '/profile?google=error');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    render(<GoogleCalendarConnect />);

    expect(await screen.findByText('Could not connect Google Calendar. Please try again.')).toBeInTheDocument();
    expect(replaceSpy).toHaveBeenCalledWith({}, '', '/profile');
  });

  it('uses translated disconnect confirmation and disconnects only when confirmed', async () => {
    (api.google.getStatus as any).mockResolvedValue({ connected: true });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    render(<GoogleCalendarConnect />);

    const disconnectButton = await screen.findByRole('button', { name: 'Disconnect' });
    fireEvent.click(disconnectButton);

    expect(confirmSpy).toHaveBeenCalledWith('Disconnect Google Calendar? Future appointments will no longer sync.');
    expect(api.google.disconnect).not.toHaveBeenCalled();

    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(api.google.disconnect).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Google Calendar disconnected.')).toBeInTheDocument();
  });

  it('uses translated fallback errors when API errors have no message', async () => {
    (api.google.getAuthUrl as any).mockRejectedValueOnce({});
    render(<GoogleCalendarConnect />);

    fireEvent.click(await screen.findByRole('button', { name: 'Connect' }));

    expect(await screen.findByText('Error getting authorization URL')).toBeInTheDocument();
  });

  it('uses translated disconnect fallback error when API errors have no message', async () => {
    (api.google.getStatus as any).mockResolvedValue({ connected: true });
    (api.google.disconnect as any).mockRejectedValueOnce({});
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(<GoogleCalendarConnect />);

    fireEvent.click(await screen.findByRole('button', { name: 'Disconnect' }));

    expect(await screen.findByText('Error disconnecting')).toBeInTheDocument();
  });
});
