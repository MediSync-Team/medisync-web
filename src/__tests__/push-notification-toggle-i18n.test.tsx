import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PushNotificationToggle from '../../app/components/PushNotificationToggle';
import { api } from '../../app/lib/api';
import {
  getActivePushSubscription,
  getPushPermission,
  isPushSupported,
} from '../../app/lib/push';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/push', () => ({
  isPushSupported: vi.fn(),
  getPushPermission: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
  getActivePushSubscription: vi.fn(),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    notifications: {
      getPreferences: vi.fn(),
      updatePreferences: vi.fn(),
      testPush: vi.fn(),
    },
  },
}));

describe('PushNotificationToggle i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (isPushSupported as any).mockReturnValue(true);
    (getPushPermission as any).mockReturnValue('granted');
    (getActivePushSubscription as any).mockResolvedValue({ endpoint: 'push-endpoint' });
    (api.notifications.getPreferences as any).mockResolvedValue({
      pushTurno: true,
      pushCancelacion: true,
      pushRecordatorio: true,
      pushReceta: true,
      pushChat: true,
    });
    (api.notifications.updatePreferences as any).mockResolvedValue({});
    (api.notifications.testPush as any).mockResolvedValue({});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders subscribed push preferences in English and keeps preference payloads', async () => {
    render(<PushNotificationToggle />);

    expect(await screen.findByText('Receive push for')).toBeInTheDocument();
    expect(screen.getByText('New appointments')).toBeInTheDocument();
    expect(screen.getByText('Bookings, confirmations, and reschedules')).toBeInTheDocument();
    expect(screen.getByText('Chat messages')).toBeInTheDocument();
    expect(screen.getByText('New messages in an appointment chat')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send test' }));

    await waitFor(() => {
      expect(api.notifications.testPush).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByRole('button', { name: '✓ Sent' })).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[4]);

    await waitFor(() => {
      expect(api.notifications.updatePreferences).toHaveBeenCalledWith({ pushChat: false });
    });
  });

  it('renders unsupported and denied states with existing translated profile labels', async () => {
    (isPushSupported as any).mockReturnValue(false);

    const { unmount } = render(<PushNotificationToggle />);

    expect(await screen.findByText('Push notifications not available in this browser')).toBeInTheDocument();
    unmount();

    (isPushSupported as any).mockReturnValue(true);
    (getPushPermission as any).mockReturnValue('denied');
    render(<PushNotificationToggle />);

    expect(await screen.findByText('Notifications blocked in browser. Enable permission manually from site settings.')).toBeInTheDocument();
  });
});
