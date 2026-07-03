import { useState, useMemo } from 'react';
import {
  LayoutDashboard, FileText, Plane, Wallet, MessageSquare,
  Activity, Folder, Package, Target, ShieldCheck,
  Calendar, Briefcase, CheckCircle2, ArrowRight,
  Download, Upload, Plus, Clock, AlertCircle,
  Monitor, Smartphone, KeyRound, Users, ClipboardList,
  FolderOpen, ChevronRight,
} from 'lucide-react';

// ── 9 Alliance palette ─────────────────────────────────────────────────────
const GOLD    = '#C9A84C';
const GOLD_LT = '#d4b96a';
const GOLD_DK = '#a8862e';
const NAVY950 = '#0d1829';
const NAVY900 = '#1B2A4A';
const NAVY800 = '#243560';
const BLUE    = '#4A7FD4';

const DARK = { page: NAVY950, card: NAVY900, line: NAVY800, t1: '#F8F7F4', t2: '#AEBCCD', t3: '#7C8A9C', track: NAVY800, goldBg: 'rgba(201,168,76,.1)', blueBg: 'rgba(74,127,212,.12)' };
type Tk = typeof DARK;

type Role = 'empleado' | 'admin';

// ── Employee modules ──────────────────────────────────────────────────────
type EmpMod = 'inicio' | 'contrato' | 'vacaciones' | 'nomina' | 'solicitudes' | 'incapacidades' | 'documentos' | 'activos' | 'objetivos' | 'certificados';
const EMP_TABS: { id: EmpMod; label: string; Icon: React.ElementType }[] = [
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

// ── Admin modules ─────────────────────────────────────────────────────────
type AdmMod = 'resumen' | 'solicitudes_adm' | 'incapacidades_adm' | 'documentos_adm' | 'empleados';
const ADM_TABS: { id: AdmMod; label: string; Icon: React.ElementType; badge?: string }[] = [
  { id: 'resumen',           label: 'Resumen',       Icon: LayoutDashboard },
  { id: 'solicitudes_adm',   label: 'Solicitudes',   Icon: ClipboardList,  badge: '3' },
  { id: 'incapacidades_adm', label: 'Incapacidades', Icon: Activity        },
  { id: 'documentos_adm',    label: 'Documentos',    Icon: FolderOpen      },
  { id: 'empleados',         label: 'Empleados',     Icon: Users           },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const BAR_H = [30, 42, 55, 62, 70, 80, 87, 94, 100];
function calcDaysToPay(t: Date) { return new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate() - t.getDate(); }
function calcPct(t: Date)       { return Math.round((t.getDate() / new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()) * 100); }
function calcTenure(t: Date)    { return Math.floor((t.getTime() - new Date('2025-09-01').getTime()) / (1000 * 60 * 60 * 24 * 30.44)); }
function fmtPay(t: Date)        { const d = new Date(t.getFullYear(), t.getMonth() + 1, 0); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }

// ── Shared UI ─────────────────────────────────────────────────────────────
function overlineStyle(tk: Tk): React.CSSProperties {
  return { fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: tk.t3 } as React.CSSProperties;
}
function cardStyle(tk: Tk): React.CSSProperties {
  return { background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.15)' };
}

function ModTitle({ tk, title, subtitle, action }: { tk: Tk; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
      <div>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: tk.t1, margin: 0, lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: tk.t3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pendiente' | 'aprobado' | 'rechazado' | 'activo' }) {
  const cfg = {
    pendiente: { bg: 'rgba(201,168,76,.12)',  c: GOLD,      label: 'Pendiente'  },
    aprobado:  { bg: 'rgba(74,212,110,.12)',  c: '#4AD46E', label: 'Aprobado'   },
    rechazado: { bg: 'rgba(212,74,74,.12)',   c: '#D44A4A', label: 'Rechazado'  },
    activo:    { bg: 'rgba(74,127,212,.12)',  c: BLUE,      label: 'Activo'     },
  }[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: cfg.bg, color: cfg.c, fontSize: 11.5, fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.c }} />{cfg.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 13, background: `rgba(201,168,76,.09)`, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD }}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: 'inherit' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'inherit', opacity: .6, maxWidth: 300 }}>{sub}</div>
    </div>
  );
}

function GoldBtn({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ appearance: 'none', border: 0, cursor: 'pointer', background: GOLD, color: NAVY950, borderRadius: 7, padding: '9px 15px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px -6px ${GOLD}88`, whiteSpace: 'nowrap' }}>
      <Icon size={14} strokeWidth={2.5} />{label}
    </button>
  );
}

function OutlineBtn({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <button style={{ appearance: 'none', cursor: 'pointer', border: `1px solid ${GOLD}55`, background: `rgba(201,168,76,.08)`, color: GOLD, borderRadius: 7, padding: '9px 15px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <Icon size={14} strokeWidth={1.75} />{label}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EMPLOYEE MODULES
// ══════════════════════════════════════════════════════════════════════════

function ModInicio({ tk, today }: { tk: Tk; today: Date }) {
  const daysToPay = calcDaysToPay(today);
  const pct       = calcPct(today);
  const tenureM   = calcTenure(today);
  const payDate   = fmtPay(today);
  const cs        = cardStyle(tk);
  const ol        = overlineStyle(tk);

  return (
    <div>
      {/* Metric strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { dot: GOLD,     label: 'Vacaciones',     value: '12.29', unit: 'días', Icon: Plane       },
          { dot: BLUE,     label: 'Días trabajados', value: '295',   unit: '',    Icon: Briefcase    },
          { dot: GOLD_LT,  label: 'Próxima nómina',  value: String(daysToPay), unit: 'días', Icon: Calendar },
          { dot: '#4AA8D4',label: 'Pendientes',      value: '0',     unit: '',    Icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} style={{ ...cs, gap: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={ol}>{s.label}</span>
              <s.Icon size={15} strokeWidth={1.75} style={{ color: s.dot }} />
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>
              {s.value}{s.unit && <span style={{ fontSize: 12, color: tk.t3, fontWeight: 400, marginLeft: 5 }}>{s.unit}</span>}
            </div>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          </div>
        ))}
      </div>

      {/* Cards 3×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'auto auto', gap: 16 }}>

        {/* Vacaciones */}
        <section style={{ ...cs, gridColumn: '1', gridRow: '1 / 3', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={ol}>Vacaciones</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD }}><Plane size={16} strokeWidth={1.75} /></div>
          </div>
          <div style={{ position: 'relative', width: 162, height: 162, borderRadius: '50%', background: `conic-gradient(${GOLD} 0 100%, ${tk.track} 0)`, display: 'grid', placeItems: 'center', margin: '4px auto' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: tk.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
            <Calendar size={13} strokeWidth={1.75} />Planificar mis días<ArrowRight size={12} strokeWidth={2} />
          </button>
        </section>

        {/* Próxima nómina */}
        <section style={{ ...cs, gridColumn: '2', gridRow: '1', background: `linear-gradient(140deg,${NAVY900},${NAVY950})`, border: `1px solid ${GOLD}22`, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ ...ol, color: '#7C8A9C' }}>Próxima nómina</span>
            <Calendar size={18} strokeWidth={1.75} style={{ color: GOLD_LT }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysToPay}</span>
            <span style={{ fontSize: 13, color: '#7C8A9C' }}>días · {payDate}</span>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${GOLD_LT},${GOLD})`, borderRadius: 99 }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#7C8A9C' }}>{today.getDate()} / {new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()} días del periodo</div>
          </div>
        </section>

        {/* Días trabajados */}
        <section style={{ ...cs, gridColumn: '3', gridRow: '1' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={ol}>Días trabajados</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', color: BLUE }}><Briefcase size={16} strokeWidth={1.75} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>295</span>
            <span style={{ fontSize: 13, color: tk.t3 }}>≈ {tenureM} meses</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28, marginTop: 'auto' }}>
            {BAR_H.map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: BLUE, opacity: 0.28 + (i / BAR_H.length) * 0.72 }} />)}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3 }}>Antigüedad · desde 01/09/2025</div>
        </section>

        <section style={{ ...cs, gridColumn: '2', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', flexShrink: 0, color: BLUE }}><CheckCircle2 size={20} strokeWidth={1.75} /></div>
          <div>
            <span style={ol}>Solicitudes pendientes</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>0</span>
              <span style={{ fontSize: 12, color: tk.t3 }}>Todo al día</span>
            </div>
          </div>
        </section>

        <section style={{ ...cs, gridColumn: '3', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', flexShrink: 0, color: GOLD }}><FileText size={18} strokeWidth={1.75} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={ol}>Tipo de contrato</span>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: tk.t1, marginTop: 3 }}>Indefinido</div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3, whiteSpace: 'nowrap' }}>01/09/2025</span>
        </section>
      </div>
    </div>
  );
}

function ModContrato({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid ${tk.line}` }}>
      <div style={{ width: '38%', fontSize: 13, color: tk.t3 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, color: tk.t1, fontWeight: 600 }}>{value}</div>
    </div>
  );
  return (
    <div>
      <ModTitle tk={tk} title="Mi contrato" subtitle="Detalles de tu vinculación laboral con 9 Alliance S.A.S." action={<OutlineBtn label="Descargar PDF" icon={Download} />} />
      <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${NAVY900},${NAVY950})`, padding: '20px 24px', borderBottom: `1px solid ${GOLD}22`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD_LT},${GOLD_DK})`, display: 'grid', placeItems: 'center', color: NAVY950, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>MR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: '#F8F7F4' }}>Mateo Rivera</div>
            <div style={{ fontSize: 13, color: '#7C8A9C', marginTop: 2 }}>Analista de Proyectos · 9 Alliance S.A.S.</div>
          </div>
          <StatusBadge status="activo" />
        </div>
        <div style={{ padding: '0 24px 8px' }}>
          {row('Tipo de contrato', 'Indefinido')}
          {row('Fecha de inicio', '01 de septiembre de 2025')}
          {row('Cargo', 'Analista de Proyectos')}
          {row('Área / Depto.', 'Gestión Estratégica')}
          {row('Jornada', 'Tiempo completo — Lun–Vie, 8:00–17:00')}
          {row('Salario base', '$ 3.500.000 COP / mes')}
          {row('Período de pago', 'Mensual — último día hábil')}
          {row('Lugar de trabajo', 'Bogotá, Colombia (Híbrido)')}
          {row('Salud', 'Nueva EPS — activo')}
          {row('Pensión', 'Protección — activo')}
          {row('ARL', 'Sura — Riesgo I')}
        </div>
      </div>
    </div>
  );
}

function ModVacaciones({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  return (
    <div>
      <ModTitle tk={tk} title="Vacaciones" subtitle="Balance y solicitud de días de descanso" action={<GoldBtn label="Nueva solicitud" icon={Plus} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Días disponibles', value: '12.29', sub: 'Acumulados al día de hoy', color: GOLD    },
          { label: 'Días tomados',     value: '0',     sub: 'En el período 2025–2026',  color: BLUE    },
          { label: 'Solicitudes',      value: '0',     sub: 'En proceso de revisión',   color: tk.t3   },
        ].map(c => (
          <div key={c.label} style={{ ...cs, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: tk.t3 }}>{c.label}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1, marginTop: 8 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: tk.t3 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${tk.line}`, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: tk.t1 }}>Historial de solicitudes</div>
        <div style={{ color: tk.t2 }}><EmptyState icon={Plane} title="Sin solicitudes" sub="Aquí aparecerán tus solicitudes con fecha, estado y días aprobados." /></div>
      </div>
    </div>
  );
}

function ModNomina({ tk, today }: { tk: Tk; today: Date }) {
  const cs = cardStyle(tk);
  const months = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return { label: d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }), estado: i === 0 ? 'pendiente' : 'aprobado' };
  }), [today]);
  return (
    <div>
      <ModTitle tk={tk} title="Nómina" subtitle="Historial de pagos y comprobantes" />
      <div style={{ background: `linear-gradient(135deg,${NAVY900},${NAVY950})`, border: `1px solid ${GOLD}22`, borderRadius: 10, padding: '20px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#7C8A9C', marginBottom: 6 }}>Período actual</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: '#F8F7F4', textTransform: 'capitalize' as const }}>{today.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</div>
          <div style={{ fontSize: 13, color: '#7C8A9C', marginTop: 4 }}>Pago estimado: {fmtPay(today)}</div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 11, color: '#7C8A9C', marginBottom: 4 }}>Salario neto estimado</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 700, color: GOLD }}>$ 2.894.600</div>
        </div>
      </div>
      <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: `1px solid ${tk.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12 }}>
          {['Período', 'Salario bruto', 'Salario neto', ''].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: tk.t3 }}>{h}</span>)}
        </div>
        {months.map((m, i) => (
          <div key={i} style={{ padding: '13px 20px', borderBottom: i < months.length - 1 ? `1px solid ${tk.line}` : undefined, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, color: tk.t1, fontWeight: 500, textTransform: 'capitalize' as const }}>{m.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: tk.t2 }}>$ 3.500.000</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: GOLD, fontWeight: 600 }}>$ 2.894.600</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge status={m.estado as 'pendiente' | 'aprobado'} />
              {i > 0 && <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: 'transparent', color: tk.t3 }}><Download size={14} strokeWidth={1.75} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModSolicitudes({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  return (
    <div>
      <ModTitle tk={tk} title="Mis solicitudes" subtitle="Gestiona permisos, certificados y otros trámites" action={<GoldBtn label="Nueva solicitud" icon={Plus} />} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['Todas', 'Pendientes', 'Aprobadas', 'Rechazadas'].map((t, i) => (
          <button key={t} style={{ appearance: 'none', cursor: 'pointer', padding: '6px 13px', borderRadius: 7, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: i === 0 ? 600 : 500, background: i === 0 ? tk.goldBg : 'transparent', color: i === 0 ? GOLD : tk.t3, border: `1px solid ${i === 0 ? GOLD+'44' : tk.line}` }}>{t}</button>
        ))}
      </div>
      <div style={{ ...cs, padding: 0, overflow: 'hidden', color: tk.t2 }}><EmptyState icon={MessageSquare} title="Sin solicitudes" sub="Aquí aparecerán tus solicitudes de permisos, vacaciones y trámites." /></div>
    </div>
  );
}

function ModIncapacidades({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  return (
    <div>
      <ModTitle tk={tk} title="Incapacidades" subtitle="Registro y seguimiento de licencias médicas" action={<GoldBtn label="Reportar incapacidad" icon={Plus} />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        {[{ label: 'Total días', value: '0', Icon: Activity }, { label: 'Registros', value: '0', Icon: FileText }, { label: 'Último reporte', value: 'N/A', Icon: Clock }].map(c => (
          <div key={c.label} style={{ ...cs, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}><c.Icon size={17} strokeWidth={1.75} /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: tk.t3 }}>{c.label}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: tk.t1, marginTop: 2 }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...cs, padding: 0, overflow: 'hidden', color: tk.t2 }}><EmptyState icon={Activity} title="Sin incapacidades" sub="Cuando reportes una incapacidad médica, aparecerá aquí con su estado." /></div>
    </div>
  );
}

function ModDocumentos({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  const docs = [
    { name: 'Contrato de trabajo — Mateo Rivera.pdf', fecha: '01/09/2025', tipo: 'Contrato',    size: '312 KB' },
    { name: 'Carta de presentación laboral.pdf',      fecha: '15/10/2025', tipo: 'Certificado', size: '89 KB'  },
    { name: 'Acuerdo de confidencialidad.pdf',        fecha: '01/09/2025', tipo: 'Interno',     size: '145 KB' },
    { name: 'Reglamento interno de trabajo.pdf',      fecha: '01/09/2025', tipo: 'Reglamento',  size: '420 KB' },
  ];
  return (
    <div>
      <ModTitle tk={tk} title="Documentos" subtitle="Tus documentos laborales y personales" action={<OutlineBtn label="Subir documento" icon={Upload} />} />
      <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: `1px solid ${tk.line}`, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16 }}>
          {['Documento', 'Tipo', 'Fecha', ''].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: tk.t3 }}>{h}</span>)}
        </div>
        {docs.map((d, i) => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: i < docs.length - 1 ? `1px solid ${tk.line}` : undefined, display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: tk.goldBg, border: `1px solid ${GOLD}22`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}><FileText size={14} strokeWidth={1.75} /></div>
              <div><div style={{ fontSize: 13.5, color: tk.t1, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 11, color: tk.t3, marginTop: 1 }}>{d.size}</div></div>
            </div>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: tk.blueBg, color: BLUE, fontSize: 11.5, fontWeight: 500 }}>{d.tipo}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tk.t3 }}>{d.fecha}</span>
            <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: 'transparent', color: tk.t3 }}><Download size={14} strokeWidth={1.75} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModActivos({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  const items = [
    { nombre: 'Laptop MacBook Pro 14"', serial: 'FVFX123456CO', fecha: '01/09/2025', Icon: Monitor    },
    { nombre: 'iPhone 15 corporativo',  serial: 'DNPW987654XX', fecha: '01/09/2025', Icon: Smartphone },
    { nombre: 'Carné de acceso físico', serial: 'AC-00142',     fecha: '01/09/2025', Icon: KeyRound   },
  ];
  return (
    <div>
      <ModTitle tk={tk} title="Activos asignados" subtitle="Equipos y recursos bajo tu responsabilidad" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ ...cs, flexDirection: 'row', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', color: BLUE, flexShrink: 0 }}><it.Icon size={20} strokeWidth={1.75} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, color: tk.t1 }}>{it.nombre}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: tk.t3 }}>S/N: {it.serial}</span>
                <span style={{ fontSize: 11.5, color: tk.t3 }}>Desde {it.fecha}</span>
              </div>
            </div>
            <StatusBadge status="activo" />
          </div>
        ))}
        <div style={{ ...cs, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
          <AlertCircle size={16} strokeWidth={1.75} style={{ color: GOLD, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: tk.t2, margin: 0 }}>Para reportar daño o devolución de un activo ve a <b style={{ color: GOLD }}>Mis solicitudes</b>.</p>
        </div>
      </div>
    </div>
  );
}

function ModObjetivos({ tk }: { tk: Tk }) {
  const goals = [
    { title: 'Completar certificación PMP',           pct: 65,  cat: 'Formación',  color: GOLD         },
    { title: 'Cerrar 3 proyectos antes de Q3',        pct: 33,  cat: 'Proyectos',  color: BLUE         },
    { title: 'Reducir tiempo de entrega de informes', pct: 80,  cat: 'Eficiencia', color: '#4AD46E'    },
    { title: 'Completar onboarding clientes nuevos',  pct: 100, cat: 'Clientes',   color: '#4AD46E'    },
  ];
  return (
    <div>
      <ModTitle tk={tk} title="Objetivos" subtitle="Metas y desempeño — período 2026" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.map((g, i) => (
          <div key={i} style={{ ...cardStyle(tk), padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, fontWeight: 600, color: tk.t1 }}>{g.title}</div>
                <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 6, background: tk.goldBg, color: GOLD_LT, fontSize: 11 }}>{g.cat}</span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 700, color: g.color }}>{g.pct}%</div>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: tk.track, overflow: 'hidden' }}>
              <div style={{ width: `${g.pct}%`, height: '100%', background: g.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModCertificados({ tk }: { tk: Tk }) {
  const certs = [
    { title: 'Certificado laboral',          desc: 'Constancia de vinculación y cargo',              time: '24 hrs' },
    { title: 'Certificado de ingresos',       desc: 'Salario para trámites bancarios o de crédito',  time: '48 hrs' },
    { title: 'Certificado de vacaciones',    desc: 'Estado de días disponibles y tomados',           time: '24 hrs' },
    { title: 'Paz y salvo',                  desc: 'Certificado de no deudas con la empresa',        time: '72 hrs' },
    { title: 'Certificado EPS',              desc: 'Comprobante de afiliación a salud',              time: '24 hrs' },
    { title: 'Carta de referencia laboral',  desc: 'Para crédito, arrendamiento u otros trámites',   time: '5 días' },
  ];
  return (
    <div>
      <ModTitle tk={tk} title="Certificados" subtitle="Solicita documentos oficiales de tu vinculación" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {certs.map((c, i) => (
          <div key={i} style={{ ...cardStyle(tk), padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}><ShieldCheck size={17} strokeWidth={1.75} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: tk.t1 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: tk.t3, marginTop: 3 }}>{c.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${tk.line}`, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: tk.t3 }}><Clock size={12} strokeWidth={1.75} />Entrega en {c.time}</span>
              <button style={{ appearance: 'none', border: `1px solid ${GOLD}55`, cursor: 'pointer', background: tk.goldBg, color: GOLD, borderRadius: 6, padding: '6px 12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ChevronRight size={12} strokeWidth={2} />Solicitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ADMIN MODULES
// ══════════════════════════════════════════════════════════════════════════

function AdminResumen({ tk }: { tk: Tk }) {
  const cs = cardStyle(tk);
  const ol = overlineStyle(tk);
  return (
    <div>
      <ModTitle tk={tk} title="Resumen administrativo" subtitle="Vista general del estado del equipo" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Empleados activos', value: '12', color: BLUE,    Icon: Users          },
          { label: 'Solicitudes pend.', value: '3',  color: GOLD,    Icon: ClipboardList   },
          { label: 'Incapacidades',     value: '1',  color: '#D44A4A', Icon: Activity      },
          { label: 'Nuevos este mes',   value: '1',  color: '#4AD46E', Icon: Users         },
        ].map(s => (
          <div key={s.label} style={{ ...cs, gap: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={ol}>{s.label}</span>
              <s.Icon size={15} strokeWidth={1.75} style={{ color: s.color }} />
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...cs }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: tk.t1 }}>Solicitudes recientes</div>
          {[
            { nombre: 'Mateo Rivera',   tipo: 'Vacaciones',    estado: 'pendiente' as const },
            { nombre: 'Laura Gómez',    tipo: 'Permiso',       estado: 'pendiente' as const },
            { nombre: 'Carlos Méndez',  tipo: 'Certificado',   estado: 'pendiente' as const },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: `1px solid ${tk.line}` }}>
              <div>
                <div style={{ fontSize: 13.5, color: tk.t1, fontWeight: 500 }}>{r.nombre}</div>
                <div style={{ fontSize: 12, color: tk.t3 }}>{r.tipo}</div>
              </div>
              <StatusBadge status={r.estado} />
            </div>
          ))}
        </div>
        <div style={{ ...cs }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: tk.t1 }}>Distribución por área</div>
          {[
            { area: 'Gestión Estratégica', n: 4, pct: 33 },
            { area: 'Gestión Financiera',  n: 3, pct: 25 },
            { area: 'Gestión Comercial',   n: 3, pct: 25 },
            { area: 'Gestión Operativa',   n: 2, pct: 17 },
          ].map((a, i) => (
            <div key={i} style={{ paddingTop: 10, borderTop: i > 0 ? `1px solid ${tk.line}` : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: tk.t2 }}>{a.area}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tk.t3 }}>{a.n} emp.</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: tk.track, overflow: 'hidden' }}>
                <div style={{ width: `${a.pct}%`, height: '100%', background: GOLD, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSolicitudes({ tk }: { tk: Tk }) {
  const pending = [
    { empleado: 'Mateo Rivera',   tipo: 'Solicitud de vacaciones',  fecha: '30/06/2026', dias: '5 días',  estado: 'pendiente' as const },
    { empleado: 'Laura Gómez',    tipo: 'Permiso por calamidad',    fecha: '28/06/2026', dias: '2 días',  estado: 'pendiente' as const },
    { empleado: 'Carlos Méndez',  tipo: 'Certificado laboral',      fecha: '25/06/2026', dias: '—',       estado: 'pendiente' as const },
  ];
  return (
    <div>
      <ModTitle tk={tk} title="Solicitudes" subtitle="Revisión y aprobación de solicitudes del equipo"
        action={<span style={{ padding: '4px 10px', borderRadius: 99, background: `rgba(201,168,76,.15)`, color: GOLD, fontSize: 13, fontWeight: 700 }}>3 pendientes</span>}
      />
      <div style={{ ...cardStyle(tk), padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: `1px solid ${tk.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 12 }}>
          {['Empleado', 'Solicitud', 'Fecha', 'Duración', 'Estado'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: tk.t3 }}>{h}</span>)}
        </div>
        {pending.map((r, i) => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: i < pending.length - 1 ? `1px solid ${tk.line}` : undefined, display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, color: tk.t1, fontWeight: 500 }}>{r.empleado}</span>
            <span style={{ fontSize: 13, color: tk.t2 }}>{r.tipo}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tk.t3 }}>{r.fecha}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tk.t3 }}>{r.dias}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusBadge status={r.estado} />
              <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: `rgba(74,212,110,.1)`, color: '#4AD46E', borderRadius: 5, padding: '4px 8px', fontSize: 11.5, fontWeight: 600 }}>✓ Aprobar</button>
              <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: `rgba(212,74,74,.1)`, color: '#D44A4A', borderRadius: 5, padding: '4px 8px', fontSize: 11.5, fontWeight: 600 }}>✗ Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminEmpleados({ tk }: { tk: Tk }) {
  const emp = [
    { nombre: 'Mateo Rivera',   cargo: 'Analista de Proyectos', area: 'G. Estratégica', inicio: '01/09/2025', estado: 'activo' as const },
    { nombre: 'Laura Gómez',    cargo: 'Contadora',             area: 'G. Financiera',  inicio: '15/03/2025', estado: 'activo' as const },
    { nombre: 'Carlos Méndez',  cargo: 'Asesor Comercial',      area: 'G. Comercial',   inicio: '10/01/2025', estado: 'activo' as const },
    { nombre: 'Andrea Torres',  cargo: 'Coordinadora RRHH',     area: 'G. Operativa',   inicio: '05/06/2024', estado: 'activo' as const },
  ];
  return (
    <div>
      <ModTitle tk={tk} title="Empleados" subtitle="Directorio y gestión del equipo" action={<GoldBtn label="Nuevo empleado" icon={Plus} />} />
      <div style={{ ...cardStyle(tk), padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 20px', borderBottom: `1px solid ${tk.line}`, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto auto', gap: 12 }}>
          {['Empleado', 'Cargo', 'Área', 'Desde', 'Estado'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: tk.t3 }}>{h}</span>)}
        </div>
        {emp.map((e, i) => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: i < emp.length - 1 ? `1px solid ${tk.line}` : undefined, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto auto', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD_LT},${GOLD_DK})`, display: 'grid', placeItems: 'center', color: NAVY950, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{e.nombre.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              <span style={{ fontSize: 13.5, color: tk.t1, fontWeight: 500 }}>{e.nombre}</span>
            </div>
            <span style={{ fontSize: 13, color: tk.t2 }}>{e.cargo}</span>
            <span style={{ fontSize: 13, color: tk.t2 }}>{e.area}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: tk.t3 }}>{e.inicio}</span>
            <StatusBadge status={e.estado} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminGeneric({ tk, title, icon: Icon, sub }: { tk: Tk; title: string; icon: React.ElementType; sub: string }) {
  return (
    <div>
      <ModTitle tk={tk} title={title} />
      <div style={{ ...cardStyle(tk), padding: 0, overflow: 'hidden', color: tk.t2 }}><EmptyState icon={Icon} title={`${title} — Próximamente`} sub={sub} /></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════
export default function GestionOperativaPage() {
  const [role,    setRole]    = useState<Role>('empleado');
  const [empMod,  setEmpMod]  = useState<EmpMod>('inicio');
  const [admMod,  setAdmMod]  = useState<AdmMod>('resumen');
  const today = useMemo(() => new Date(), []);

  // Dark theme fixed (consistent with portal's navy palette)
  const tk = DARK;

  const TabBar = ({ tabs, active, onSelect }: { tabs: typeof EMP_TABS | typeof ADM_TABS; active: string; onSelect: (id: string) => void }) => (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
      {(tabs as { id: string; label: string; Icon: React.ElementType; badge?: string }[]).map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{ appearance: 'none', outline: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: isActive ? 600 : 500, background: isActive ? tk.goldBg : 'transparent', color: isActive ? GOLD : tk.t3, border: isActive ? `1px solid ${GOLD}44` : '1px solid transparent', whiteSpace: 'nowrap', position: 'relative', transition: 'background .15s, color .15s' } as React.CSSProperties}
          >
            <t.Icon size={14} strokeWidth={1.75} />
            {t.label}
            {t.badge && <span style={{ marginLeft: 2, padding: '1px 6px', borderRadius: 99, background: GOLD, color: NAVY950, fontSize: 10, fontWeight: 700 }}>{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ background: `linear-gradient(135deg,${NAVY950} 0%,${NAVY900} 100%)`, borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
        {/* Diagonal stripe */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', backgroundImage: 'repeating-linear-gradient(118deg, transparent 0 30px, rgba(201,168,76,.1) 30px 31px)', maskImage: 'linear-gradient(90deg, transparent, #000)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: tk.goldBg, border: `1px solid ${GOLD}44`, display: 'grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}>
            <Briefcase size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: '#F8F7F4', margin: 0, lineHeight: 1.2 }}>Gestión Operativa</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#7C8A9C', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{role === 'empleado' ? 'Portal de Empleado' : 'Panel de Administración'}</span>
              <ChevronRight size={11} strokeWidth={2} style={{ color: '#7C8A9C' }} />
              <span style={{ color: GOLD_LT }}>{role === 'empleado' ? EMP_TABS.find(t => t.id === empMod)?.label : ADM_TABS.find(t => t.id === admMod)?.label}</span>
            </p>
          </div>
        </div>
        {/* Role toggle */}
        <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,.06)', border: `1px solid ${NAVY800}`, borderRadius: 9, padding: 3 }}>
          {(['empleado', 'admin'] as Role[]).map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ appearance: 'none', border: 0, cursor: 'pointer', padding: '6px 16px', borderRadius: 7, fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, background: role === r ? GOLD : 'transparent', color: role === r ? NAVY950 : '#7C8A9C', transition: 'background .18s, color .18s', whiteSpace: 'nowrap' }}>
              {r === 'empleado' ? 'Portal Empleado' : 'Administración'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab strip ── */}
      <div style={{ background: tk.card, border: `1px solid ${tk.line}`, borderRadius: 10, padding: '10px 14px' }}>
        {role === 'empleado'
          ? <TabBar tabs={EMP_TABS} active={empMod} onSelect={id => setEmpMod(id as EmpMod)} />
          : <TabBar tabs={ADM_TABS} active={admMod} onSelect={id => setAdmMod(id as AdmMod)} />}
      </div>

      {/* ── Module content ── */}
      <div style={{ color: tk.t1 }}>
        {role === 'empleado' ? (
          <>
            {empMod === 'inicio'        && <ModInicio        tk={tk} today={today} />}
            {empMod === 'contrato'      && <ModContrato      tk={tk} />}
            {empMod === 'vacaciones'    && <ModVacaciones    tk={tk} />}
            {empMod === 'nomina'        && <ModNomina        tk={tk} today={today} />}
            {empMod === 'solicitudes'   && <ModSolicitudes   tk={tk} />}
            {empMod === 'incapacidades' && <ModIncapacidades tk={tk} />}
            {empMod === 'documentos'    && <ModDocumentos    tk={tk} />}
            {empMod === 'activos'       && <ModActivos       tk={tk} />}
            {empMod === 'objetivos'     && <ModObjetivos     tk={tk} />}
            {empMod === 'certificados'  && <ModCertificados  tk={tk} />}
          </>
        ) : (
          <>
            {admMod === 'resumen'           && <AdminResumen      tk={tk} />}
            {admMod === 'solicitudes_adm'   && <AdminSolicitudes  tk={tk} />}
            {admMod === 'incapacidades_adm' && <AdminGeneric tk={tk} title="Incapacidades" icon={Activity}  sub="Gestión centralizada de licencias médicas del equipo. Disponible próximamente." />}
            {admMod === 'documentos_adm'    && <AdminGeneric tk={tk} title="Documentos"    icon={FolderOpen} sub="Repositorio de documentos laborales de todos los empleados. Disponible próximamente." />}
            {admMod === 'empleados'         && <AdminEmpleados    tk={tk} />}
          </>
        )}
      </div>
    </div>
  );
}
