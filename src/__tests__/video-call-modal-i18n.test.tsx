import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import VideoCallModal from '../../app/components/VideoCallModal';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

// Render with English copy so we also assert the i18n wiring.
vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  API_BASE: 'https://api.test/api',
  api: {
    turnos: {
      getVideoToken: vi.fn(async () => ({ token: 'tkn', url: 'wss://livekit.example', roomName: 't1' })),
    },
    chat: {
      getMensajes: vi.fn(async () => []),
      enviar: vi.fn(async () => ({ id: 'm1', remitenteId: 'me', contenido: 'hello', createdAt: new Date().toISOString() })),
    },
    archivos: {
      getByTurno: vi.fn(async () => []),
      subir: vi.fn(async () => ({ id: 'a1', nombreOriginal: 'study.pdf', url: '/uploads/a1.pdf', mimeType: 'application/pdf', createdAt: new Date().toISOString() })),
    },
  },
}));

// Minimal in-memory LiveKit Room that "connects" instantly.
vi.mock('livekit-client', () => {
  class FakeRoom {
    state = 'disconnected';
    localParticipant = {
      identity: 'me',
      setCameraEnabled: vi.fn(async () => ({ videoTrack: { attach: vi.fn() } })),
      setMicrophoneEnabled: vi.fn(async () => undefined),
      publishData: vi.fn(),
    };
    on() { return this; }
    async connect() { this.state = 'connected'; }
    disconnect() {}
  }
  return {
    Room: FakeRoom,
    RoomEvent: new Proxy({}, { get: (_t, p) => p }),
    ConnectionState: { Connected: 'connected' },
    Track: { Kind: { Video: 'video', Audio: 'audio' }, Source: { Camera: 'camera', Microphone: 'microphone' } },
  };
});

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
});

beforeEach(() => {
  vi.clearAllMocks();
});

function renderModal() {
  return render(
    <VideoCallModal
      turnoId="t1"
      participantName="Dr. House"
      participantRoleLabel="Dr."
      fechaHora={new Date().toISOString()}
      onClose={() => {}}
    />,
  );
}

describe('VideoCallModal (LiveKit)', () => {
  it('mints a LiveKit token for the turno and shows the localized call header', async () => {
    renderModal();
    await waitFor(() => expect(api.turnos.getVideoToken).toHaveBeenCalledWith('t1'));
    expect(await screen.findByText(/Video call/)).toBeInTheDocument();
  });

  it('renders localized mic and camera control titles once connected', async () => {
    renderModal();
    expect(await screen.findByTitle('Mute microphone')).toBeInTheDocument();
    expect(screen.getByTitle('Turn camera off')).toBeInTheDocument();
  });

  it('opens the in-call chat and persists a sent message via the chat API', async () => {
    renderModal();
    await waitFor(() => expect(api.turnos.getVideoToken).toHaveBeenCalled());

    fireEvent.click(await screen.findByTitle('Chat'));

    const input = await screen.findByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(api.chat.enviar).toHaveBeenCalledWith('t1', 'hello'));
  });
});
