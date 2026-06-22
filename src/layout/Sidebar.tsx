import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo9A } from '../components/Logo9A';

const navItems = [
  { key: 'inicio',           path: '/',            exact: true  },
  { key: 'calendario',       path: '/calendario',  exact: false },
  { key: 'clientesExternos', path: '/clientes',    exact: false },
  { key: 'calculadoras',     path: '/calculadoras',exact: false },
  { key: 'indicadores',      path: '/indicadores', exact: false },
] as const;

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  function isActive(path: string, exact: boolean) {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <aside className="w-52 min-w-[200px] bg-navy-950 border-r border-white/10 flex flex-col shrink-0 min-h-screen">
      <div className="flex justify-center pt-6 pb-5 border-b border-white/10">
        <Logo9A size={64} />
      </div>

      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {navItems.map(({ key, path, exact }) => (
          <button
            key={key}
            onClick={() => navigate(path)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition
              ${isActive(path, exact)
                ? 'text-gold-400 bg-gold-500/10'
                : 'text-cream-200/65 hover:text-cream-100 hover:bg-white/5'
              }`}
          >
            {t(`nav.${key}`)}
          </button>
        ))}
      </nav>
    </aside>
  );
}
