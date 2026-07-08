import { useState, useEffect } from 'react';
import {
  Users, Trash2, Pencil, X, Eye, EyeOff,
  Lock, CheckCircle, AlertCircle, RefreshCw, ShieldCheck,
  UserPlus, KeyRound, Copy, Mail,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const NAVY950 = '#0d1829';
const NAVY900 = '#1B2A4A';
const NAVY800 = '#243560';
const GOLD    = '#C9A84C';

const ADMIN_KEY = atob('OUFsbGlhbmNlMjAyNg==');

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: {
    display_name?: string; phone?: string;
    first_name?: string; second_name?: string;
    first_last_name?: string; second_last_name?: string;
    identification?: string;
  };
  app_metadata?: { provider?: string };
}

function getInitials(email: string) {
  const u = email.split('@')[0].split(/[._-]/);
  return u.length >= 2 ? (u[0][0] + u[1][0]).toUpperCase() : email.slice(0, 2).toUpperCase();
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', borderRadius: 9,
      background: type === 'success' ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
      border: `1px solid ${type === 'success' ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`,
      marginTop: 12,
    }}>
      {type === 'success'
        ? <CheckCircle size={15} style={{ color: '#34D399', flexShrink: 0, marginTop: 1 }} />
        : <AlertCircle size={15} style={{ color: '#F87171', flexShrink: 0, marginTop: 1 }} />}
      <span style={{ fontSize: 13, color: type === 'success' ? '#6EE7B7' : '#FCA5A5', lineHeight: 1.4 }}>{msg}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; autoComplete?: string;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === 'password';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, color: '#AEBCCD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: GOLD, marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPwd && showPwd ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: NAVY950, border: `1px solid ${NAVY800}`,
            borderRadius: 8, padding: isPwd ? '9px 38px 9px 12px' : '9px 12px',
            color: '#F8F7F4', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none',
          }}
        />
        {isPwd && (
          <button type="button" onClick={() => setShowPwd(p => !p)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7C8A9C', display: 'flex', padding: 0 }}>
            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Admin auth modal ──────────────────────────────────────────────────────────
function AdminModal({ onSuccess }: { onSuccess: () => void }) {
  const [pass, setPass]       = useState('');
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (pass.trim().toLowerCase() === ADMIN_KEY.toLowerCase()) {
        sessionStorage.setItem('9a_admin', '1');
        onSuccess();
      } else {
        setError('Credenciales incorrectas. Verifica la clave de administrador.');
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 16, padding: 32, width: 360, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} strokeWidth={1.75} style={{ color: GOLD }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Acceso de Administrador</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#7C8A9C', textAlign: 'center' }}>Este módulo requiere credenciales de administrador para acceder.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#AEBCCD', letterSpacing: '0.05em' }}>CLAVE DE ADMINISTRADOR</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7C8A9C', pointerEvents: 'none' }} />
            <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="Ingresa la clave" autoFocus
              style={{ width: '100%', boxSizing: 'border-box', background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 40px 10px 36px', color: '#F8F7F4', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            <button type="button" onClick={() => setShow(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7C8A9C', display: 'flex' }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {error && <Alert type="error" msg={error} />}
          <button type="submit" disabled={loading || !pass}
            style={{ padding: '11px 0', borderRadius: 9, background: GOLD, border: 'none', color: NAVY950, fontSize: 13, fontWeight: 700, cursor: loading || !pass ? 'not-allowed' : 'pointer', opacity: loading || !pass ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading && <span style={{ width: 13, height: 13, border: `2px solid ${NAVY950}55`, borderTopColor: NAVY950, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Add user modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    first_name: '', second_name: '', first_last_name: '', second_last_name: '',
    identification: '', email: '', phone: '', password: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function set(k: keyof typeof form) { return (v: string) => setForm(f => ({ ...f, [k]: v })); }

  const requiredFilled = form.first_name && form.first_last_name && form.second_last_name && form.identification && form.email && form.password;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setMsg({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' }); return; }
    setLoading(true); setMsg(null);
    try {
      const res  = await fetch('/api/admin-users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: 'Usuario creado correctamente.' });
      setTimeout(() => { onCreated(); onClose(); }, 1200);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message ?? 'Error creando usuario.' });
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 16, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} strokeWidth={1.75} style={{ color: GOLD }} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Agregar usuario</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7C8A9C', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nombres */}
          <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nombres</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Primer nombre" value={form.first_name} onChange={set('first_name')} placeholder="Ej: Juan" required />
            <Field label="Segundo nombre" value={form.second_name} onChange={set('second_name')} placeholder="Ej: Carlos" />
          </div>

          {/* Apellidos */}
          <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Apellidos</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Primer apellido" value={form.first_last_name} onChange={set('first_last_name')} placeholder="Ej: García" required />
            <Field label="Segundo apellido" value={form.second_last_name} onChange={set('second_last_name')} placeholder="Ej: López" required />
          </div>

          {/* Datos de contacto */}
          <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Datos de contacto</p>
          <Field label="Correo electrónico" value={form.email} onChange={set('email')} type="email" placeholder="correo@ejemplo.com" required autoComplete="off" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Número de identificación" value={form.identification} onChange={set('identification')} placeholder="Cédula / NIT" required />
            <Field label="Número de celular" value={form.phone} onChange={set('phone')} placeholder="Ej: 3001234567" />
          </div>

          {/* Contraseña */}
          <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Acceso</p>
          <Field label="Contraseña inicial" value={form.password} onChange={set('password')} type="password" placeholder="Mínimo 8 caracteres" required autoComplete="new-password" />
          <p style={{ margin: '-6px 0 0', fontSize: 11, color: '#7C8A9C' }}>El usuario podrá cambiarla desde su perfil o mediante el enlace de recuperación.</p>

          {msg && <Alert type={msg.type} msg={msg.text} />}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !requiredFilled}
              style={{ flex: 2, padding: '10px 0', borderRadius: 9, background: GOLD, border: 'none', color: NAVY950, fontSize: 13, fontWeight: 700, cursor: loading || !requiredFilled ? 'not-allowed' : 'pointer', opacity: loading || !requiredFilled ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <span style={{ width: 13, height: 13, border: `2px solid ${NAVY950}55`, borderTopColor: NAVY950, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              Crear usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reset password modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }: { user: SupabaseUser; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [link, setLink]       = useState('');
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');

  async function handleReset() {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin-users?action=reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLink(data.link ?? '');
    } catch (err: any) {
      setError(err.message ?? 'Error generando enlace de recuperación.');
    }
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 16, padding: 28, width: 420, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={16} strokeWidth={1.75} style={{ color: '#818CF8' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Restablecer contraseña</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7C8A9C', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>

        {!link ? (
          <>
            <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${NAVY800}`, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#AEBCCD' }}>
                Se generará un <strong style={{ color: '#F8F7F4' }}>enlace de recuperación</strong> para:
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: GOLD, fontWeight: 600 }}>{user.email}</p>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: '#7C8A9C' }}>
              El enlace es de un solo uso. Cópialo y envíaselo al usuario para que cree su nueva contraseña.
            </p>
            {error && <Alert type="error" msg={error} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleReset} disabled={loading}
                style={{ flex: 2, padding: '10px 0', borderRadius: 9, background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', color: '#A5B4FC', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading
                  ? <span style={{ width: 13, height: 13, border: '2px solid rgba(99,102,241,.3)', borderTopColor: '#818CF8', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  : <Mail size={14} />}
                Generar enlace
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
              <CheckCircle size={15} style={{ color: '#34D399', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: '#6EE7B7' }}>Enlace generado. Cópialo y envíaselo al usuario.</p>
            </div>
            <div style={{ background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 11, color: '#7C8A9C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
              <button onClick={copyLink}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: copied ? 'rgba(52,211,153,.15)' : 'rgba(255,255,255,.07)', border: `1px solid ${copied ? 'rgba(52,211,153,.3)' : NAVY800}`, color: copied ? '#34D399' : '#AEBCCD', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                <Copy size={12} /> {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 11.5, color: '#7C8A9C' }}>El enlace expira en 24 horas y solo puede usarse una vez.</p>
            <button onClick={onClose}
              style={{ width: '100%', padding: '10px 0', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Edit user modal ───────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }: { user: SupabaseUser; onClose: () => void; onSaved: () => void }) {
  const m = user.user_metadata ?? {};
  const [form, setForm] = useState({
    first_name:      m.first_name      ?? m.display_name?.split(' ')[0] ?? '',
    second_name:     m.second_name     ?? '',
    first_last_name: m.first_last_name ?? '',
    second_last_name:m.second_last_name?? '',
    identification:  m.identification  ?? '',
    email:           user.email        ?? '',
    phone:           m.phone           ?? '',
    password:        '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function set(k: keyof typeof form) { return (v: string) => setForm(f => ({ ...f, [k]: v })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.password && form.password.length < 8) {
      setMsg({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' }); return;
    }
    setLoading(true); setMsg(null);
    const display_name = [form.first_name, form.second_name, form.first_last_name, form.second_last_name].filter(Boolean).join(' ');
    const body: Record<string, string> = { display_name, ...form };
    if (!form.password) delete body.password;
    if (form.email === user.email) delete body.email;
    try {
      const res  = await fetch(`/api/admin-users?id=${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: 'Usuario actualizado correctamente.' });
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message ?? 'Error actualizando usuario.' });
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 16, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Editar usuario</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7C8A9C', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#7C8A9C' }}>{user.email}</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nombres</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Primer nombre" value={form.first_name} onChange={set('first_name')} placeholder="Ej: Juan" required />
            <Field label="Segundo nombre" value={form.second_name} onChange={set('second_name')} placeholder="Ej: Carlos" />
          </div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Apellidos</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Primer apellido" value={form.first_last_name} onChange={set('first_last_name')} placeholder="Ej: García" required />
            <Field label="Segundo apellido" value={form.second_last_name} onChange={set('second_last_name')} placeholder="Ej: López" required />
          </div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Datos de contacto</p>
          <Field label="Correo electrónico" value={form.email} onChange={set('email')} type="email" placeholder="correo@ejemplo.com" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Número de identificación" value={form.identification} onChange={set('identification')} placeholder="Cédula / NIT" required />
            <Field label="Número de celular" value={form.phone} onChange={set('phone')} placeholder="Ej: 3001234567" />
          </div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cambiar contraseña</p>
          <Field label="Nueva contraseña" value={form.password} onChange={set('password')} type="password" placeholder="Dejar vacío para no cambiar" autoComplete="new-password" />

          {msg && <Alert type={msg.type} msg={msg.text} />}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 2, padding: '10px 0', borderRadius: 9, background: GOLD, border: 'none', color: NAVY950, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <span style={{ width: 13, height: 13, border: `2px solid ${NAVY950}55`, borderTopColor: NAVY950, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onDeleted }: { user: SupabaseUser; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleDelete() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin-users?id=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDeleted(); onClose();
    } catch (err: any) {
      setError(err.message ?? 'Error eliminando usuario.');
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: NAVY900, border: '1px solid rgba(248,113,113,.3)', borderRadius: 16, padding: 28, width: 380, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Eliminar usuario</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7C8A9C', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#AEBCCD' }}>
          ¿Estás seguro de que deseas eliminar a <strong style={{ color: '#F8F7F4' }}>{user.user_metadata?.display_name || user.email}</strong>?
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: '#7C8A9C' }}>Esta acción no se puede deshacer. El usuario perderá acceso al portal inmediatamente.</p>
        {error && <Alert type="error" msg={error} />}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={loading}
            style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: 'rgba(248,113,113,.15)', border: '1px solid rgba(248,113,113,.35)', color: '#FCA5A5', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <span style={{ width: 13, height: 13, border: '2px solid rgba(248,113,113,.4)', borderTopColor: '#FCA5A5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <Trash2 size={14} />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GestionUsuariosPage() {
  const { user: currentUser } = useAuth();
  const [adminAuthed,   setAdminAuthed]   = useState(() => sessionStorage.getItem('9a_admin') === '1');
  const [users,         setUsers]         = useState<SupabaseUser[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [fetchError,    setFetchError]    = useState('');
  const [editTarget,    setEditTarget]    = useState<SupabaseUser | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<SupabaseUser | null>(null);
  const [resetTarget,   setResetTarget]   = useState<SupabaseUser | null>(null);
  const [showAddModal,  setShowAddModal]  = useState(false);

  useEffect(() => {
    if (adminAuthed) loadUsers();
  }, [adminAuthed]);

  async function loadUsers() {
    setLoading(true); setFetchError('');
    try {
      const res  = await fetch('/api/admin-users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error cargando usuarios');
      setUsers(data.users ?? []);
    } catch (e: any) {
      setFetchError(e.message);
    }
    setLoading(false);
  }

  if (!adminAuthed) return <AdminModal onSuccess={() => setAdminAuthed(true)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 960 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} strokeWidth={1.75} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Gestión de Usuarios</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#7C8A9C' }}>
              {users.length > 0 ? `${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}` : 'Administra las cuentas del portal'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadUsers} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 12.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={13} strokeWidth={2} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
          <button onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, background: GOLD, border: 'none', color: NAVY950, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus size={14} strokeWidth={2} />
            Agregar usuario
          </button>
        </div>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>Error al cargar usuarios</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#F87171' }}>{fetchError}</p>
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#7C8A9C' }}>
            Verifica que <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4 }}>SUPABASE_URL</code> y{' '}
            <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4 }}>SUPABASE_SERVICE_ROLE_KEY</code> estén en Vercel.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#7C8A9C', fontSize: 13 }}>
          <span style={{ display: 'inline-block', width: 20, height: 20, border: `2px solid ${NAVY800}`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 10 }} />
          <p style={{ margin: 0 }}>Cargando usuarios…</p>
        </div>
      )}

      {/* Table */}
      {!loading && !fetchError && users.length > 0 && (
        <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${NAVY800}` }}>
                  {['Usuario', 'Email', 'Identificación', 'Proveedor', 'Creado', 'Último acceso', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isMe        = u.id === currentUser?.id;
                  const m           = u.user_metadata ?? {};
                  const displayName = m.display_name || u.email?.split('@')[0] || '—';
                  const initials    = getInitials(u.email ?? '');
                  return (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? `1px solid rgba(36,53,96,.6)` : 'none', background: isMe ? 'rgba(201,168,76,.04)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMe ? `linear-gradient(135deg,#d4b96a,${GOLD})` : NAVY800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isMe ? NAVY950 : '#AEBCCD', flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#F8F7F4', whiteSpace: 'nowrap' }}>{displayName}</p>
                            {isMe && <span style={{ fontSize: 10, color: GOLD, fontWeight: 600 }}>Tú</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#AEBCCD', whiteSpace: 'nowrap', fontSize: 12 }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', color: '#7C8A9C', whiteSpace: 'nowrap', fontSize: 12 }}>{m.identification ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', padding: '2px 8px', borderRadius: 20, color: '#AEBCCD', textTransform: 'capitalize' }}>
                          {u.app_metadata?.provider ?? 'email'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#7C8A9C', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(u.created_at)}</td>
                      <td style={{ padding: '12px 16px', color: '#7C8A9C', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(u.last_sign_in_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setEditTarget(u)} title="Editar usuario"
                            style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pencil size={13} strokeWidth={1.8} />
                          </button>
                          <button onClick={() => setResetTarget(u)} title="Restablecer contraseña"
                            style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', color: '#818CF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <KeyRound size={13} strokeWidth={1.8} />
                          </button>
                          {!isMe && (
                            <button onClick={() => setDeleteTarget(u)} title="Eliminar usuario"
                              style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={13} strokeWidth={1.8} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !fetchError && users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#7C8A9C' }}>
          <Users size={32} strokeWidth={1.25} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No se encontraron usuarios.</p>
        </div>
      )}

      {/* Modals */}
      {showAddModal  && <AddUserModal    onClose={() => setShowAddModal(false)}  onCreated={loadUsers} />}
      {editTarget    && <EditModal       user={editTarget}    onClose={() => setEditTarget(null)}    onSaved={loadUsers} />}
      {deleteTarget  && <DeleteModal     user={deleteTarget}  onClose={() => setDeleteTarget(null)}  onDeleted={loadUsers} />}
      {resetTarget   && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
