import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type DemoMode = 'empresa' | 'empleado' | null;

interface DemoContextType {
  demoMode: DemoMode;
  isDemoMode: boolean;
  enterDemo: (mode: DemoMode) => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  demoMode: null,
  isDemoMode: false,
  enterDemo: () => {},
  exitDemo: () => {},
});

const SESSION_KEY = '9a_demo_mode_v2';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState<DemoMode>(() => {
    const v = sessionStorage.getItem(SESSION_KEY);
    if (v === 'empresa' || v === 'empleado') return v;
    return null;
  });

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, demoMode ?? '');
  }, [demoMode]);

  function enterDemo(mode: DemoMode) { setDemoMode(mode); }
  function exitDemo()                { setDemoMode(null); }

  return (
    <DemoContext.Provider value={{ demoMode, isDemoMode: demoMode !== null, enterDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
