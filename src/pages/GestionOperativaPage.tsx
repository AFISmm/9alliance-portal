import { useState, useMemo } from 'react';
import {
  Plane, Calendar, Briefcase, CheckCircle2,
  FileText, Bell, Moon, Sun, Upload, ArrowRight,
} from 'lucide-react';
import dgIso from '../assets/dg-iso.png';

// ── Design tokens ─────────────────────────────────────────────────────────────
const DARK = {
  page:     '#0B1420',
  card:     '#121E2B',
  line:     '#21303F',
  t1:       '#F4F7FB',
  t2:       '#AEBCCD',
  t3:       '#7C8A9C',
  track:    '#21303F',
  orangeBg: '#3A1C12',
  blueBg:   '#12243C',
};
const LIGHT = {
  page:     '#F2F5F9',
  card:     '#ffffff',
  line:     '#E4EAF1',
  t1:       '#0E1A26',
  t2:       '#46556A',
  t3:       '#8A98AB',
  track:    '#E4EAF1',
  orangeBg: '#FCE9E1',
  blueBg:   '#E4EEFB',
};

type Theme = 'oscuro' | 'claro';

function calcDaysToPay(today: Date): number {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - today.getDate();
}
function calcPeriodPct(today: Date): number {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Math.round((today.getDate() / lastDay) * 100);
}
function calcTenure(from: Date, today: Date): number {
  return Math.floor((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}
function fmtPayDate(today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const BAR_HEIGHTS = [30, 42, 55, 62, 70, 80, 87, 94, 100];

export default function GestionOperativaPage() {
  const [theme, setTheme] = useState<Theme>('oscuro');
  const tk = theme === 'oscuro' ? DARK : LIGHT;

  const today      = useMemo(() => new Date(), []);
  const daysToPay  = useMemo(() => calcDaysToPay(today),  [today]);
  const periodPct  = useMemo(() => calcPeriodPct(today),  [today]);
  const tenureM    = useMemo(() => calcTenure(new Date('2025-09-01'), today), [today]);
  const payDateStr = useMemo(() => fmtPayDate(today), [today]);

  const todayStr = today.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });

  const card: React.CSSProperties = {
    background:    tk.card,
    border:        `1px solid ${tk.line}`,
    borderRadius:  10,
    padding:       20,
    boxShadow:     '0 1px 3px rgba(7,14,21,.07)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           12,
  };
  const overline: React.CSSProperties = {
    fontFamily:    'Inter, sans-serif',
    fontSize:      10.5,
    fontWeight:    600,
    letterSpacing: '.1em',
    textTransform: 'uppercase' as const,
    color:         tk.t3,
  };
  const chipO: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 9,
    background: tk.orangeBg,
    display: 'grid', placeItems: 'center',
    color: '#F1592A', flexShrink: 0,
  };
  const chipB: React.CSSProperties = {
    ...chipO,
    background: tk.blueBg,
    color: theme === 'oscuro' ? '#62B6F2' : '#2E6FD6',
  };

  return (
    <div style={{ minHeight: '100%', background: tk.page, borderRadius: 12, overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <header style={{ position: 'relative', background: 'linear-gradient(135deg,#0E1A26 0%,#070E15 100%)', color: '#fff', padding: '26px 28px 28px', overflow: 'hidden' }}>
        {/* Diagonal stripe pattern */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', backgroundImage: 'repeating-linear-gradient(118deg, transparent 0 30px, rgba(241,89,42,.45) 30px 31px)', maskImage: 'linear-gradient(90deg, transparent 10%, #000 90%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 10%, #000 90%)', pointerEvents: 'none' }} />

        {/* Top bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <img src={dgIso} alt="diGenius.ai" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(241,89,42,.35))' }} />
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, letterSpacing: '-.01em' }}>
                <span style={{ fontWeight: 400, color: '#fff' }}>di</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>Genius</span>
                <span style={{ fontWeight: 600, color: '#5BB8F0' }}>.ai</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '.18em', color: '#566375', marginTop: 1 }}>PORTAL EMPLEADO</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={{ width: 36, height: 36, borderRadius: 7, border: 0, background: 'transparent', color: 'rgba(255,255,255,.8)', cursor: 'pointer', display: 'grid', placeItems: 'center', position: 'relative' }}>
              <Bell size={17} strokeWidth={1.75} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#F1592A', border: '1.5px solid #0E1A26' }} />
            </button>
            <button
              onClick={() => setTheme(t => t === 'oscuro' ? 'claro' : 'oscuro')}
              style={{ width: 36, height: 36, borderRadius: 7, border: 0, background: 'transparent', color: 'rgba(255,255,255,.8)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              {theme === 'oscuro' ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Greeting row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,#FF7A45,#E0481C)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, boxShadow: '0 0 0 3px rgba(241,89,42,.18)', flexShrink: 0 }}>MR</div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.06em', color: '#93A1B3', marginBottom: 4 }}>GESTIÓN OPERATIVA · {todayStr}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 27, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.08 }}>Hola, Mateo</div>
              <div style={{ fontSize: 13.5, color: '#7C8A9C', marginTop: 4 }}>Este es el resumen de tu situación laboral.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: '#F1592A', color: '#fff', borderRadius: 7, padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 6px 18px -8px rgba(241,89,42,.7)' }}>
              <Plane size={16} strokeWidth={1.75} />Solicitar vacaciones
            </button>
            <button style={{ appearance: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.09)', color: '#fff', border: '1px solid rgba(255,255,255,.18)', borderRadius: 7, padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Upload size={16} strokeWidth={1.75} />Subir documento
            </button>
          </div>
        </div>

        {/* Metric strip */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            { dot: '#F1592A', label: 'Vacaciones',     value: '12.29', unit: 'días'  },
            { dot: '#62B6F2', label: 'Días trabajados', value: '295',   unit: ''      },
            { dot: '#FF7A45', label: 'Próxima nómina',  value: String(daysToPay), unit: 'días' },
            { dot: '#2E6FD6', label: 'Pendientes',      value: '0',     unit: ''      },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '13px 18px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.08)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: '#93A1B3' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {s.value}{s.unit && <span style={{ fontSize: 12, color: '#93A1B3', fontWeight: 400, marginLeft: 5 }}>{s.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── Cards grid ── */}
      <div style={{ padding: 20, background: tk.page }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'auto auto', gap: 16 }}>

          {/* A · Vacaciones — spans 2 rows */}
          <section style={{ ...card, gridColumn: '1', gridRow: '1 / 3', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={overline}>Vacaciones</span>
              <span style={chipO}><Plane size={19} strokeWidth={1.75} /></span>
            </div>
            {/* Conic-gradient ring */}
            <div style={{ position: 'relative', width: 164, height: 164, borderRadius: '50%', background: `conic-gradient(#F1592A 0 100%, ${tk.track} 0)`, display: 'grid', placeItems: 'center', margin: '4px auto' }}>
              <div style={{ width: 122, height: 122, borderRadius: '50%', background: tk.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>12.29</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10.5, color: tk.t3, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginTop: 3 }}>días</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[{ label: 'Disponibles', val: '12.29', color: '#F1592A' }, { label: 'Tomadas', val: '0', color: tk.track }].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: tk.t2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }} />{r.label}
                  </span>
                  <b style={{ fontFamily: 'Inter, sans-serif', color: tk.t1 }}>{r.val}</b>
                </div>
              ))}
            </div>
            <button style={{ appearance: 'none', border: 0, cursor: 'pointer', width: '100%', background: tk.orangeBg, color: '#F1592A', borderRadius: 7, padding: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 'auto' }}>
              <Plane size={14} strokeWidth={1.75} />Planificar mis días<ArrowRight size={13} strokeWidth={2} />
            </button>
          </section>

          {/* B · Próxima nómina */}
          <section style={{ ...card, gridColumn: '2', gridRow: '1', background: theme === 'oscuro' ? 'linear-gradient(140deg,#1B2E42,#0C1722)' : 'linear-gradient(140deg,#0E1A26,#070E15)', border: '1px solid rgba(255,255,255,.06)', boxShadow: '0 10px 28px -16px rgba(7,14,21,.8)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ ...overline, color: '#93A1B3' }}>Próxima nómina</span>
              <Calendar size={19} strokeWidth={1.75} style={{ color: '#FF8A5C', flexShrink: 0 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysToPay}</span>
              <span style={{ fontSize: 13, color: '#93A1B3' }}>días · {payDateStr}</span>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
                <div style={{ width: `${periodPct}%`, height: '100%', background: 'linear-gradient(90deg,#FF7A45,#F1592A)', borderRadius: 99 }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#93A1B3' }}>
                {today.getDate()} / {new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()} días del periodo
              </div>
            </div>
          </section>

          {/* C · Días trabajados */}
          <section style={{ ...card, gridColumn: '3', gridRow: '1' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={overline}>Días trabajados</span>
              <span style={chipB}><Briefcase size={19} strokeWidth={1.75} /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 30, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>295</span>
              <span style={{ fontSize: 13, color: tk.t3 }}>≈ {tenureM} meses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28, marginTop: 'auto' }}>
              {BAR_HEIGHTS.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: theme === 'oscuro' ? '#62B6F2' : '#2E6FD6', opacity: 0.3 + (i / BAR_HEIGHTS.length) * 0.7 }} />
              ))}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3 }}>Desde · 01/09/2025</div>
          </section>

          {/* D · Solicitudes */}
          <section style={{ ...card, gridColumn: '2', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: tk.blueBg, display: 'grid', placeItems: 'center', flexShrink: 0, color: theme === 'oscuro' ? '#62B6F2' : '#2E6FD6' }}>
              <CheckCircle2 size={22} strokeWidth={1.75} />
            </div>
            <div>
              <span style={overline}>Solicitudes pendientes</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>0</span>
                <span style={{ fontSize: 12.5, color: tk.t3 }}>Todo al día</span>
              </div>
            </div>
          </section>

          {/* E · Tipo de contrato */}
          <section style={{ ...card, gridColumn: '3', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 9, background: tk.orangeBg, display: 'grid', placeItems: 'center', flexShrink: 0, color: '#F1592A' }}>
              <FileText size={20} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={overline}>Tipo de contrato</span>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: tk.t1, marginTop: 3 }}>Indefinido</div>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3, whiteSpace: 'nowrap' }}>01/09/2025</span>
          </section>

        </div>
      </div>
    </div>
  );
}
