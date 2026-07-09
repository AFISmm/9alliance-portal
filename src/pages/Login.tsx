import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useDemo } from '../context/DemoContext';
import { Logo9A } from '../components/Logo9A';
import { Building2, HardHat } from 'lucide-react';

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

  function handleDemo(mode: 'empresa' | 'empleado') {
    enterDemo(mode);
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

        {/* Demo options */}
        <div className="mt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-cream-200/30 text-xs tracking-widest">DEMO</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Demo Empresa */}
            <button
              onClick={() => handleDemo('empresa')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '14px 10px',
                background: 'rgba(201,168,76,.06)',
                border: '1px solid rgba(201,168,76,.25)',
                borderRadius: 10, cursor: 'pointer',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,.12)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,.25)';
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,168,76,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={17} strokeWidth={1.8} style={{ color: '#C9A84C' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: '.04em' }}>DEMO EMPRESA</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7C8A9C', marginTop: 2 }}>Todos los módulos</div>
              </div>
            </button>

            {/* Demo Empleado */}
            <button
              onClick={() => handleDemo('empleado')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '14px 10px',
                background: 'rgba(74,127,212,.06)',
                border: '1px solid rgba(74,127,212,.25)',
                borderRadius: 10, cursor: 'pointer',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,127,212,.12)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(74,127,212,.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,127,212,.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(74,127,212,.25)';
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,127,212,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardHat size={17} strokeWidth={1.8} style={{ color: '#4A7FD4' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: '#4A7FD4', letterSpacing: '.04em' }}>DEMO EMPLEADO</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7C8A9C', marginTop: 2 }}>Vista operativa</div>
              </div>
            </button>
          </div>

          <p className="text-center text-[10px] text-cream-200/20 mt-3">
            Sin necesidad de cuenta · Datos ficticios
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
