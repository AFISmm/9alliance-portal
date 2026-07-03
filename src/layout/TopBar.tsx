import { useLocation }    from 'react-router-dom';
import { PanelLeftOpen }   from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLayout }        from '../context/LayoutContext';

const MODULE_NAMES: Record<string, string> = {
  '/inicio':              'Inicio',
  '/gestion-estrategica': 'Gestión Estratégica',
  '/gestion-financiera':  'Gestión Financiera',
  '/gestion-comercial':   'Gestión Comercial',
  '/gestion-operativa':   'Gestión Operativa',
  '/informacion-general': 'Información General',
  '/empresas':            'Empresas',
  '/empresa':             'Detalle de empresa',
  '/perfil':              'Mi perfil',
  '/gestion-usuarios':   'Gestión de Usuarios',
};

export function TopBar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();

  const moduleName = Object.entries(MODULE_NAMES).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? '';

  return (
    <header
      className="shrink-0 flex items-center justify-between px-6"
      style={{ height: 44, background: '#0d1829', borderBottom: '1px solid rgba(255,255,255,.07)' }}
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
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#C9A84C',
              flexShrink: 0,
            }}
          >
            <PanelLeftOpen size={14} strokeWidth={1.8} />
          </button>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(174,188,205,.4)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {moduleName}
        </p>
      </div>

      <LanguageSwitcher />
    </header>
  );
}
