import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo9A } from '../components/Logo9A';
import { realClients } from '../data/clients';

const navItems = [
  { label: 'EMPRESAS',             path: '/empresas'            },
  { label: 'GESTIÓN ESTRATÉGICA',  path: '/gestion-estrategica' },
  { label: 'GESTIÓN FINANCIERA',   path: '/gestion-financiera'  },
  { label: 'GESTIÓN COMERCIAL',    path: '/gestion-comercial'   },
  { label: 'GESTIÓN OPERATIVA',    path: '/gestion-operativa'   },
  { label: 'INFORMACIÓN GENERAL',  path: '/informacion-general' },
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
    <aside className="w-52 min-w-[200px] bg-navy-950 border-r border-white/10 flex flex-col shrink-0 min-h-screen">
      <div className="flex justify-center pt-6 pb-5 border-b border-white/10">
        <Logo9A size={64} />
      </div>

      <nav className="px-3 pt-4 flex-1 space-y-0.5">
        {navItems.map(({ label, path }) => {
          const active = isActive(path);
          const isEmpresas = path === '/empresas';

          return (
            <div key={path}>
              <button
                onClick={() => { navigate(path); if (isEmpresas) setEmpresasOpen(true); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition
                  ${active
                    ? 'text-gold-400 bg-gold-500/10'
                    : 'text-cream-200/55 hover:text-cream-100 hover:bg-white/5'
                  }`}
              >
                <span>{label}</span>
                {isEmpresas && (
                  <span
                    className="text-gold-400/60 text-xs pl-2"
                    onClick={e => { e.stopPropagation(); setEmpresasOpen(o => !o); }}
                  >
                    {empresasOpen ? '▾' : '▸'}
                  </span>
                )}
              </button>

              {/* Empresas sub-list */}
              {isEmpresas && empresasOpen && (
                <div className="mt-0.5 mb-1 space-y-0.5">
                  {realClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/empresa/${c.id}`)}
                      className={`w-full text-left pl-6 pr-3 py-2 rounded-lg transition text-xs
                        ${activeEmpresaId === c.id
                          ? 'text-gold-400 bg-gold-500/10'
                          : 'text-cream-200/55 hover:text-cream-100 hover:bg-white/5'
                        }`}
                    >
                      <p className="font-medium truncate">{c.nombre}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
