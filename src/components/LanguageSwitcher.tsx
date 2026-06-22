import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const active = i18n.language;

  function toggle(lang: string) {
    i18n.changeLanguage(lang);
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language selector">
      <button
        onClick={() => toggle('es')}
        aria-label={t('lang.cambiarEspanol')}
        title={t('lang.cambiarEspanol')}
        className={`text-lg transition-all leading-none ${active === 'es' ? 'opacity-100 scale-110 ring-1 ring-gold-500 rounded' : 'opacity-40 hover:opacity-70'}`}
      >🇪🇸</button>
      <button
        onClick={() => toggle('en')}
        aria-label={t('lang.cambiarIngles')}
        title={t('lang.cambiarIngles')}
        className={`text-lg transition-all leading-none ${active === 'en' ? 'opacity-100 scale-110 ring-1 ring-gold-500 rounded' : 'opacity-40 hover:opacity-70'}`}
      >🇺🇸</button>
    </div>
  );
}
