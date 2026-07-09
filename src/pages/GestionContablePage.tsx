import { useState, useRef, useMemo } from 'react';
import {
  Plus, Upload, Download, Pencil, Trash2, X,
  ChevronDown, Landmark, Wallet, CreditCard, Search,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────
type EstadoT = 'Pendiente' | 'Conciliado' | 'En revisión';
type TipoT   = 'cargo' | 'abono';

interface Tx {
  id: number;
  fecha: string;
  descripcion: string;
  movimiento: string;
  tipo: TipoT;
  monto: number;
  concepto: string;
  cuenta: string;
  cuentaRef: string;
  origen: string;
  nota: string;
  estado: EstadoT;
}

interface Period {
  id: string;
  nombre: string;
  banco: string;
  cuenta: string;
  saldoInicial: number;
  transactions: Tx[];
}

interface Company {
  id: string;
  name: string;
  currentPeriodId: string | null;
  periods: Record<string, Period>;
}

interface AppData {
  version: string;
  currentCompanyId: string;
  companies: Record<string, Company>;
  _nextId: number;
}

// ── Constants ─────────────────────────────────────────────────────────
const COMPANIES = [
  { id: 'mercury-ltda',  name: 'Mercury Methods LTDA' },
  { id: 'mercury-llc',   name: 'Mercury Methods LLC'  },
  { id: 'david-illidge', name: 'David Illidge'         },
  { id: 'azahar-retail', name: 'Azahar Retail'         },
];
const BANCOS: string[]  = ['Global66 COP', 'Global66 USD', 'Davivienda', 'Bancolombia', 'Nequi'];
const ESTADOS: EstadoT[] = ['Pendiente', 'Conciliado', 'En revisión'];
const STORAGE_KEY = '9a_conciliacion_v1';

// ── Seed ──────────────────────────────────────────────────────────────
function mkTx(id: number, f: string, d: string, m: string, t: TipoT, a: number,
  con: string, cta: string, ctaRef: string, ori: string, nota: string, est: EstadoT): Tx {
  return { id, fecha:f, descripcion:d, movimiento:m, tipo:t, monto:a,
    concepto:con, cuenta:cta, cuentaRef:ctaRef, origen:ori, nota, estado:est };
}

function buildSeed(): AppData {
  const txs: Tx[] = [
    mkTx(1001,'2026-03-03','Otro Movimiento de Retiro','28831783','cargo',6405200,'','22xx','','','','Pendiente'),
    mkTx(1002,'2026-03-03','GMF 4x1000','11383614','cargo',12003.56,'Impuestos no acreditables','54100501','GMF 4x1000','Global66','GMF retiro 28831783','Conciliado'),
    mkTx(1003,'2026-03-03','Otro Movimiento de Depósito','62012','abono',18795319.37,'','13050501','','','','Pendiente'),
    mkTx(1004,'2026-03-05','Compra Comcel Domiciliacion M','11160098','cargo',276080,'Teléfono','51353501','Servicios / Teléfono','Comcel / Claro','','Conciliado'),
    mkTx(1005,'2026-03-05','Otro Movimiento de Depósito','28992772','abono',42143.91,'','13050501','','','','Pendiente'),
    mkTx(1006,'2026-03-06','Compra Microsoft','11192582','cargo',56563.15,'Software contables','51959501','Servicios online / Software','Microsoft','','Conciliado'),
    mkTx(1007,'2026-03-06','GMF Microsoft','11519323','cargo',226.26,'Impuestos no acreditables','54100501','GMF Microsoft','Global66','GMF Microsoft','Conciliado'),
    mkTx(1008,'2026-03-13','Compra Comcel Domiciliacion M','11353946','cargo',46472,'Teléfono','51353501','Servicios / Teléfono','Comcel / Claro','','Conciliado'),
    mkTx(1009,'2026-03-13','Otro Movimiento de Retiro','7050429','cargo',800000,'','22xx','','','','Pendiente'),
    mkTx(1010,'2026-03-15','Compra Movistar Pagosepayco','11413473','cargo',190992,'Teléfono','51353501','Servicios / Teléfono','Movistar Colombia','','Conciliado'),
    mkTx(1011,'2026-03-18','Otro Movimiento de Retiro','29720162','cargo',3452466.33,'','','','','','Pendiente'),
    mkTx(1012,'2026-03-20','Otro Movimiento de Depósito','65393','abono',21922329.62,'','13050501','','','','Pendiente'),
    mkTx(1013,'2026-03-31','Intereses del período','–','abono',45460.74,'Intereses','42100501','Financieros / Intereses','Global66','Rendimientos mar-2026','Conciliado'),
  ];
  const companies: Record<string, Company> = {};
  for (const c of COMPANIES) {
    companies[c.id] = { id: c.id, name: c.name, currentPeriodId: null, periods: {} };
  }
  companies['mercury-ltda'].currentPeriodId = '2026-03';
  companies['mercury-ltda'].periods['2026-03'] = {
    id: '2026-03', nombre: 'Marzo 2026',
    banco: 'Global66 COP', cuenta: '11200502',
    saldoInicial: 11351966.78, transactions: txs,
  };
  return { version: '1.0', currentCompanyId: 'mercury-ltda', companies, _nextId: 2000 };
}

// ── Persistence ───────────────────────────────────────────────────────
function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as AppData;
      if (d.version === '1.0' && d.companies) return d;
    }
  } catch { /**/ }
  return buildSeed();
}
function saveData(d: AppData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

// ── Helpers ────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function nextEstado(e: EstadoT): EstadoT {
  return ESTADOS[(ESTADOS.indexOf(e) + 1) % ESTADOS.length];
}
function estadoColor(e: EstadoT) {
  if (e === 'Conciliado')  return '#22c55e';
  if (e === 'En revisión') return '#3b82f6';
  return '#f59e0b';
}
function estadoBg(e: EstadoT) {
  if (e === 'Conciliado')  return 'rgba(34,197,94,.12)';
  if (e === 'En revisión') return 'rgba(59,130,246,.12)';
  return 'rgba(245,158,11,.12)';
}
function parseCsvImport(text: string): Tx[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const result: Tx[] = [];
  let nid = Date.now();
  for (const line of lines.slice(1)) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    if (cols.length < 5) continue;
    const [fecha, descripcion, movimiento='', debitoStr='0', creditoStr='0',
      concepto='', cuenta='', cuentaRef='', origen='', nota='', estadoRaw='Pendiente'] = cols;
    const debito  = Math.abs(parseFloat(debitoStr.replace(/[^0-9.]/g, '')) || 0);
    const credito = Math.abs(parseFloat(creditoStr.replace(/[^0-9.]/g, '')) || 0);
    if (!fecha || (!debito && !credito)) continue;
    const tipo: TipoT   = debito > 0 ? 'cargo' : 'abono';
    const monto          = debito > 0 ? debito  : credito;
    const estado: EstadoT = ESTADOS.includes(estadoRaw as EstadoT) ? estadoRaw as EstadoT : 'Pendiente';
    result.push({ id: nid++, fecha, descripcion, movimiento, tipo, monto, concepto, cuenta, cuentaRef, origen, nota, estado });
  }
  return result;
}
function exportCsv(txs: Tx[], filename: string) {
  const headers = ['Fecha','Descripcion','N Movimiento','Débito','Crédito','Concepto Alegra','Cuenta Contable','Ref Cuenta','Origen/Destino','Notas','Estado'];
  const rows = txs.map(t => [
    t.fecha, t.descripcion, t.movimiento,
    t.tipo === 'cargo'  ? t.monto.toString() : '0',
    t.tipo === 'abono' ? t.monto.toString() : '0',
    t.concepto, t.cuenta, t.cuentaRef, t.origen, t.nota, t.estado,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Shared style constants ─────────────────────────────────────────────
const LABEL_ST: React.CSSProperties = {
  display: 'block', fontFamily: "'Inter', sans-serif",
  fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em',
  textTransform: 'uppercase', color: '#7C8A9C', marginBottom: 5,
};
const INPUT_ST: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 7, color: '#F4F7FB',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
};
const CARD_ST: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 10,
};
const BTN_GHOST: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px',
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 7, color: '#AEBCCD', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
};
const BLANK_TX: Omit<Tx,'id'> = {
  fecha: new Date().toISOString().slice(0,10), descripcion: '', movimiento: '',
  tipo: 'cargo', monto: 0, concepto: '', cuenta: '', cuentaRef: '', origen: '', nota: '', estado: 'Pendiente',
};
const BLANK_PER = { id:'', nombre:'', banco: BANCOS[0], cuenta:'', saldoInicial: 0 };

// ── Component ─────────────────────────────────────────────────────────
export default function GestionContablePage() {
  const [data, setData]               = useState<AppData>(loadData);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editTx, setEditTx]           = useState<Tx | null>(null);
  const [txForm, setTxForm]           = useState<Omit<Tx,'id'>>(BLANK_TX);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [periodForm, setPeriodForm]   = useState(BLANK_PER);
  const [confirmDel, setConfirmDel]   = useState<number | null>(null);
  const [search, setSearch]           = useState('');
  const fileRef                       = useRef<HTMLInputElement>(null);

  const company = data.companies[data.currentCompanyId];
  const period  = company?.currentPeriodId ? company.periods[company.currentPeriodId] : null;

  const allTxs = useMemo(() => {
    const t = period?.transactions ?? [];
    return [...t].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id));
  }, [period]);

  const txs = useMemo(() => {
    if (!search.trim()) return allTxs;
    const q = search.toLowerCase();
    return allTxs.filter(t =>
      t.descripcion.toLowerCase().includes(q) ||
      t.movimiento.toLowerCase().includes(q)  ||
      t.concepto.toLowerCase().includes(q)    ||
      t.origen.toLowerCase().includes(q)
    );
  }, [allTxs, search]);

  const totalCargos = allTxs.reduce((s,t) => s + (t.tipo==='cargo' ? t.monto : 0), 0);
  const totalAbonos = allTxs.reduce((s,t) => s + (t.tipo==='abono' ? t.monto : 0), 0);
  const saldoActual = (period?.saldoInicial ?? 0) + totalAbonos - totalCargos;
  const concCount   = allTxs.filter(t => t.estado==='Conciliado').length;
  const pendCount   = allTxs.filter(t => t.estado==='Pendiente').length;
  const revCount    = allTxs.filter(t => t.estado==='En revisión').length;

  const periodList = company
    ? Object.values(company.periods).sort((a,b) => b.id.localeCompare(a.id))
    : [];

  function mut(fn: (d: AppData) => void) {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as AppData;
      fn(next);
      saveData(next);
      return next;
    });
  }

  function setCompany(id: string) { mut(d => { d.currentCompanyId = id; }); }
  function setPeriod(id: string)  {
    mut(d => { d.companies[d.currentCompanyId].currentPeriodId = id; });
  }
  function toggleEstado(txId: number) {
    mut(d => {
      const co  = d.companies[d.currentCompanyId];
      const per = co.periods[co.currentPeriodId!];
      const tx  = per.transactions.find(t => t.id === txId);
      if (tx) tx.estado = nextEstado(tx.estado);
    });
  }
  function deleteTx(txId: number) {
    mut(d => {
      const co  = d.companies[d.currentCompanyId];
      const per = co.periods[co.currentPeriodId!];
      per.transactions = per.transactions.filter(t => t.id !== txId);
    });
    setConfirmDel(null);
  }
  function openAdd() {
    setEditTx(null);
    setTxForm({ ...BLANK_TX, fecha: new Date().toISOString().slice(0,10) });
    setShowAddEdit(true);
  }
  function openEdit(tx: Tx) {
    setEditTx(tx);
    setTxForm({ fecha:tx.fecha, descripcion:tx.descripcion, movimiento:tx.movimiento,
      tipo:tx.tipo, monto:tx.monto, concepto:tx.concepto, cuenta:tx.cuenta,
      cuentaRef:tx.cuentaRef, origen:tx.origen, nota:tx.nota, estado:tx.estado });
    setShowAddEdit(true);
  }
  function saveTx() {
    if (!txForm.descripcion || !txForm.monto) return;
    mut(d => {
      const co  = d.companies[d.currentCompanyId];
      const per = co.periods[co.currentPeriodId!];
      if (editTx) {
        const idx = per.transactions.findIndex(t => t.id === editTx.id);
        if (idx >= 0) per.transactions[idx] = { id: editTx.id, ...txForm };
      } else {
        d._nextId++;
        per.transactions.push({ id: d._nextId, ...txForm });
      }
    });
    setShowAddEdit(false);
  }
  function createPeriod() {
    if (!periodForm.id || !periodForm.nombre) return;
    const pid = periodForm.id.slice(0, 7);
    mut(d => {
      const co = d.companies[d.currentCompanyId];
      co.periods[pid] = {
        id: pid, nombre: periodForm.nombre, banco: periodForm.banco,
        cuenta: periodForm.cuenta, saldoInicial: periodForm.saldoInicial, transactions: [],
      };
      co.currentPeriodId = pid;
    });
    setShowNewPeriod(false);
    setPeriodForm(BLANK_PER);
  }
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !period) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const newTxs = parseCsvImport(ev.target?.result as string);
      if (newTxs.length) {
        mut(d => {
          const co  = d.companies[d.currentCompanyId];
          const per = co.periods[co.currentPeriodId!];
          for (const tx of newTxs) { d._nextId++; tx.id = d._nextId; per.transactions.push(tx); }
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const canSaveTx = !!txForm.descripcion && txForm.monto > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>

      {/* ── Company tabs ── */}
      <div style={{ ...CARD_ST, padding: '5px 5px' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {COMPANIES.map(c => {
            const active = data.currentCompanyId === c.id;
            return (
              <button key={c.id} onClick={() => setCompany(c.id)} style={{
                padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: active ? 600 : 500,
                background: active ? 'rgba(201,168,76,.14)' : 'transparent',
                color: active ? '#C9A84C' : 'rgba(248,247,244,.4)',
                transition: 'all .15s',
                boxShadow: active ? 'inset 0 -2px 0 0 #C9A84C' : 'none',
              }}>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Period bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {periodList.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <select value={company?.currentPeriodId ?? ''} onChange={e => setPeriod(e.target.value)}
              style={{ appearance: 'none', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#F4F7FB', padding: '7px 32px 7px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer' }}>
              {periodList.map(p => <option key={p.id} value={p.id} style={{ background: '#0d1829' }}>{p.nombre}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#7C8A9C', pointerEvents: 'none' }} />
          </div>
        ) : (
          <span style={{ color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Sin períodos</span>
        )}
        <button onClick={() => { setPeriodForm(BLANK_PER); setShowNewPeriod(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)',
          borderRadius: 8, color: '#C9A84C', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
        }}>
          <Plus size={13} strokeWidth={2.5} /> Nuevo período
        </button>
        {period && (
          <span style={{ color: 'rgba(248,247,244,.3)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            {period.banco} · {period.cuenta}
          </span>
        )}
      </div>

      {/* ── Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Saldo Inicial', value: fmt(period?.saldoInicial ?? 0), color: '#C9A84C',  Icon: Wallet     },
          { label: 'Total Abonos',  value: fmt(totalAbonos),               color: '#22c55e',  Icon: CreditCard },
          { label: 'Total Cargos',  value: fmt(totalCargos),               color: '#ef4444',  Icon: CreditCard },
          { label: 'Saldo Actual',  value: fmt(saldoActual),               color: saldoActual >= 0 ? '#22c55e' : '#ef4444', Icon: Landmark },
        ].map(m => (
          <div key={m.label} style={{ ...CARD_ST, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="overline-9a">{m.label}</span>
              <m.Icon size={17} strokeWidth={1.7} style={{ color: m.color, opacity: .65 }} />
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Estado strip + total ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {([['Conciliados', concCount, '#22c55e'], ['Pendientes', pendCount, '#f59e0b'], ['En revisión', revCount, '#3b82f6']] as const).map(([label, count, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 99 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color, fontWeight: 600 }}>{count} {label}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#7C8A9C' }}>
          {allTxs.length} movimientos
        </span>
      </div>

      {/* ── Action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
          background: '#C9A84C', border: 'none', borderRadius: 7, color: '#0d1829',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 18px -8px rgba(201,168,76,.6)',
        }}>
          <Plus size={15} strokeWidth={2.5} /> Agregar
        </button>
        <button onClick={() => fileRef.current?.click()} style={BTN_GHOST}>
          <Upload size={14} /> Importar CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleImport} />
        {allTxs.length > 0 && (
          <button onClick={() => exportCsv(allTxs, `conciliacion_${data.currentCompanyId}_${company?.currentPeriodId ?? 'sin-periodo'}.csv`)} style={BTN_GHOST}>
            <Download size={14} /> Exportar CSV
          </button>
        )}
        <div style={{ flex: 1, maxWidth: 300, position: 'relative', marginLeft: 'auto' }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#7C8A9C' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
            style={{ ...INPUT_ST, paddingLeft: 30 }} />
        </div>
      </div>

      {/* ── Table ── */}
      {!period ? (
        <div style={{ ...CARD_ST, padding: 48, textAlign: 'center', color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>
          Selecciona o crea un período para comenzar.
        </div>
      ) : (
        <div style={{ ...CARD_ST, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1100, fontFamily:"'DM Sans', sans-serif", fontSize:12.5 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                {['Fecha','Descripción','Ref.','Débito','Crédito','Concepto','Cuenta','Origen','Estado',''].map(h => (
                  <th key={h} style={{
                    padding:'10px 12px', textAlign: h==='Débito'||h==='Crédito' ? 'right' : 'left',
                    fontFamily:"'Inter', sans-serif", fontSize:10, fontWeight:600,
                    letterSpacing:'.1em', textTransform:'uppercase', color:'#7C8A9C', whiteSpace:'nowrap',
                    background:'rgba(255,255,255,.02)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.length === 0 ? (
                <tr><td colSpan={10} style={{ padding:40, textAlign:'center', color:'#7C8A9C' }}>
                  {search ? 'Sin resultados.' : 'Sin movimientos en este período.'}
                </td></tr>
              ) : txs.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                  <td style={{ padding:'9px 12px', fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:'#AEBCCD', whiteSpace:'nowrap' }}>{tx.fecha}</td>
                  <td style={{ padding:'9px 12px', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={tx.descripcion}>{tx.descripcion}</td>
                  <td style={{ padding:'9px 12px', fontFamily:"'JetBrains Mono', monospace", fontSize:10.5, color:'#7C8A9C', maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.movimiento || '–'}</td>
                  <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:"'JetBrains Mono', monospace", fontSize:12, color: tx.tipo==='cargo' ? '#fca5a5' : 'rgba(255,255,255,.2)' }}>
                    {tx.tipo==='cargo' ? fmt(tx.monto) : '–'}
                  </td>
                  <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:"'JetBrains Mono', monospace", fontSize:12, color: tx.tipo==='abono' ? '#86efac' : 'rgba(255,255,255,.2)' }}>
                    {tx.tipo==='abono' ? fmt(tx.monto) : '–'}
                  </td>
                  <td style={{ padding:'9px 12px', color:'#AEBCCD', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.concepto || '–'}</td>
                  <td style={{ padding:'9px 12px', fontFamily:"'JetBrains Mono', monospace", fontSize:10.5, color:'#7C8A9C' }}>{tx.cuenta || '–'}</td>
                  <td style={{ padding:'9px 12px', color:'#AEBCCD', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.origen || '–'}</td>
                  <td style={{ padding:'9px 12px' }}>
                    {confirmDel !== tx.id && (
                      <button onClick={() => toggleEstado(tx.id)} style={{
                        display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px',
                        borderRadius:99, border:`1px solid ${estadoColor(tx.estado)}35`,
                        background:estadoBg(tx.estado), color:estadoColor(tx.estado),
                        cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontSize:11.5, fontWeight:600, whiteSpace:'nowrap',
                      }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:estadoColor(tx.estado) }} />
                        {tx.estado}
                      </button>
                    )}
                  </td>
                  <td style={{ padding:'9px 8px', whiteSpace:'nowrap' }}>
                    {confirmDel === tx.id ? (
                      <span style={{ display:'inline-flex', gap:4 }}>
                        <button onClick={() => deleteTx(tx.id)} style={{ padding:'3px 8px', borderRadius:5, border:'none', background:'#ef4444', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>Sí</button>
                        <button onClick={() => setConfirmDel(null)} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#AEBCCD', cursor:'pointer', fontSize:11 }}>No</button>
                      </span>
                    ) : (
                      <span style={{ display:'inline-flex', gap:3 }}>
                        <button onClick={() => openEdit(tx)} title="Editar" style={{ padding:4, borderRadius:5, border:'none', background:'rgba(255,255,255,.05)', color:'#C9A84C', cursor:'pointer', display:'flex', alignItems:'center' }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setConfirmDel(tx.id)} title="Eliminar" style={{ padding:4, borderRadius:5, border:'none', background:'rgba(255,255,255,.05)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showAddEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,10,18,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'#0f1c2d', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:24, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Inter', sans-serif", fontSize:15, fontWeight:700, color:'#F4F7FB' }}>
                {editTx ? 'Editar movimiento' : 'Nuevo movimiento'}
              </h3>
              <button onClick={() => setShowAddEdit(false)} style={{ background:'none', border:'none', color:'#7C8A9C', cursor:'pointer' }}><X size={17} /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px' }}>
              <div>
                <label style={LABEL_ST}>Fecha *</label>
                <input type="date" value={txForm.fecha} onChange={e => setTxForm(f => ({ ...f, fecha:e.target.value }))} style={INPUT_ST} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:8 }}>
                <div>
                  <label style={LABEL_ST}>Tipo *</label>
                  <select value={txForm.tipo} onChange={e => setTxForm(f => ({ ...f, tipo:e.target.value as TipoT }))} style={INPUT_ST}>
                    <option value="cargo"  style={{ background:'#0d1829' }}>Débito</option>
                    <option value="abono"  style={{ background:'#0d1829' }}>Crédito</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_ST}>Monto *</label>
                  <input type="number" step="0.01" min="0" value={txForm.monto || ''} onChange={e => setTxForm(f => ({ ...f, monto:parseFloat(e.target.value)||0 }))} style={INPUT_ST} placeholder="0.00" />
                </div>
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={LABEL_ST}>Descripción *</label>
                <input value={txForm.descripcion} onChange={e => setTxForm(f => ({ ...f, descripcion:e.target.value }))} style={INPUT_ST} placeholder="Descripción del movimiento" />
              </div>
              <div>
                <label style={LABEL_ST}>N° Movimiento</label>
                <input value={txForm.movimiento} onChange={e => setTxForm(f => ({ ...f, movimiento:e.target.value }))} style={INPUT_ST} placeholder="Referencia" />
              </div>
              <div>
                <label style={LABEL_ST}>Estado</label>
                <select value={txForm.estado} onChange={e => setTxForm(f => ({ ...f, estado:e.target.value as EstadoT }))} style={INPUT_ST}>
                  {ESTADOS.map(e => <option key={e} value={e} style={{ background:'#0d1829' }}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_ST}>Concepto Alegra</label>
                <input value={txForm.concepto} onChange={e => setTxForm(f => ({ ...f, concepto:e.target.value }))} style={INPUT_ST} placeholder="Concepto contable" />
              </div>
              <div>
                <label style={LABEL_ST}>Cuenta Contable</label>
                <input value={txForm.cuenta} onChange={e => setTxForm(f => ({ ...f, cuenta:e.target.value }))} style={INPUT_ST} placeholder="Ej. 51353501" />
              </div>
              <div>
                <label style={LABEL_ST}>Ref. Cuenta</label>
                <input value={txForm.cuentaRef} onChange={e => setTxForm(f => ({ ...f, cuentaRef:e.target.value }))} style={INPUT_ST} placeholder="Descripción" />
              </div>
              <div>
                <label style={LABEL_ST}>Origen / Destino</label>
                <input value={txForm.origen} onChange={e => setTxForm(f => ({ ...f, origen:e.target.value }))} style={INPUT_ST} placeholder="Nombre del tercero" />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={LABEL_ST}>Notas</label>
                <input value={txForm.nota} onChange={e => setTxForm(f => ({ ...f, nota:e.target.value }))} style={INPUT_ST} placeholder="Notas adicionales" />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setShowAddEdit(false)} style={{ padding:'9px 18px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#AEBCCD', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontSize:13 }}>Cancelar</button>
              <button onClick={saveTx} disabled={!canSaveTx} style={{ padding:'9px 18px', borderRadius:7, border:'none', background:canSaveTx ? '#C9A84C' : 'rgba(201,168,76,.3)', color:canSaveTx ? '#0d1829' : '#7C8A9C', cursor:canSaveTx ? 'pointer' : 'not-allowed', fontFamily:"'Inter', sans-serif", fontSize:13, fontWeight:700 }}>
                {editTx ? 'Guardar cambios' : 'Crear movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Period Modal ── */}
      {showNewPeriod && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,10,18,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'#0f1c2d', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:24, width:'100%', maxWidth:420 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Inter', sans-serif", fontSize:15, fontWeight:700, color:'#F4F7FB' }}>Nuevo período</h3>
              <button onClick={() => setShowNewPeriod(false)} style={{ background:'none', border:'none', color:'#7C8A9C', cursor:'pointer' }}><X size={17} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={LABEL_ST}>Mes (YYYY-MM) *</label>
                <input value={periodForm.id} onChange={e => setPeriodForm(f => ({ ...f, id:e.target.value }))} style={INPUT_ST} placeholder="2026-07" maxLength={7} />
              </div>
              <div>
                <label style={LABEL_ST}>Nombre *</label>
                <input value={periodForm.nombre} onChange={e => setPeriodForm(f => ({ ...f, nombre:e.target.value }))} style={INPUT_ST} placeholder="Julio 2026" />
              </div>
              <div>
                <label style={LABEL_ST}>Banco</label>
                <select value={periodForm.banco} onChange={e => setPeriodForm(f => ({ ...f, banco:e.target.value }))} style={INPUT_ST}>
                  {BANCOS.map(b => <option key={b} value={b} style={{ background:'#0d1829' }}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_ST}>N° Cuenta</label>
                <input value={periodForm.cuenta} onChange={e => setPeriodForm(f => ({ ...f, cuenta:e.target.value }))} style={INPUT_ST} placeholder="12345678" />
              </div>
              <div>
                <label style={LABEL_ST}>Saldo inicial</label>
                <input type="number" step="0.01" value={periodForm.saldoInicial || ''} onChange={e => setPeriodForm(f => ({ ...f, saldoInicial:parseFloat(e.target.value)||0 }))} style={INPUT_ST} placeholder="0.00" />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setShowNewPeriod(false)} style={{ padding:'9px 18px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#AEBCCD', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontSize:13 }}>Cancelar</button>
              <button onClick={createPeriod} disabled={!periodForm.id || !periodForm.nombre} style={{ padding:'9px 18px', borderRadius:7, border:'none', background:periodForm.id && periodForm.nombre ? '#C9A84C' : 'rgba(201,168,76,.3)', color:periodForm.id && periodForm.nombre ? '#0d1829' : '#7C8A9C', cursor:'pointer', fontFamily:"'Inter', sans-serif", fontSize:13, fontWeight:700 }}>
                Crear período
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
