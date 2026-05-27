'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import Spinner from './Spinner';

export default function GoogleCalendarConnect() {
  const { t } = useLang();
  const p = t('profile');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.google.getStatus()
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));

    // Show feedback when redirected back from Google OAuth
    const params = new URLSearchParams(window.location.search);
    const google = params.get('google');
    if (google === 'connected') {
      setConnected(true);
      setMsg({ ok: true, text: p.googleCalendarOAuthSuccess });
      // Clean up the URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    } else if (google === 'error') {
      setMsg({ ok: false, text: p.googleCalendarOAuthError });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleConnect() {
    setWorking(true);
    setMsg(null);
    try {
      const { url } = await api.google.getAuthUrl();
      window.location.href = url;     // redirect to Google consent page
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? p.googleCalendarAuthUrlError });
      setWorking(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(p.googleCalendarDisconnectConfirm)) return;
    setWorking(true);
    setMsg(null);
    try {
      await api.google.disconnect();
      setConnected(false);
      setMsg({ ok: true, text: p.googleCalendarDisconnectSuccess });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? p.googleCalendarDisconnectError });
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Spinner size={16} />
        {p.verifyingConnection}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Google Calendar icon */}
        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z" opacity=".1"/>
            <path fill="#4285F4" d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" opacity="0"/>
            {/* Simplified Google Calendar "G" logo */}
            <rect x="3" y="3" width="18" height="18" rx="2" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>
            <rect x="3" y="3" width="18" height="5" rx="2" fill="#4285F4"/>
            <rect x="3" y="6" width="18" height="2" fill="#4285F4"/>
            <rect x="7" y="2" width="2" height="4" rx="1" fill="#EA4335"/>
            <rect x="15" y="2" width="2" height="4" rx="1" fill="#EA4335"/>
            <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#4285F4">31</text>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Google Calendar</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {connected
              ? p.googleCalendarConnectedDescription
              : p.googleCalendarDisconnectedDescription}
          </p>
        </div>

        {connected ? (
          <button
            onClick={handleDisconnect}
            disabled={working}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {working ? p.googleCalendarDisconnecting : p.googleCalendarDisconnect}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={working}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {working ? p.googleCalendarConnecting : p.googleCalendarConnect}
          </button>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <span className={`text-xs ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {connected ? p.googleCalendarConnectedStatus : p.googleCalendarDisconnectedStatus}
        </span>
      </div>

      {/* Feedback message */}
      {msg && (
        <p className={`text-xs px-3 py-2 rounded-lg ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
