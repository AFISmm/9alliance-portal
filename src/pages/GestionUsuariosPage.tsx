import { useState, useEffect } from 'react';
import {
  Users, Trash2, Pencil, X, Eye, EyeOff,
  Lock, CheckCircle, AlertCircle, RefreshCw, ShieldCheck,
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
  user_metadata?: { display_name?: string; phone?: string };
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
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 9,
      background: type === 'success' ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
      border: `1px solid ${type === 'success' ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`,
      marginTop: 12,
    }}>
      {type === 'success'
        ? <CheckCircle size={15} style={{ color: '#34D399', flexShrink: 0 }} />
        : <AlertCircle size={15} style={{ color: '#F87171', flexShrink: 0 }} />}
      <span style={{ fontSize: 13, color: type === 'success' ? '#6EE7B7' : '#FCA5A5' }}>{msg}</span>
    </div>
  );
}

// ── Admin auth modal ──────────────────────────────────────────────────────────
function AdminModal({ onSuccess }: { onSuccess: () => void }) {
  const [pass, setPass]     = useState('');
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState('');
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
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: `rgba(201,168,76,.12)`, border: `1px solid rgba(201,168,76,.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} strokeWidth={1.75} style={{ color: GOLD }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Acceso de Administrador</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#7C8A9C', textAlign: 'center' }}>Este módulo requiere credenciales de administrador para acceder.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#AEBCCD', letterSpacing: '0.05em' }}>CLAVE DE ADMINISTRADOR</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7C8A9C', pointerEvents: 'none' }} />
            <input
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="Ingresa la clave"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 40px 10px 36px', color: '#F8F7F4', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
            />
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

// ── Edit user modal ───────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }: { user: SupabaseUser; onClose: () => void; onSaved: () => void }) {
  const [name,    setName]    = useState(user.user_metadata?.display_name ?? '');
  const [email,   setEmail]   = useState(user.email ?? '');
  const [pwd,     setPwd]     = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const body: Record<string, string> = { display_name: name.trim() };
    if (email.trim() !== user.email) body.email = email.trim();
    if (pwd.trim()) {
      if (pwd.trim().length < 8) { setMsg({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' }); setLoading(false); return; }
      body.password = pwd.trim();
    }
    try {
      const res = await fetch(`/api/admin-users?id=${user.id}`, {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 16, padding: 28, width: 400, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Editar usuario</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7C8A9C', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#7C8A9C' }}>{user.email}</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'NOMBRE PARA MOSTRAR', value: name, set: setName, type: 'text', placeholder: 'Nombre completo' },
            { label: 'CORREO ELECTRÓNICO',  value: email, set: setEmail, type: 'email', placeholder: 'correo@ejemplo.com' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#AEBCCD', letterSpacing: '0.05em' }}>{label}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 14px', color: '#F8F7F4', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#AEBCCD', letterSpacing: '0.05em' }}>NUEVA CONTRASEÑA (opcional)</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Dejar vacío para no cambiar"
                style={{ width: '100%', boxSizing: 'border-box', background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 9, padding: '10px 40px 10px 14px', color: '#F8F7F4', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7C8A9C', display: 'flex' }}>
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {msg && <Alert type={msg.type} msg={msg.text} />}

          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: '11px 0', borderRadius: 9, background: GOLD, border: 'none', color: NAVY950, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading && <span style={{ width: 13, height: 13, border: `2px solid ${NAVY950}55`, borderTopColor: NAVY950, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            Guardar cambios
          </button>
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
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Error eliminando usuario.');
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
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
  const [adminAuthed, setAdminAuthed] = useState(() => sessionStorage.getItem('9a_admin') === '1');
  const [users,       setUsers]       = useState<SupabaseUser[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [fetchError,  setFetchError]  = useState('');
  const [editTarget,  setEditTarget]  = useState<SupabaseUser | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<SupabaseUser | null>(null);

  useEffect(() => {
    if (adminAuthed) loadUsers();
  }, [adminAuthed]);

  async function loadUsers() {
    setLoading(true);
    setFetchError('');
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

  if (!adminAuthed) {
    return <AdminModal onSuccess={() => setAdminAuthed(true)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `rgba(201,168,76,.1)`, border: `1px solid rgba(201,168,76,.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} strokeWidth={1.75} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Gestión de Usuarios</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#7C8A9C' }}>
              {users.length > 0 ? `${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}` : 'Administra las cuentas del portal'}
            </p>
          </div>
        </div>
        <button onClick={loadUsers} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 12.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={13} strokeWidth={2} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 12, padding: '14px 18px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#FCA5A5', fontWeight: 600 }}>Error al cargar usuarios</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#F87171' }}>{fetchError}</p>
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#7C8A9C' }}>
            Verifica que las variables <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4 }}>SUPABASE_URL</code> y{' '}
            <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4 }}>SUPABASE_SERVICE_ROLE_KEY</code> estén configuradas en Vercel.
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

      {/* Users table */}
      {!loading && !fetchError && users.length > 0 && (
        <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${NAVY800}` }}>
                  {['Usuario', 'Email', 'Proveedor', 'Creado', 'Último acceso', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  const displayName   = u.user_metadata?.display_name || u.email?.split('@')[0] || '—';
                  const initials      = getInitials(u.email ?? '');
                  return (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? `1px solid rgba(36,53,96,.6)` : 'none', background: isCurrentUser ? 'rgba(201,168,76,.04)' : 'transparent' }}>
                      {/* Avatar + name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: isCurrentUser ? `linear-gradient(135deg,#d4b96a,${GOLD})` : NAVY800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isCurrentUser ? NAVY950 : '#AEBCCD', flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#F8F7F4', whiteSpace: 'nowrap' }}>{displayName}</p>
                            {isCurrentUser && <span style={{ fontSize: 10, color: GOLD, fontWeight: 600 }}>Tú</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#AEBCCD', whiteSpace: 'nowrap' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, background: 'rgba(255,255,255,.07)', border: `1px solid rgba(255,255,255,.1)`, padding: '2px 8px', borderRadius: 20, color: '#AEBCCD', textTransform: 'capitalize' }}>
                          {u.app_metadata?.provider ?? 'email'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#7C8A9C', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(u.created_at)}</td>
                      <td style={{ padding: '12px 16px', color: '#7C8A9C', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(u.last_sign_in_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setEditTarget(u)}
                            title="Editar usuario"
                            style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Pencil size={13} strokeWidth={1.8} />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Eliminar usuario"
                              style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
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
      {editTarget   && <EditModal   user={editTarget}   onClose={() => setEditTarget(null)}   onSaved={loadUsers} />}
      {deleteTarget && <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={loadUsers} />}

      {/* Spin keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
