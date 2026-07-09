import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Building2, Target, Wallet, Briefcase,
  SlidersHorizontal, Info, LogOut, Landmark,
  UserCog, FlaskConical, X, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo9A }       from '../components/Logo9A';
import { useAuth }      from '../auth/AuthContext';
import { useDemo }      from '../context/DemoContext';

const topItems: Array<{ label: string; path: string; Icon: LucideIcon }> = [
  { label: 'INICIO',   path: '/inicio',   Icon: Home      },
  { label: 'EMPRESAS', path: '/empresas', Icon: Building2 },
];

const sectionItems: Array<{ label: string; path: string; Icon: LucideIcon }> = [
  { label: 'GESTIÓN ESTRATÉGICA', path: '/gestion-estrategica', Icon: Target          },
  { label: 'GESTIÓN FINANCIERA',  path: '/gestion-financiera',  Icon: Wallet          },
  { label: 'GESTIÓN CONTABLE',    path: '/gestion-contable',    Icon: Landmark        },
  { label: 'GESTIÓN COMERCIAL',   path: '/gestion-comercial',   Icon: Briefcase       },
  { label: 'GESTIÓN OPERATIVA',   path: '/gestion-operativa',   Icon: SlidersHorizontal },
  { label: 'INFORMACIÓN GENERAL', path: '/informacion-general', Icon: Info            },
  { label: 'GESTIÓN DE USUARIOS', path: '/gestion-usuarios',    Icon: UsersRound      },
];

function rowCls(active: boolean) {
  return (
    'w-full flex items-center gap-3 px-3.5 py-[9px] rounded-[8px] ' +
    'text-[12.5px] font-medium tracking-wide transition-all duration-150 border-none ' +
    (active
      ? 'text-gold-400 bg-gold-500/10 font-semibold nav-active'
      : 'text-cream-200/50 hover:text-cream-100 hover:bg-white/5')
  );
}

function getInitials(email: string): string {
  const user  = email.split('@')[0];
  const parts = user.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : user.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, signOut } = useAuth();
  const { isDemoMode, exitDemo } = useDemo();

  function isActive(path: string) {
    if (path === '/empresas')
      return location.pathname === '/empresas' || location.pathname.startsWith('/empresa/');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  function handleExitDemo() { exitDemo(); navigate('/login'); }

  const displayName = (user?.user_metadata?.display_name as string | undefined)
    || user?.email?.split('@')[0] || 'Usuario';
  const email    = user?.email ?? '';
  const initials = email ? getInitials(email) : (isDemoMode ? 'DM' : 'U');

  return (
    <aside
      className="w-60 min-w-[240px] border-r border-white/8 flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #0E1A26 0%, #070E15 100%)', position: 'relative' }}
    >
      {/* Dot pattern overlay */}
      <div className="sidebar-dots" />

      {/* Brand */}
      <div className="flex flex-col items-center gap-3 pt-12 pb-6 border-b border-white/8" style={{ position: 'relative' }}>
        <Logo9A size={80} />
        <div className="text-center space-y-0.5">
          <p className="text-cream-100 text-[11px] font-semibold tracking-[0.18em]" style={{ fontFamily: "'Inter', sans-serif" }}>9 ALLIANCE</p>
          <p className="text-cream-200/30 text-[9px] tracking-[0.12em] uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Portal Administrativo</p>
        </div>
      </div>

      {/* Demo banner */}
      {isDemoMode && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ position: 'relative', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)' }}>
          <FlaskConical size={13} strokeWidth={1.9} className="text-gold-400 shrink-0" />
          <span className="text-gold-400 text-[10.5px] font-semibold tracking-wide flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>MODO DEMO</span>
          <button onClick={handleExitDemo} className="text-gold-400/50 hover:text-gold-400 transition-colors" title="Salir del demo">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4" style={{ position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Top items */}
        <div className="space-y-0.5">
          {topItems.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)} className={rowCls(isActive(path))}>
              <Icon size={16} strokeWidth={1.8} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Section label */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '.16em',
          color: '#566375',
          padding: '20px 14px 8px',
          textTransform: 'uppercase',
        }}>
          MÓDULOS
        </div>

        {/* Section items */}
        <div className="space-y-0.5">
          {sectionItems.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)} className={rowCls(isActive(path))}>
              <Icon size={16} strokeWidth={1.8} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 space-y-1.5" style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {isDemoMode ? (
          <div className="flex items-center gap-2.5 px-1 py-1 rounded-[11px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '10px 13px' }}>
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: '#C9A84C' }}>
              DM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cream-100 text-[12px] font-semibold truncate leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Usuario Demo</p>
              <p className="text-gold-400/60 text-[10px] truncate leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>Modo de exploración</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-[11px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '10px 13px' }}>
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg,#d4b96a,#C9A84C)', color: '#0d1829', fontFamily: "'Inter', sans-serif" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cream-100 text-[12px] font-semibold truncate leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>{displayName}</p>
              <p className="text-[10px] truncate leading-tight" style={{ color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>{email}</p>
            </div>
          </div>
        )}

        {!isDemoMode && (
          <button
            onClick={() => navigate('/perfil')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors text-[12px] font-medium ${
              isActive('/perfil') ? 'text-gold-400 bg-gold-500/10 nav-active' : 'text-cream-200/50 hover:text-cream-100 hover:bg-white/5'
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <UserCog size={13} strokeWidth={1.9} className="shrink-0" />
            Mi perfil
          </button>
        )}

        {isDemoMode ? (
          <button
            onClick={handleExitDemo}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-gold-400/60 hover:text-gold-400 hover:bg-gold-500/8 transition-colors text-[12px] font-medium"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <X size={13} strokeWidth={1.9} className="shrink-0" />
            Salir del demo
          </button>
        ) : (
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-cream-200/50 hover:text-red-400 hover:bg-red-400/8 transition-colors text-[12px] font-medium"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <LogOut size={13} strokeWidth={1.9} className="shrink-0" />
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}
