'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

interface VideoCallModalProps {
  turnoId: string;
  profesionalNombre: string;
  fechaHora: string;
  onClose: () => void;
}

/**
 * Embeds a Jitsi Meet room using the Jitsi External API script.
 * Falls back to opening the link in a new tab if the API fails to load.
 */
export default function VideoCallModal({ turnoId, profesionalNombre, fechaHora, onClose }: VideoCallModalProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);

  const fecha = new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  // Step 1 — get join URL from backend
  useEffect(() => {
    api.turnos.getVideoToken(turnoId)
      .then(data => {
        setJoinUrl(data.joinUrl);
      })
      .catch(e => {
        setErrorMsg(e.message ?? 'No se pudo obtener el link de videollamada.');
        setState('error');
      });
  }, [turnoId]);

  // Step 2 — once URL is ready, load Jitsi External API and mount
  useEffect(() => {
    if (!joinUrl || !containerRef.current) return;

    // Parse room name and domain from the URL
    // e.g. https://meet.jit.si/MediSync-abc123
    let domain = 'meet.jit.si';
    let roomName = '';
    try {
      const url = new URL(joinUrl);
      domain = url.hostname;
      roomName = url.pathname.replace(/^\//, '');
    } catch {
      roomName = joinUrl.split('/').pop() ?? '';
    }

    function mountJitsi() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI || !containerRef.current) return;

      apiRef.current = new JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand',
            'videoquality', 'tileview',
          ],
        },
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => { onClose(); });
      setState('ready');
    }

    // If the Jitsi External API script is already loaded, mount immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).JitsiMeetExternalAPI) {
      mountJitsi();
      return;
    }

    // Otherwise load the script dynamically
    const existingScript = document.getElementById('jitsi-api-script');
    if (existingScript) {
      existingScript.addEventListener('load', mountJitsi);
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-api-script';
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = mountJitsi;
    script.onerror = () => {
      setErrorMsg('No se pudo cargar el componente de videollamada.');
      setState('error');
    };
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [joinUrl, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${state === 'ready' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-white font-medium text-sm">
            Videollamada — {profesionalNombre}
          </span>
          <span className="text-slate-400 text-xs">{fecha}</span>
        </div>
        <div className="flex items-center gap-2">
          {joinUrl && state !== 'error' && (
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              Abrir en nueva pestaña
            </a>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Salir
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative">
        {state === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-10 pointer-events-none">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Conectando a la sala...</span>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6 z-10">
            <div className="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium mb-1">No se pudo conectar</p>
              <p className="text-slate-400 text-sm mb-3">{errorMsg}</p>
              {joinUrl && (
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Unirse en el navegador
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Jitsi mounts here */}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
