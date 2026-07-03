import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Building2, Target, Wallet, Briefcase,
  SlidersHorizontal, Info, ChevronDown, ChevronRight, LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo9A } from '../components/Logo9A';
import { realClients } from '../data/clients';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const topItems: Array<{ label: string; path: string; Icon: LucideIcon }> = [
  { label: 'INICIO', path: '/inicio', Icon: Home },
];

const sectionItems: Array<{ label: string; path: string; Icon: LucideIcon }> = [
  { label: 'GESTIÓN ESTRATÉGICA', path: '/gestion-estrategica', Icon: Target },
  { label: 'GESTIÓN FINANCIERA',  path: '/gestion-financiera',  Icon: Wallet },
  { label: 'GESTIÓN COMERCIAL',   path: '/gestion-comercial',   Icon: Briefcase },
  { label: 'GESTIÓN OPERATIVA',   path: '/gestion-operativa',   Icon: SlidersHorizontal },
  { label: 'INFORMACIÓN GENERAL', path: '/informacion-general', Icon: Info },
];

function rowCls(active: boolean) {
  return (
    'w-full flex items-center justify-between px-3.5 py-3 rounded-lg ' +
    'text-xs font-semibold tracking-wide transition-colors ' +
    (active
      ? 'text-gold-400 bg-gold-500/10'
      : 'text-cream-200/55 hover:text-cream-100 hover:bg-white/5')
  );
}

function getInitials(email: string): string {
  const user = email.split('@')[0];
  const parts = user.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : user.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, signOut } = useAuth();
  const [empresasOpen, setEmpresasOpen] = useState(false);

  function isActive(path: string) {
    if (path === '/empresas')
      return location.pathname === '/empresas' || location.pathname.startsWith('/empresa/');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  const activeEmpresaId = location.pathname.startsWith('/empresa/')
    ? location.pathname.split('/')[2]
    : null;

  return (
    <aside className="w-60 min-w-[240px] bg-navy-950 border-r border-white/8 flex flex-col shrink-0 min-h-screen">

      {/* Brand */}
      <div className="flex flex-col items-center gap-2.5 pt-6 pb-5 border-b border-white/8">
        <Logo9A size={56} />
        <div className="text-center space-y-0.5">
          <p className="text-cream-100 text-[11px] font-semibold tracking-[0.18em]">9 ALLIANCE</p>
          <p className="text-cream-200/30 text-[9px] tracking-[0.12em] uppercase">Portal Administrativo</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3.5 py-4">

        {/* Top items: INICIO */}
        <div className="space-y-0.5">
          {topItems.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)} className={rowCls(isActive(path))}>
              <span className="flex items-center gap-3">
                <Icon size={16} strokeWidth={1.8} className="shrink-0" />
                <span>{label}</span>
              </span>
            </button>
          ))}

          {/* EMPRESAS */}
          <div>
            <button
              onClick={() => { navigate('/empresas'); setEmpresasOpen(o => !o); }}
              className={rowCls(isActive('/empresas'))}
            >
              <span className="flex items-center gap-3">
                <Building2 size={16} strokeWidth={1.8} className="shrink-0" />
                <span>EMPRESAS</span>
              </span>
              <span
                className="shrink-0"
                onClick={e => { e.stopPropagation(); setEmpresasOpen(o => !o); }}
              >
                {empresasOpen
                  ? <ChevronDown size={13} strokeWidth={2} />
                  : <ChevronRight size={13} strokeWidth={2} />}
              </span>
            </button>

            {empresasOpen && (
              <div className="mt-0.5 mb-1 space-y-px">
                {realClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/empresa/${c.id}`)}
                    className={`w-full text-left py-1.5 pl-12 pr-3 rounded-md transition-colors text-[10.5px] ${
                      activeEmpresaId === c.id
                        ? 'text-gold-400 font-medium'
                        : 'text-cream-200/45 hover:text-cream-100'
                    }`}
                  >
                    <p className="truncate leading-snug">{c.nombre}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section items con separador */}
        <div className="mt-4 space-y-0.5">
          {sectionItems.map(({ label, path, Icon }) => (
            <button key={path} onClick={() => navigate(path)} className={rowCls(isActive(path))}>
              <span className="flex items-center gap-3">
                <Icon size={16} strokeWidth={1.8} className="shrink-0" />
                <span>{label}</span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Language switcher */}
      <div className="border-t border-white/8 px-4 py-2.5 flex items-center justify-between">
        <span className="text-cream-200/30 text-[9.5px] tracking-widest font-medium uppercase">Idioma</span>
        <LanguageSwitcher />
      </div>

      {/* User + logout */}
      <div className="border-t border-white/8 px-3.5 py-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg,#d4b96a,#C9A84C)', color: '#0d1829' }}
          >
            {user?.email ? getInitials(user.email) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cream-100 text-[12px] font-semibold truncate leading-tight">
              {user?.email?.split('@')[0] ?? 'Usuario'}
            </p>
            <p className="text-cream-200/35 text-[10px] truncate leading-tight">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-cream-200/50 hover:text-red-400 hover:bg-red-400/8 transition-colors text-[11.5px] font-medium"
        >
          <LogOut size={13} strokeWidth={1.9} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
