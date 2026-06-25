import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo9A } from '../components/Logo9A';
import { realClients } from '../data/clients';

const navItems = [
  { label: 'Empresas',             path: '/empresas'            },
  { label: 'Gestión Estratégica',  path: '/gestion-estrategica' },
  { label: 'Gestión Financiera',   path: '/gestion-financiera'  },
  { label: 'Gestión Comercial',    path: '/gestion-comercial'   },
  { label: 'Gestión Operativa',    path: '/gestion-operativa'   },
  { label: 'Información General',  path: '/informacion-general' },
] as const;

export function Sidebar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [empresasOpen, setEmpresasOpen] = useState(true);

  function isActive(path: string) {
    if (path === '/empresas') {
      return location.pathname === '/empresas' || location.pathname.startsWith('/empresa/');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  const activeEmpresaId = location.pathname.startsWith('/empresa/')
    ? location.pathname.split('/')[2]
    : null;

  return (
    <aside className="w-52 min-w-[200px] bg-navy-950 border-r border-white/8 flex flex-col shrink-0 min-h-screen">

      {/* Brand */}
      <div className="flex flex-col items-center gap-2.5 pt-6 pb-5 border-b border-white/8">
        <Logo9A size={56} />
        <div className="text-center space-y-0.5">
          <p className="text-cream-100 text-[11px] font-semibold tracking-[0.18em]">9 ALLIANCE</p>
          <p className="text-cream-200/30 text-[9px] tracking-[0.12em] uppercase">Portal Administrativo</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-3 space-y-px">
        {navItems.map(({ label, path }) => {
          const active = isActive(path);
          const isEmpresas = path === '/empresas';

          return (
            <div key={path}>
              <button
                onClick={() => { navigate(path); if (isEmpresas) setEmpresasOpen(true); }}
                className={`w-full flex items-center justify-between pl-3 pr-2.5 py-2.5 rounded-lg text-[11px] font-medium tracking-wide transition border-l-2
                  ${active
                    ? 'text-gold-400 bg-gold-500/10 border-gold-500/70'
                    : 'text-cream-200/50 hover:text-cream-100 hover:bg-white/4 border-transparent'
                  }`}
              >
                <span>{label}</span>
                {isEmpresas && (
                  <span
                    className={`text-[10px] pl-1 transition ${active ? 'text-gold-400/70' : 'text-cream-200/30'}`}
                    onClick={e => { e.stopPropagation(); setEmpresasOpen(o => !o); }}
                  >
                    {empresasOpen ? '▾' : '▸'}
                  </span>
                )}
              </button>

              {/* Empresas sub-list */}
              {isEmpresas && empresasOpen && (
                <div className="mt-0.5 mb-1 ml-3 space-y-px border-l border-white/8 pl-3">
                  {realClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/empresa/${c.id}`)}
                      className={`w-full text-left py-1.5 px-2 rounded-md transition text-[10.5px]
                        ${activeEmpresaId === c.id
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
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-4 py-3">
        <p className="text-cream-200/20 text-[9px] tracking-widest text-center font-medium">v 2.0 · 2026</p>
      </div>
    </aside>
  );
}
