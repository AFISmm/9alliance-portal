import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Header() {
  const { signOut, user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-12 bg-navy-950 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
      <div className="text-sm text-cream-200/60 truncate max-w-xs">{user?.email}</div>
      <div className="flex items-center gap-4">
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
