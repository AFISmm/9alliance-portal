import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Building2, Target, Wallet, Briefcase,
  SlidersHorizontal, Info, LogOut, Landmark,
  UserCog, FlaskConical, X, UsersRound, MessageSquarePlus,
  HardHat, UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo9A }       from '../components/Logo9A';
import { useAuth }      from '../auth/AuthContext';
import { useDemo }      from '../context/DemoContext';
import type { DemoMode } from '../context/DemoContext';

// ── Nav item definitions ────────────────────────────────────────────────
interface NavItem { label: string; path: string; Icon: LucideIcon }

const ALL_TOP: NavItem[] = [
  { label: 'INICIO',   path: '/inicio',   Icon: Home      },
  { label: 'EMPRESAS', path: '/empresas', Icon: Building2 },
];

const ALL_MODULES: NavItem[] = [
  { label: 'GESTIÓN ESTRATÉGICA', path: '/gestion-estrategica', Icon: Target             },
  { label: 'GESTIÓN FINANCIERA',  path: '/gestion-financiera',  Icon: Wallet             },
  { label: 'GESTIÓN CONTABLE',    path: '/gestion-contable',    Icon: Landmark           },
  { label: 'GESTIÓN COMERCIAL',   path: '/gestion-comercial',   Icon: Briefcase          },
  { label: 'GESTIÓN OPERATIVA',   path: '/gestion-operativa',   Icon: SlidersHorizontal  },
  { label: 'INFORMACIÓN GENERAL', path: '/informacion-general', Icon: Info               },
  { label: 'GESTIÓN DE USUARIOS', path: '/gestion-usuarios',    Icon: UsersRound         },
];

const PQR_ITEM: NavItem = { label: 'GESTIÓN DE PQRs', path: '/gestion-pqrs', Icon: MessageSquarePlus };

// Items visible en modo Demo Empleado
const EMPLEADO_TOP: NavItem[]     = [{ label: 'INICIO', path: '/inicio', Icon: Home }];
const EMPLEADO_MODULES: NavItem[] = [
  { label: 'GESTIÓN OPERATIVA', path: '/gestion-operativa', Icon: SlidersHorizontal },
  { label: 'MI PERFIL',         path: '/perfil',            Icon: UserCog           },
];

// ── Helpers ─────────────────────────────────────────────────────────────
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

function demoBadgeStyle(demoMode: DemoMode) {
  if (demoMode === 'empresa')  return { bg: 'rgba(201,168,76,.1)', border: 'rgba(201,168,76,.3)', color: '#C9A84C', Icon: FlaskConical, label: 'DEMO EMPRESA' };
  if (demoMode === 'empleado') return { bg: 'rgba(74,127,212,.1)',  border: 'rgba(74,127,212,.3)',  color: '#4A7FD4', Icon: HardHat,      label: 'DEMO EMPLEADO' };
  return null;
}

// ── Component ────────────────────────────────────────────────────────────
export function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, signOut } = useAuth();
  const { demoMode, isDemoMode, exitDemo } = useDemo();

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

  // PQRs visible para cualquier usuario real autenticado o en demo empresa
  const showPQRs = (user !== null && demoMode === null) || demoMode === 'empresa';

  // Compute visible nav items based on mode
  const topItems     = demoMode === 'empleado' ? EMPLEADO_TOP     : ALL_TOP;
  const moduleItems  = demoMode === 'empleado' ? EMPLEADO_MODULES : [
    ...ALL_MODULES,
    ...(showPQRs ? [PQR_ITEM] : []),
  ];

  const badge = demoBadgeStyle(demoMode);

  return (
    <aside
      className="w-60 min-w-[240px] border-r border-white/8 flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #0E1A26 0%, #070E15 100%)', position: 'relative' }}
    >
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
      {badge && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ position: 'relative', background: badge.bg, border: `1px solid ${badge.border}` }}>
          <badge.Icon size={13} strokeWidth={1.9} style={{ color: badge.color, flexShrink: 0 }} />
          <span className="text-[10.5px] font-semibold tracking-wide flex-1" style={{ fontFamily: "'Inter', sans-serif", color: badge.color }}>{badge.label}</span>
          <button onClick={handleExitDemo} style={{ color: badge.color, opacity: .5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Salir del demo">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Demo Empleado role badge */}
      {demoMode === 'empleado' && (
        <div style={{ margin: '4px 12px 0', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(74,127,212,.06)', borderRadius: 8 }}>
          <UserCheck size={12} strokeWidth={1.9} style={{ color: '#4A7FD4' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, color: '#4A7FD4' }}>Ana García · Analista de Operaciones</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4" style={{ position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>
        <div className="space-y-0.5">
          {topItems.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)} className={rowCls(isActive(path))}>
              <Icon size={16} strokeWidth={1.8} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.16em', color: '#566375', padding: '20px 14px 8px', textTransform: 'uppercase' }}>
          {demoMode === 'empleado' ? 'MIS MÓDULOS' : 'MÓDULOS'}
        </div>

        <div className="space-y-0.5">
          {moduleItems.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)} className={rowCls(isActive(path))}
              style={path === '/gestion-pqrs' ? { color: isActive(path) ? '#C9A84C' : 'rgba(248,247,244,.38)' } : {}}>
              <Icon size={16} strokeWidth={1.8} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User + actions */}
      <div className="px-3 py-3 space-y-1.5" style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {/* User card */}
        {isDemoMode ? (
          <div className="flex items-center gap-2.5 px-1 py-1 rounded-[11px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '10px 13px' }}>
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
              style={{ background: demoMode === 'empleado' ? 'rgba(74,127,212,.15)' : 'rgba(201,168,76,.15)', border: `1px solid ${demoMode === 'empleado' ? 'rgba(74,127,212,.3)' : 'rgba(201,168,76,.3)'}`, color: demoMode === 'empleado' ? '#4A7FD4' : '#C9A84C' }}>
              {demoMode === 'empleado' ? 'AG' : 'DM'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cream-100 text-[12px] font-semibold truncate leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                {demoMode === 'empleado' ? 'Ana García' : 'Usuario Demo'}
              </p>
              <p className="text-[10px] truncate leading-tight" style={{ color: demoMode === 'empleado' ? '#4A7FD4' : '#C9A84C', opacity: .7, fontFamily: "'DM Sans', sans-serif" }}>
                {demoMode === 'empleado' ? 'Modo empleado' : 'Modo empresa'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-[11px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: '10px 13px' }}>
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg,#d4b96a,#C9A84C)', color: '#0d1829', fontFamily: "'Inter', sans-serif" }}>
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
          <button onClick={handleExitDemo}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-gold-400/60 hover:text-gold-400 hover:bg-gold-500/8 transition-colors text-[12px] font-medium"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <X size={13} strokeWidth={1.9} className="shrink-0" />
            Salir del demo
          </button>
        ) : (
          <button onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-cream-200/50 hover:text-red-400 hover:bg-red-400/8 transition-colors text-[12px] font-medium"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <LogOut size={13} strokeWidth={1.9} className="shrink-0" />
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}
