import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp as TrendIcon, AlertTriangle, CheckCircle2,
  Clock, XCircle, Building2, MessageSquare,
} from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import { UVT_2026, SMMLV_2026, AUX_TRANSPORTE_2026 } from '../data/fiscalParams';
import { clients, clientsMap } from '../data/clients';
import { obligaciones } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';
import { useDemo } from '../context/DemoContext';

const MESES: Record<string, string> = {
  enero:'ene',febrero:'feb',marzo:'mar',abril:'abr',mayo:'may',junio:'jun',
  julio:'jul',agosto:'ago',septiembre:'sep',octubre:'oct',noviembre:'nov',diciembre:'dic',
};
function shortDate(label: string): string {
  if (!label) return '';
  const dm = label.match(/^(\d{1,2}) de (\w+)/i);
  if (dm) return `${dm[1]} ${MESES[dm[2].toLowerCase()] ?? dm[2].slice(0,3)}`;
  const mm = label.match(/^(\w+)\s+(\d{4})/i);
  if (mm) return `${MESES[mm[1].toLowerCase()] ?? mm[1].slice(0,3)} ${mm[2]}`;
  return label.slice(0, 10);
}

function MarketRow({ name, subtitle, value, change }: {
  name: string; subtitle: string; value: string; change: number | null;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div>
        <p className="text-cream-100 text-xs font-semibold">{name}</p>
        <p className="text-cream-200/35 text-[10px]">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-cream-100 text-sm font-bold tabular-nums">{value}</p>
        {change !== null && (
          <p className={`text-[10px] font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

function fmtCOP(v: number | null) {
  if (!v) return '—';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(v);
}
function fmtFiscal(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function InicioPage() {
  const navigate  = useNavigate();
  const { demoMode } = useDemo();
  const { data: mkt, loading: mktLoading } = useMarketData();

  const activeClients = useMemo(() =>
    demoMode === 'empresa'
      ? clients.filter(c => !c.esReal)
      : clients,
  [demoMode]);

  const allVenc = useMemo(() =>
    getAllVencimientos(activeClients, obligaciones),
  [activeClients]);

  const counts = useMemo(() => ({
    pendiente:   allVenc.filter(v => v.estado === 'pendiente').length,
    proximo:     allVenc.filter(v => v.estado === 'proximo').length,
    vencido:     allVenc.filter(v => v.estado === 'vencido').length,
    presentado:  allVenc.filter(v => v.estado === 'presentado').length,
  }), [allVenc]);

  const proximos = useMemo(() =>
    allVenc
      .filter(v => v.estado === 'proximo' || v.estado === 'vencido')
      .sort((a, b) => (a.fechaExactaNit ?? a.fechaFin).localeCompare(b.fechaExactaNit ?? b.fechaFin))
      .slice(0, 4),
  [allVenc]);

  // Per-client worst status
  const clientStatus = useMemo(() =>
    activeClients.map(c => {
      const venc = allVenc.filter(v => v.clienteId === c.id);
      const worst = venc.some(v => v.estado === 'vencido') ? 'vencido'
        : venc.some(v => v.estado === 'proximo') ? 'proximo'
        : venc.some(v => v.estado === 'pendiente') ? 'pendiente'
        : 'presentado';
      return { client: c, worst, total: venc.length,
        vencidos: venc.filter(v => v.estado === 'vencido').length,
        proximos: venc.filter(v => v.estado === 'proximo').length,
        presentados: venc.filter(v => v.estado === 'presentado').length,
      };
    }),
  [activeClients, allVenc]);

  // PQRs pending from localStorage
  const pqrsPendientes = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem('9a_pqrs_v1') ?? '[]') as { estado: string }[];
      return all.filter(p => p.estado === 'nueva' || p.estado === 'en_revision').length;
    } catch { return 0; }
  }, []);

  const STATUS_CFG = {
    pendiente:  { label: 'Pendientes',   color: '#7C8A9C', bg: 'rgba(124,138,156,.1)',  Icon: Clock        },
    proximo:    { label: 'Próx. a vencer', color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  Icon: AlertTriangle },
    vencido:    { label: 'Vencidas',      color: '#ef4444', bg: 'rgba(239,68,68,.1)',    Icon: XCircle      },
    presentado: { label: 'Al día',        color: '#22c55e', bg: 'rgba(34,197,94,.1)',    Icon: CheckCircle2 },
  } as const;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-cream-100">Inicio</h1>
        <p className="text-cream-200/35 text-xs mt-0.5">Panel de control operativo · 9 Alliance</p>
      </div>

      {/* ── Contadores de estado ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['vencido', 'proximo', 'pendiente', 'presentado'] as const).map(key => {
          const cfg = STATUS_CFG[key];
          return (
            <button key={key} onClick={() => navigate('/informacion-general?tab=calendario')}
              className="bg-navy-800/50 border border-white/8 rounded-xl p-4 flex flex-col gap-1.5 hover:border-white/15 transition-colors text-left">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                  <cfg.Icon size={14} strokeWidth={1.8} style={{ color: cfg.color }} />
                </div>
                <span className="text-[10px] font-semibold text-cream-200/50 uppercase tracking-wide">{cfg.label}</span>
              </div>
              <span className="text-2xl font-bold tabular-nums" style={{ color: cfg.color }}>{counts[key]}</span>
              <span className="text-[10px] text-cream-200/30">obligaciones</span>
            </button>
          );
        })}
      </div>

      {/* ── Fila principal: vencimientos + mercados + indicadores ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Próximos vencimientos */}
        <div className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-cream-100 text-xs font-semibold">Próximos vencimientos</h3>
            <button onClick={() => navigate('/informacion-general?tab=calendario')}
              className="text-gold-400/50 hover:text-gold-400 text-[10px] transition-colors">Ver todos →</button>
          </div>
          {proximos.length === 0 ? (
            <p className="px-4 py-5 text-center text-cream-200/30 text-xs">Sin vencimientos próximos</p>
          ) : (
            <div className="divide-y divide-white/5">
              {proximos.map(v => {
                const cliente = clientsMap[v.clienteId];
                const oblig   = obligaciones.find(o => o.id === v.obligacionId);
                const isVenc  = v.estado === 'vencido';
                return (
                  <button key={v.id} onClick={() => navigate(`/empresa/${v.clienteId}`)}
                    className="w-full flex items-start justify-between gap-2 px-4 py-2.5 hover:bg-white/3 transition-colors text-left">
                    <div className="min-w-0">
                      <p className="text-cream-100 text-[11px] font-semibold truncate">{cliente?.nombre ?? v.clienteId}</p>
                      <p className="text-cream-200/40 text-[10px] truncate mt-0.5">{oblig?.nombre ?? v.obligacionId}</p>
                    </div>
                    <p className={`text-[10.5px] font-semibold tabular-nums shrink-0 mt-0.5 ${isVenc ? 'text-red-400' : 'text-amber-400'}`}>
                      {shortDate(v.fechaExactaLabel ?? v.rangoFechas)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mercados */}
        <div className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8 flex items-center gap-2">
            <TrendIcon size={13} strokeWidth={2} className="text-gold-400 shrink-0" />
            <h3 className="text-cream-100 text-xs font-semibold">Mercados</h3>
          </div>
          <div className="divide-y divide-white/5">
            <MarketRow name="USD/COP" subtitle="Dólar / Peso"
              value={mktLoading ? '…' : fmtCOP(mkt?.exchange.usdCop ?? null)} change={+0.18} />
            <MarketRow name="COLCAP" subtitle="Índice BVC" value="2.261,53" change={-0.42} />
            <MarketRow name="EUR/COP" subtitle="Euro / Peso"
              value={mktLoading ? '…' : fmtCOP(mkt?.exchange.eurCop ?? null)} change={+0.03} />
            <MarketRow name="UVR" subtitle="Unidad de Valor Real" value="405,12" change={+0.01} />
          </div>
        </div>

        {/* Indicadores 2026 */}
        <div className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8">
            <h3 className="text-cream-100 text-xs font-semibold">Indicadores 2026</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { label: 'UVT',               value: fmtFiscal(UVT_2026)             },
              { label: 'SMMLV',             value: fmtFiscal(SMMLV_2026)           },
              { label: 'Auxilio transporte', value: fmtFiscal(AUX_TRANSPORTE_2026) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-cream-200/55 text-xs">{row.label}</p>
                <p className="text-gold-400 text-xs font-bold tabular-nums">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Estado por empresa ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-cream-100 text-sm font-semibold">Estado por empresa</h2>
          <button onClick={() => navigate('/empresas')} className="text-gold-400/50 hover:text-gold-400 text-[10px] transition-colors">
            Ver todas →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {clientStatus.map(({ client: c, worst, total, vencidos, proximos: prox, presentados }) => {
            const cfg = STATUS_CFG[worst as keyof typeof STATUS_CFG];
            return (
              <button key={c.id} onClick={() => navigate(`/empresa/${c.id}`)}
                className="bg-navy-800/50 border border-white/8 rounded-xl p-4 flex flex-col gap-3 hover:border-white/15 transition-colors text-left"
                style={{ borderLeft: `3px solid ${cfg.color}40` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
                      <Building2 size={15} strokeWidth={1.8} className="text-gold-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-cream-100 text-[12px] font-semibold leading-tight truncate">{c.nombre}</p>
                      <p className="text-cream-200/35 text-[10px] mt-0.5">{c.sector}</p>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  {vencidos > 0 && <span className="text-red-400">{vencidos} vencida{vencidos !== 1 ? 's' : ''}</span>}
                  {prox > 0     && <span className="text-amber-400">{prox} próxima{prox !== 1 ? 's' : ''}</span>}
                  {presentados > 0 && <span className="text-emerald-400">{presentados} al día</span>}
                  <span className="text-cream-200/25 ml-auto">{total} total</span>
                </div>
                {!c.esReal && (
                  <span className="text-[9px] text-cream-200/20 -mt-1">Demo</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PQRs pendientes ─────────────────────────────────────────────────── */}
      {pqrsPendientes > 0 && (
        <button onClick={() => navigate('/gestion-pqrs')}
          className="flex items-center gap-3 bg-navy-800/50 border border-amber-500/25 rounded-xl px-4 py-3 hover:border-amber-500/40 transition-colors text-left">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <MessageSquare size={14} strokeWidth={1.8} className="text-amber-400" />
          </div>
          <div>
            <p className="text-cream-100 text-xs font-semibold">
              {pqrsPendientes} PQR{pqrsPendientes !== 1 ? 's' : ''} pendiente{pqrsPendientes !== 1 ? 's' : ''} de revisión
            </p>
            <p className="text-cream-200/40 text-[10px] mt-0.5">Ir a Gestión de PQRs →</p>
          </div>
        </button>
      )}

    </div>
  );
}
