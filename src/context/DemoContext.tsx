import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  enterDemo: () => void;
  exitDemo:  () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  enterDemo: () => {},
  exitDemo:  () => {},
});

const SESSION_KEY = '9a_demo_mode';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() =>
    sessionStorage.getItem(SESSION_KEY) === '1'
  );

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, isDemoMode ? '1' : '0');
  }, [isDemoMode]);

  function enterDemo() { setIsDemoMode(true); }
  function exitDemo()  { setIsDemoMode(false); }

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
