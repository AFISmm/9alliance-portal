import { useState, useEffect } from 'react';
import {
  MessageSquarePlus, Send, Clock, CheckCircle2,
  AlertCircle, User, Hash, Mail, Lock, FileText,
  Loader2, Inbox, ChevronRight, Reply, X,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useDemo } from '../context/DemoContext';

// ── Types ──────────────────────────────────────────────────────────────
type PQRStatus = 'nueva' | 'en_revision' | 'resuelta';

interface PQR {
  id: string;
  nombre: string;
  apellido: string;
  identificacion: string;
  correo: string;
  correoDestino: string;
  mensaje: string;
  estado: PQRStatus;
  timestamp: number;
  respuesta?: string;
  respondidoEn?: number;
}

const LS_KEY     = '9a_pqrs_v1';
const ADMIN_NAME  = 'FELIPE SERNA';
const ADMIN_EMAIL = 'felipe.serna@mercurymethods.com';

function loadPQRs(): PQR[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

function savePQRs(list: PQR[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  catch {}
}

// ── Helpers ────────────────────────────────────────────────────────────
function statusConfig(s: PQRStatus): { label: string; color: string; bg: string; Icon: React.ElementType } {
  const map = {
    nueva:        { label: 'Nueva',       color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  Icon: Clock         },
    en_revision:  { label: 'En revisión', color: '#3b82f6', bg: 'rgba(59,130,246,.12)',  Icon: AlertCircle   },
    resuelta:     { label: 'Resuelta',    color: '#22c55e', bg: 'rgba(34,197,94,.12)',   Icon: CheckCircle2  },
  };
  return map[s];
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 10,
};

function InputField({
  label, icon: Icon, type = 'text', value, onChange, placeholder, disabled, required,
}: {
  label: string; icon: React.ElementType; type?: string;
  value: string; onChange?: (v: string) => void;
  placeholder?: string; disabled?: boolean; required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7C8A9C' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={14} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#566375', pointerEvents: 'none', zIndex: 1 }} />
        {disabled && <Lock size={12} strokeWidth={2} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#566375', pointerEvents: 'none' }} />}
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: disabled ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${disabled ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 8, padding: disabled ? '9px 34px 9px 34px' : '9px 14px 9px 34px',
            color: disabled ? '#566375' : '#F4F7FB',
            fontFamily: disabled ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
            fontSize: 13, outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────
export default function GestionPQRsPage() {
  const { demoMode } = useDemo();
  const { addNotification } = useNotifications();
  const [pqrs, setPQRs]     = useState<PQR[]>(loadPQRs);
  const [selected, setSelected] = useState<PQR | null>(null);

  // Developer: respuesta por PQR
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respuestaText, setRespuestaText] = useState('');
  const [sending, setSending]   = useState(false);
  const [sendOk, setSendOk]     = useState<string | null>(null); // pqr id que acaba de resolverse
  const [sendErr, setSendErr]   = useState('');

  // Form state (demo view)
  const [nombre,         setNombre]         = useState('');
  const [apellido,       setApellido]       = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [correo,         setCorreo]         = useState('');
  const [mensaje,        setMensaje]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [success,        setSuccess]        = useState(false);

  useEffect(() => { savePQRs(pqrs); }, [pqrs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));

    const pqr: PQR = {
      id: `pqr_${Date.now()}`,
      nombre:         nombre.trim(),
      apellido:       apellido.trim(),
      identificacion: identificacion.trim(),
      correo:         correo.trim(),
      correoDestino:  ADMIN_EMAIL,
      mensaje:        mensaje.trim(),
      estado:         'nueva',
      timestamp:      Date.now(),
    };

    setPQRs(prev => [pqr, ...prev]);

    addNotification({
      type:  'pqr',
      title: `Nueva PQR de ${pqr.nombre} ${pqr.apellido}`,
      body:  pqr.mensaje.slice(0, 120) + (pqr.mensaje.length > 120 ? '…' : ''),
      href:  '/gestion-pqrs',
    });

    setNombre(''); setApellido(''); setIdentificacion(''); setCorreo(''); setMensaje('');
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  function changeStatus(id: string, estado: PQRStatus) {
    setPQRs(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, estado } : prev);
  }

  async function handleSendResponse(p: PQR) {
    const texto = respuestaText.trim();
    if (!texto) return;
    setSending(true);
    setSendErr('');
    try {
      const res = await fetch('/api/pqr-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:    p.nombre,
          apellido:  p.apellido,
          correo:    p.correo,
          mensaje:   p.mensaje,
          respuesta: texto,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      // Marcar como resuelta y guardar respuesta
      const updated: PQR = { ...p, estado: 'resuelta', respuesta: texto, respondidoEn: Date.now() };
      setPQRs(prev => prev.map(q => q.id === p.id ? updated : q));
      setSelected(updated);
      setRespondingId(null);
      setRespuestaText('');
      setSendOk(p.id);
      setTimeout(() => setSendOk(null), 5000);
    } catch (e: unknown) {
      setSendErr(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  const counts = {
    nueva:       pqrs.filter(p => p.estado === 'nueva').length,
    en_revision: pqrs.filter(p => p.estado === 'en_revision').length,
    resuelta:    pqrs.filter(p => p.estado === 'resuelta').length,
  };

  // ── Vista demo: solo formulario de radicación ──────────────────────────
  if (demoMode !== null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquarePlus size={20} strokeWidth={1.7} style={{ color: '#C9A84C' }} />
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F4F7FB' }}>
            Radicar PQR
          </h2>
          <span style={{ fontSize: 11.5, color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>
            Peticiones, Quejas y Reclamos
          </span>
        </div>

        <div style={{ ...CARD, padding: '22px 20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Nombre"   icon={User} value={nombre}   onChange={setNombre}   placeholder="Tu nombre"   required />
              <InputField label="Apellido" icon={User} value={apellido} onChange={setApellido} placeholder="Tu apellido" required />
            </div>
            <InputField label="N° Identificación"   icon={Hash} value={identificacion} onChange={setIdentificacion} placeholder="CC / NIT" required />
            <InputField label="Correo electrónico"  icon={Mail} type="email" value={correo} onChange={setCorreo} placeholder="correo@ejemplo.com" required />
            <InputField label="Enviar PQR a"        icon={User} value={ADMIN_NAME} disabled />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7C8A9C' }}>
                Descripción del problema <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <FileText size={14} strokeWidth={1.8} style={{ position: 'absolute', left: 12, top: 12, color: '#566375', pointerEvents: 'none' }} />
                <textarea
                  value={mensaje} onChange={e => setMensaje(e.target.value)}
                  placeholder="Describe el problema que tienes con la plataforma…"
                  required rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 8, padding: '9px 14px 9px 34px',
                    color: '#F4F7FB', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    resize: 'vertical', outline: 'none', minHeight: 110,
                  }}
                />
              </div>
            </div>

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 8, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)' }}>
                <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: '#86efac' }}>
                  PQR radicada correctamente. Felipe Serna ha sido notificado.
                </span>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 8,
              background: submitting ? 'rgba(201,168,76,.5)' : '#C9A84C',
              border: 'none', color: '#0d1829',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} strokeWidth={2} />}
              {submitting ? 'Enviando…' : 'Radicar PQR'}
            </button>
          </form>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Vista desarrollador: gestión de PQRs recibidas ─────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MessageSquarePlus size={20} strokeWidth={1.7} style={{ color: '#C9A84C' }} />
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F4F7FB' }}>
          Gestión de PQRs
        </h2>
        <span style={{ fontSize: 11.5, color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>
          Peticiones, Quejas y Reclamos recibidas
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {([
          { key: 'nueva', label: 'Nuevas' },
          { key: 'en_revision', label: 'En revisión' },
          { key: 'resuelta', label: 'Resueltas' },
        ] as const).map(({ key, label }) => {
          const cfg = statusConfig(key);
          return (
            <div key={key} style={{ ...CARD, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7C8A9C' }}>{label}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{counts[key]}</span>
            </div>
          );
        })}
      </div>

      {/* PQR list — full width */}
      <div style={{ ...CARD, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Inbox size={15} strokeWidth={1.8} style={{ color: '#C9A84C' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#F4F7FB' }}>
            PQRs recibidas
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#7C8A9C' }}>
            {pqrs.length} total
          </span>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 600 }}>
          {pqrs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#566375', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              Aún no hay PQRs radicadas.
            </div>
          ) : (
            pqrs.map(p => {
              const cfg = statusConfig(p.estado);
              const isSelected = selected?.id === p.id;
              return (
                <div key={p.id}>
                  <div
                    onClick={() => setSelected(isSelected ? null : p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 16px',
                      borderBottom: '1px solid rgba(255,255,255,.04)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255,255,255,.04)' : 'transparent',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => !isSelected && ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.025)')}
                    onMouseLeave={e => !isSelected && ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <cfg.Icon size={14} strokeWidth={2} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, color: '#F4F7FB' }}>
                        {p.nombre} {p.apellido}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: '#7C8A9C', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.correo} · {new Date(p.timestamp).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 10.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                      <ChevronRight size={13} strokeWidth={2} style={{ color: '#566375', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ padding: '14px 18px 16px', background: 'rgba(255,255,255,.025)', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 20px' }}>
                        {[
                          { label: 'Identificación', val: p.identificacion },
                          { label: 'Correo',          val: p.correo },
                          { label: 'Enviado a',       val: p.correoDestino },
                          { label: 'Fecha',           val: new Date(p.timestamp).toLocaleString('es-CO') },
                        ].map(row => (
                          <div key={row.label}>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#566375' }}>{row.label}</span>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#AEBCCD', marginTop: 2, wordBreak: 'break-all' }}>{row.val}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#566375' }}>Mensaje</span>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: '#AEBCCD', marginTop: 5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{p.mensaje}</p>
                      </div>

                      {/* Respuesta existente */}
                      {p.respuesta && (
                        <div style={{ background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Reply size={12} strokeWidth={2} style={{ color: '#C9A84C' }} />
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C9A84C' }}>Respuesta enviada</span>
                            {p.respondidoEn && (
                              <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#566375' }}>
                                {new Date(p.respondidoEn).toLocaleString('es-CO')}
                              </span>
                            )}
                          </div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: '#F4F7FB', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{p.respuesta}</p>
                        </div>
                      )}

                      {/* Success banner */}
                      {sendOk === p.id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)' }}>
                          <CheckCircle2 size={13} strokeWidth={2} style={{ color: '#22c55e', flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#86efac' }}>
                            Respuesta enviada al correo del solicitante. PQR marcada como resuelta.
                          </span>
                        </div>
                      )}

                      {/* Formulario de respuesta */}
                      {respondingId === p.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#566375' }}>
                            Escribir respuesta
                          </label>
                          <textarea
                            value={respuestaText}
                            onChange={e => setRespuestaText(e.target.value)}
                            placeholder="Escribe aquí la respuesta que se enviará por correo al solicitante…"
                            rows={4}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)',
                              borderRadius: 8, padding: '9px 12px',
                              color: '#F4F7FB', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                              resize: 'vertical', outline: 'none', minHeight: 100,
                            }}
                          />
                          {sendErr && (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: '#f87171' }}>
                              {sendErr}
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleSendResponse(p)}
                              disabled={sending || !respuestaText.trim()}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 16px', borderRadius: 7,
                                background: sending || !respuestaText.trim() ? 'rgba(201,168,76,.4)' : '#C9A84C',
                                border: 'none', color: '#0d1829',
                                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                                cursor: sending || !respuestaText.trim() ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {sending
                                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Send size={12} strokeWidth={2} />
                              }
                              {sending ? 'Enviando…' : 'Enviar respuesta'}
                            </button>
                            <button
                              onClick={() => { setRespondingId(null); setRespuestaText(''); setSendErr(''); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '7px 12px', borderRadius: 7,
                                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
                                color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              <X size={12} strokeWidth={2} />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        p.estado !== 'resuelta' && !p.respuesta && (
                          <div>
                            <button
                              onClick={() => { setRespondingId(p.id); setRespuestaText(''); setSendErr(''); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 14px', borderRadius: 7,
                                background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)',
                                color: '#C9A84C', fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Reply size={13} strokeWidth={2} />
                              Responder
                            </button>
                          </div>
                        )
                      )}

                      {/* Estado manual (solo cuando no se está respondiendo) */}
                      {respondingId !== p.id && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#566375', alignSelf: 'center', marginRight: 4 }}>Cambiar estado:</span>
                          {(['nueva', 'en_revision', 'resuelta'] as PQRStatus[]).map(s => {
                            const c = statusConfig(s);
                            return (
                              <button key={s} onClick={() => changeStatus(p.id, s)} style={{
                                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                                background: p.estado === s ? c.bg : 'rgba(255,255,255,.04)',
                                border: `1px solid ${p.estado === s ? c.color + '66' : 'rgba(255,255,255,.08)'}`,
                                color: p.estado === s ? c.color : '#7C8A9C',
                              }}>
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
