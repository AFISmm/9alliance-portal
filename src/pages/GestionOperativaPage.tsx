import { useState, useMemo } from 'react';
import {
  LayoutDashboard, FileText, Plane, Wallet, MessageSquare,
  Activity, Folder, Package, Target, ShieldCheck,
  Calendar, Briefcase, CheckCircle2, ArrowRight,
  Download, Upload, Plus, Clock, Bell, Moon, Sun,
  ChevronRight, AlertCircle, Monitor, Smartphone, KeyRound,
} from 'lucide-react';

// ── 9 Alliance palette ─────────────────────────────────────────────────────
const GOLD    = '#C9A84C';
const GOLD_LT = '#d4b96a';
const NAVY950 = '#0d1829';
const NAVY900 = '#1B2A4A';
const NAVY800 = '#243560';
const NAVY700 = '#2d4175';
const BLUE    = '#4A7FD4';

const DARK = { page: NAVY950, card: NAVY900, line: NAVY800, t1: '#F8F7F4', t2: '#AEBCCD', t3: '#7C8A9C', track: NAVY800, goldBg: 'rgba(201,168,76,.1)', blueBg: 'rgba(74,127,212,.12)' };
const LIGHT = { page: '#F2F5F9', card: '#ffffff', line: '#E4EAF1', t1: NAVY950, t2: '#46556A', t3: '#8A98AB', track: '#E4EAF1', goldBg: 'rgba(201,168,76,.09)', blueBg: '#E4EEFB' };

type Theme = 'oscuro' | 'claro';
type Mod   = 'inicio' | 'contrato' | 'vacaciones' | 'nomina' | 'solicitudes' | 'incapacidades' | 'documentos' | 'activos' | 'objetivos' | 'certificados';

const NAV: { id: Mod; label: string; Icon: React.ElementType }[] = [
  { id: 'inicio',         label: 'Inicio',          Icon: LayoutDashboard },
  { id: 'contrato',       label: 'Mi contrato',     Icon: FileText        },
  { id: 'vacaciones',     label: 'Vacaciones',      Icon: Plane           },
  { id: 'nomina',         label: 'Nómina',          Icon: Wallet          },
  { id: 'solicitudes',    label: 'Mis solicitudes', Icon: MessageSquare   },
  { id: 'incapacidades',  label: 'Incapacidades',   Icon: Activity        },
  { id: 'documentos',     label: 'Documentos',      Icon: Folder          },
  { id: 'activos',        label: 'Activos',         Icon: Package         },
  { id: 'objetivos',      label: 'Objetivos',       Icon: Target          },
  { id: 'certificados',   label: 'Certificados',    Icon: ShieldCheck     },
];

const BAR_H = [30, 42, 55, 62, 70, 80, 87, 94, 100];

function calcDaysToPay(t: Date) { return new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate() - t.getDate(); }
function calcPct(t: Date)       { return Math.round((t.getDate() / new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()) * 100); }
function calcTenure(t: Date)    { return Math.floor((t.getTime() - new Date('2025-09-01').getTime()) / (1000 * 60 * 60 * 24 * 30.44)); }
function fmtPay(t: Date)        { const d = new Date(t.getFullYear(), t.getMonth() + 1, 0); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }

// ── Shared sub-components ──────────────────────────────────────────────────
function ModTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
      <div>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--t1)', margin: 0, lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pendiente' | 'aprobado' | 'rechazado' | 'activo' }) {
  const cfg = {
    pendiente:  { bg: 'rgba(201,168,76,.12)',  color: GOLD,    label: 'Pendiente'  },
    aprobado:   { bg: 'rgba(74,212,110,.12)',  color: '#4AD46E', label: 'Aprobado' },
    rechazado:  { bg: 'rgba(212,74,74,.12)',   color: '#D44A4A', label: 'Rechazado' },
    activo:     { bg: 'rgba(74,127,212,.12)',  color: BLUE,    label: 'Activo'     },
  }[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 11.5, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />{cfg.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: `rgba(201,168,76,.1)`, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD }}>
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280 }}>{sub}</div>
    </div>
  );
}

// ── MODULE: Inicio ─────────────────────────────────────────────────────────
function ModInicio({ tk, today }: { tk: typeof DARK; today: Date }) {
  const daysToPay = calcDaysToPay(today);
  const pct       = calcPct(today);
  const tenureM   = calcTenure(today);
  const payDate   = fmtPay(today);

  const card: React.CSSProperties = { background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.15)' };
  const overline: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: tk.t3 };

  return (
    <div>
      {/* Metric strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { dot: GOLD,    label: 'Vacaciones',     value: '12.29', unit: 'días',  Icon: Plane      },
          { dot: BLUE,    label: 'Días trabajados', value: '295',   unit: '',     Icon: Briefcase  },
          { dot: GOLD_LT, label: 'Próxima nómina',  value: String(daysToPay), unit: 'días', Icon: Calendar },
          { dot: '#4AA8D4',label: 'Pendientes',     value: '0',     unit: '',     Icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} style={{ ...card, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={overline}>{s.label}</span>
              <s.Icon size={16} strokeWidth={1.75} style={{ color: s.dot }} />
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>
              {s.value}{s.unit && <span style={{ fontSize: 12, color: tk.t3, fontWeight: 400, marginLeft: 5 }}>{s.unit}</span>}
            </div>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          </div>
        ))}
      </div>

      {/* 3-col cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'auto auto', gap: 16 }}>
        {/* Vacaciones — span 2 rows */}
        <section style={{ ...card, gridColumn: '1', gridRow: '1 / 3', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={overline}>Vacaciones</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD }}><Plane size={17} strokeWidth={1.75} /></div>
          </div>
          <div style={{ position: 'relative', width: 158, height: 158, borderRadius: '50%', background: `conic-gradient(${GOLD} 0 100%, ${tk.track} 0)`, display: 'grid', placeItems: 'center', margin: '4px auto' }}>
            <div style={{ width: 118, height: 118, borderRadius: '50%', background: tk.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 30, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>12.29</div>
              <div style={{ fontSize: 9.5, color: tk.t3, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginTop: 3 }}>días libres</div>
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ label: 'Disponibles', val: '12.29', c: GOLD }, { label: 'Tomadas', val: '0', c: tk.track }].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: tk.t2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: r.c }} />{r.label}</span>
                <b style={{ fontFamily: 'Inter, sans-serif', color: tk.t1 }}>{r.val}</b>
              </div>
            ))}
          </div>
          <button style={{ appearance: 'none', border: `1px solid ${GOLD}44`, cursor: 'pointer', width: '100%', background: tk.goldBg, color: GOLD, borderRadius: 7, padding: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
            <Calendar size={13} strokeWidth={1.75} />Planificar<ArrowRight size={12} strokeWidth={2} />
          </button>
        </section>

        {/* Próxima nómina */}
        <section style={{ ...card, gridColumn: '2', gridRow: '1', background: 'linear-gradient(140deg,#1B2A4A,#0d1829)', border: `1px solid ${GOLD}22`, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ ...overline, color: '#93A1B3' }}>Próxima nómina</span>
            <Calendar size={18} strokeWidth={1.75} style={{ color: GOLD_LT }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysToPay}</span>
            <span style={{ fontSize: 13, color: '#93A1B3' }}>días · {payDate}</span>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${GOLD_LT},${GOLD})`, borderRadius: 99 }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#93A1B3' }}>{today.getDate()} / {new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()} días del periodo</div>
          </div>
        </section>

        {/* Días trabajados */}
        <section style={{ ...card, gridColumn: '3', gridRow: '1' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={overline}>Días trabajados</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', color: BLUE }}><Briefcase size={17} strokeWidth={1.75} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 30, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>295</span>
            <span style={{ fontSize: 13, color: tk.t3 }}>≈ {tenureM} meses</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28, marginTop: 'auto' }}>
            {BAR_H.map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: BLUE, opacity: 0.28 + (i / BAR_H.length) * 0.72 }} />)}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3 }}>Antigüedad · desde 01/09/2025</div>
        </section>

        {/* Solicitudes */}
        <section style={{ ...card, gridColumn: '2', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', flexShrink: 0, color: BLUE }}><CheckCircle2 size={21} strokeWidth={1.75} /></div>
          <div>
            <span style={overline}>Solicitudes pendientes</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>0</span>
              <span style={{ fontSize: 12.5, color: tk.t3 }}>Todo al día</span>
            </div>
          </div>
        </section>

        {/* Tipo contrato */}
        <section style={{ ...card, gridColumn: '3', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', flexShrink: 0, color: GOLD }}><FileText size={18} strokeWidth={1.75} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={overline}>Tipo de contrato</span>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: tk.t1, marginTop: 3 }}>Indefinido</div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3, whiteSpace: 'nowrap' }}>01/09/2025</span>
        </section>
      </div>
    </div>
  );
}

// ── MODULE: Mi contrato ────────────────────────────────────────────────────
function ModContrato({ tk }: { tk: typeof DARK }) {
  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${tk.line}` }}>
      <div style={{ width: '40%', fontSize: 13, color: tk.t3, fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, color: tk.t1, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{value}</div>
    </div>
  );
  return (
    <div>
      <ModTitle title="Mi contrato" subtitle="Información detallada de tu vinculación laboral"
        action={<button style={{ appearance: 'none', border: `1px solid ${GOLD}55`, cursor: 'pointer', background: tk.goldBg, color: GOLD, borderRadius: 7, padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={14} strokeWidth={1.75} />Descargar PDF</button>}
      />
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${NAVY900}, ${NAVY950})`, padding: '20px 24px', borderBottom: `1px solid ${GOLD}22`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD_LT},${GOLD})`, display: 'grid', placeItems: 'center', color: NAVY950, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18 }}>MR</div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700, color: '#F8F7F4' }}>Mateo Rivera</div>
            <div style={{ fontSize: 13, color: '#93A1B3', marginTop: 2 }}>Analista de Proyectos · 9 Alliance S.A.S.</div>
          </div>
          <StatusBadge status="activo" />
        </div>
        <div style={{ padding: '0 24px 8px' }}>
          {row('Tipo de contrato',  'Indefinido')}
          {row('Fecha de inicio',   '01 de septiembre de 2025')}
          {row('Cargo',             'Analista de Proyectos')}
          {row('Área / Depto.',     'Gestión Estratégica')}
          {row('Jornada laboral',   'Tiempo completo — Lunes a viernes, 8:00–17:00')}
          {row('Salario base',      '$ 3.500.000 COP / mes')}
          {row('Período de pago',   'Mensual — último día hábil del mes')}
          {row('Lugar de trabajo',  'Bogotá, Colombia (Híbrido)')}
          {row('Ciudad contrato',   'Bogotá D.C.')}
          {row('Pensión',           'Protección — afiliado activo')}
          {row('Salud',             'Nueva EPS — afiliado activo')}
          {row('ARL',               'Sura — Riesgo I')}
          <div style={{ padding: '14px 0' }}>
            <div style={{ fontSize: 13, color: tk.t3, fontWeight: 500, marginBottom: 8 }}>Cesantías e intereses</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Fondo Porvenir', 'Tasa 12% anual'].map(t => (
                <span key={t} style={{ padding: '4px 10px', borderRadius: 6, background: tk.goldBg, border: `1px solid ${GOLD}33`, fontSize: 12, color: GOLD, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODULE: Vacaciones ─────────────────────────────────────────────────────
function ModVacaciones({ tk }: { tk: typeof DARK }) {
  return (
    <div>
      <ModTitle title="Vacaciones" subtitle="Gestión y solicitud de días de descanso"
        action={<button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: GOLD, color: NAVY950, borderRadius: 7, padding: '9px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px -6px ${GOLD}88` }}><Plus size={14} strokeWidth={2.5} />Nueva solicitud</button>}
      />
      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Días disponibles', value: '12.29', sub: 'Acumulados al día de hoy', color: GOLD    },
          { label: 'Días tomados',     value: '0',     sub: 'En el período 2025–2026',  color: BLUE    },
          { label: 'Días pendientes',  value: '0',     sub: 'Solicitudes en revisión',  color: '#93A1B3' },
        ].map(c => (
          <div key={c.label} style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: tk.t3, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: tk.t3, marginTop: 6 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      {/* History */}
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${tk.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: tk.t1 }}>Historial de solicitudes</span>
        </div>
        <EmptyState icon={Plane} title="Sin solicitudes aún" sub="Cuando solicites días de vacaciones aparecerán aquí con su estado." />
      </div>
    </div>
  );
}

// ── MODULE: Nómina ─────────────────────────────────────────────────────────
function ModNomina({ tk, today }: { tk: typeof DARK; today: Date }) {
  const months = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      arr.push({ label: d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }), monto: '$ 3.500.000', neto: '$ 2.894.600', estado: i === 0 ? 'pendiente' : 'aprobado' });
    }
    return arr;
  }, [today]);

  return (
    <div>
      <ModTitle title="Nómina" subtitle="Historial de pagos y comprobantes de nómina" />
      {/* Current period highlight */}
      <div style={{ background: 'linear-gradient(135deg, #1B2A4A, #0d1829)', border: `1px solid ${GOLD}22`, borderRadius: 12, padding: 22, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: '#7C8A9C', marginBottom: 6 }}>Período actual</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 700, color: '#F8F7F4', textTransform: 'capitalize' as const }}>{today.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</div>
          <div style={{ fontSize: 13, color: '#7C8A9C', marginTop: 4 }}>Pago estimado: {fmtPay(today)}</div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 11, color: '#93A1B3', marginBottom: 4 }}>Salario neto estimado</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: GOLD }}>$ 2.894.600</div>
        </div>
      </div>
      {/* Table */}
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: `1px solid ${tk.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12 }}>
          {['Período', 'Salario bruto', 'Salario neto', 'Estado'].map(h => (
            <span key={h} style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: tk.t3 }}>{h}</span>
          ))}
        </div>
        {months.map((m, i) => (
          <div key={i} style={{ padding: '13px 20px', borderBottom: i < months.length - 1 ? `1px solid ${tk.line}` : undefined, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: tk.t1, fontWeight: 500, textTransform: 'capitalize' as const }}>{m.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: tk.t2 }}>{m.monto}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: GOLD, fontWeight: 600 }}>{m.neto}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge status={m.estado as 'pendiente' | 'aprobado'} />
              {i > 0 && <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: 'transparent', color: tk.t3, display: 'grid', placeItems: 'center' }}><Download size={15} strokeWidth={1.75} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MODULE: Mis solicitudes ────────────────────────────────────────────────
function ModSolicitudes({ tk }: { tk: typeof DARK }) {
  return (
    <div>
      <ModTitle title="Mis solicitudes" subtitle="Historial de todas tus solicitudes"
        action={<button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: GOLD, color: NAVY950, borderRadius: 7, padding: '9px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px -6px ${GOLD}88` }}><Plus size={14} strokeWidth={2.5} />Nueva solicitud</button>}
      />
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['Todas', 'Pendientes', 'Aprobadas', 'Rechazadas'].map((t, i) => (
          <button key={t} style={{ appearance: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 7, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: i === 0 ? 600 : 500, background: i === 0 ? tk.goldBg : 'transparent', color: i === 0 ? GOLD : tk.t3, border: `1px solid ${i === 0 ? GOLD+'44' : tk.line}` }}>{t}</button>
        ))}
      </div>
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, overflow: 'hidden' }}>
        <EmptyState icon={MessageSquare} title="Sin solicitudes" sub="Aquí aparecerán tus solicitudes de permisos, certificados u otros trámites." />
      </div>
    </div>
  );
}

// ── MODULE: Incapacidades ──────────────────────────────────────────────────
function ModIncapacidades({ tk }: { tk: typeof DARK }) {
  return (
    <div>
      <ModTitle title="Incapacidades" subtitle="Registro y seguimiento de licencias médicas"
        action={<button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: GOLD, color: NAVY950, borderRadius: 7, padding: '9px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px -6px ${GOLD}88` }}><Plus size={14} strokeWidth={2.5} />Reportar incapacidad</button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Total días',     value: '0',  sub: 'Días de incapacidad en 2026', icon: Activity      },
          { label: 'Registros',      value: '0',  sub: 'Incapacidades reportadas',   icon: FileText      },
          { label: 'Último reporte', value: 'N/A',sub: 'Sin registros recientes',     icon: Clock         },
        ].map(c => (
          <div key={c.label} style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}>
              <c.icon size={18} strokeWidth={1.75} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: tk.t3 }}>{c.label}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: tk.t1, marginTop: 2 }}>{c.value}</div>
              <div style={{ fontSize: 11.5, color: tk.t3, marginTop: 1 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, overflow: 'hidden' }}>
        <EmptyState icon={Activity} title="Sin incapacidades registradas" sub="Cuando reportes una incapacidad médica, aparecerá aquí con su número de días y estado." />
      </div>
    </div>
  );
}

// ── MODULE: Documentos ─────────────────────────────────────────────────────
function ModDocumentos({ tk }: { tk: typeof DARK }) {
  const docs = [
    { name: 'Contrato de trabajo — Mateo Rivera.pdf', fecha: '01/09/2025', tipo: 'Contrato',    size: '312 KB' },
    { name: 'Carta de presentación laboral.pdf',       fecha: '15/10/2025', tipo: 'Certificado', size: '89 KB'  },
    { name: 'Acuerdo de confidencialidad.pdf',         fecha: '01/09/2025', tipo: 'Interno',     size: '145 KB' },
    { name: 'Reglamento interno de trabajo.pdf',       fecha: '01/09/2025', tipo: 'Reglamento',  size: '420 KB' },
  ];
  return (
    <div>
      <ModTitle title="Documentos" subtitle="Tus documentos laborales y personales"
        action={<button style={{ appearance: 'none', border: `1px solid ${GOLD}55`, cursor: 'pointer', background: tk.goldBg, color: GOLD, borderRadius: 7, padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={14} strokeWidth={1.75} />Subir documento</button>}
      />
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: `1px solid ${tk.line}`, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16 }}>
          {['Documento', 'Tipo', 'Fecha', ''].map(h => <span key={h} style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: tk.t3 }}>{h}</span>)}
        </div>
        {docs.map((d, i) => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: i < docs.length - 1 ? `1px solid ${tk.line}` : undefined, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: 'rgba(201,168,76,.08)', border: `1px solid ${GOLD}22`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}><FileText size={15} strokeWidth={1.75} /></div>
              <div>
                <div style={{ fontSize: 13.5, color: tk.t1, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 11.5, color: tk.t3, marginTop: 1 }}>{d.size}</div>
              </div>
            </div>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: tk.blueBg, color: BLUE, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap' as const }}>{d.tipo}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tk.t3 }}>{d.fecha}</span>
            <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: 'transparent', color: tk.t3, display: 'grid', placeItems: 'center' }}><Download size={15} strokeWidth={1.75} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MODULE: Activos ────────────────────────────────────────────────────────
function ModActivos({ tk }: { tk: typeof DARK }) {
  const items = [
    { nombre: 'Laptop MacBook Pro 14"',     serial: 'FVFX123456CO', fecha: '01/09/2025', Icon: Monitor,    estado: 'activo' },
    { nombre: 'iPhone 15 corporativo',      serial: 'DNPW987654XX', fecha: '01/09/2025', Icon: Smartphone, estado: 'activo' },
    { nombre: 'Carné de acceso físico',     serial: 'AC-00142',     fecha: '01/09/2025', Icon: KeyRound,   estado: 'activo' },
  ];
  return (
    <div>
      <ModTitle title="Activos asignados" subtitle="Equipos y recursos de la empresa bajo tu responsabilidad" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', color: BLUE, flexShrink: 0 }}>
              <it.Icon size={21} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: tk.t1 }}>{it.nombre}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: tk.t3 }}>S/N: {it.serial}</span>
                <span style={{ fontSize: 11.5, color: tk.t3 }}>Desde {it.fecha}</span>
              </div>
            </div>
            <StatusBadge status={it.estado as 'activo'} />
          </div>
        ))}
      </div>
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: '16px 20px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertCircle size={18} strokeWidth={1.75} style={{ color: GOLD, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: tk.t2, margin: 0 }}>Para reportar pérdida, daño o devolución de un activo, contacta a Administración a través de <b style={{ color: GOLD }}>Mis solicitudes</b>.</p>
      </div>
    </div>
  );
}

// ── MODULE: Objetivos ──────────────────────────────────────────────────────
function ModObjetivos({ tk }: { tk: typeof DARK }) {
  const goals = [
    { title: 'Completar certificación PMP',              pct: 65, cat: 'Formación',   color: GOLD  },
    { title: 'Cerrar 3 proyectos antes de Q3',           pct: 33, cat: 'Proyectos',   color: BLUE  },
    { title: 'Reducir tiempo de entrega de informes',    pct: 80, cat: 'Eficiencia',  color: '#4AD46E' },
    { title: 'Completar onboarding clientes nuevos',     pct: 100,cat: 'Clientes',    color: '#4AD46E' },
  ];
  return (
    <div>
      <ModTitle title="Objetivos" subtitle="Seguimiento de metas y desempeño para el período 2026" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.map((g, i) => (
          <div key={i} style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, fontWeight: 600, color: tk.t1 }}>{g.title}</div>
                <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 6, background: tk.goldBg, color: GOLD_LT, fontSize: 11, fontWeight: 500 }}>{g.cat}</span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 700, color: g.color }}>{g.pct}%</div>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: tk.track, overflow: 'hidden' }}>
              <div style={{ width: `${g.pct}%`, height: '100%', background: g.color, borderRadius: 99, transition: 'width .6s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MODULE: Certificados ───────────────────────────────────────────────────
function ModCertificados({ tk }: { tk: typeof DARK }) {
  const certs = [
    { title: 'Certificado laboral',         desc: 'Constancia de vinculación activa y cargo',              time: '24 hrs' },
    { title: 'Certificado de ingresos',      desc: 'Certificación de salario para trámites bancarios',     time: '48 hrs' },
    { title: 'Certificado de vacaciones',   desc: 'Estado actual de días disponibles y tomados',           time: '24 hrs' },
    { title: 'Paz y salvo',                 desc: 'Certificado de no deudas con la empresa',               time: '72 hrs' },
    { title: 'Certificado EPS',             desc: 'Comprobante de afiliación a salud',                     time: '24 hrs' },
    { title: 'Carta de referencia laboral', desc: 'Para uso en procesos de crédito o arrendamiento',       time: '5 días' },
  ];
  return (
    <div>
      <ModTitle title="Certificados" subtitle="Solicita certificados y documentos oficiales de tu vinculación" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {certs.map((c, i) => (
          <div key={i} style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}>
                <ShieldCheck size={18} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: tk.t1 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: tk.t3, marginTop: 3 }}>{c.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${tk.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: tk.t3 }}>
                <Clock size={13} strokeWidth={1.75} />Entrega en {c.time}
              </div>
              <button style={{ appearance: 'none', border: `1px solid ${GOLD}55`, cursor: 'pointer', background: tk.goldBg, color: GOLD, borderRadius: 6, padding: '6px 12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ChevronRight size={13} strokeWidth={2} />Solicitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────
export default function GestionOperativaPage() {
  const [mod,   setMod]   = useState<Mod>('inicio');
  const [theme, setTheme] = useState<Theme>('oscuro');
  const tk    = theme === 'oscuro' ? DARK : LIGHT;
  const today = useMemo(() => new Date(), []);

  const MODULE_TITLES: Record<Mod, string> = {
    inicio: 'Inicio', contrato: 'Mi contrato', vacaciones: 'Vacaciones',
    nomina: 'Nómina', solicitudes: 'Mis solicitudes', incapacidades: 'Incapacidades',
    documentos: 'Documentos', activos: 'Activos', objetivos: 'Objetivos',
    certificados: 'Certificados',
  };

  // Escape AppShell's p-6 padding to fill full area
  return (
    <div style={{ margin: -24, display: 'flex', height: 'calc(100vh - 88px)', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", '--t1': tk.t1, '--t2': tk.t2, '--t3': tk.t3 } as React.CSSProperties}>

      {/* ── Nav sidebar ── */}
      <aside style={{ width: 228, flexShrink: 0, background: 'linear-gradient(180deg,#0d1829 0%,#1B2A4A 100%)', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${NAVY800}` }}>
        {/* dot pattern */}
        <div style={{ position: 'absolute', width: 228, top: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(201,168,76,.04) 1px, transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />

        {/* Section label */}
        <div style={{ position: 'relative', padding: '20px 22px 8px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: '#4A5568' }}>MI PORTAL</div>

        {/* Nav items */}
        <nav style={{ position: 'relative', flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
          {NAV.map(({ id, label, Icon }) => {
            const active = mod === id;
            return (
              <button
                key={id}
                onClick={() => setMod(id)}
                style={{ appearance: 'none', border: 0, cursor: 'pointer', width: 'calc(100% - 24px)', margin: '2px 12px', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 8, background: active ? 'rgba(201,168,76,.12)' : 'transparent', color: active ? '#F8F7F4' : '#7C8A9C', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: active ? 600 : 500, boxShadow: active ? `inset 3px 0 0 0 ${GOLD}` : 'none', transition: 'background .15s, color .15s', textAlign: 'left' as const }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = active ? '#F8F7F4' : '#AEBCCD'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? '#F8F7F4' : '#7C8A9C'; }}
              >
                <Icon size={18} strokeWidth={1.75} style={{ flexShrink: 0, color: active ? GOLD : 'currentColor' }} />
                <span style={{ flex: 1 }}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{ position: 'relative', margin: '0 12px 12px', padding: '10px 12px', background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY700}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD_LT},${GOLD})`, display: 'grid', placeItems: 'center', color: NAVY950, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>MR</div>
          <div style={{ lineHeight: 1.3, flex: 1, minWidth: 0 }}>
            <div style={{ color: '#F8F7F4', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mateo Rivera</div>
            <div style={{ color: '#7C8A9C', fontSize: 11.5 }}>Empleado</div>
          </div>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: tk.page, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ flexShrink: 0, padding: '12px 24px', borderBottom: `1px solid ${tk.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme === 'oscuro' ? NAVY900 : '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: tk.t3 }}>GESTIÓN OPERATIVA</span>
            <ChevronRight size={13} strokeWidth={1.75} style={{ color: tk.t3 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, fontWeight: 600, color: tk.t1 }}>{MODULE_TITLES[mod]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={{ width: 34, height: 34, borderRadius: 7, border: 0, background: 'transparent', color: tk.t3, cursor: 'pointer', display: 'grid', placeItems: 'center', position: 'relative' }}>
              <Bell size={16} strokeWidth={1.75} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: '50%', background: GOLD }} />
            </button>
            <button onClick={() => setTheme(t => t === 'oscuro' ? 'claro' : 'oscuro')} style={{ width: 34, height: 34, borderRadius: 7, border: 0, background: 'transparent', color: tk.t3, cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Cambiar tema">
              {theme === 'oscuro' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Module content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {mod === 'inicio'        && <ModInicio       tk={tk} today={today} />}
          {mod === 'contrato'      && <ModContrato     tk={tk} />}
          {mod === 'vacaciones'    && <ModVacaciones   tk={tk} />}
          {mod === 'nomina'        && <ModNomina       tk={tk} today={today} />}
          {mod === 'solicitudes'   && <ModSolicitudes  tk={tk} />}
          {mod === 'incapacidades' && <ModIncapacidades tk={tk} />}
          {mod === 'documentos'    && <ModDocumentos   tk={tk} />}
          {mod === 'activos'       && <ModActivos      tk={tk} />}
          {mod === 'objetivos'     && <ModObjetivos    tk={tk} />}
          {mod === 'certificados'  && <ModCertificados tk={tk} />}
        </div>
      </div>
    </div>
  );
}
