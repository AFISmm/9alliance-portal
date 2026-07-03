import { useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

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
};

export function TopBar() {
  const location = useLocation();

  const moduleName = Object.entries(MODULE_NAMES).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? '';

  return (
    <header
      className="shrink-0 flex items-center justify-between px-6"
      style={{ height: 44, background: '#0d1829', borderBottom: '1px solid rgba(255,255,255,.07)' }}
    >
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

      <LanguageSwitcher />
    </header>
  );
}
