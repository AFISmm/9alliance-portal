import { useState, useMemo } from 'react';
import {
  Plane, Calendar, Briefcase, CheckCircle2,
  FileText, Bell, Moon, Sun, Upload, ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

// ── 9 Alliance palette ────────────────────────────────────────────────────────
// navy-950 #0d1829  navy-900 #1B2A4A  navy-800 #243560  navy-700 #2d4175
// gold-500 #C9A84C  gold-400 #d4b96a  gold-300 #e0cb8e
// cream    #F8F7F4

const DARK = {
  page:     '#0d1829',
  card:     '#1B2A4A',
  line:     '#243560',
  t1:       '#F8F7F4',
  t2:       '#AEBCCD',
  t3:       '#7C8A9C',
  track:    '#243560',
  goldBg:   'rgba(201,168,76,.12)',
  blueBg:   'rgba(45,65,117,.55)',
};
const LIGHT = {
  page:     '#F2F5F9',
  card:     '#ffffff',
  line:     '#E4EAF1',
  t1:       '#0d1829',
  t2:       '#46556A',
  t3:       '#8A98AB',
  track:    '#E4EAF1',
  goldBg:   'rgba(201,168,76,.1)',
  blueBg:   '#E4EEFB',
};

// Gold shades
const GOLD    = '#C9A84C';
const GOLD_LT = '#d4b96a';
const GOLD_DK = '#a8862e';
const BLUE    = '#4A7FD4';

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
    boxShadow:     '0 1px 3px rgba(0,0,0,.15)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           13,
  };
  const overline: React.CSSProperties = {
    fontFamily:    'Inter, sans-serif',
    fontSize:      10.5,
    fontWeight:    600,
    letterSpacing: '.1em',
    textTransform: 'uppercase' as const,
    color:         tk.t3,
  };
  const chipGold: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 9,
    background: tk.goldBg,
    border: `1px solid ${GOLD}33`,
    display: 'grid', placeItems: 'center',
    color: GOLD, flexShrink: 0,
  };
  const chipBlue: React.CSSProperties = {
    ...chipGold,
    background: tk.blueBg,
    border: `1px solid ${BLUE}33`,
    color: BLUE,
  };

  return (
    <div style={{ minHeight: '100%', background: tk.page, borderRadius: 12, overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <header style={{ position: 'relative', background: 'linear-gradient(135deg, #0d1829 0%, #1B2A4A 100%)', color: '#fff', padding: '24px 28px 26px', overflow: 'hidden' }}>

        {/* Diagonal stripe: gold tint */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '42%', height: '100%', backgroundImage: 'repeating-linear-gradient(118deg, transparent 0 30px, rgba(201,168,76,.22) 30px 31px)', maskImage: 'linear-gradient(90deg, transparent 10%, #000 90%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 10%, #000 90%)', pointerEvents: 'none' }} />

        {/* Top bar: breadcrumb + actions */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, letterSpacing: '.04em', color: '#93A1B3' }}>
            <LayoutDashboard size={16} strokeWidth={1.75} style={{ color: GOLD, flexShrink: 0 }} />
            <span>Portal empleado · {todayStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={{ width: 36, height: 36, borderRadius: 7, border: 0, background: 'transparent', color: 'rgba(255,255,255,.75)', cursor: 'pointer', display: 'grid', placeItems: 'center', position: 'relative' }}>
              <Bell size={17} strokeWidth={1.75} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: GOLD, border: '1.5px solid #0d1829' }} />
            </button>
            <button
              onClick={() => setTheme(t => t === 'oscuro' ? 'claro' : 'oscuro')}
              style={{ width: 36, height: 36, borderRadius: 7, border: 0, background: 'transparent', color: 'rgba(255,255,255,.75)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              title="Cambiar tema"
            >
              {theme === 'oscuro' ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Greeting + CTA buttons */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD_LT}, ${GOLD_DK})`, display: 'grid', placeItems: 'center', color: '#0d1829', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, boxShadow: `0 0 0 4px ${GOLD}28`, flexShrink: 0 }}>MR</div>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.08 }}>Hola, Mateo</div>
              <div style={{ fontSize: 14, color: '#93A1B3', marginTop: 5 }}>Este es el resumen de tu situación laboral.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button style={{ appearance: 'none', border: 0, cursor: 'pointer', background: GOLD, color: '#0d1829', borderRadius: 7, padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, boxShadow: `0 6px 18px -8px ${GOLD}99` }}>
              <Plane size={16} strokeWidth={1.75} />Solicitar vacaciones
            </button>
            <button style={{ appearance: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.18)', borderRadius: 7, padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Upload size={16} strokeWidth={1.75} />Subir documento
            </button>
          </div>
        </div>

        {/* Metric strip */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            { dot: GOLD,    label: 'Vacaciones',     value: '12.29', unit: 'días'  },
            { dot: BLUE,    label: 'Días trabajados', value: '295',   unit: ''      },
            { dot: GOLD_LT, label: 'Próxima nómina',  value: String(daysToPay), unit: 'días' },
            { dot: '#4AA8D4',label: 'Pendientes',     value: '0',     unit: ''      },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '13px 18px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.07)' : undefined }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'auto auto', gap: 16, maxWidth: 1180 }}>

          {/* A · Vacaciones (span 2 rows) */}
          <section style={{ ...card, gridColumn: '1', gridRow: '1 / 3', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={overline}>Vacaciones</span>
              <span style={chipGold}><Plane size={19} strokeWidth={1.75} /></span>
            </div>
            {/* Conic ring with gold accent */}
            <div style={{ position: 'relative', width: 166, height: 166, borderRadius: '50%', background: `conic-gradient(${GOLD} 0 100%, ${tk.track} 0)`, display: 'grid', placeItems: 'center', margin: '6px auto' }}>
              <div style={{ width: 124, height: 124, borderRadius: '50%', background: tk.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>12.29</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10.5, color: tk.t3, textTransform: 'uppercase' as const, letterSpacing: '.12em', marginTop: 4 }}>días libres</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[{ label: 'Disponibles', val: '12.29', color: GOLD }, { label: 'Tomadas', val: '0', color: tk.track }].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: tk.t2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }} />{r.label}
                  </span>
                  <b style={{ fontFamily: 'Inter, sans-serif', color: tk.t1 }}>{r.val}</b>
                </div>
              ))}
            </div>
            <button style={{ appearance: 'none', border: `1px solid ${GOLD}44`, cursor: 'pointer', width: '100%', background: tk.goldBg, color: GOLD, borderRadius: 7, padding: 11, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 'auto' }}>
              <Calendar size={14} strokeWidth={1.75} />Planificar mis días<ArrowRight size={13} strokeWidth={2} />
            </button>
          </section>

          {/* B · Próxima nómina (dark accent card — navy gradient) */}
          <section style={{ ...card, gridColumn: '2', gridRow: '1', background: 'linear-gradient(140deg,#1B2A4A,#0d1829)', border: `1px solid ${GOLD}22`, boxShadow: '0 10px 28px -16px rgba(0,0,0,.6)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ ...overline, color: '#93A1B3' }}>Próxima nómina</span>
              <Calendar size={19} strokeWidth={1.75} style={{ color: GOLD_LT, flexShrink: 0 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{daysToPay}</span>
              <span style={{ fontSize: 13.5, color: '#93A1B3' }}>días · {payDateStr}</span>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
                <div style={{ width: `${periodPct}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD_LT}, ${GOLD})`, borderRadius: 99 }} />
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
              <span style={chipBlue}><Briefcase size={19} strokeWidth={1.75} /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>295</span>
              <span style={{ fontSize: 13, color: tk.t3 }}>≈ {tenureM} meses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30, marginTop: 'auto' }}>
              {BAR_HEIGHTS.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: BLUE, opacity: 0.3 + (i / BAR_HEIGHTS.length) * 0.7 }} />
              ))}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3 }}>Antigüedad · desde 01/09/2025</div>
          </section>

          {/* D · Solicitudes pendientes */}
          <section style={{ ...card, gridColumn: '2', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: tk.blueBg, border: `1px solid ${BLUE}33`, display: 'grid', placeItems: 'center', flexShrink: 0, color: BLUE }}>
              <CheckCircle2 size={22} strokeWidth={1.75} />
            </div>
            <div>
              <span style={overline}>Solicitudes pendientes</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: tk.t1, lineHeight: 1 }}>0</span>
                <span style={{ fontSize: 13, color: tk.t3 }}>Todo al día</span>
              </div>
            </div>
          </section>

          {/* E · Tipo de contrato */}
          <section style={{ ...card, gridColumn: '3', gridRow: '2', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 9, background: tk.goldBg, border: `1px solid ${GOLD}33`, display: 'grid', placeItems: 'center', flexShrink: 0, color: GOLD }}>
              <FileText size={20} strokeWidth={1.75} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={overline}>Tipo de contrato</span>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700, color: tk.t1, marginTop: 3 }}>Indefinido</div>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: tk.t3, whiteSpace: 'nowrap' }}>01/09/2025</span>
          </section>

        </div>
      </div>
    </div>
  );
}
