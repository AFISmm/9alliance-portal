import { useState } from 'react';
import { Briefcase, TrendingUp, Users, DollarSign, Target, ChevronRight, Circle, Phone, Mail, Calendar } from 'lucide-react';
import { ModuloEnConstruccion } from '../components/ModuloEnConstruccion';
import { useDemo } from '../context/DemoContext';

// ── Demo data ──────────────────────────────────────────────────────────
type LeadStage = 'prospecto' | 'calificado' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido';

interface Lead {
  id: string; nombre: string; empresa: string; correo: string; telefono: string;
  etapa: LeadStage; valor: number; fecha: string; responsable: string;
}

const STAGE_CFG: Record<LeadStage, { label: string; color: string; bg: string }> = {
  prospecto:   { label: 'Prospecto',   color: '#7C8A9C', bg: 'rgba(124,138,156,.1)' },
  calificado:  { label: 'Calificado',  color: '#3b82f6', bg: 'rgba(59,130,246,.1)'  },
  propuesta:   { label: 'Propuesta',   color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
  negociacion: { label: 'Negociación', color: '#a855f7', bg: 'rgba(168,85,247,.1)'  },
  ganado:      { label: 'Ganado',      color: '#22c55e', bg: 'rgba(34,197,94,.1)'   },
  perdido:     { label: 'Perdido',     color: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
};

const DEMO_LEADS: Lead[] = [
  { id: 'L01', nombre: 'Andrés Morales',   empresa: 'Constructora Zenith',         correo: 'amorales@zenith.co',     telefono: '+57 310 1234567', etapa: 'negociacion', valor: 45_000_000, fecha: '2026-06-20', responsable: 'Felipe S.' },
  { id: 'L02', nombre: 'Patricia Londoño', empresa: 'Inversiones del Pacífico',    correo: 'plondonho@pacifico.co',  telefono: '+57 315 2345678', etapa: 'propuesta',   valor: 28_000_000, fecha: '2026-06-18', responsable: 'Camila R.' },
  { id: 'L03', nombre: 'Ricardo Ospina',   empresa: 'Grupo Alimentario SAS',       correo: 'rospina@galimenta.co',   telefono: '+57 300 3456789', etapa: 'calificado',  valor: 12_500_000, fecha: '2026-06-15', responsable: 'Felipe S.' },
  { id: 'L04', nombre: 'Luisa Fernández',  empresa: 'Tecno Soluciones Ltda',       correo: 'lfernandez@tecnosol.co', telefono: '+57 321 4567890', etapa: 'ganado',      valor: 62_000_000, fecha: '2026-06-10', responsable: 'Andrés T.' },
  { id: 'L05', nombre: 'Mauricio Reyes',   empresa: 'Distribuidora Nacional',      correo: 'mreyes@disnac.co',       telefono: '+57 305 5678901', etapa: 'prospecto',   valor: 8_200_000,  fecha: '2026-06-25', responsable: 'Camila R.' },
  { id: 'L06', nombre: 'Daniela Suárez',   empresa: 'Comercio & Logística SAS',   correo: 'dsuarez@comerlog.co',    telefono: '+57 318 6789012', etapa: 'propuesta',   valor: 19_800_000, fecha: '2026-06-22', responsable: 'Felipe S.' },
  { id: 'L07', nombre: 'Hernán Vargas',    empresa: 'Agropecuaria El Llano',       correo: 'hvargas@ellano.co',      telefono: '+57 312 7890123', etapa: 'perdido',     valor: 31_000_000, fecha: '2026-05-30', responsable: 'Andrés T.' },
  { id: 'L08', nombre: 'Sofía Castillo',   empresa: 'Pharma Andina S.A.',          correo: 'scastillo@pharma.co',    telefono: '+57 301 8901234', etapa: 'calificado',  valor: 24_600_000, fecha: '2026-06-28', responsable: 'Camila R.' },
];

const FUNNEL_STAGES: LeadStage[] = ['prospecto', 'calificado', 'propuesta', 'negociacion', 'ganado'];

function fmt(n: number) { return '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 }); }

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 10,
};

// ── Demo Comercial Layout ──────────────────────────────────────────────
function DemoComercial() {
  const [selectedStage, setSelectedStage] = useState<LeadStage | 'all'>('all');
  const [selected, setSelected] = useState<Lead | null>(null);

  const filtered = selectedStage === 'all' ? DEMO_LEADS : DEMO_LEADS.filter(l => l.etapa === selectedStage);

  const totalPipeline  = DEMO_LEADS.filter(l => l.etapa !== 'perdido').reduce((s, l) => s + l.valor, 0);
  const totalGanado    = DEMO_LEADS.filter(l => l.etapa === 'ganado').reduce((s, l) => s + l.valor, 0);
  const totalLeads     = DEMO_LEADS.length;
  const tasaConversion = Math.round((DEMO_LEADS.filter(l => l.etapa === 'ganado').length / totalLeads) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Briefcase size={20} strokeWidth={1.7} style={{ color: '#C9A84C' }} />
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F4F7FB' }}>Gestión Comercial</h2>
        <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', fontSize: 10.5, color: '#C9A84C', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>DEMO</span>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 11 }}>
        {[
          { label: 'Pipeline total',   value: fmt(totalPipeline),     color: '#C9A84C', Icon: DollarSign },
          { label: 'Negocios ganados', value: fmt(totalGanado),        color: '#22c55e', Icon: TrendingUp  },
          { label: 'Total leads',      value: String(totalLeads),      color: '#3b82f6', Icon: Users       },
          { label: 'Tasa conversión',  value: `${tasaConversion}%`,    color: '#a855f7', Icon: Target      },
        ].map(m => (
          <div key={m.label} style={{ ...CARD, padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7C8A9C' }}>{m.label}</span>
              <m.Icon size={15} strokeWidth={1.7} style={{ color: m.color, opacity: .6 }} />
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div style={CARD}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={14} strokeWidth={1.8} style={{ color: '#C9A84C' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#F4F7FB' }}>Embudo de ventas</span>
        </div>
        <div style={{ display: 'flex', gap: 0, padding: '14px 16px', overflowX: 'auto' }}>
          {FUNNEL_STAGES.map((stage, i) => {
            const leads = DEMO_LEADS.filter(l => l.etapa === stage);
            const cfg   = STAGE_CFG[stage];
            const pct   = Math.round((leads.length / FUNNEL_STAGES.length) * 100);
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 100 }}>
                <button
                  onClick={() => setSelectedStage(selectedStage === stage ? 'all' : stage)}
                  style={{
                    flex: 1, padding: '12px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: selectedStage === stage ? cfg.bg : 'rgba(255,255,255,.025)',
                    borderColor: selectedStage === stage ? cfg.color : 'transparent',
                    borderWidth: 1, borderStyle: 'solid',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: cfg.color }}>{leads.length}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, color: cfg.color, textAlign: 'center' }}>{cfg.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#7C8A9C' }}>{fmt(leads.reduce((s, l) => s + l.valor, 0))}</span>
                </button>
                {i < FUNNEL_STAGES.length - 1 && (
                  <ChevronRight size={16} strokeWidth={1.5} style={{ color: '#566375', flexShrink: 0, margin: '0 4px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leads table + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 14 }}>
        {/* Table */}
        <div style={{ ...CARD, overflow: 'auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#F4F7FB' }}>Leads · {filtered.length}</span>
            {selectedStage !== 'all' && (
              <button onClick={() => setSelectedStage('all')} style={{ fontSize: 11, color: '#7C8A9C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Ver todos ×
              </button>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr>
                {['Nombre', 'Empresa', 'Etapa', 'Valor', 'Responsable', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#566375', whiteSpace: 'nowrap', background: 'rgba(255,255,255,.02)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const cfg = STAGE_CFG[l.etapa];
                const isSel = selected?.id === l.id;
                return (
                  <tr key={l.id}
                    onClick={() => setSelected(isSel ? null : l)}
                    style={{ cursor: 'pointer', background: isSel ? 'rgba(255,255,255,.04)' : 'transparent', transition: 'background .1s' }}
                    onMouseEnter={e => !isSel && ((e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.02)')}
                    onMouseLeave={e => !isSel && ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '9px 12px', fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, color: '#F4F7FB', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{l.nombre}</td>
                    <td style={{ padding: '9px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AEBCCD', borderBottom: '1px solid rgba(255,255,255,.04)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.empresa}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 10.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        <Circle size={4} fill={cfg.color} strokeWidth={0} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#F4F7FB', borderBottom: '1px solid rgba(255,255,255,.04)', whiteSpace: 'nowrap' }}>{fmt(l.valor)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AEBCCD', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{l.responsable}</td>
                    <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#7C8A9C', borderBottom: '1px solid rgba(255,255,255,.04)', whiteSpace: 'nowrap' }}>{l.fecha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lead detail */}
        {selected && (
          <div style={{ ...CARD, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#F4F7FB' }}>Detalle del lead</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#566375', fontSize: 16 }}>×</button>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(201,168,76,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} strokeWidth={1.6} style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: '#F4F7FB' }}>{selected.nombre}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7C8A9C', marginTop: 2 }}>{selected.empresa}</div>
            </div>
            {[
              { Icon: Mail,     val: selected.correo },
              { Icon: Phone,    val: selected.telefono },
              { Icon: Calendar, val: selected.fecha },
              { Icon: DollarSign, val: fmt(selected.valor) },
            ].map(({ Icon, val }) => (
              <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AEBCCD' }}>
                <Icon size={13} strokeWidth={1.7} style={{ color: '#566375', flexShrink: 0 }} />
                {val}
              </div>
            ))}
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#566375' }}>Responsable</span>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600, color: '#AEBCCD', marginTop: 3 }}>{selected.responsable}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────
export default function GestionComercialPage() {
  const { demoMode } = useDemo();
  if (demoMode === 'empresa') return <DemoComercial />;
  return (
    <ModuloEnConstruccion
      titulo="Gestión Comercial"
      descripcion="Estamos trabajando en este módulo, ¡lo tendremos funcionando muy pronto!"
    />
  );
}
