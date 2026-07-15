import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Landmark, TrendingUp, TrendingDown, FileText, AlertCircle, Loader2, Layers, Plus, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { realClients } from '../data/clients';
import {
  getJournals, getInvoices, getAccounts, getCostCenters,
  type AlegraJournal, type AlegraInvoice, type AlegraAccount, type AlegraCostCenter,
} from '../lib/alegraApi';
import {
  loadContracts, addContract, updateContract, deleteContract,
  type Contract,
} from '../data/contracts';
import { useDemo } from '../context/DemoContext';
import { DEMO_JOURNALS, DEMO_INVOICES, DEMO_ACCOUNTS, DEMO_COST_CENTERS, DEMO_CONTRACTS } from '../data/demoAlegra';

// ── Helpers ────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function statusLabel(s: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    open:          { label: 'Abierta',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    paid:          { label: 'Pagada',     color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
    void:          { label: 'Anulada',    color: '#7C8A9C', bg: 'rgba(124,138,156,.1)' },
    draft:         { label: 'Borrador',   color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
    partial:       { label: 'Parcial',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    overdue:       { label: 'Vencida',    color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
  };
  return map[s] ?? { label: s, color: '#7C8A9C', bg: 'rgba(124,138,156,.1)' };
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset:     'Activo',
  liability: 'Pasivo',
  equity:    'Patrimonio',
  income:    'Ingresos',
  expense:   'Gastos',
};

// ── Styles ─────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 10,
};
const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left',
  fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
  letterSpacing: '.1em', textTransform: 'uppercase', color: '#7C8A9C',
  whiteSpace: 'nowrap', background: 'rgba(255,255,255,.02)',
};
const TD: React.CSSProperties = {
  padding: '9px 12px',
  fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
  borderBottom: '1px solid rgba(255,255,255,.04)',
};

// ── Component ──────────────────────────────────────────────────────────
export default function GestionContablePage() {
  const { demoMode } = useDemo();
  const isDemo = demoMode === 'empresa';

  const [selectedId, setSelectedId]   = useState(realClients[0]?.id ?? '');
  const [activeTab, setActiveTab]     = useState<'comprobantes' | 'facturas' | 'cuentas' | 'centros'>('comprobantes');
  const [loading, setLoading]         = useState(!isDemo);
  const [error, setError]             = useState('');
  const [journals, setJournals]       = useState<AlegraJournal[]>(isDemo ? DEMO_JOURNALS : []);
  const [invoices, setInvoices]       = useState<AlegraInvoice[]>(isDemo ? DEMO_INVOICES : []);
  const [accounts, setAccounts]       = useState<AlegraAccount[]>(isDemo ? DEMO_ACCOUNTS : []);
  const [costCenters, setCostCenters] = useState<AlegraCostCenter[]>(isDemo ? DEMO_COST_CENTERS : []);
  const [contracts, setContracts]     = useState<Contract[]>(() =>
    isDemo ? DEMO_CONTRACTS : loadContracts()
  );
  // New contract form state
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [expandedCC, setExpandedCC]   = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<Contract>>({
    nombre: '', descripcion: '', costCenterId: undefined, costCenterName: '',
    valorContrato: 0, fechaInicio: '', fechaFin: '', estado: 'activo', responsable: '',
  });

  const selectedClient = realClients.find(c => c.id === selectedId);

  async function loadData() {
    if (isDemo) {
      setJournals(DEMO_JOURNALS);
      setInvoices(DEMO_INVOICES);
      setAccounts(DEMO_ACCOUNTS);
      setCostCenters(DEMO_COST_CENTERS);
      setContracts(DEMO_CONTRACTS);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [j, inv, acc, cc] = await Promise.all([
        getJournals(50),
        getInvoices(80),
        getAccounts(),
        getCostCenters(),
      ]);
      setJournals(j);
      setInvoices(inv);
      setAccounts(acc);
      setCostCenters(cc);
      setContracts(loadContracts());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveContract() {
    if (!draft.nombre || !draft.valorContrato || !draft.fechaInicio) return;
    if (isDemo) return; // demo is read-only
    if (editingId) {
      updateContract(editingId, draft as Partial<Contract>);
    } else {
      const { clienteId: _skip, ...rest } = draft as Contract;
      addContract({ clienteId: selectedId, ...(rest as Omit<Contract, 'id' | 'timestamp' | 'clienteId'>) });
    }
    setContracts(loadContracts());
    setShowForm(false);
    setEditingId(null);
    setDraft({ nombre: '', descripcion: '', costCenterId: undefined, costCenterName: '', valorContrato: 0, fechaInicio: '', fechaFin: '', estado: 'activo', responsable: '' });
  }

  function handleEditContract(c: Contract) {
    setDraft({ ...c });
    setEditingId(c.id);
    setShowForm(true);
  }

  function handleDeleteContract(id: string) {
    if (isDemo) return;
    deleteContract(id);
    setContracts(loadContracts());
  }

  useEffect(() => { loadData(); }, []);

  // Filter invoices by selected company (match by company name keywords)
  const filteredInvoices = useMemo(() => {
    if (!selectedClient) return invoices;
    const key = selectedClient.nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    return invoices.filter(inv => {
      const cn = (inv.client?.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cn.includes(key) || key.includes(cn.slice(0, 6));
    });
  }, [invoices, selectedClient]);

  // Metrics (from Alegra data)
  const totalIngresos  = invoices.reduce((s, i) => s + (i.total   ?? 0), 0);
  const totalPorCobrar = invoices.reduce((s, i) => s + (i.balance ?? 0), 0);
  const comprobantes   = journals.length;

  // Centros de costo metrics
  const activeContracts = contracts.filter(c => c.estado === 'activo');
  const totalContratado = activeContracts.reduce((s, c) => s + c.valorContrato, 0);
  const contractsByCC = useMemo(() => {
    const map: Record<number, Contract[]> = {};
    for (const c of contracts) {
      if (c.costCenterId == null) continue;
      if (!map[c.costCenterId]) map[c.costCenterId] = [];
      map[c.costCenterId].push(c);
    }
    return map;
  }, [contracts]);

  // Account groups
  const accountGroups = useMemo(() => {
    const groups: Record<string, AlegraAccount[]> = {};
    for (const a of accounts) {
      const t = a.type ?? 'other';
      if (!groups[t]) groups[t] = [];
      groups[t].push(a);
    }
    return groups;
  }, [accounts]);

  // Sorted group keys
  const groupOrder = ['asset', 'liability', 'equity', 'income', 'expense'];
  const sortedGroups = [
    ...groupOrder.filter(k => accountGroups[k]),
    ...Object.keys(accountGroups).filter(k => !groupOrder.includes(k)),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Landmark size={20} strokeWidth={1.7} style={{ color: '#C9A84C' }} />
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F4F7FB' }}>
            Gestión Contable
          </h2>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
            background: loading ? 'rgba(255,255,255,.06)' : error ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)',
            border: `1px solid ${loading ? 'rgba(255,255,255,.1)' : error ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`,
            borderRadius: 99, fontSize: 11, fontWeight: 600, color: loading ? '#7C8A9C' : error ? '#ef4444' : '#22c55e',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
            {loading ? 'Cargando…' : error ? 'Sin conexión' : 'Conectado · Alegra'}
          </span>
        </div>
        <button onClick={loadData} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 8, color: loading ? '#566375' : '#AEBCCD', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
        }}>
          {loading
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <RefreshCw size={13} />}
          Actualizar
        </button>
      </div>

      {/* ── Company tabs ── */}
      <div style={{ ...CARD, padding: '5px 5px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
          {realClients.map(c => {
            const active = selectedId === c.id;
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)} style={{
                padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: active ? 600 : 500,
                background: active ? 'rgba(201,168,76,.14)' : 'transparent',
                color: active ? '#C9A84C' : 'rgba(248,247,244,.4)',
                transition: 'all .15s',
                boxShadow: active ? 'inset 0 -2px 0 0 #C9A84C' : 'none',
                whiteSpace: 'nowrap',
              }}>
                {c.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Company info strip ── */}
      {selectedClient && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#7C8A9C' }}>
            NIT {selectedClient.nit}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.2)' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AEBCCD' }}>
            {selectedClient.sector}
          </span>
        </div>
      )}

      {/* ── Error state ── */}
      {error && !loading && (
        <div style={{ ...CARD, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertCircle size={18} strokeWidth={1.7} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#F4F7FB', marginBottom: 4 }}>
              No se pudo conectar con Alegra
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7C8A9C', wordBreak: 'break-all' }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ── Metrics row ── */}
      {!error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Facturado',  value: fmt(totalIngresos),  color: '#22c55e',  Icon: TrendingUp   },
            { label: 'Por Cobrar',       value: fmt(totalPorCobrar), color: '#f59e0b',  Icon: TrendingDown },
            { label: 'Comprobantes',     value: String(comprobantes), color: '#C9A84C', Icon: FileText     },
            { label: 'Facturas',         value: String(filteredInvoices.length), color: '#3b82f6', Icon: Landmark },
          ].map(m => (
            <div key={m.label} style={{ ...CARD, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="overline-9a">{m.label}</span>
                <m.Icon size={16} strokeWidth={1.7} style={{ color: m.color, opacity: .65 }} />
              </div>
              {loading ? (
                <div style={{ height: 26, background: 'rgba(255,255,255,.06)', borderRadius: 5, animation: 'pulse 1.5s infinite' }} />
              ) : (
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>
                  {m.value}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.08)', overflowX: 'auto' }}>
        {([
          { key: 'comprobantes', label: 'Comprobantes' },
          { key: 'facturas',     label: `Facturas${filteredInvoices.length ? ` (${filteredInvoices.length})` : ''}` },
          { key: 'cuentas',      label: 'Plan de cuentas' },
          { key: 'centros',      label: `Centros de costo${activeContracts.length ? ` (${activeContracts.length})` : ''}` },
        ] as const).map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '9px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: active ? 600 : 500,
              color: active ? '#C9A84C' : 'rgba(248,247,244,.45)',
              borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
              transition: 'all .15s', marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {loading ? (
        <div style={{ ...CARD, padding: 48, textAlign: 'center', color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: '#C9A84C' }} />
          Cargando datos de Alegra…
        </div>
      ) : (
        <>
          {/* Comprobantes */}
          {activeTab === 'comprobantes' && (
            <div style={{ ...CARD, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={TH}>Fecha</th>
                    <th style={TH}>N° Comprobante</th>
                    <th style={TH}>Descripción</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.length === 0 ? (
                    <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#7C8A9C', padding: 40 }}>Sin comprobantes registrados.</td></tr>
                  ) : journals.map(j => (
                    <tr key={j.id} style={{ transition: 'background .1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#AEBCCD', whiteSpace: 'nowrap' }}>{j.date}</td>
                      <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#C9A84C' }}>
                        {j.numberTemplate?.fullNumber ?? `#${j.id}`}
                      </td>
                      <td style={{ ...TD, color: '#F4F7FB', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={j.description}>{j.description || '—'}</td>
                      <td style={{ ...TD, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#F4F7FB' }}>
                        {fmt(j.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Facturas */}
          {activeTab === 'facturas' && (
            <div style={{ ...CARD, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={TH}>Fecha</th>
                    <th style={TH}>N° Factura</th>
                    <th style={TH}>Cliente</th>
                    <th style={TH}>Vence</th>
                    <th style={TH}>Estado</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Total</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Por cobrar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan={7} style={{ ...TD, textAlign: 'center', color: '#7C8A9C', padding: 40 }}>
                      Sin facturas para esta empresa.
                    </td></tr>
                  ) : filteredInvoices.map(inv => {
                    const st = statusLabel(inv.status);
                    return (
                      <tr key={inv.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#AEBCCD', whiteSpace: 'nowrap' }}>{inv.date}</td>
                        <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#C9A84C' }}>
                          {inv.numberTemplate?.fullNumber ?? `#${inv.id}`}
                        </td>
                        <td style={{ ...TD, color: '#F4F7FB', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.client?.name ?? '—'}
                        </td>
                        <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#AEBCCD', whiteSpace: 'nowrap' }}>
                          {inv.dueDate ?? '—'}
                        </td>
                        <td style={{ ...TD }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 600, fontSize: 11.5, fontFamily: "'DM Sans', sans-serif" }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                            {st.label}
                          </span>
                        </td>
                        <td style={{ ...TD, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#F4F7FB' }}>
                          {fmt(inv.total)}
                        </td>
                        <td style={{ ...TD, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: (inv.balance ?? 0) > 0 ? '#f59e0b' : '#22c55e' }}>
                          {fmt(inv.balance ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Centros de costo */}
          {activeTab === 'centros' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Contratos activos',  value: String(activeContracts.length),  color: '#22c55e' },
                  { label: 'Valor contratado',   value: fmt(totalContratado),             color: '#C9A84C' },
                  { label: 'Centros activos',    value: String(costCenters.filter(cc => cc.status === 'active').length), color: '#3b82f6' },
                  { label: 'Finalizados',        value: String(contracts.filter(c => c.estado === 'finalizado').length), color: '#7C8A9C' },
                ].map(m => (
                  <div key={m.label} style={{ ...CARD, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span className="overline-9a">{m.label}</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, fontWeight: 700, color: m.color, lineHeight: 1 }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Nuevo contrato button */}
              {!isDemo && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowForm(f => !f); setEditingId(null); setDraft({ nombre: '', descripcion: '', costCenterId: undefined, costCenterName: '', valorContrato: 0, fechaInicio: '', fechaFin: '', estado: 'activo', responsable: '' }); }} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                    background: showForm ? 'rgba(255,255,255,.04)' : 'rgba(201,168,76,.15)',
                    border: `1px solid ${showForm ? 'rgba(255,255,255,.1)' : 'rgba(201,168,76,.35)'}`,
                    borderRadius: 8, color: showForm ? '#7C8A9C' : '#C9A84C', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
                  }}>
                    {showForm ? <X size={13} /> : <Plus size={13} />}
                    {showForm ? 'Cancelar' : 'Nuevo contrato'}
                  </button>
                </div>
              )}

              {/* New/edit contract form */}
              {showForm && !isDemo && (
                <div style={{ ...CARD, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#F4F7FB', margin: 0 }}>
                    {editingId ? 'Editar contrato' : 'Nuevo contrato'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Nombre del contrato *', key: 'nombre', type: 'text' },
                      { label: 'Descripción', key: 'descripcion', type: 'text' },
                      { label: 'Responsable', key: 'responsable', type: 'text' },
                      { label: 'Valor contrato (COP) *', key: 'valorContrato', type: 'number' },
                      { label: 'Fecha inicio *', key: 'fechaInicio', type: 'date' },
                      { label: 'Fecha fin', key: 'fechaFin', type: 'date' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7C8A9C' }}>
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          value={String((draft as any)[f.key] ?? '')}
                          onChange={e => setDraft(d => ({ ...d, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                          style={{
                            padding: '7px 10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                            borderRadius: 7, color: '#F4F7FB', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
                            outline: 'none',
                          }}
                        />
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7C8A9C' }}>
                        Centro de costo
                      </label>
                      <select
                        value={draft.costCenterId ?? ''}
                        onChange={e => {
                          const id = Number(e.target.value);
                          const cc = costCenters.find(c => c.id === id);
                          setDraft(d => ({ ...d, costCenterId: id || undefined, costCenterName: cc?.name ?? '' }));
                        }}
                        style={{
                          padding: '7px 10px', background: 'rgba(20,30,50,.9)', border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 7, color: '#F4F7FB', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
                          outline: 'none',
                        }}
                      >
                        <option value="">— Sin asignar —</option>
                        {costCenters.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#7C8A9C' }}>
                        Estado
                      </label>
                      <select
                        value={draft.estado ?? 'activo'}
                        onChange={e => setDraft(d => ({ ...d, estado: e.target.value as Contract['estado'] }))}
                        style={{
                          padding: '7px 10px', background: 'rgba(20,30,50,.9)', border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 7, color: '#F4F7FB', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
                          outline: 'none',
                        }}
                      >
                        <option value="activo">Activo</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="suspendido">Suspendido</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{
                      padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 7, color: '#7C8A9C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
                    }}>Cancelar</button>
                    <button onClick={handleSaveContract} style={{
                      padding: '7px 16px', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)',
                      borderRadius: 7, color: '#C9A84C', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
                    }}>{editingId ? 'Guardar cambios' : 'Crear contrato'}</button>
                  </div>
                </div>
              )}

              {/* Cost centers accordion */}
              {costCenters.map(cc => {
                const ccContracts = contractsByCC[cc.id] ?? [];
                const ccTotal = ccContracts.filter(c => c.estado === 'activo').reduce((s, c) => s + c.valorContrato, 0);
                const isExpanded = expandedCC === cc.id;
                return (
                  <div key={cc.id} style={CARD}>
                    <button
                      onClick={() => setExpandedCC(isExpanded ? null : cc.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201,168,76,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Layers size={15} strokeWidth={1.7} style={{ color: '#C9A84C' }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#F4F7FB' }}>{cc.name}</div>
                          {cc.code && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#7C8A9C' }}>{cc.code}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>{fmt(ccTotal)}</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7C8A9C' }}>{ccContracts.length} contrato{ccContracts.length !== 1 ? 's' : ''}</div>
                        </div>
                        {isExpanded
                          ? <ChevronUp size={15} strokeWidth={1.7} style={{ color: '#7C8A9C', flexShrink: 0 }} />
                          : <ChevronDown size={15} strokeWidth={1.7} style={{ color: '#7C8A9C', flexShrink: 0 }} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', overflowX: 'auto' }}>
                        {ccContracts.length === 0 ? (
                          <p style={{ padding: '16px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: '#566375', margin: 0 }}>
                            Sin contratos en este centro de costo.
                          </p>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                            <thead>
                              <tr>
                                <th style={TH}>Nombre</th>
                                <th style={TH}>Cliente</th>
                                <th style={TH}>Inicio</th>
                                <th style={TH}>Fin</th>
                                <th style={TH}>Estado</th>
                                <th style={{ ...TH, textAlign: 'right' }}>Valor</th>
                                {!isDemo && <th style={{ ...TH, textAlign: 'center' }}>Acción</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {ccContracts.map(ct => {
                                const client = realClients.find(c => c.id === ct.clienteId);
                                const estadoColor: Record<string, string> = {
                                  activo: '#22c55e', finalizado: '#7C8A9C', suspendido: '#f59e0b',
                                };
                                return (
                                  <tr key={ct.id}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <td style={{ ...TD, color: '#F4F7FB', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ct.nombre}>{ct.nombre}</td>
                                    <td style={{ ...TD, color: '#AEBCCD', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {client?.nombre ?? ct.clienteId}
                                    </td>
                                    <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#AEBCCD', whiteSpace: 'nowrap' }}>{ct.fechaInicio}</td>
                                    <td style={{ ...TD, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#AEBCCD', whiteSpace: 'nowrap' }}>{ct.fechaFin ?? '—'}</td>
                                    <td style={{ ...TD }}>
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 99, background: 'rgba(255,255,255,.05)', color: estadoColor[ct.estado] ?? '#7C8A9C', fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                                        {{activo: 'Activo', finalizado: 'Finalizado', suspendido: 'Suspendido'}[ct.estado]}
                                      </span>
                                    </td>
                                    <td style={{ ...TD, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#C9A84C', whiteSpace: 'nowrap' }}>
                                      {fmt(ct.valorContrato)}
                                    </td>
                                    {!isDemo && (
                                      <td style={{ ...TD, textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                          <button onClick={() => handleEditContract(ct)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C8A9C', padding: 4 }}>
                                            <Pencil size={12} strokeWidth={1.7} />
                                          </button>
                                          <button onClick={() => handleDeleteContract(ct.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                                            <Trash2 size={12} strokeWidth={1.7} />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {costCenters.length === 0 && (
                <div style={{ ...CARD, padding: 48, textAlign: 'center', color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>
                  Sin centros de costo en Alegra.
                </div>
              )}
            </div>
          )}

          {/* Cuentas */}
          {activeTab === 'cuentas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedGroups.map(groupKey => {
                const accs = accountGroups[groupKey] ?? [];
                const label = ACCOUNT_TYPE_LABELS[groupKey] ?? groupKey;
                const totalBal = accs.reduce((s, a) => s + (a.balance ?? 0), 0);
                return (
                  <div key={groupKey} style={CARD}>
                    {/* Group header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: '#C9A84C', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#F4F7FB' }}>
                        {fmt(totalBal)}
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
                        <tbody>
                          {accs.map(a => (
                            <tr key={a.id}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ ...TD, paddingLeft: 16 + ((a._depth ?? 0) * 14), fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#7C8A9C', whiteSpace: 'nowrap', width: 110 }}>
                                {a.code ?? '—'}
                              </td>
                              <td style={{ ...TD, color: (a._depth ?? 0) === 0 ? '#F4F7FB' : '#AEBCCD', fontWeight: (a._depth ?? 0) === 0 ? 600 : 400 }}>
                                {a.name}
                              </td>
                              <td style={{ ...TD, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: (a.balance ?? 0) !== 0 ? '#F4F7FB' : '#566375', whiteSpace: 'nowrap' }}>
                                {(a.balance ?? 0) !== 0 ? fmt(a.balance ?? 0) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              {accounts.length === 0 && (
                <div style={{ ...CARD, padding: 48, textAlign: 'center', color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>
                  Sin cuentas contables en Alegra.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:.8; } }
      `}</style>
    </div>
  );
}
