import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find(l => l.code === i18n.language) ?? LANGS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 6,
          border: '1px solid rgba(201,168,76,.22)',
          background: open ? 'rgba(201,168,76,.10)' : 'rgba(255,255,255,.04)',
          cursor: 'pointer',
          color: 'rgba(174,188,205,.75)',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown
          size={11}
          strokeWidth={2}
          style={{
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#C9A84C',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 130,
            background: '#1B2A4A',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 200,
            boxShadow: '0 8px 24px rgba(0,0,0,.4)',
          }}
        >
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: l.code === i18n.language ? 'rgba(201,168,76,.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: l.code === i18n.language ? '#C9A84C' : 'rgba(174,188,205,.75)',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fontWeight: l.code === i18n.language ? 600 : 400,
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (l.code !== i18n.language) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.05)'; }}
              onMouseLeave={e => { if (l.code !== i18n.language) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
