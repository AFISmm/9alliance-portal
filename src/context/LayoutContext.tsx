import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((p: boolean) => boolean)) => void;
  isMobile: boolean;
  notificationOpen: boolean;
  setNotificationOpen: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  isMobile: false,
  notificationOpen: false,
  setNotificationOpen: () => {},
});

function getIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile]                     = useState(getIsMobile);
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(() => getIsMobile());
  const [notificationOpen, setNotificationOpen]     = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setSidebarCollapsed(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <LayoutContext.Provider value={{
      sidebarCollapsed, setSidebarCollapsed,
      isMobile,
      notificationOpen, setNotificationOpen,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
