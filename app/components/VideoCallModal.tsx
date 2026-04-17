'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE } from '../lib/api';

/** Derive WebSocket base from the REST API base URL. */
function getWsBase(): string {
  const base = API_BASE.replace(/\/api\/?$/, '');
  return base.replace(/^https/, 'wss').replace(/^http/, 'ws');
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

type CallState = 'connecting' | 'waiting' | 'calling' | 'in-call' | 'ended' | 'error';

interface VideoCallModalProps {
  turnoId: string;
  profesionalNombre: string;
  fechaHora: string;
  onClose: () => void;
}

export default function VideoCallModal({ turnoId, profesionalNombre, fechaHora, onClose }: VideoCallModalProps) {
  const [state, setState]           = useState<CallState>('connecting');
  const [errorMsg, setErrorMsg]     = useState('');
  const [micOn, setMicOn]           = useState(true);
  const [cameraOn, setCameraOn]     = useState(true);
  const [hasRemote, setHasRemote]   = useState(false);
  const [duration, setDuration]     = useState(0); // seconds in call

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef          = useRef<WebSocket | null>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  // Queue ICE candidates received before remote description is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  const fecha = new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    wsRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
  }, []);

  const createPC = useCallback((stream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate.toJSON() }));
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setHasRemote(true);
      setState('in-call');
      // Start call timer
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setState('ended');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Get ticket from backend
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/turnos/${turnoId}/video-token`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message ?? 'Error al obtener acceso');
        if (cancelled) return;
        const { ticket } = data.data as { ticket: string; roomId: string };

        // 2. Request camera + microphone
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch {
          throw new Error('No se pudo acceder a la cámara o el micrófono. Verificá los permisos del navegador.');
        }
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
            setErrorMsg('Error al conectar con el servidor de videollamada.');
            setState('error');
          }
        };

        ws.onclose = (e) => {
          if (!cancelled && e.code !== 1000) {
            setState(s => (s === 'in-call' ? 'ended' : s === 'error' ? 'error' : 'ended'));
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
              setState('ended');
              if (timerRef.current) clearInterval(timerRef.current);
              break;

            case 'error':
              setErrorMsg(String(msg.message ?? 'Error desconocido'));
              setState('error');
              break;
          }
        };

      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar la videollamada');
          setState('error');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [turnoId, createPC, cleanup]);

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
    connecting: 'Iniciando...',
    waiting:    'Esperando al otro participante…',
    calling:    'Estableciendo conexión…',
    'in-call':  `En consulta · ${formatDuration(duration)}`,
    ended:      'Llamada finalizada',
    error:      'Error de conexión',
  }[state];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            state === 'in-call' ? 'bg-emerald-400 animate-pulse' :
            state === 'error'   ? 'bg-red-400' :
            state === 'ended'   ? 'bg-slate-500' : 'bg-amber-400 animate-pulse'
          }`} />
          <span className="text-white font-medium text-sm truncate">
            {state === 'in-call' || state === 'calling' || state === 'waiting'
              ? `Videoconsulta · Dr/a. ${profesionalNombre}`
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
          title="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Video area ── */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">

        {/* Remote video — full area */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${hasRemote ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Overlay states */}
        {!hasRemote && (state === 'connecting' || state === 'waiting' || state === 'calling') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="w-24 h-24 rounded-full bg-slate-700/80 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-200 font-medium mb-1">{statusLabel}</p>
              {state === 'waiting' && (
                <p className="text-slate-400 text-sm">Compartí el link o avisale al otro participante que ingrese</p>
              )}
            </div>
            {(state === 'connecting' || state === 'calling') && (
              <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
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
            <p className="text-slate-200 font-medium">Llamada finalizada</p>
            {duration > 0 && (
              <p className="text-slate-400 text-sm">Duración: {formatDuration(duration)}</p>
            )}
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
            >
              Cerrar
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
              <p className="text-white font-semibold mb-2">No se pudo conectar</p>
              <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors"
            >
              Cerrar
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

      {/* ── Controls ── */}
      {(state === 'in-call' || state === 'waiting' || state === 'calling' || state === 'connecting') && (
        <div className="flex-shrink-0 flex items-center justify-center gap-5 py-4 px-4 bg-slate-800/90 backdrop-blur border-t border-slate-700">
          {/* Mic */}
          <button
            onClick={toggleMic}
            title={micOn ? 'Silenciar micrófono' : 'Activar micrófono'}
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
            title="Colgar"
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg scale-100 hover:scale-105 active:scale-95"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5 6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25" />
            </svg>
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            title={cameraOn ? 'Apagar cámara' : 'Activar cámara'}
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
    </div>
  );
}
