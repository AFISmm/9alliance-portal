import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Logo9A } from '../components/Logo9A';

export function Header() {
  return (
    <header className="h-13 bg-navy-950 border-b border-white/10 flex items-center justify-between px-5 shrink-0" style={{ height: '52px' }}>
      <div className="flex items-center gap-3">
        <Logo9A size={30} />
        <span className="text-cream-100 font-semibold text-sm tracking-wide">9 Alliance</span>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
