'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE, InAppNotification, notificationsApi } from './api';

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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const loadInbox = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const data = await notificationsApi.getInbox();
      setNotifications(data.notifs);
      setUnread(data.unread);
    } catch {
      // not authenticated or network error — silently ignore
    }
  }, []);

  useEffect(() => {
    loadInbox();

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // Open SSE stream
    const es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onmessage = (event) => {
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
      es.close();
      esRef.current = null;
    };
  }, [loadInbox]);

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
