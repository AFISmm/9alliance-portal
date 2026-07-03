import { useState } from 'react';
import { User, Phone, Lock, CheckCircle, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

const NAVY950 = '#0d1829';
const NAVY900 = '#1B2A4A';
const NAVY800 = '#243560';
const GOLD    = '#C9A84C';

function getInitials(email: string): string {
  const user = email.split('@')[0];
  const parts = user.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : user.slice(0, 2).toUpperCase();
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${NAVY800}` }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#AEBCCD', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, disabled, type = 'text'
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        background: disabled ? `${NAVY800}80` : NAVY950,
        border: `1px solid ${NAVY800}`,
        borderRadius: 9,
        padding: '10px 14px',
        color: disabled ? '#7C8A9C' : '#F8F7F4',
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 9,
      background: type === 'success' ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
      border: `1px solid ${type === 'success' ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`,
    }}>
      {type === 'success'
        ? <CheckCircle size={15} strokeWidth={2} style={{ color: '#34D399', flexShrink: 0 }} />
        : <AlertCircle size={15} strokeWidth={2} style={{ color: '#F87171', flexShrink: 0 }} />}
      <span style={{ fontSize: 13, color: type === 'success' ? '#6EE7B7' : '#FCA5A5' }}>{msg}</span>
    </div>
  );
}

function SaveBtn({ loading, label = 'Guardar cambios' }: { loading?: boolean; label?: string }) {
  return (
    <button
      type="submit" disabled={loading}
      style={{
        padding: '10px 20px', borderRadius: 9, background: GOLD, border: 'none',
        color: NAVY950, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      {loading
        ? <span className="animate-spin" style={{ display: 'inline-block', width: 13, height: 13, border: `2px solid ${NAVY950}55`, borderTopColor: NAVY950, borderRadius: '50%' }} />
        : null}
      {label}
    </button>
  );
}

export default function PerfilPage() {
  const { user } = useAuth();

  // ── Info personal ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState<string>(
    (user?.user_metadata?.display_name as string | undefined) ?? ''
  );
  const [phone, setPhone] = useState<string>(
    (user?.user_metadata?.phone as string | undefined) ?? ''
  );
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMsg(null);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim(), phone: phone.trim() },
    });
    setInfoLoading(false);
    setInfoMsg(error
      ? { type: 'error', text: 'No se pudo actualizar. Intenta de nuevo.' }
      : { type: 'success', text: 'Información actualizada correctamente.' }
    );
  }

  // ── Contraseña ─────────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd,     setNewPwd]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwds,   setShowPwds]     = useState(false);
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdMsg,     setPwdMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 8) return setPwdMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    if (newPwd !== confirmPwd) return setPwdMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
    setPwdLoading(true);
    // Re-authenticate first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPwd,
    });
    if (signInErr) {
      setPwdLoading(false);
      return setPwdMsg({ type: 'error', text: 'Contraseña actual incorrecta.' });
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (error) {
      setPwdMsg({ type: 'error', text: 'No se pudo cambiar la contraseña. Intenta de nuevo.' });
    } else {
      setPwdMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    }
  }

  const email = user?.email ?? '';
  const initials = email ? getInitials(email) : 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 680 }}>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg,${NAVY950} 0%,${NAVY900} 100%)`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18, border: `1px solid ${NAVY800}` }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg,#d4b96a,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: NAVY950, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>
            {displayName || email.split('@')[0]}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#7C8A9C' }}>{email}</p>
        </div>
      </div>

      {/* ── Información personal ── */}
      <Card title="Información personal">
        <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="NOMBRE PARA MOSTRAR">
              <div style={{ position: 'relative' }}>
                <User size={15} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7C8A9C', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Tu nombre completo"
                  style={{ width: '100%', boxSizing: 'border-box', background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 14px 10px 36px', color: '#F8F7F4', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                />
              </div>
            </Field>
            <Field label="CELULAR">
              <div style={{ position: 'relative' }}>
                <Phone size={15} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7C8A9C', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  style={{ width: '100%', boxSizing: 'border-box', background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 14px 10px 36px', color: '#F8F7F4', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                />
              </div>
            </Field>
          </div>
          <Field label="CORREO ELECTRÓNICO">
            <TextInput value={email} disabled placeholder="—" />
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#7C8A9C' }}>El correo se gestiona a través de tu cuenta de autenticación.</p>
          </Field>
          {infoMsg && <Alert type={infoMsg.type} msg={infoMsg.text} />}
          <div><SaveBtn loading={infoLoading} /></div>
        </form>
      </Card>

      {/* ── Seguridad ── */}
      <Card title="Seguridad — Cambiar contraseña">
        <form onSubmit={handleChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'CONTRASEÑA ACTUAL',   value: currentPwd, set: setCurrentPwd },
            { label: 'NUEVA CONTRASEÑA',    value: newPwd,     set: setNewPwd     },
            { label: 'CONFIRMAR CONTRASEÑA', value: confirmPwd, set: setConfirmPwd },
          ].map(({ label, value, set }) => (
            <Field key={label} label={label}>
              <div style={{ position: 'relative' }}>
                <Lock size={15} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7C8A9C', pointerEvents: 'none' }} />
                <input
                  type={showPwds ? 'text' : 'password'}
                  value={value}
                  onChange={e => set(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 40px 10px 36px', color: '#F8F7F4', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwds(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7C8A9C', padding: 2, display: 'flex' }}
                >
                  {showPwds ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </Field>
          ))}
          <p style={{ margin: 0, fontSize: 11.5, color: '#7C8A9C' }}>Mínimo 8 caracteres.</p>
          {pwdMsg && <Alert type={pwdMsg.type} msg={pwdMsg.text} />}
          <div>
            <SaveBtn loading={pwdLoading} label="Cambiar contraseña" />
          </div>
        </form>
      </Card>

      {/* ── Información de sesión ── */}
      <Card title="Información de sesión">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'ID de usuario', value: user?.id?.slice(0, 18) + '…' },
            { label: 'Proveedor',     value: user?.app_metadata?.provider ?? 'email' },
            { label: 'Último acceso', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-CO') : '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${NAVY800}` }}>
              <span style={{ fontSize: 13, color: '#AEBCCD' }}>{row.label}</span>
              <span style={{ fontSize: 13, color: '#F8F7F4', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
