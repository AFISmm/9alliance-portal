import { useLocation }    from 'react-router-dom';
import { PanelLeftOpen }   from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLayout }        from '../context/LayoutContext';

const MODULE_NAMES: Record<string, string> = {
  '/inicio':              'Inicio',
  '/gestion-estrategica': 'Gestión Estratégica',
  '/gestion-financiera':  'Gestión Financiera',
  '/gestion-contable':    'Gestión Contable',
  '/gestion-comercial':   'Gestión Comercial',
  '/gestion-operativa':   'Gestión Operativa',
  '/informacion-general': 'Información General',
  '/empresas':            'Empresas',
  '/empresa':             'Detalle de empresa',
  '/perfil':              'Mi perfil',
  '/gestion-usuarios':    'Gestión de Usuarios',
};

const DAY_NAMES  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatDate(): string {
  const d = new Date();
  const day   = DAY_NAMES[d.getDay()];
  const date  = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year  = d.getFullYear();
  return `${day} ${date} ${month} ${year}`;
}

export function TopBar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();

  const moduleName = Object.entries(MODULE_NAMES).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? '';

  return (
    <header
      className="shrink-0 flex items-center justify-between px-6"
      style={{ height: 48, background: '#070E15', borderBottom: '1px solid rgba(255,255,255,.07)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Expandir menú"
            style={{
              background: 'rgba(201,168,76,.08)',
              border: '1px solid rgba(201,168,76,.2)',
              borderRadius: 7,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#C9A84C', flexShrink: 0,
            }}
          >
            <PanelLeftOpen size={14} strokeWidth={1.8} />
          </button>
        )}

        {/* Breadcrumb — JetBrains Mono style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, letterSpacing: '.04em', color: '#7C8A9C' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', opacity: .8, flexShrink: 0, display: 'inline-block' }} />
          {moduleName && (
            <>
              <span style={{ color: '#AEBCCD', fontWeight: 500 }}>{moduleName}</span>
              <span style={{ opacity: .4 }}>·</span>
            </>
          )}
          <span>{formatDate()}</span>
        </div>
      </div>

      <LanguageSwitcher />
    </header>
  );
}
