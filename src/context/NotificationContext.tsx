import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string;
  timestamp: number;
  read: boolean;
  type: 'pqr' | 'info' | 'alert';
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  removeNotification: () => {},
});

const LS_KEY = '9a_notifications_v1';

function load(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

function save(list: AppNotification[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(load);

  const set = useCallback((updater: (prev: AppNotification[]) => AppNotification[]) => {
    setNotifications(prev => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newN: AppNotification = {
      ...n,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      read: false,
    };
    set(prev => [newN, ...prev]);
  }, [set]);

  const markRead = useCallback((id: string) => {
    set(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [set]);

  const markAllRead = useCallback(() => {
    set(prev => prev.map(n => ({ ...n, read: true })));
  }, [set]);

  const removeNotification = useCallback((id: string) => {
    set(prev => prev.filter(n => n.id !== id));
  }, [set]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      addNotification, markRead, markAllRead, removeNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
