'use client';

import { useNotifications } from '../lib/notification-context';
import { InAppNotification } from '../lib/api';
import { useLang } from '../lib/i18n/context';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

const tipoIcon: Record<string, string> = {
  TURNO_RESERVADO: '📅',
  TURNO_CONFIRMADO: '✅',
  TURNO_CANCELADO: '❌',
  RECETA_EMITIDA: '💊',
};

function NotifItem({ notif, onRead }: { notif: InAppNotification; onRead: (id: string) => void }) {
  const icon = tipoIcon[notif.tipo] ?? '🔔';
  return (
    <div
      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.leida ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
      onClick={() => {
        if (!notif.leida) onRead(notif.id);
        if (notif.link) window.location.href = notif.link;
      }}
    >
      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-slate-800 dark:text-slate-100 ${!notif.leida ? 'font-semibold' : ''}`}>
            {notif.titulo}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{timeAgo(notif.createdAt)}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.cuerpo}</p>
      </div>
      {!notif.leida && (
        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
      )}
    </div>
  );
}

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const { t } = useLang();
  const c = t('common');

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificaciones</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Marcar todas leídas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Sin notificaciones
          </p>
        ) : (
          notifications.map(n => (
            <NotifItem key={n.id} notif={n} onRead={markRead} />
          ))
        )}
      </div>
    </div>
  );
}
