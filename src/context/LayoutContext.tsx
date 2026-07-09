import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((p: boolean) => boolean)) => void;
  isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  isMobile: false,
});

function getIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile]               = useState(getIsMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getIsMobile());

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
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed, isMobile }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
