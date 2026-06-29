'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type RemoteTrack,
  type RemoteParticipant,
  type LocalTrackPublication,
} from 'livekit-client';
import { API_BASE, api } from '../lib/api';
import { formatClinicInstantDateTime, formatClinicInstantTime, getLocale } from '../lib/date';
import { useLang } from '../lib/i18n/context';
import Spinner from './Spinner';
import { PaperclipIcon, ChatIcon, SendIcon } from './icons';

type CallState = 'connecting' | 'waiting' | 'in-call' | 'reconnecting' | 'ended' | 'error';

/** Origin of the API (drops the trailing /api) so we can resolve /uploads/... file URLs. */
function apiOrigin(): string {
  return API_BASE.replace(/\/api\/?$/, '');
}

function resolveUploadUrl(url?: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  return `${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** A unified chat row: either a text message (ChatMensaje) or a shared file (Archivo). */
type ChatItem =
  | { kind: 'text'; id: string; senderId: string; text: string; at: string }
  | { kind: 'file'; id: string; senderId?: string; name: string; url: string; mime?: string; at: string };

/** Payload broadcast over the LiveKit data channel (topic 'chat') for instant delivery. */
type ChatWire =
  | { kind: 'text'; id: string; senderId: string; text: string; at: string }
  | { kind: 'file'; id: string; senderId: string; name: string; url: string; mime?: string; at: string };

const CHAT_TOPIC = 'chat';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

  const [state, setState]       = useState<CallState>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [micOn, setMicOn]       = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [hasRemote, setHasRemote] = useState(false);
  const [duration, setDuration] = useState(0); // seconds in call

  // Chat panel
  const [chatOpen, setChatOpen]   = useState(false);
  const [items, setItems]         = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending]     = useState(false);
  const [chatError, setChatError] = useState('');
  const [myUserId, setMyUserId]   = useState('');
  const [unread, setUnread]       = useState(0);

  const roomRef        = useRef<Room | null>(null);
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const chatBottomRef  = useRef<HTMLDivElement>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingRef     = useRef(false);
  const hasRemoteRef   = useRef(false);
  const seenIdsRef     = useRef<Set<string>>(new Set());
  const chatOpenRef    = useRef(false);
  const connectPromiseRef  = useRef<Promise<void> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fecha = formatClinicInstantDateTime(fechaHora, dateLocale, { dateStyle: 'short', timeStyle: 'short' });

  const startCallTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  /** Append an item unless we've already shown it (dedupes echoes / history overlap). */
  const addItem = useCallback((item: ChatItem) => {
    if (seenIdsRef.current.has(item.id)) return;
    seenIdsRef.current.add(item.id);
    setItems(prev => [...prev, item].sort((a, b) => a.at.localeCompare(b.at)));
  }, []);

  // ── Connect to the LiveKit room ────────────────────────────────────────────
  // StrictMode-safe: connect exactly once and defer teardown one tick, so the
  // dev mount→unmount→mount cycle can't disconnect a still-connecting room
  // (which dropped the call with "cannot send signal request before connected"
  // and let a second join kick the real one).
  useEffect(() => {
    // Cancel a teardown scheduled by a StrictMode fake-unmount; keep the room.
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }

    if (!roomRef.current) {
      closingRef.current = false;
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      // Show the call as soon as the other participant is present — even if they
      // have no camera (audio-only) and never publish a video track.
      const markInCall = () => {
        setState(prev => (prev === 'ended' || prev === 'error' ? prev : 'in-call'));
        startCallTimer();
      };

      room
        .on(RoomEvent.ParticipantConnected, markInCall)
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
            hasRemoteRef.current = true;
            setHasRemote(true);
          } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
            track.attach(remoteAudioRef.current);
          }
          markInCall();
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
        })
        .on(RoomEvent.ParticipantDisconnected, () => {
          // The other party left → end the call.
          hasRemoteRef.current = false;
          setHasRemote(false);
          stopCallTimer();
          setState('ended');
        })
        .on(RoomEvent.Reconnecting, () => setState('reconnecting'))
        .on(RoomEvent.Reconnected, () => setState(prev => (prev === 'reconnecting' ? (room.remoteParticipants.size > 0 ? 'in-call' : 'waiting') : prev)))
        .on(RoomEvent.Disconnected, () => {
          if (!closingRef.current && roomRef.current === room) {
            stopCallTimer();
            setState(prev => (prev === 'error' ? prev : 'ended'));
          }
        })
        .on(RoomEvent.DataReceived, (payload: Uint8Array, _p?: RemoteParticipant, _k?: unknown, topic?: string) => {
          if (topic !== CHAT_TOPIC) return;
          try {
            const wire = JSON.parse(decoder.decode(payload)) as ChatWire;
            addItem(wire);
            if (!chatOpenRef.current) setUnread(u => u + 1);
          } catch { /* ignore malformed data */ }
        });

      connectPromiseRef.current = (async () => {
        try {
          // Auth-gated by turno + join window.
          const { token, url } = await api.turnos.getVideoToken(turnoId);
          if (roomRef.current !== room) return;

          // The LiveKit signal connection can fail transiently (slow network /
          // cold edge); retry a few times before surfacing an error.
          let lastErr: unknown;
          for (let attempt = 0; attempt < 3; attempt++) {
            if (roomRef.current !== room || closingRef.current) return;
            try {
              await room.connect(url, token);
              lastErr = undefined;
              break;
            } catch (e) {
              lastErr = e;
              if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
            }
          }
          if (lastErr) throw lastErr;
          if (roomRef.current !== room || closingRef.current) return; // torn down / closed while connecting
          setMyUserId(room.localParticipant.identity);
          // Someone may already be in the room (joined before us) → go straight to in-call.
          if (room.remoteParticipants.size > 0) markInCall();
          else setState('waiting');

          // Publish camera + mic (degrade gracefully if a device is unavailable).
          try {
            const pub = await room.localParticipant.setCameraEnabled(true);
            attachLocalVideo(pub);
            setCameraOn(true);
          } catch { setCameraOn(false); }
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
            setMicOn(true);
          } catch { setMicOn(false); }

          void loadHistory(room.localParticipant.identity);
        } catch (err) {
          if (roomRef.current === room && !closingRef.current) {
            setErrorMsg(err instanceof Error ? err.message : vc.startError);
            setState('error');
          }
        }
      })();
    }

    return () => {
      // Defer one tick: StrictMode's immediate re-setup cancels this; a real
      // unmount lets it run and disconnects only after connect settles.
      disconnectTimerRef.current = setTimeout(() => {
        closingRef.current = true;
        stopCallTimer();
        const room = roomRef.current;
        roomRef.current = null;
        connectPromiseRef.current?.finally(() => room?.disconnect());
        connectPromiseRef.current = null;
      }, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoId]);

  function attachLocalVideo(pub?: LocalTrackPublication) {
    if (pub?.videoTrack && localVideoRef.current) {
      pub.videoTrack.attach(localVideoRef.current);
    }
  }

  const loadHistory = useCallback(async (selfId: string) => {
    try {
      const [mensajes, archivos] = await Promise.all([
        api.chat.getMensajes(turnoId),
        api.archivos.getByTurno(turnoId),
      ]);
      const textItems: ChatItem[] = mensajes.map(m => ({
        kind: 'text', id: m.id, senderId: m.remitenteId, text: m.contenido, at: m.createdAt,
      }));
      const fileItems: ChatItem[] = archivos.map(a => ({
        kind: 'file', id: a.id, name: a.nombreOriginal ?? 'archivo',
        url: resolveUploadUrl(a.url), mime: a.mimeType, at: a.createdAt ?? new Date().toISOString(),
      }));
      void selfId;
      for (const it of [...textItems, ...fileItems]) addItem(it);
    } catch { /* history is best-effort */ }
  }, [turnoId, addItem]);

  // Auto-scroll the chat to the newest message.
  useEffect(() => {
    if (chatOpen) chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items, chatOpen]);

  // Mirror chatOpen into a ref for the (stable) data-channel handler.
  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);

  const toggleChat = useCallback(() => {
    setChatOpen(o => {
      const next = !o;
      if (next) setUnread(0); // clear the unread badge when opening
      return next;
    });
  }, []);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micOn;
    try { await room.localParticipant.setMicrophoneEnabled(next); setMicOn(next); } catch { /* ignore */ }
  }, [micOn]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraOn;
    try {
      const pub = await room.localParticipant.setCameraEnabled(next);
      if (next) attachLocalVideo(pub);
      setCameraOn(next);
    } catch { /* ignore */ }
  }, [cameraOn]);

  const hangUp = useCallback(() => {
    closingRef.current = true;
    stopCallTimer();
    setState('ended');
    // Disconnect only after any in-flight connect settles, so closing never
    // aborts a still-connecting room ("could not establish signal connection").
    const room = roomRef.current;
    if (connectPromiseRef.current) connectPromiseRef.current.finally(() => room?.disconnect());
    else room?.disconnect();
  }, [stopCallTimer]);

  // ── Chat ─────────────────────────────────────────────────────────────────
  const broadcast = useCallback((wire: ChatWire) => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    try {
      room.localParticipant.publishData(encoder.encode(JSON.stringify(wire)), { reliable: true, topic: CHAT_TOPIC });
    } catch { /* delivery is best-effort; the message is already persisted */ }
  }, []);

  const sendText = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sending) return;
    setSending(true);
    setChatError('');
    try {
      const saved = await api.chat.enviar(turnoId, text); // persisted to the turno
      setChatInput('');
      const item: ChatItem = { kind: 'text', id: saved.id, senderId: myUserId, text, at: saved.createdAt };
      addItem(item);
      broadcast(item);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : vc.unknownError);
    } finally {
      setSending(false);
    }
  }, [chatInput, sending, turnoId, myUserId, addItem, broadcast, vc.unknownError]);

  const sendFile = useCallback(async (file: File) => {
    setChatError('');
    setSending(true);
    try {
      const archivo = await api.archivos.subir(turnoId, file, 'OTRO'); // validated + persisted to the turno
      const item: ChatItem = {
        kind: 'file', id: archivo.id, senderId: myUserId,
        name: archivo.nombreOriginal ?? file.name, url: resolveUploadUrl(archivo.url),
        mime: archivo.mimeType, at: archivo.createdAt ?? new Date().toISOString(),
      };
      addItem(item);
      broadcast({ ...item, senderId: myUserId });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : vc.fileError);
    } finally {
      setSending(false);
    }
  }, [turnoId, myUserId, addItem, broadcast, vc.fileError]);

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (file) void sendFile(file);
  }, [sendFile]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const statusLabel = {
    connecting: vc.starting,
    waiting:    vc.waiting,
    'in-call':  `${vc.inConsultation} · ${formatDuration(duration)}`,
    reconnecting: vc.reconnecting,
    ended:      vc.ended,
    error:      vc.connectionError,
  }[state];

  const showControls = state === 'in-call' || state === 'waiting' || state === 'connecting' || state === 'reconnecting';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">

      {/* -- Header -- */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            state === 'in-call' ? 'bg-emerald-400 animate-pulse' :
            state === 'error'   ? 'bg-red-400' :
            state === 'reconnecting' ? 'bg-orange-400 animate-pulse' :
            state === 'ended'   ? 'bg-slate-500' : 'bg-amber-400 animate-pulse'
          }`} />
          <span className="text-white font-medium text-sm truncate">
            {state === 'in-call' || state === 'waiting' || state === 'reconnecting'
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
          className="shrink-0 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          title={vc.close}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* -- Body: video + chat panel -- */}
      <div className="flex-1 relative flex overflow-hidden bg-slate-900">

        {/* Video area */}
        <div className="relative flex-1 min-w-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${hasRemote ? 'opacity-100' : 'opacity-0'}`}
          />
          <audio ref={remoteAudioRef} autoPlay />

          {!hasRemote && (state === 'connecting' || state === 'waiting' || state === 'reconnecting') && (
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
              {(state === 'connecting' || state === 'reconnecting') && (
                <Spinner size={20} className="text-slate-400" />
              )}
            </div>
          )}

          {/* Connected, but the other participant has their camera off / no video yet. */}
          {!hasRemote && state === 'in-call' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-semibold text-slate-200">
                {participantName.charAt(0).toUpperCase()}
              </div>
              <p className="text-slate-200 font-medium">{participantRoleLabel} {participantName}</p>
              <p className="text-slate-400 text-sm">{vc.remoteCameraOff}</p>
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
              <button onClick={onClose} className="mt-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors">
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
              <button onClick={onClose} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors">
                {vc.close}
              </button>
            </div>
          )}

          {/* Local video — picture-in-picture */}
          <div className={`absolute bottom-20 right-4 transition-all duration-300 ${
            state === 'in-call' ? 'w-36 sm:w-44' : 'w-28 sm:w-36'
          } aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-600/50 bg-slate-800`}>
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
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

        {/* Chat panel */}
        {chatOpen && state !== 'ended' && state !== 'error' && (
          <aside className="absolute inset-0 sm:relative sm:inset-auto z-10 w-full sm:w-80 flex flex-col bg-slate-800 border-l border-slate-700">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 flex-shrink-0">
              <span className="text-white font-medium text-sm">{vc.chatTitle}</span>
              <button onClick={() => setChatOpen(false)} className="sm:hidden text-slate-400 hover:text-white p-1" title={vc.close}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {items.length === 0 && (
                <p className="text-slate-500 text-xs text-center mt-6">{vc.chatEmpty}</p>
              )}
              {items.map(item => {
                const isMine = item.senderId && item.senderId === myUserId;
                if (item.kind === 'file') {
                  return (
                    <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[80%] flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-700 text-slate-100 text-sm hover:bg-slate-600 transition-colors"
                      >
                        <PaperclipIcon size={16} />
                        <span className="truncate">{item.name}</span>
                      </a>
                    </div>
                  );
                }
                return (
                  <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{item.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-emerald-100/70' : 'text-slate-400'}`}>
                        {formatClinicInstantTime(item.at, dateLocale)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {chatError && <p className="text-red-400 text-xs text-center">{chatError}</p>}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={sendText} className="px-3 py-3 border-t border-slate-700 flex gap-2 items-center flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,application/pdf"
                className="hidden"
                onChange={onPickFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                title={vc.attachFile}
                className="w-9 h-9 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center hover:bg-slate-600 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <PaperclipIcon size={16} />
              </button>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={vc.chatPlaceholder}
                className="flex-1 min-w-0 bg-slate-900 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sending}
                className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {sending ? <Spinner size={16} /> : <SendIcon size={16} />}
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* -- Controls -- */}
      {showControls && (
        <div className="flex-shrink-0 flex items-center justify-center gap-5 py-4 px-4 bg-slate-800/90 backdrop-blur border-t border-slate-700">
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

          <button
            onClick={hangUp}
            title={vc.hangUp}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg scale-100 hover:scale-105 active:scale-95"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5 6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25" />
            </svg>
          </button>

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

          {/* Chat toggle — bottom controls, to the right of the camera button */}
          <button
            onClick={toggleChat}
            title={vc.chatTitle}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              chatOpen ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <ChatIcon size={24} />
            {!chatOpen && unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-slate-800">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
