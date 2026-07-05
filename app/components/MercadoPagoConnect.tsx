'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import Spinner from './Spinner';

/**
 * Lets a professional link their own Mercado Pago account (OAuth) so consultation
 * payments settle into their account. Mirrors {@link GoogleCalendarConnect}.
 * Rendered only for professionals (see ProfileModal · Integraciones).
 */
export default function MercadoPagoConnect() {
  const { t } = useLang();
  const p = t('profile');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.mercadopago.getStatus()
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));

    // Show feedback when redirected back from the Mercado Pago OAuth consent
    const params = new URLSearchParams(window.location.search);
    const mp = params.get('mp');
    if (mp === 'connected') {
      setConnected(true);
      setMsg({ ok: true, text: p.mercadopagoOAuthSuccess });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (mp === 'error') {
      setMsg({ ok: false, text: p.mercadopagoOAuthError });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleConnect() {
    setWorking(true);
    setMsg(null);
    try {
      const { url } = await api.mercadopago.getAuthUrl();
      window.location.href = url;     // redirect to Mercado Pago consent page
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? p.mercadopagoAuthUrlError });
      setWorking(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(p.mercadopagoDisconnectConfirm)) return;
    setWorking(true);
    setMsg(null);
    try {
      await api.mercadopago.disconnect();
      setConnected(false);
      setMsg({ ok: true, text: p.mercadopagoDisconnectSuccess });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message ?? p.mercadopagoDisconnectError });
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
        {/* Mercado Pago icon */}
        <div className="w-9 h-9 rounded-lg bg-[#009EE3] flex items-center justify-center shadow-sm flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="white" />
            <rect x="2.5" y="9" width="19" height="2.4" fill="#009EE3" />
            <rect x="5" y="14" width="6" height="1.8" rx="0.9" fill="#009EE3" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mercado Pago</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {connected
              ? p.mercadopagoConnectedDescription
              : p.mercadopagoDisconnectedDescription}
          </p>
        </div>

        {connected ? (
          <button
            onClick={handleDisconnect}
            disabled={working}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {working ? p.mercadopagoDisconnecting : p.mercadopagoDisconnect}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={working}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[#009EE3] text-white hover:bg-[#008FD1] disabled:opacity-50 transition-colors"
          >
            {working ? p.mercadopagoConnecting : p.mercadopagoConnect}
          </button>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <span className={`text-xs ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
          {connected ? p.mercadopagoConnectedStatus : p.mercadopagoDisconnectedStatus}
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
