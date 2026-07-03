import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useDemo } from '../context/DemoContext';
import { Logo9A } from '../components/Logo9A';
import { Play } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { enterDemo } = useDemo();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError(t('auth.errorCorreo'));
    if (password.length < 8) return setError(t('auth.errorContrasena'));
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) return setError(t('auth.errorCredenciales'));
    navigate('/');
  }

  function handleDemo() {
    enterDemo();
    navigate('/');
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-navy-900 px-4 min-h-screen">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo9A size={100} />
        </div>
        <h1 className="text-2xl text-cream-100 text-center mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 400 }}>9 Alliance</h1>
        <p className="text-gold-400 text-center text-sm mb-8">{t('auth.portal')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-cream-200 mb-1">{t('auth.correo')}</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500 transition"
              autoComplete="email" required
            />
          </div>
          <div>
            <label className="block text-sm text-cream-200 mb-1">{t('auth.contrasena')}</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500 transition"
              autoComplete="current-password" required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? '...' : t('auth.entrar')}
          </button>
        </form>

        {/* Demo button */}
        <div className="mt-4">
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-cream-200/30 text-xs">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <button
            onClick={handleDemo}
            className="w-full flex items-center justify-center gap-2.5 border border-gold-500/30 hover:border-gold-500/60 hover:bg-gold-500/5 text-gold-400 font-semibold py-2.5 rounded-lg transition"
          >
            <Play size={15} strokeWidth={2} />
            Explorar Demo
          </button>
          <p className="text-center text-[11px] text-cream-200/25 mt-2">
            Empresas ficticias · Sin necesidad de cuenta
          </p>
        </div>

        <p className="text-center text-sm text-cream-200 mt-6">
          {t('auth.sinCuenta')}{' '}
          <Link to="/registro" className="text-gold-400 hover:text-gold-300 underline">
            {t('auth.registrarse')}
          </Link>
        </p>
      </div>
    </div>
  );
}
