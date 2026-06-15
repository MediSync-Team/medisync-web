import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
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
  static instances: MockRTCPeerConnection[] = [];
  onicecandidate: ((event: { candidate: null }) => void) | null = null;
  ontrack: ((event: { streams: unknown[] }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  onicecandidateerror: ((event: { url?: string; errorCode: number; errorText?: string }) => void) | null = null;
  connectionState = 'connected';
  iceConnectionState = 'new';
  iceGatheringState = 'new';
  signalingState = 'stable';
  localDescription = {};
  remoteDescription = {};
  addTrack = vi.fn();
  addIceCandidate = vi.fn();
  close = vi.fn();
  createOffer = vi.fn(async () => ({}));
  createAnswer = vi.fn(async () => ({}));
  setLocalDescription = vi.fn(async () => undefined);
  setRemoteDescription = vi.fn(async () => undefined);
  getStats = vi.fn(async () => new Map([
    ['transport-1', { id: 'transport-1', type: 'transport', selectedCandidatePairId: 'pair-1' }],
    ['pair-1', { id: 'pair-1', type: 'candidate-pair', localCandidateId: 'local-1', remoteCandidateId: 'remote-1', state: 'succeeded', nominated: true }],
    ['local-1', { id: 'local-1', type: 'local-candidate', candidateType: 'relay', protocol: 'udp' }],
    ['remote-1', { id: 'remote-1', type: 'remote-candidate', candidateType: 'srflx', protocol: 'udp' }],
  ]));
  config: RTCConfiguration;

  constructor(config: RTCConfiguration) {
    this.config = config;
    MockRTCPeerConnection.instances.push(this);
  }
}

const audioTrack = { enabled: true, stop: vi.fn() };
const videoTrack = { enabled: true, stop: vi.fn() };
const audioOnlyTrack = { enabled: true, stop: vi.fn() };
const stream = {
  getTracks: () => [audioTrack, videoTrack],
  getAudioTracks: () => [audioTrack],
  getVideoTracks: () => [videoTrack],
};
const audioOnlyStream = {
  getTracks: () => [audioOnlyTrack],
  getAudioTracks: () => [audioOnlyTrack],
  getVideoTracks: () => [],
};

const renderModal = (props?: Partial<ComponentProps<typeof VideoCallModal>>) => render(
  <VideoCallModal
    turnoId="turno-1"
    participantName="Ana Garcia"
    participantRoleLabel="Dr/a."
    fechaHora="2026-06-01T13:00:00.000Z"
    onClose={vi.fn()}
    {...props}
  />
);

const expectDocumentText = (text: string) => {
  expect(document.body.textContent).toContain(text);
};

const expectDocumentTextNot = (text: string) => {
  expect(document.body.textContent).not.toContain(text);
};

describe('VideoCallModal i18n', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    const storage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
        removeItem: vi.fn((key: string) => storage.delete(key)),
      },
    });
    MockWebSocket.instances = [];
    MockRTCPeerConnection.instances = [];
    audioTrack.enabled = true;
    videoTrack.enabled = true;
    audioOnlyTrack.enabled = true;
    audioTrack.stop.mockClear();
    videoTrack.stop.mockClear();
    audioOnlyTrack.stop.mockClear();
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
    window.localStorage.removeItem('videoDebug');
    window.localStorage.removeItem('videoRelay');
    window.history.replaceState({}, '', '/');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  async function connectAndCreatePeerConnection() {
    renderModal();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onopen?.();
    });
    await act(async () => {
      MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'start-call' }) });
    });

    expect(MockRTCPeerConnection.instances.length).toBe(1);
    return MockRTCPeerConnection.instances[0];
  }

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
    (navigator.mediaDevices.getUserMedia as any)
      .mockRejectedValueOnce(new Error('no camera'))
      .mockRejectedValueOnce(new Error('denied'));

    renderModal();

    expect(await screen.findByText('Could not connect')).toBeInTheDocument();
    expect(screen.getByText('Could not access the camera or microphone. Check your browser permissions.')).toBeInTheDocument();
  });

  it('falls back to audio-only when camera access fails', async () => {
    (navigator.mediaDevices.getUserMedia as any)
      .mockRejectedValueOnce(new Error('no camera'))
      .mockResolvedValueOnce(audioOnlyStream);

    renderModal();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onopen?.();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenNthCalledWith(1, { video: true, audio: true });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenNthCalledWith(2, { audio: true, video: false });
    expect(await screen.findByText('Waiting for the other participant...')).toBeInTheDocument();
    expect(screen.getByTitle('Mute microphone')).toBeInTheDocument();
    expect(screen.getByTitle('Turn camera on')).toBeInTheDocument();
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

  it('renders a neutral participant label when supplied by the call site', async () => {
    renderModal({ participantRoleLabel: 'Patient', participantName: 'Juan Perez' });

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    act(() => {
      MockWebSocket.instances[0].onopen?.();
    });

    expect(await screen.findByText('Video call · Patient Juan Perez')).toBeInTheDocument();
    expect(screen.queryByText('Video call · Dr/a. Juan Perez')).not.toBeInTheDocument();
  });

  it('starts only one timer and stops it after hanging up', async () => {
    const pc = await connectAndCreatePeerConnection();

    vi.useFakeTimers();
    try {
      act(() => {
        pc.ontrack?.({ streams: [{}] });
        pc.ontrack?.({ streams: [{}] });
      });
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expectDocumentText('00:03');
      expectDocumentTextNot('00:06');

      fireEvent.click(screen.getByTitle('Hang up'));
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expectDocumentText('00:03');
      expectDocumentTextNot('00:05');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows reconnecting on disconnected and fails after timeout', async () => {
    const pc = await connectAndCreatePeerConnection();

    vi.useFakeTimers();
    try {
      act(() => {
        pc.connectionState = 'disconnected';
        pc.onconnectionstatechange?.();
      });

      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
      expect(screen.queryByText('Call ended')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(25_000);
      });

      expect(screen.getByText('Could not connect')).toBeInTheDocument();
      expect(screen.getByText('Could not restore the audio/video connection. Try changing networks or rejoining the call.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a connection error immediately when peer connection fails', async () => {
    const pc = await connectAndCreatePeerConnection();

    act(() => {
      pc.connectionState = 'failed';
      pc.onconnectionstatechange?.();
    });

    expect(screen.getByText('Could not connect')).toBeInTheDocument();
    expect(screen.getByText('Could not restore the audio/video connection. Try changing networks or rejoining the call.')).toBeInTheDocument();
  });

  it('still treats peer-left as a normal ended call', async () => {
    renderModal();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });
    await act(async () => {
      MockWebSocket.instances[0].onopen?.();
      MockWebSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: 'peer-left' }) });
    });

    expect(screen.getAllByText('Call ended')).not.toHaveLength(0);
    expect(screen.queryByText('Could not connect')).not.toBeInTheDocument();
  });

  it('enables relay-only peer connections and sanitized diagnostics in debug mode', async () => {
    window.localStorage.setItem('videoDebug', '1');
    window.localStorage.setItem('videoRelay', '1');
    (api.turnos.getVideoToken as any).mockResolvedValue({
      ticket: 'ticket-1',
      iceServers: [
        { urls: 'stun:stun.example.com:19302' },
        { urls: ['turn:secret.example.com:3478', 'turns:secret.example.com:5349?transport=tcp'], username: 'secret-user', credential: 'secret-pass' },
      ],
    });

    const pc = await connectAndCreatePeerConnection();

    expect(pc.config.iceTransportPolicy).toBe('relay');
    expect(await screen.findByText('Video diagnostics')).toBeInTheDocument();
    expectDocumentText('forced');
    expectDocumentText('servers=2 stun=1 turn=1 turns=1 other=0');

    act(() => {
      pc.onicecandidateerror?.({ url: 'turn:secret.example.com:3478', errorCode: 701, errorText: 'timeout' });
    });

    expectDocumentText('code=701');
    expectDocumentTextNot('secret-user');
    expectDocumentTextNot('secret-pass');
  });
});
