import { useState, useEffect, useCallback } from 'react';
import {
  getAccounts, getJournals, getInvoices, getExpenses, getItems, getContacts, createJournal,
  type AlegraAccount, type AlegraJournal, type AlegraInvoice,
  type AlegraExpense, type AlegraItem,
} from '../lib/alegraApi';

type Tab = 'cuentas' | 'comprobantes' | 'facturas' | 'gastos' | 'productos';

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function Chip({ label, color = 'default' }: { label: string; color?: 'green' | 'red' | 'blue' | 'amber' | 'default' }) {
  const cls: Record<string, string> = {
    green:   'bg-green-500/15 text-green-300 border-green-500/20',
    red:     'bg-red-500/15 text-red-300 border-red-500/20',
    blue:    'bg-blue-500/15 text-blue-300 border-blue-500/20',
    amber:   'bg-amber-500/15 text-amber-300 border-amber-500/20',
    default: 'bg-white/8 text-cream-200/60 border-white/10',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls[color]}`}>{label}</span>;
}

function statusColor(s: string): 'green' | 'red' | 'blue' | 'amber' | 'default' {
  if (['paid', 'closed', 'active'].includes(s)) return 'green';
  if (['void', 'cancelled'].includes(s)) return 'red';
  if (['open', 'draft'].includes(s)) return 'blue';
  if (['overdue', 'partial'].includes(s)) return 'amber';
  return 'default';
}

function ErrorBox({ msg }: { msg: string }) {
  const isForbidden = msg.toLowerCase().includes('forbidden') || msg.includes('403');
  if (isForbidden) {
    return (
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-5 space-y-2">
        <p className="text-amber-300 font-medium text-sm">Acceso no habilitado para este módulo</p>
        <p className="text-cream-200/50 text-xs leading-relaxed">
          El usuario <span className="text-cream-100">mm@9alliance.co</span> no tiene permisos para este módulo de Alegra.
        </p>
        <p className="text-cream-200/45 text-xs leading-relaxed">
          Para habilitarlo: en Alegra ve a <span className="text-cream-100">Configuración → Usuarios y roles</span>,
          selecciona el usuario y activa los permisos del módulo de Contabilidad o Gastos.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-1.5">
      <p className="text-red-400 text-sm font-medium">Error al cargar</p>
      <p className="text-red-400/70 text-xs font-mono break-all">{msg}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <tr><td colSpan={99} className="px-4 py-10 text-center text-cream-200/30 text-sm">{text}</td></tr>;
}

// ─── Plan de Cuentas ────────────────────────────────────────────────────────
function PlanCuentas() {
  const [accounts, setAccounts] = useState<AlegraAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    getAccounts()
      .then(setAccounts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = accounts.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    String(a.code)?.includes(search)
  );

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando plan de cuentas…</p>;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por código o nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/25 focus:outline-none focus:border-gold-500/50"
        />
        <span className="text-cream-200/30 text-xs whitespace-nowrap">{filtered.length} cuentas</span>
        <button onClick={load} className="text-cream-200/40 hover:text-gold-400 text-xs transition">↺ Recargar</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/35 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 w-24">Código</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Tipo</th>
              <th className="text-right px-4 py-3 hidden lg:table-cell">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className={`border-b border-white/5 hover:bg-white/3 transition ${(a._depth ?? 0) === 0 ? 'bg-white/2' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-gold-400/80 text-xs">{a.code ?? '—'}</td>
                <td className="px-4 py-2.5 text-cream-100" style={{ paddingLeft: `${(a._depth ?? 0) * 16 + 16}px` }}>
                  {(a._depth ?? 0) === 0
                    ? <span className="font-semibold text-cream-100">{a.name}</span>
                    : <span className="text-cream-200/80">{a.name}</span>}
                </td>
                <td className="px-4 py-2.5 text-cream-200/45 text-xs hidden md:table-cell">{a.type}</td>
                <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                  {a.balance !== undefined
                    ? <span className={a.balance < 0 ? 'text-red-400' : 'text-cream-100'}>{fmt(a.balance)}</span>
                    : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <Empty text="Sin resultados" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Comprobantes ───────────────────────────────────────────────────────────
interface JournalEntry { accountId: string; debit: string; credit: string }

function Comprobantes({ accounts }: { accounts: AlegraAccount[] }) {
  const [journals, setJournals] = useState<AlegraJournal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [fecha, setFecha]       = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc]         = useState('');
  const [entries, setEntries]   = useState<JournalEntry[]>([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);

  const load = useCallback(() => {
    setLoading(true); setError('');
    getJournals(50)
      .then(setJournals)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalD = entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0);
  const totalC = entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0);
  const balanced = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

  function updateEntry(i: number, f: keyof JournalEntry, v: string) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
  }

  async function handleSave() {
    if (!balanced) return;
    setSaving(true);
    try {
      await createJournal({
        date: fecha,
        description: desc,
        entries: entries
          .filter(e => e.accountId && (parseFloat(e.debit) || parseFloat(e.credit)))
          .map(e => ({
            account: { id: e.accountId },
            debit: parseFloat(e.debit) || 0,
            credit: parseFloat(e.credit) || 0,
          })),
      });
      setShowForm(false);
      setDesc('');
      setEntries([{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]);
      load();
    } catch (err: any) {
      alert(`Error al crear: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando comprobantes…</p>;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-cream-200/35 text-xs">{journals.length} comprobante(s)</span>
          <button onClick={load} className="text-cream-200/40 hover:text-gold-400 text-xs transition">↺ Recargar</button>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {showForm ? '✕ Cancelar' : '+ Nuevo comprobante'}
        </button>
      </div>

      {showForm && (
        <div className="bg-navy-800/60 border border-gold-500/20 rounded-xl p-5 space-y-4">
          <h3 className="text-cream-100 font-semibold">Comprobante de diario</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream-200/40 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50" />
            </div>
            <div>
              <label className="block text-xs text-cream-200/40 mb-1">Descripción</label>
              <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Concepto"
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/50" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cream-200/40 text-xs">
                  <th className="text-left pb-2 pr-2">Cuenta</th>
                  <th className="text-right pb-2 w-28">Débito</th>
                  <th className="text-right pb-2 w-28 px-1">Crédito</th>
                  <th className="w-6"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((en, i) => (
                  <tr key={i}>
                    <td className="pr-2 pb-2">
                      <select value={en.accountId} onChange={e => updateEntry(i, 'accountId', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-cream-100 focus:outline-none focus:border-gold-500/50">
                        <option value="">— Cuenta —</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 pb-2">
                      <input type="number" min="0" value={en.debit} onChange={e => updateEntry(i, 'debit', e.target.value)}
                        placeholder="0"
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-right text-cream-100 focus:outline-none focus:border-gold-500/50" />
                    </td>
                    <td className="px-1 pb-2">
                      <input type="number" min="0" value={en.credit} onChange={e => updateEntry(i, 'credit', e.target.value)}
                        placeholder="0"
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-right text-cream-100 focus:outline-none focus:border-gold-500/50" />
                    </td>
                    <td className="pl-1 pb-2">
                      {entries.length > 2 && (
                        <button onClick={() => setEntries(p => p.filter((_, j) => j !== i))}
                          className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 text-xs font-semibold">
                  <td className="pt-2 text-cream-200/40">TOTAL</td>
                  <td className="pt-2 text-right pr-2 text-cream-100">{fmt(totalD)}</td>
                  <td className="pt-2 text-right pr-2 text-cream-100">{fmt(totalC)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {!balanced && totalD > 0 && (
            <p className="text-amber-400 text-xs">Débito y crédito deben ser iguales para cuadrar.</p>
          )}
          <div className="flex justify-between">
            <button onClick={() => setEntries(p => [...p, { accountId: '', debit: '', credit: '' }])}
              className="text-cream-200/45 hover:text-cream-100 text-xs transition">+ Agregar línea</button>
            <button onClick={handleSave} disabled={!balanced || !desc || saving}
              className="bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 disabled:opacity-40 text-gold-300 font-semibold text-sm px-5 py-2 rounded-lg transition">
              {saving ? 'Guardando…' : 'Registrar en Alegra →'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/35 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Nº</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Descripción</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {journals.map(j => (
              <tr key={j.id} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="px-4 py-2.5 font-mono text-gold-400/80 text-xs">{j.numberTemplate?.fullNumber ?? `#${j.id}`}</td>
                <td className="px-4 py-2.5 text-cream-200/60 text-xs">{j.date}</td>
                <td className="px-4 py-2.5 text-cream-100">{j.description || '—'}</td>
                <td className="px-4 py-2.5 text-right text-cream-100">{fmt(j.total ?? 0)}</td>
              </tr>
            ))}
            {journals.length === 0 && <Empty text="Sin comprobantes registrados" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Facturas ───────────────────────────────────────────────────────────────
function Facturas() {
  const [invoices, setInvoices] = useState<AlegraInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    getInvoices(50).then(setInvoices).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando facturas…</p>;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-cream-200/35 text-xs">{invoices.length} factura(s)</span>
        <button onClick={load} className="text-cream-200/40 hover:text-gold-400 text-xs transition">↺ Recargar</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/35 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Nº</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="px-4 py-2.5 font-mono text-gold-400/80 text-xs">{inv.numberTemplate?.fullNumber ?? `#${inv.id}`}</td>
                <td className="px-4 py-2.5 text-cream-200/60 text-xs">{inv.date}</td>
                <td className="px-4 py-2.5 text-cream-100">{inv.client?.name ?? '—'}</td>
                <td className="px-4 py-2.5"><Chip label={inv.status} color={statusColor(inv.status)} /></td>
                <td className="px-4 py-2.5 text-right text-cream-100">{fmt(inv.total ?? 0)}</td>
                <td className="px-4 py-2.5 text-right hidden md:table-cell">
                  {inv.balance !== undefined
                    ? <span className={inv.balance > 0 ? 'text-amber-400' : 'text-green-400'}>{fmt(inv.balance)}</span>
                    : '—'}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <Empty text="Sin facturas registradas" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Gastos ─────────────────────────────────────────────────────────────────
function Gastos() {
  const [expenses, setExpenses] = useState<AlegraExpense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    getExpenses(50).then(setExpenses).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando gastos…</p>;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-cream-200/35 text-xs">{expenses.length} gasto(s)</span>
        <button onClick={load} className="text-cream-200/40 hover:text-gold-400 text-xs transition">↺ Recargar</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/35 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Nº</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Proveedor</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="px-4 py-2.5 font-mono text-gold-400/80 text-xs">{e.numberTemplate?.fullNumber ?? `#${e.id}`}</td>
                <td className="px-4 py-2.5 text-cream-200/60 text-xs">{e.date}</td>
                <td className="px-4 py-2.5 text-cream-100">{e.issuer?.name ?? '—'}</td>
                <td className="px-4 py-2.5"><Chip label={e.status} color={statusColor(e.status)} /></td>
                <td className="px-4 py-2.5 text-right text-cream-100">{fmt(e.total ?? 0)}</td>
              </tr>
            ))}
            {expenses.length === 0 && <Empty text="Sin gastos registrados" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Productos / Servicios ───────────────────────────────────────────────────
function Productos() {
  const [items, setItems]     = useState<AlegraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    getItems(100).then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando productos y servicios…</p>;
  if (error)   return <ErrorBox msg={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="text" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/25 focus:outline-none focus:border-gold-500/50" />
        <span className="text-cream-200/30 text-xs">{filtered.length} ítems</span>
        <button onClick={load} className="text-cream-200/40 hover:text-gold-400 text-xs transition">↺ Recargar</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/35 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Tipo</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Precio</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="px-4 py-2.5 text-cream-100">{item.name}</td>
                <td className="px-4 py-2.5 text-cream-200/45 text-xs hidden md:table-cell">{item.type}</td>
                <td className="px-4 py-2.5"><Chip label={item.status} color={statusColor(item.status)} /></td>
                <td className="px-4 py-2.5 text-right text-cream-100">
                  {item.price?.[0]?.price !== undefined ? fmt(item.price[0].price) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <Empty text="Sin productos registrados" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function AlegraPage() {
  const [tab, setTab]           = useState<Tab>('facturas');
  const [accounts, setAccounts] = useState<AlegraAccount[]>([]);
  const [connStatus, setConnStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [connMsg, setConnMsg]   = useState('');

  useEffect(() => {
    getContacts()
      .then(() => setConnStatus('ok'))
      .catch(e => { setConnStatus('error'); setConnMsg(e.message); });
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'facturas',     label: 'Facturas'         },
    { id: 'gastos',       label: 'Gastos'           },
    { id: 'productos',    label: 'Productos'        },
    { id: 'cuentas',      label: 'Plan de cuentas'  },
    { id: 'comprobantes', label: 'Comprobantes'     },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-cream-100">Alegra</h1>
          <p className="text-cream-200/40 text-sm mt-1">Facturas, gastos, productos y contabilidad</p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition ${
          connStatus === 'ok'
            ? 'bg-green-500/10 border-green-500/25 text-green-300'
            : connStatus === 'error'
            ? 'bg-red-500/10 border-red-500/25 text-red-400'
            : 'bg-white/5 border-white/10 text-cream-200/40'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            connStatus === 'ok' ? 'bg-green-400'
            : connStatus === 'error' ? 'bg-red-400 animate-pulse'
            : 'bg-cream-200/30 animate-pulse'
          }`} />
          {connStatus === 'checking' ? 'Verificando conexión…'
           : connStatus === 'ok'     ? 'Conectado a Alegra'
           : `Error — ${connMsg}`}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-navy-900/60 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-gold-500/15 text-gold-300 border border-gold-500/25'
                : 'text-cream-200/50 hover:text-cream-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'facturas'     && <Facturas />}
        {tab === 'gastos'       && <Gastos />}
        {tab === 'productos'    && <Productos />}
        {tab === 'cuentas'      && <PlanCuentas />}
        {tab === 'comprobantes' && <Comprobantes accounts={accounts} />}
      </div>
    </div>
  );
}
