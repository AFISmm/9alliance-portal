import { useLocation }        from 'react-router-dom';
import { Menu, X, Bell }        from 'lucide-react';
import { LanguageSwitcher }     from '../components/LanguageSwitcher';
import { useLayout }            from '../context/LayoutContext';
import { useNotifications }     from '../context/NotificationContext';

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
  '/gestion-pqrs':        'Gestión de PQRs',
};

const DAY_NAMES   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatDate(): string {
  const d = new Date();
  return `${DAY_NAMES[d.getDay()]} ${String(d.getDate()).padStart(2,'0')} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function TopBar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, isMobile, notificationOpen, setNotificationOpen } = useLayout();
  const { unreadCount } = useNotifications();

  const moduleName = Object.entries(MODULE_NAMES).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? '';

  const showBurger = isMobile || sidebarCollapsed;

  return (
    <header style={{
      flexShrink: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px', height: 48,
      background: '#070E15',
      borderBottom: '1px solid rgba(255,255,255,.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showBurger && (
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Abrir menú' : 'Cerrar menú'}
            style={{
              background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)',
              borderRadius: 7, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#C9A84C', flexShrink: 0,
            }}
          >
            {isMobile && !sidebarCollapsed
              ? <X size={14} strokeWidth={2} />
              : <Menu size={14} strokeWidth={2} />}
          </button>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11.5, letterSpacing: '.04em', color: '#7C8A9C',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', opacity: .8, flexShrink: 0, display: 'inline-block' }} />
          {moduleName && (
            <>
              <span style={{ color: '#AEBCCD', fontWeight: 500 }}>{moduleName}</span>
              <span style={{ opacity: .35 }}>·</span>
            </>
          )}
          <span style={{ display: isMobile ? 'none' : 'inline' }}>{formatDate()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <button
          onClick={() => setNotificationOpen(!notificationOpen)}
          title="Notificaciones"
          style={{
            position: 'relative',
            background: notificationOpen ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${notificationOpen ? 'rgba(201,168,76,.35)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 7, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: notificationOpen ? '#C9A84C' : '#7C8A9C',
            transition: 'all .15s',
          }}
        >
          <Bell size={14} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 16, height: 16, borderRadius: '50%',
              background: '#ef4444', border: '2px solid #070E15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: '#fff',
              fontFamily: "'Inter', sans-serif",
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
