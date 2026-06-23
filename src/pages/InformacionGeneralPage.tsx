import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CalendarPage from './CalendarPage';
import Indicadores from './Indicadores';
import Calculadoras from './Calculadoras';

type Tab = 'calendario' | 'indicadores' | 'calculadoras';

const tabs: { id: Tab; label: string }[] = [
  { id: 'calendario',   label: 'Calendario Tributario' },
  { id: 'indicadores',  label: 'Indicadores Fiscales'  },
  { id: 'calculadoras', label: 'Calculadoras'          },
];

export default function InformacionGeneralPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(paramTab && tabs.some(t => t.id === paramTab) ? paramTab : 'calendario');

  // Sync tab when URL param changes (e.g. when navigating from GestionEstrategica)
  useEffect(() => {
    if (paramTab && tabs.some(t => t.id === paramTab)) {
      setTab(paramTab);
    }
  }, [paramTab]);

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    // Preserve other params (like estado) but update tab
    const next = new URLSearchParams(searchParams);
    next.set('tab', newTab);
    if (newTab !== 'calendario') next.delete('estado');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cream-100">Información General</h1>

      <div className="flex gap-1 bg-navy-900/60 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-gold-500/15 text-gold-300 border border-gold-500/25'
                : 'text-cream-200/50 hover:text-cream-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'calendario'   && <CalendarPage />}
        {tab === 'indicadores'  && <Indicadores />}
        {tab === 'calculadoras' && <Calculadoras />}
      </div>
    </div>
  );
}
