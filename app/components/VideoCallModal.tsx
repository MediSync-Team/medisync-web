'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE, api } from '../lib/api';
import { formatClinicInstantDateTime, getLocale } from '../lib/date';
import { useLang } from '../lib/i18n/context';
import Spinner from './Spinner';

/** Derive WebSocket base from the REST API base URL. */
function getWsBase(): string {
  const base = API_BASE.replace(/\/api\/?$/, '');
  return base.replace(/^https/, 'wss').replace(/^http/, 'ws');
}

/** Fallback ICE servers (STUN-only) when the backend doesn't supply any. */
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const RECONNECT_TIMEOUT_MS = 25_000;

type CallState = 'connecting' | 'waiting' | 'calling' | 'in-call' | 'reconnecting' | 'ended' | 'error';

type VideoDiagnostics = {
  enabled: boolean;
  relayOnly: boolean;
  iceServers: string;
  connectionState: string;
  iceConnectionState: string;
  iceGatheringState: string;
  signalingState: string;
  selectedCandidatePair: string;
  candidateErrors: string[];
};

const emptyDiagnostics: VideoDiagnostics = {
  enabled: false,
  relayOnly: false,
  iceServers: 'unknown',
  connectionState: 'new',
  iceConnectionState: 'new',
  iceGatheringState: 'new',
  signalingState: 'stable',
  selectedCandidatePair: 'unknown',
  candidateErrors: [],
};

function readVideoFlag(name: 'videoDebug' | 'videoRelay') {
  if (typeof window === 'undefined') return false;
  const fromQuery = new URLSearchParams(window.location.search).get(name);
  return fromQuery === '1' || window.localStorage.getItem(name) === '1';
}

function summarizeIceServers(servers: RTCIceServer[]) {
  const counts = { stun: 0, turn: 0, turns: 0, other: 0 };
  for (const server of servers) {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    for (const url of urls) {
      const scheme = String(url).split(':')[0] as keyof typeof counts;
      if (scheme in counts) counts[scheme] += 1;
      else counts.other += 1;
    }
  }
  return `servers=${servers.length} stun=${counts.stun} turn=${counts.turn} turns=${counts.turns} other=${counts.other}`;
}

async function getSelectedCandidatePairSummary(pc: RTCPeerConnection) {
  if (typeof pc.getStats !== 'function') return 'stats unavailable';

  try {
    const stats = await pc.getStats();
    let selectedPair: RTCStats | undefined;

    stats.forEach((report: any) => {
      if (report.type === 'transport' && report.selectedCandidatePairId) {
        selectedPair = stats.get(report.selectedCandidatePairId);
      }
      if (
        report.type === 'candidate-pair' &&
        (report.selected || (report.nominated && report.state === 'succeeded'))
      ) {
        selectedPair = report;
      }
    });

    if (!selectedPair) return 'none';

    const pair = selectedPair as any;
    const local = pair.localCandidateId ? (stats.get(pair.localCandidateId) as any) : undefined;
    const remote = pair.remoteCandidateId ? (stats.get(pair.remoteCandidateId) as any) : undefined;
    const localType = local?.candidateType ?? 'unknown';
    const remoteType = remote?.candidateType ?? 'unknown';
    const protocol = local?.protocol ?? pair.protocol ?? 'unknown';
    const state = pair.state ?? 'unknown';
    return `local=${localType} remote=${remoteType} protocol=${protocol} state=${state}`;
  } catch (err) {
    return err instanceof Error ? `stats error: ${err.message}` : 'stats error';
  }
}

interface VideoCallModalProps {
  turnoId: string;
  participantName: string;
  participantRoleLabel: string;
  fechaHora: string;
  onClose: () => void;
}

export default function VideoCallModal({ turnoId, participantName, participantRoleLabel, fechaHora, onClose }: VideoCallModalProps) {
  const { t, lang } = useLang();
  const vc = t('videoCall');
  const dateLocale = getLocale(lang);
  const [state, setState]           = useState<CallState>('connecting');
  const [errorMsg, setErrorMsg]     = useState('');
  const [micOn, setMicOn]           = useState(true);
  const [cameraOn, setCameraOn]     = useState(true);
  const [hasRemote, setHasRemote]   = useState(false);
  const [duration, setDuration]     = useState(0); // seconds in call
  const [diagnostics, setDiagnostics] = useState<VideoDiagnostics>(() => ({
    ...emptyDiagnostics,
    enabled: readVideoFlag('videoDebug'),
    relayOnly: readVideoFlag('videoRelay'),
  }));

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef          = useRef<WebSocket | null>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRemoteRef = useRef(false);
  const closingRef = useRef(false);
  // Queue ICE candidates received before remote description is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  // ICE servers (STUN + TURN) supplied by the backend video-token endpoint
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS);

  const fecha = formatClinicInstantDateTime(fechaHora, dateLocale, { dateStyle: 'short', timeStyle: 'short' });

  const logVideoInfo = useCallback((event: string, data?: Record<string, unknown>) => {
    console.info('[video-call]', event, data ?? {});
  }, []);

  const logVideoError = useCallback((event: string, data?: Record<string, unknown>) => {
    console.error('[video-call]', event, data ?? {});
  }, []);

  const stopCallTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCallTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const stopReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const failMediaConnection = useCallback((message: string) => {
    stopReconnectTimeout();
    stopCallTimer();
    setErrorMsg(message);
    setState('error');
  }, [stopCallTimer, stopReconnectTimeout]);

  const startReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) return;
    reconnectTimeoutRef.current = setTimeout(() => {
      logVideoError('reconnect-timeout');
      failMediaConnection(vc.reconnectFailed);
    }, RECONNECT_TIMEOUT_MS);
  }, [failMediaConnection, logVideoError, vc.reconnectFailed]);

  const refreshDiagnostics = useCallback(async (pc: RTCPeerConnection, event: string) => {
    const selectedCandidatePair = await getSelectedCandidatePairSummary(pc);
    const snapshot = {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      signalingState: pc.signalingState,
      selectedCandidatePair,
    };
    setDiagnostics(current => ({ ...current, ...snapshot }));
    logVideoInfo(event, snapshot);
  }, [logVideoInfo]);

  const cleanup = useCallback(() => {
    closingRef.current = true;
    stopCallTimer();
    stopReconnectTimeout();
    wsRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
  }, [stopCallTimer, stopReconnectTimeout]);

  const acquireMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraOn(Boolean(stream.getVideoTracks()[0]?.enabled ?? true));
      setMicOn(Boolean(stream.getAudioTracks()[0]?.enabled ?? true));
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setCameraOn(false);
        setMicOn(Boolean(stream.getAudioTracks()[0]?.enabled ?? true));
        return stream;
      } catch {
        throw new Error(vc.mediaPermissionError);
      }
    }
  }, [vc.mediaPermissionError]);

  const createPC = useCallback((stream: MediaStream): RTCPeerConnection => {
    closingRef.current = false;
    const config: RTCConfiguration = {
      iceServers: iceServersRef.current,
      ...(diagnostics.relayOnly ? { iceTransportPolicy: 'relay' as RTCIceTransportPolicy } : {}),
    };
    const pc = new RTCPeerConnection(config);
    logVideoInfo('peer-connection-created', {
      iceServers: summarizeIceServers(iceServersRef.current),
      relayOnly: diagnostics.relayOnly,
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate.toJSON() }));
      }
    };

    pc.onicecandidateerror = (e) => {
      const message = `url=${e.url || 'unknown'} code=${e.errorCode} text=${e.errorText || 'unknown'}`;
      setDiagnostics(current => ({
        ...current,
        candidateErrors: [...current.candidateErrors, message].slice(-5),
      }));
      logVideoError('ice-candidate-error', {
        url: e.url,
        errorCode: e.errorCode,
        errorText: e.errorText,
      });
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      hasRemoteRef.current = true;
      stopReconnectTimeout();
      setHasRemote(true);
      setState('in-call');
      startCallTimer();
      void refreshDiagnostics(pc, 'remote-track');
    };

    pc.onconnectionstatechange = () => {
      void refreshDiagnostics(pc, 'connection-state-change');
      if (closingRef.current) return;

      if (pc.connectionState === 'connected') {
        stopReconnectTimeout();
        if (hasRemoteRef.current) setState('in-call');
        return;
      }

      if (pc.connectionState === 'disconnected') {
        setState('reconnecting');
        startReconnectTimeout();
        return;
      }

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        logVideoError('connection-failed', { connectionState: pc.connectionState });
        failMediaConnection(vc.reconnectFailed);
      }
    };

    pc.oniceconnectionstatechange = () => {
      void refreshDiagnostics(pc, 'ice-connection-state-change');
    };

    pc.onicegatheringstatechange = () => {
      void refreshDiagnostics(pc, 'ice-gathering-state-change');
    };

    pcRef.current = pc;
    return pc;
  }, [
    diagnostics.relayOnly,
    failMediaConnection,
    logVideoError,
    logVideoInfo,
    refreshDiagnostics,
    startCallTimer,
    startReconnectTimeout,
    stopReconnectTimeout,
    vc.reconnectFailed,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Get ticket from backend
        const data = await api.turnos.getVideoToken(turnoId);
        if (cancelled) return;
        const { ticket } = data;
        if (data.iceServers && data.iceServers.length > 0) {
          iceServersRef.current = data.iceServers;
        }
        const iceSummary = summarizeIceServers(iceServersRef.current);
        setDiagnostics(current => ({ ...current, iceServers: iceSummary }));
        logVideoInfo('ice-servers-received', {
          iceServers: iceSummary,
          relayOnly: diagnostics.relayOnly,
        });

        // 2. Request camera + microphone, falling back to microphone-only
        const stream = await acquireMediaStream();
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Connect to WebSocket signaling server
        const ws = new WebSocket(`${getWsBase()}/ws/video?ticket=${ticket}`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!cancelled) setState('waiting');
        };

        ws.onerror = () => {
          if (!cancelled) {
            logVideoError('websocket-error');
            failMediaConnection(vc.signalingError);
          }
        };

        ws.onclose = (e) => {
          if (!cancelled && !closingRef.current && e.code !== 1000) {
            logVideoError('websocket-closed', { code: e.code });
            failMediaConnection(vc.signalingError);
          }
        };

        ws.onmessage = async (event) => {
          if (cancelled) return;
          let msg: { type: string; [k: string]: unknown };
          try {
            msg = JSON.parse(event.data as string);
          } catch {
            return;
          }

          switch (msg.type) {
            case 'waiting':
              setState('waiting');
              break;

            case 'peer-joined':
              // We were first in the room; the other peer just joined and will initiate.
              setState('calling');
              break;

            case 'start-call': {
              // We are the second to join → create the offer
              setState('calling');
              const pc = createPC(stream);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription }));
              break;
            }

            case 'offer': {
              // We receive the offer (we were waiting) → answer
              setState('calling');
              const pc = createPC(stream);
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit));
              // Flush queued ICE candidates
              for (const c of iceCandidateQueue.current) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
              }
              iceCandidateQueue.current = [];
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription }));
              break;
            }

            case 'answer': {
              const pc = pcRef.current;
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit));
                // Flush queued ICE candidates
                for (const c of iceCandidateQueue.current) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
                }
                iceCandidateQueue.current = [];
              }
              break;
            }

            case 'ice-candidate': {
              const pc = pcRef.current;
              const candidate = msg.candidate as RTCIceCandidateInit;
              if (pc && pc.remoteDescription) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
              } else {
                // Queue until remote description is set
                iceCandidateQueue.current.push(candidate);
              }
              break;
            }

            case 'peer-left':
              stopReconnectTimeout();
              setState('ended');
              stopCallTimer();
              break;

            case 'error':
              stopReconnectTimeout();
              setErrorMsg(String(msg.message ?? vc.unknownError));
              failMediaConnection(String(msg.message ?? vc.unknownError));
              break;
          }
        };

      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : vc.startError);
          setState('error');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [
    turnoId,
    createPC,
    cleanup,
    acquireMediaStream,
    diagnostics.relayOnly,
    failMediaConnection,
    logVideoError,
    logVideoInfo,
    stopCallTimer,
    stopReconnectTimeout,
    vc.signalingError,
    vc.startError,
    vc.unknownError,
  ]);

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCameraOn(track.enabled); }
  };

  const hangUp = useCallback(() => {
    cleanup();
    setState('ended');
  }, [cleanup]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const statusLabel = {
    connecting: vc.starting,
    waiting:    vc.waiting,
    calling:    vc.calling,
    'in-call':  `${vc.inConsultation} · ${formatDuration(duration)}`,
    reconnecting: vc.reconnecting,
    ended:      vc.ended,
    error:      vc.connectionError,
  }[state];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">

      {/* -- Header -- */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            state === 'in-call' ? 'bg-emerald-400 animate-pulse' :
            state === 'error'   ? 'bg-red-400' :
            state === 'reconnecting' ? 'bg-orange-400 animate-pulse' :
            state === 'ended'   ? 'bg-slate-500' : 'bg-amber-400 animate-pulse'
          }`} />
          <span className="text-white font-medium text-sm truncate">
            {state === 'in-call' || state === 'calling' || state === 'waiting' || state === 'reconnecting'
              ? `${vc.title} · ${participantRoleLabel} ${participantName}`
              : statusLabel}
          </span>
          {state === 'in-call' && (
            <span className="text-emerald-400 text-xs font-mono shrink-0">{formatDuration(duration)}</span>
          )}
          <span className="text-slate-500 text-xs hidden sm:inline shrink-0">{fecha}</span>
        </div>
        <button
          onClick={state === 'ended' || state === 'error' ? onClose : hangUp}
          className="ml-3 shrink-0 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          title={vc.close}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* -- Video area -- */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">

        {/* Remote video — full area */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${hasRemote ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Overlay states */}
        {!hasRemote && (state === 'connecting' || state === 'waiting' || state === 'calling' || state === 'reconnecting') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="w-24 h-24 rounded-full bg-slate-700/80 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-200 font-medium mb-1">{statusLabel}</p>
              {state === 'waiting' && (
                <p className="text-slate-400 text-sm">{vc.waitingInstructions}</p>
              )}
            </div>
            {(state === 'connecting' || state === 'calling' || state === 'reconnecting') && (
              <Spinner size={20} className="text-slate-400" />
            )}
          </div>
        )}

        {state === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-700/80 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <p className="text-slate-200 font-medium">{vc.ended}</p>
            {duration > 0 && (
              <p className="text-slate-400 text-sm">{vc.duration}: {formatDuration(duration)}</p>
            )}
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
            >
              {vc.close}
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">{vc.errorTitle}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
            >
              {vc.close}
            </button>
          </div>
        )}

        {/* Local video — picture-in-picture */}
        <div className={`absolute bottom-20 right-4 transition-all duration-300 ${
          state === 'in-call' ? 'w-36 sm:w-44' : 'w-28 sm:w-36'
        } aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-600/50 bg-slate-800`}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.531l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          )}
          {!micOn && (
            <div className="absolute top-1.5 left-1.5 bg-red-600/90 rounded-full p-1">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* -- Controls -- */}
      {(state === 'in-call' || state === 'waiting' || state === 'calling' || state === 'connecting' || state === 'reconnecting') && (
        <div className="flex-shrink-0 flex items-center justify-center gap-5 py-4 px-4 bg-slate-800/90 backdrop-blur border-t border-slate-700">
          {/* Mic */}
          <button
            onClick={toggleMic}
            title={micOn ? vc.muteMic : vc.unmuteMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {micOn ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25" />
              </svg>
            )}
          </button>

          {/* Hang up */}
          <button
            onClick={hangUp}
            title={vc.hangUp}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg scale-100 hover:scale-105 active:scale-95"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5 6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25" />
            </svg>
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            title={cameraOn ? vc.turnCameraOff : vc.turnCameraOn}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              cameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {cameraOn ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.531l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.531l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25h9M3 3l18 18" />
              </svg>
            )}
          </button>
        </div>
      )}

      {diagnostics.enabled && (
        <div className="fixed left-3 bottom-3 z-[60] max-w-sm rounded-xl border border-slate-600 bg-slate-950/95 p-3 text-[11px] text-slate-200 shadow-2xl">
          <p className="mb-1 font-semibold text-slate-100">Video diagnostics</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            <dt className="text-slate-400">relay</dt>
            <dd>{diagnostics.relayOnly ? 'forced' : 'auto'}</dd>
            <dt className="text-slate-400">ice</dt>
            <dd>{diagnostics.iceServers}</dd>
            <dt className="text-slate-400">pc</dt>
            <dd>{diagnostics.connectionState}</dd>
            <dt className="text-slate-400">ice conn</dt>
            <dd>{diagnostics.iceConnectionState}</dd>
            <dt className="text-slate-400">gathering</dt>
            <dd>{diagnostics.iceGatheringState}</dd>
            <dt className="text-slate-400">signaling</dt>
            <dd>{diagnostics.signalingState}</dd>
            <dt className="text-slate-400">pair</dt>
            <dd>{diagnostics.selectedCandidatePair}</dd>
          </dl>
          {diagnostics.candidateErrors.length > 0 && (
            <div className="mt-2 border-t border-slate-700 pt-2">
              <p className="font-semibold text-red-300">ICE candidate errors</p>
              <ul className="mt-1 space-y-1 text-red-200">
                {diagnostics.candidateErrors.map((err, idx) => <li key={`${err}-${idx}`}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
