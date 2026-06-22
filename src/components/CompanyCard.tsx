import { company } from '../data/company';
import { Logo9A } from './Logo9A';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { key: 'inicio', path: '/' },
  { key: 'calendario', path: '/calendario' },
  { key: 'calculadoras', path: '/calculadoras' },
  { key: 'indicadores', path: '/indicadores' },
] as const;

export function CompanyCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="px-4 pt-5 pb-3">
      <div className="flex justify-center mb-3">
        <Logo9A size={72} />
      </div>
      <div className="text-center mb-4">
        <h2 className="text-cream-100 font-semibold text-base leading-tight">{company.razonSocial}</h2>
        <p className="text-gold-400 text-xs mt-0.5">{company.tipo}</p>
      </div>

      <div className="space-y-1 mb-4 text-xs text-cream-200/70">
        <p><span className="text-cream-200/40">NIT</span> {company.nit}</p>
        <p><span className="text-cream-200/40">Dir.</span> {company.direccion}</p>
        <p><span className="text-cream-200/40">Tel.</span> {company.telefono}</p>
        <p><span className="text-cream-200/40">✉</span> {company.email}</p>
      </div>

      <div className="border-t border-white/10 pt-3 space-y-0.5">
        {navItems.map(({ key, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition font-medium
                ${isActive
                  ? 'text-gold-400 bg-gold-500/10'
                  : 'text-cream-200/70 hover:text-cream-100 hover:bg-white/5'
                }`}
            >
              {t(`nav.${key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
