import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Landmark, TrendingUp, TrendingDown, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { realClients } from '../data/clients';
import {
  getJournals, getInvoices, getAccounts,
  type AlegraJournal, type AlegraInvoice, type AlegraAccount,
} from '../lib/alegraApi';
import { useDemo } from '../context/DemoContext';
import { DEMO_JOURNALS, DEMO_INVOICES, DEMO_ACCOUNTS } from '../data/demoAlegra';

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
  const [activeTab, setActiveTab]     = useState<'comprobantes' | 'facturas' | 'cuentas'>('comprobantes');
  const [loading, setLoading]         = useState(!isDemo);
  const [error, setError]             = useState('');
  const [journals, setJournals]       = useState<AlegraJournal[]>(isDemo ? DEMO_JOURNALS : []);
  const [invoices, setInvoices]       = useState<AlegraInvoice[]>(isDemo ? DEMO_INVOICES : []);
  const [accounts, setAccounts]       = useState<AlegraAccount[]>(isDemo ? DEMO_ACCOUNTS : []);

  const selectedClient = realClients.find(c => c.id === selectedId);

  async function loadData() {
    if (isDemo) {
      setJournals(DEMO_JOURNALS);
      setInvoices(DEMO_INVOICES);
      setAccounts(DEMO_ACCOUNTS);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [j, inv, acc] = await Promise.all([
        getJournals(50),
        getInvoices(80),
        getAccounts(),
      ]);
      setJournals(j);
      setInvoices(inv);
      setAccounts(acc);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
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
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {([
          { key: 'comprobantes', label: 'Comprobantes' },
          { key: 'facturas',     label: `Facturas${filteredInvoices.length ? ` (${filteredInvoices.length})` : ''}` },
          { key: 'cuentas',      label: 'Plan de cuentas' },
        ] as const).map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '9px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: active ? 600 : 500,
              color: active ? '#C9A84C' : 'rgba(248,247,244,.45)',
              borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
              transition: 'all .15s', marginBottom: -1,
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
