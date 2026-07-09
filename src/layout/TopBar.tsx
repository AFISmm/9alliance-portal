import { useLocation }    from 'react-router-dom';
import { Menu, X }         from 'lucide-react';
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

const DAY_NAMES   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatDate(): string {
  const d = new Date();
  return `${DAY_NAMES[d.getDay()]} ${String(d.getDate()).padStart(2,'0')} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function TopBar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, isMobile } = useLayout();

  const moduleName = Object.entries(MODULE_NAMES).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? '';

  const showBurger = isMobile || sidebarCollapsed;

  return (
    <header
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 48,
        background: '#070E15',
        borderBottom: '1px solid rgba(255,255,255,.07)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger — always on mobile, only when collapsed on desktop */}
        {showBurger && (
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Abrir menú' : 'Cerrar menú'}
            style={{
              background: 'rgba(201,168,76,.08)',
              border: '1px solid rgba(201,168,76,.2)',
              borderRadius: 7,
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#C9A84C', flexShrink: 0,
            }}
          >
            {isMobile && !sidebarCollapsed
              ? <X size={14} strokeWidth={2} />
              : <Menu size={14} strokeWidth={2} />}
          </button>
        )}

        {/* Breadcrumb — JetBrains Mono */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11.5, letterSpacing: '.04em', color: '#7C8A9C',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#C9A84C', opacity: .8, flexShrink: 0, display: 'inline-block',
          }} />
          {moduleName && (
            <>
              <span style={{ color: '#AEBCCD', fontWeight: 500 }}>{moduleName}</span>
              <span style={{ opacity: .35 }}>·</span>
            </>
          )}
          {/* Hide date on very small screens */}
          <span style={{ display: isMobile ? 'none' : 'inline' }}>{formatDate()}</span>
        </div>
      </div>

      <LanguageSwitcher />
    </header>
  );
}
