'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

interface VideoCallModalProps {
  turnoId: string;
  profesionalNombre: string;
  fechaHora: string;
  onClose: () => void;
}

export default function VideoCallModal({ turnoId, profesionalNombre, fechaHora, onClose }: VideoCallModalProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    api.turnos.getVideoToken(turnoId)
      .then(data => {
        setJoinUrl(data.joinUrl);
        setState('ready');
      })
      .catch(e => {
        setErrorMsg(e.message ?? 'No se pudo obtener el link de videollamada.');
        setState('error');
      });
  }, [turnoId]);

  const fecha = new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-medium text-sm">
            Videollamada con {profesionalNombre}
          </span>
          <span className="text-slate-400 text-xs">{fecha}</span>
        </div>
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

      {/* Body */}
      <div className="flex-1 relative">
        {state === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Conectando a la sala...</span>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium mb-1">No se pudo conectar</p>
              <p className="text-slate-400 text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {state === 'ready' && joinUrl && (
          <iframe
            ref={iframeRef}
            src={joinUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Videollamada MediSync"
          />
        )}
      </div>
    </div>
  );
}
