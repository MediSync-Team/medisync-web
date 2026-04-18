'use client';

import { useState, useEffect } from 'react';
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getActivePushSubscription,
} from '../lib/push';
import { api, NotificationPreferences } from '../lib/api';

type PushState = 'loading' | 'unsupported' | 'subscribed' | 'unsubscribed' | 'denied';

type PushPrefKey = 'pushTurno' | 'pushCancelacion' | 'pushRecordatorio' | 'pushReceta' | 'pushChat';

const PUSH_EVENTS: { key: PushPrefKey; label: string; description: string }[] = [
  { key: 'pushTurno',        label: 'Nuevos turnos',    description: 'Reservas, confirmaciones y reprogramaciones' },
  { key: 'pushCancelacion',  label: 'Cancelaciones',    description: 'Cuando un turno es cancelado' },
  { key: 'pushRecordatorio', label: 'Recordatorios',    description: '24 h y 2 h antes del turno' },
  { key: 'pushReceta',       label: 'Recetas',          description: 'Cuando el profesional emite una receta' },
  { key: 'pushChat',         label: 'Mensajes de chat', description: 'Nuevos mensajes en el chat de un turno' },
];

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        on ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function PushNotificationToggle() {
  const [pushState, setPushState] = useState<PushState>('loading');
  const [working, setWorking] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [prefs, setPrefs] = useState<Partial<NotificationPreferences>>({});
  const [saving, setSaving] = useState<PushPrefKey | null>(null);

  useEffect(() => {
    if (!isPushSupported()) { setPushState('unsupported'); return; }
    const perm = getPushPermission();
    if (perm === 'denied') { setPushState('denied'); return; }
    getActivePushSubscription().then((sub) => {
      setPushState(sub ? 'subscribed' : 'unsubscribed');
    });
  }, []);

  useEffect(() => {
    api.notifications.getPreferences().then((data) => {
      setPrefs(data as Partial<NotificationPreferences>);
    }).catch(() => {});
  }, []);

  const handleTogglePush = async () => {
    setWorking(true);
    try {
      if (pushState === 'subscribed') {
        await unsubscribeFromPush();
        setPushState('unsubscribed');
      } else {
        const result = await subscribeToPush();
        if (result === 'granted')     setPushState('subscribed');
        else if (result === 'denied') setPushState('denied');
      }
    } catch (err) {
      console.error('[push toggle]', err);
    } finally {
      setWorking(false);
    }
  };

  const handleTest = async () => {
    setWorking(true);
    try {
      await api.notifications.testPush();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (err) {
      console.error('[push test]', err);
    } finally {
      setWorking(false);
    }
  };

  const handlePrefChange = async (key: PushPrefKey, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving(key);
    try {
      await api.notifications.updatePreferences({ [key]: value });
    } catch (err) {
      console.error('[push pref]', err);
      setPrefs((p) => ({ ...p, [key]: !value })); // revert on error
    } finally {
      setSaving(null);
    }
  };

  if (pushState === 'loading') return null;

  if (pushState === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Notificaciones push no disponibles en este navegador
      </div>
    );
  }

  if (pushState === 'denied') {
    return (
      <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>Notificaciones bloqueadas en el navegador. Habilitá el permiso manualmente desde la configuración del sitio.</span>
      </div>
    );
  }

  const isSubscribed = pushState === 'subscribed';

  return (
    <div className="space-y-4">
      {/* Main subscribe/unsubscribe button */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleTogglePush}
          disabled={working}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            isSubscribed
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {working ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : isSubscribed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          )}
          {isSubscribed ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
        </button>

        {isSubscribed && (
          <button
            onClick={handleTest}
            disabled={working || testSent}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 disabled:opacity-60"
          >
            {testSent ? '✓ Enviada' : 'Enviar prueba'}
          </button>
        )}
      </div>

      {/* Per-event preference toggles — only show when subscribed */}
      {isSubscribed && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Recibir push para</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {PUSH_EVENTS.map(({ key, label, description }) => {
              const value = prefs[key] !== false; // default true
              return (
                <li key={key} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <Toggle
                    on={value}
                    onChange={(v) => handlePrefChange(key, v)}
                    disabled={saving === key}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
