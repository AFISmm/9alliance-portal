import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, FileText, Download, CheckCircle, Star } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../auth/AuthContext';

const NAVY950 = '#0d1829';
const NAVY900 = '#1B2A4A';
const NAVY800 = '#243560';
const GOLD    = '#C9A84C';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CertForm {
  type: string;
  name: string;
}

const QUICK_ACTIONS = [
  { label: '¿Qué puedo hacer aquí?', text: '¿Qué funcionalidades tiene este módulo?' },
  { label: 'Solicitar certificado',   text: 'Quiero solicitar un certificado laboral'  },
  { label: 'Ver vencimientos',        text: '¿Cómo veo los vencimientos tributarios?'  },
  { label: 'Hablar con un asesor',    text: 'Quiero hablar con un asesor de 9 Alliance'},
];

const MODULE_LABELS: Record<string, string> = {
  '/inicio':              'Inicio',
  '/gestion-estrategica': 'Gestión Estratégica',
  '/gestion-financiera':  'Gestión Financiera',
  '/gestion-comercial':   'Gestión Comercial',
  '/gestion-operativa':   'Gestión Operativa',
  '/informacion-general': 'Información General',
  '/empresas':            'Empresas',
  '/perfil':              'Mi Perfil',
};

// ── Fetch logo as base64 for PDF embedding ──────────────────────────────────
async function fetchLogoBase64(): Promise<string | null> {
  try {
    const res  = await fetch('/logo-9a.png');
    const blob = await res.blob();
    return await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── PDF generation ───────────────────────────────────────────────────────────
async function downloadCertPDF(certType: string, name: string) {
  const labels: Record<string, string> = {
    laboral:  'CERTIFICADO LABORAL',
    ingresos: 'CERTIFICADO DE INGRESOS Y RETENCIONES',
    activo:   'CERTIFICADO DE EMPLEADO ACTIVO',
  };
  const title = labels[certType] ?? 'CERTIFICADO';
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Background
  doc.setFillColor(13, 24, 41);
  doc.rect(0, 0, 210, 297, 'F');

  // Gold top bar
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 0, 210, 5, 'F');

  // Logo
  const logoData = await fetchLogoBase64();
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', 90, 10, 30, 30); } catch { /* skip */ }
  }

  // Company name
  doc.setFontSize(20);
  doc.setTextColor(201, 168, 76);
  doc.setFont('helvetica', 'bold');
  doc.text('9 Alliance', 105, 48, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(124, 138, 156);
  doc.setFont('helvetica', 'normal');
  doc.text('Portal Administrativo · Documento oficial', 105, 55, { align: 'center' });

  // Divider
  doc.setDrawColor(36, 53, 96);
  doc.setLineWidth(0.4);
  doc.line(20, 61, 190, 61);

  // Certificate title
  doc.setFontSize(14);
  doc.setTextColor(248, 247, 244);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 72, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.setTextColor(174, 188, 205);
  doc.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Bogotá D.C., ${today}`, 105, 81, { align: 'center' });

  doc.line(20, 88, 190, 88);

  // Body
  const bodyLines = [
    { text: '9 Alliance SAS BIC, identificada con NIT 900.524.213-6, certifica que:', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: '', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: name, bold: true, color: [201, 168, 76] as [number,number,number] },
    { text: '', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: 'se encuentra vinculado(a) a esta organización en calidad de colaborador(a),', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: 'en los términos del contrato laboral vigente suscrito entre las partes.', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: '', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: 'Este certificado se expide a solicitud del interesado(a) para los fines', bold: false, color: [248, 247, 244] as [number,number,number] },
    { text: 'legales y personales que estime conveniente.', bold: false, color: [248, 247, 244] as [number,number,number] },
  ];

  let y = 100;
  for (const line of bodyLines) {
    doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
    doc.setFontSize(line.bold ? 12 : 11);
    doc.setTextColor(...line.color);
    if (line.text) doc.text(line.text, 22, y);
    y += line.bold ? 9 : 7;
  }

  // Signature line
  doc.setDrawColor(36, 53, 96);
  doc.line(22, 200, 95, 200);
  doc.setFontSize(9);
  doc.setTextColor(124, 138, 156);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma autorizada', 22, 207);
  doc.text('9 Alliance SAS BIC', 22, 213);

  // Footer divider
  doc.line(20, 248, 190, 248);
  doc.setFontSize(8);
  doc.text('Documento generado electrónicamente · 9 Alliance SAS BIC · mm@9alliance.co', 105, 255, { align: 'center' });

  // Gold bottom bar
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 292, 210, 5, 'F');

  const filename = `${title.replace(/\s+/g, '_')}_${name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

// ── Satisfaction survey ───────────────────────────────────────────────────────
function SatisfactionSurvey() {
  const [rating,    setRating]    = useState(0);
  const [hover,     setHover]     = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.3)' }}>
        <CheckCircle size={14} strokeWidth={2} style={{ color: '#34D399' }} />
        <span style={{ fontSize: 12.5, color: '#6EE7B7' }}>¡Gracias por tu calificación!</span>
      </div>
    );
  }

  return (
    <div style={{ background: '#162038', border: `1px solid ${NAVY800}`, borderRadius: 12, padding: '14px' }}>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#F8F7F4', fontWeight: 600 }}>
        ¿Quedaste satisfecho con la atención?
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#7C8A9C' }}>
        Califica la resolución de tu solicitud
      </p>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => { setRating(star); setTimeout(() => setSubmitted(true), 300); }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', transition: 'transform .1s', transform: hover >= star || rating >= star ? 'scale(1.2)' : 'scale(1)' }}
          >
            <Star
              size={24}
              strokeWidth={1.5}
              style={{
                color: hover >= star || rating >= star ? GOLD : '#243560',
                fill:  hover >= star || rating >= star ? GOLD : 'transparent',
                transition: 'color .15s, fill .15s',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Chatbot() {
  const { user } = useAuth();
  const location = useLocation();
  const [open,          setOpen]         = useState(false);
  const [messages,      setMessages]     = useState<Message[]>([]);
  const [input,         setInput]        = useState('');
  const [loading,       setLoading]      = useState(false);
  const [showCertForm,  setShowCertForm] = useState(false);
  const [certForm,      setCertForm]     = useState<CertForm>({ type: 'laboral', name: '' });
  const [showSurvey,    setShowSurvey]   = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const currentModule = Object.entries(MODULE_LABELS).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showCertForm, showSurvey]);

  const displayName = (user?.user_metadata?.display_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? '';

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const isCertIntent = /certificado|certific/i.test(trimmed);
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');

    // Certificate request → skip API, show form directly
    if (isCertIntent) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Con gusto te ayudo. Completa el siguiente formulario para generar tu certificado:',
      }]);
      setShowCertForm(true);
      setShowSurvey(false);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          currentModule,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content ?? 'No pude obtener una respuesta en este momento. Intenta de nuevo.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadCert(e: React.FormEvent) {
    e.preventDefault();
    if (!certForm.name.trim()) return;
    await downloadCertPDF(certForm.type, certForm.name.trim());
    setShowCertForm(false);
    setShowSurvey(true);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ El certificado de **${certForm.name}** se ha descargado correctamente.`,
    }]);
    setCertForm(p => ({ ...p, name: '' }));
  }

  function openChat() {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `¡Hola${displayName ? ', ' + displayName : ''}! Soy Julia, asistente de 9 Alliance. ¿En qué puedo ayudarte hoy?`,
      }]);
    }
  }

  const hasUserMessages = messages.some(m => m.role === 'user');

  return createPortal(
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={openChat}
          title="Julia · Asistente 9 Alliance"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            width: 54, height: 54, borderRadius: '50%',
            background: `linear-gradient(135deg,#d4b96a,${GOLD})`,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(201,168,76,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <MessageCircle size={24} strokeWidth={1.75} style={{ color: NAVY950 }} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 370, height: 570,
          background: NAVY900, border: `1px solid ${NAVY800}`,
          borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,.65)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>

          {/* Header */}
          <div style={{ background: `linear-gradient(135deg,${NAVY950},${NAVY900})`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${NAVY800}` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,#d4b96a,${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={18} strokeWidth={1.75} style={{ color: NAVY950 }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Julia</p>
              <p style={{ margin: 0, fontSize: 11, color: GOLD }}>● Asistente 9 Alliance</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C8A9C', padding: 4, display: 'flex' }}>
              <X size={17} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: m.role === 'user' ? `linear-gradient(135deg,#d4b96a,${GOLD})` : NAVY800,
                  fontSize: 10, fontWeight: 700, color: m.role === 'user' ? NAVY950 : GOLD,
                }}>
                  {m.role === 'user' ? (displayName ? displayName[0].toUpperCase() : 'U') : 'J'}
                </div>
                <div style={{
                  maxWidth: '76%', padding: '9px 12px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? `linear-gradient(135deg,#2d4175,${NAVY800})` : '#1e3050',
                  border: `1px solid ${m.role === 'user' ? NAVY800 : 'rgba(255,255,255,.07)'}`,
                  fontSize: 13, color: '#F8F7F4', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content.replace(/\*\*([^*]+)\*\*/g, '$1')}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: NAVY800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: GOLD }}>J</div>
                <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#1e3050', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="animate-bounce" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: GOLD, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Certificate form */}
            {showCertForm && (
              <div style={{ background: '#162038', border: `1px solid ${NAVY800}`, borderRadius: 12, padding: '14px', marginTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FileText size={15} strokeWidth={1.75} style={{ color: GOLD }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#F8F7F4' }}>Generar certificado</span>
                </div>
                <form onSubmit={handleDownloadCert} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <select
                    value={certForm.type}
                    onChange={e => setCertForm(p => ({ ...p, type: e.target.value }))}
                    style={{ background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 8, padding: '8px 10px', color: '#F8F7F4', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                  >
                    <option value="laboral">Certificado Laboral</option>
                    <option value="ingresos">Certificado de Ingresos y Retenciones</option>
                    <option value="activo">Certificado de Empleado Activo</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre completo del empleado"
                    value={certForm.name}
                    onChange={e => setCertForm(p => ({ ...p, name: e.target.value }))}
                    required
                    style={{ background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 8, padding: '8px 10px', color: '#F8F7F4', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowCertForm(false)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: GOLD, border: 'none', color: NAVY950, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Download size={13} strokeWidth={2} />
                      Descargar PDF
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Satisfaction survey */}
            {showSurvey && <SatisfactionSurvey />}

            <div ref={endRef} />
          </div>

          {/* Quick actions — always visible when no user messages yet */}
          {!hasUserMessages && (
            <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => sendMessage(a.text)}
                  style={{ padding: '5px 10px', borderRadius: 20, background: 'rgba(201,168,76,.1)', border: `1px solid ${GOLD}44`, color: GOLD, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${NAVY800}`, display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Escribe tu pregunta..."
              style={{ flex: 1, background: NAVY950, border: `1px solid ${NAVY800}`, borderRadius: 10, padding: '9px 12px', color: '#F8F7F4', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, borderRadius: 10, background: input.trim() ? GOLD : `${GOLD}44`, border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Send size={15} strokeWidth={2} style={{ color: input.trim() ? NAVY950 : `${NAVY950}88` }} />
            </button>
          </div>

        </div>
      )}
    </>,
    document.body
  );
}
