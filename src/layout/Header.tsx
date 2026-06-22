import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Logo9A } from '../components/Logo9A';

export function Header() {
  const { signOut, user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-13 bg-navy-950 border-b border-white/10 flex items-center justify-between px-5 shrink-0" style={{ height: '52px' }}>
      <div className="flex items-center gap-3">
        <Logo9A size={30} />
        <span className="text-cream-100 font-semibold text-sm tracking-wide">9 Alliance</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-cream-200/35 hidden md:block truncate max-w-[200px]">{user?.email}</span>
        <LanguageSwitcher />
        <button
          onClick={signOut}
          className="text-xs text-cream-200/60 hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-red-400/10"
        >
          {t('nav.cerrarSesion')}
        </button>
      </div>
    </header>
  );
}
