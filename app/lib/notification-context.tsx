'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE, InAppNotification, notificationsApi } from './api';
import { useAuth } from './auth-context';

interface NotificationContextValue {
  notifications: InAppNotification[];
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unread: 0,
  markRead: async () => {},
  markAllRead: async () => {},
});

export function isActiveNotificationSession(sessionId: number, currentSessionId: number, closed: boolean) {
  return !closed && sessionId === currentSessionId;
}

export function getNotificationStreamUrl(token: string) {
  return `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    sessionRef.current += 1;
    const sessionId = sessionRef.current;
    let closed = false;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setNotifications([]);
    setUnread(0);

    if (authLoading || !user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    notificationsApi.getInbox()
      .then((data) => {
        if (!isActiveNotificationSession(sessionId, sessionRef.current, closed)) return;
        setNotifications(data.notifs);
        setUnread(data.unread);
      })
      .catch(() => {
        // not authenticated or network error — silently ignore
      });

    // Open SSE stream
    const es = new EventSource(getNotificationStreamUrl(token));
    esRef.current = es;

    es.onmessage = (event) => {
      if (!isActiveNotificationSession(sessionId, sessionRef.current, closed)) return;
      try {
        const notif: InAppNotification = JSON.parse(event.data);
        setNotifications(prev => [notif, ...prev]);
        setUnread(prev => prev + 1);
      } catch {
        // ignore malformed event
      }
    };

    es.onerror = () => {
      // Connection dropped; EventSource will auto-reconnect
    };

    return () => {
      closed = true;
      es.close();
      if (esRef.current === es) esRef.current = null;
    };
  }, [authLoading, user?.id]);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
    setUnread(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    setUnread(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unread, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
