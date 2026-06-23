import { useState, useEffect, useCallback } from 'react';
import {
  getAccounts, getJournals, getInvoices, createJournal,
  type AlegraAccount, type AlegraJournal, type AlegraInvoice,
} from '../lib/alegraApi';

type Tab = 'cuentas' | 'comprobantes' | 'facturas';

// ───────────────────── helpers ─────────────────────
function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-blue-500/15 text-blue-300',
    closed: 'bg-green-500/15 text-green-300',
    paid: 'bg-green-500/15 text-green-300',
    void: 'bg-red-500/15 text-red-300',
    draft: 'bg-white/10 text-cream-200/50',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? 'bg-white/10 text-cream-200/50'}`}>
      {status}
    </span>
  );
}

// ───────────────────── Plan de Cuentas ─────────────────────
function PlanCuentas() {
  const [accounts, setAccounts] = useState<AlegraAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter(a =>
    search === '' ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.code?.includes(search)
  );

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando plan de cuentas desde Alegra…</p>;
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-2">
      <p className="text-red-400 text-sm font-medium">No se pudo cargar el plan de cuentas</p>
      <p className="text-red-400/70 text-xs font-mono">{error}</p>
      <p className="text-cream-200/40 text-xs">Es posible que el módulo de contabilidad no esté habilitado en tu cuenta de Alegra. Verifica en Alegra → Configuración → Módulos.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por código o nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/30 focus:outline-none focus:border-gold-500/50"
        />
        <span className="text-cream-200/40 text-xs whitespace-nowrap">{filtered.length} cuentas</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/40 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 w-24">Código</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Tipo</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="px-4 py-2.5 font-mono text-gold-400/80">{a.code}</td>
                <td className="px-4 py-2.5 text-cream-100">{a.name}</td>
                <td className="px-4 py-2.5 text-cream-200/50 hidden md:table-cell">{a.type}</td>
                <td className="px-4 py-2.5 text-right hidden md:table-cell">
                  {a.balance !== undefined ? (
                    <span className={a.balance < 0 ? 'text-red-400' : 'text-cream-100'}>
                      {formatCOP(a.balance)}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-cream-200/30">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────── Comprobantes (diario) ─────────────────────
interface JournalEntry { accountId: string; debit: string; credit: string; }

function Comprobantes({ accounts }: { accounts: AlegraAccount[] }) {
  const [journals, setJournals] = useState<AlegraJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);

  const load = useCallback(() => {
    setLoading(true);
    getJournals(50)
      .then(setJournals)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function addEntry() {
    setEntries(prev => [...prev, { accountId: '', debit: '', credit: '' }]);
  }

  function updateEntry(i: number, field: keyof JournalEntry, val: string) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }

  function removeEntry(i: number) {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  }

  const totalDebito = entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0);
  const totalCredito = entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0);
  const balanced = Math.abs(totalDebito - totalCredito) < 0.01;

  async function handleSave() {
    if (!fecha || !descripcion || !balanced || totalDebito === 0) return;
    setSaving(true);
    try {
      const payload = {
        date: fecha,
        description: descripcion,
        entries: entries
          .filter(e => e.accountId && (parseFloat(e.debit) || parseFloat(e.credit)))
          .map(e => ({
            account: { id: parseInt(e.accountId) },
            debit: parseFloat(e.debit) || 0,
            credit: parseFloat(e.credit) || 0,
          })),
      };
      await createJournal(payload);
      setShowForm(false);
      setDescripcion('');
      setEntries([{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]);
      load();
    } catch (err: any) {
      alert(`Error al crear: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando comprobantes…</p>;
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-2">
      <p className="text-red-400 text-sm font-medium">No se pudo cargar los comprobantes</p>
      <p className="text-red-400/70 text-xs font-mono">{error}</p>
      <p className="text-cream-200/40 text-xs">El módulo de comprobantes de diario puede requerir el plan Contabilidad en Alegra.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-cream-200/40 text-xs">{journals.length} comprobante(s) recientes</span>
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
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-cream-200/40 mb-1">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Concepto del comprobante"
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cream-200/40 text-xs">
                  <th className="text-left pb-2">Cuenta</th>
                  <th className="text-right pb-2 w-32">Débito</th>
                  <th className="text-right pb-2 w-32">Crédito</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {entries.map((en, i) => (
                  <tr key={i}>
                    <td className="pr-2 pb-2">
                      <select
                        value={en.accountId}
                        onChange={e => updateEntry(i, 'accountId', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-cream-100 focus:outline-none focus:border-gold-500/50"
                      >
                        <option value="">— Seleccionar cuenta —</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 pb-2">
                      <input
                        type="number" min="0" value={en.debit}
                        onChange={e => updateEntry(i, 'debit', e.target.value)}
                        placeholder="0"
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-right text-cream-100 focus:outline-none focus:border-gold-500/50"
                      />
                    </td>
                    <td className="px-1 pb-2">
                      <input
                        type="number" min="0" value={en.credit}
                        onChange={e => updateEntry(i, 'credit', e.target.value)}
                        placeholder="0"
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-right text-cream-100 focus:outline-none focus:border-gold-500/50"
                      />
                    </td>
                    <td className="pl-1 pb-2">
                      {entries.length > 2 && (
                        <button onClick={() => removeEntry(i)} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 text-xs font-semibold">
                  <td className="pt-2 text-cream-200/50">TOTAL</td>
                  <td className="pt-2 text-right pr-2 text-cream-100">{formatCOP(totalDebito)}</td>
                  <td className="pt-2 text-right pr-2 text-cream-100">{formatCOP(totalCredito)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!balanced && totalDebito > 0 && (
            <p className="text-amber-400 text-xs">⚠ El comprobante no cuadra. Débito y crédito deben ser iguales.</p>
          )}

          <div className="flex justify-between">
            <button onClick={addEntry} className="text-cream-200/50 hover:text-cream-100 text-xs transition">
              + Agregar línea
            </button>
            <button
              onClick={handleSave}
              disabled={!fecha || !descripcion || !balanced || totalDebito === 0 || saving}
              className="bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 disabled:opacity-40 text-gold-300 font-semibold text-sm px-5 py-2 rounded-lg transition"
            >
              {saving ? 'Guardando…' : 'Registrar en Alegra'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-cream-200/40 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Nº</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Descripción</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {journals.map(j => (
              <tr key={j.id} className="border-b border-white/5 hover:bg-white/3 transition">
                <td className="px-4 py-2.5 font-mono text-gold-400/80 text-xs">
                  {j.numberTemplate?.fullNumber ?? `#${j.id}`}
                </td>
                <td className="px-4 py-2.5 text-cream-200/70 text-xs">{j.date}</td>
                <td className="px-4 py-2.5 text-cream-100">{j.description || '—'}</td>
                <td className="px-4 py-2.5 text-right text-cream-100">{formatCOP(j.total ?? 0)}</td>
              </tr>
            ))}
            {journals.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-cream-200/30">Sin comprobantes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────── Facturas ─────────────────────
function Facturas() {
  const [invoices, setInvoices] = useState<AlegraInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInvoices(50)
      .then(setInvoices)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-cream-200/40 text-sm animate-pulse">Cargando facturas…</p>;
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-2">
      <p className="text-red-400 text-sm font-medium">No se pudo cargar las facturas</p>
      <p className="text-red-400/70 text-xs font-mono">{error}</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-cream-200/40 text-xs uppercase tracking-wider">
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
              <td className="px-4 py-2.5 font-mono text-gold-400/80 text-xs">
                {inv.numberTemplate?.fullNumber ?? `#${inv.id}`}
              </td>
              <td className="px-4 py-2.5 text-cream-200/70 text-xs">{inv.date}</td>
              <td className="px-4 py-2.5 text-cream-100">{inv.client?.name ?? '—'}</td>
              <td className="px-4 py-2.5"><StatusChip status={inv.status} /></td>
              <td className="px-4 py-2.5 text-right text-cream-100">{formatCOP(inv.total ?? 0)}</td>
              <td className="px-4 py-2.5 text-right hidden md:table-cell">
                {inv.balance !== undefined ? (
                  <span className={inv.balance > 0 ? 'text-amber-400' : 'text-green-400'}>
                    {formatCOP(inv.balance)}
                  </span>
                ) : '—'}
              </td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-cream-200/30">Sin facturas registradas</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────── Página principal ─────────────────────
export default function AlegraPage() {
  const [tab, setTab] = useState<Tab>('cuentas');
  const [accounts, setAccounts] = useState<AlegraAccount[]>([]);
  const [connStatus, setConnStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [connMsg, setConnMsg] = useState('');

  useEffect(() => {
    // Test basic connectivity with contacts (always available in all Alegra plans)
    getContacts()
      .then(() => setConnStatus('ok'))
      .catch(e => { setConnStatus('error'); setConnMsg(e.message); });
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cuentas',       label: 'Plan de cuentas' },
    { id: 'comprobantes',  label: 'Comprobantes' },
    { id: 'facturas',      label: 'Facturas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-cream-100">Alegra</h1>
          <p className="text-cream-200/40 text-sm mt-1">Plan de cuentas, comprobantes y facturas</p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
          connStatus === 'ok'       ? 'bg-green-500/10 border-green-500/25 text-green-300' :
          connStatus === 'error'    ? 'bg-red-500/10 border-red-500/25 text-red-400' :
                                      'bg-white/5 border-white/10 text-cream-200/40'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            connStatus === 'ok' ? 'bg-green-400' : connStatus === 'error' ? 'bg-red-400' : 'bg-cream-200/30 animate-pulse'
          }`} />
          {connStatus === 'checking' ? 'Verificando conexión…'
           : connStatus === 'ok'     ? 'Conectado a Alegra'
           : `Sin conexión — ${connMsg}`}
        </div>
      </div>

      <div className="flex gap-1 bg-navy-900/60 rounded-xl p-1 w-fit">
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

      <div>
        {tab === 'cuentas'      && <PlanCuentas />}
        {tab === 'comprobantes' && <Comprobantes accounts={accounts} />}
        {tab === 'facturas'     && <Facturas />}
      </div>
    </div>
  );
}
