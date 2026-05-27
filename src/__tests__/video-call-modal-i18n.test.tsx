import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VideoCallModal from '../../app/components/VideoCallModal';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

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
      getVideoToken: vi.fn(),
    },
  },
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
}

class MockRTCPeerConnection {
  onicecandidate: ((event: { candidate: null }) => void) | null = null;
  ontrack: ((event: { streams: unknown[] }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState = 'connected';
  localDescription = {};
  remoteDescription = {};
  addTrack = vi.fn();
  addIceCandidate = vi.fn();
  close = vi.fn();
  createOffer = vi.fn(async () => ({}));
  createAnswer = vi.fn(async () => ({}));
  setLocalDescription = vi.fn(async () => undefined);
  setRemoteDescription = vi.fn(async () => undefined);
}

const audioTrack = { enabled: true, stop: vi.fn() };
const videoTrack = { enabled: true, stop: vi.fn() };
const stream = {
  getTracks: () => [audioTrack, videoTrack],
  getAudioTracks: () => [audioTrack],
  getVideoTracks: () => [videoTrack],
};

const renderModal = () => render(
  <VideoCallModal
    turnoId="turno-1"
    profesionalNombre="Ana Garcia"
    fechaHora="2026-06-01T13:00:00.000Z"
    onClose={vi.fn()}
  />
);

describe('VideoCallModal i18n', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    audioTrack.enabled = true;
    videoTrack.enabled = true;
    audioTrack.stop.mockClear();
    videoTrack.stop.mockClear();
    (api.turnos.getVideoToken as any).mockResolvedValue({ ticket: 'ticket-1' });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
    vi.stubGlobal('RTCSessionDescription', vi.fn((value) => value));
    vi.stubGlobal('RTCIceCandidate', vi.fn((value) => value));
  });

  it('renders connecting and waiting copy in English', async () => {
    renderModal();

    expect(screen.getAllByText('Starting...').length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onopen?.();
    });

    expect(await screen.findByText('Waiting for the other participant...')).toBeInTheDocument();
    expect(screen.getByText('Share the link or let the other participant know to join')).toBeInTheDocument();
    expect(screen.getByText('Video call · Dr/a. Ana Garcia')).toBeInTheDocument();
  });

  it('shows translated media permission fallback error', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(new Error('denied'));

    renderModal();

    expect(await screen.findByText('Could not connect')).toBeInTheDocument();
    expect(screen.getByText('Could not access the camera or microphone. Check your browser permissions.')).toBeInTheDocument();
  });

  it('shows translated signaling fallback error', async () => {
    renderModal();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onerror?.();
    });

    expect(await screen.findByText('Could not connect')).toBeInTheDocument();
    expect(screen.getByText('Error connecting to the video call server.')).toBeInTheDocument();
  });

  it('renders and toggles media control titles in English', async () => {
    renderModal();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onopen?.();
    });

    const micButton = await screen.findByTitle('Mute microphone');
    const cameraButton = screen.getByTitle('Turn camera off');
    expect(screen.getByTitle('Hang up')).toBeInTheDocument();

    fireEvent.click(micButton);
    expect(audioTrack.enabled).toBe(false);
    expect(screen.getByTitle('Unmute microphone')).toBeInTheDocument();

    fireEvent.click(cameraButton);
    expect(videoTrack.enabled).toBe(false);
    expect(screen.getByTitle('Turn camera on')).toBeInTheDocument();
  });

  it('shows translated ended state and close action', async () => {
    renderModal();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onopen?.();
    });

    fireEvent.click(await screen.findByTitle('Hang up'));

    await waitFor(() => {
      expect(screen.getAllByText('Call ended').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThanOrEqual(1);
  });
});
