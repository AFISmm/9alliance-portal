import { useMarketData } from '../hooks/useMarketData';

interface TItem {
  id: string;
  symbol: string;
  name: string;
  change: number;
  points: number[]; // 12 valores normalizados 0-1 (izquierda = más antiguo)
  apiKey?: 'usd' | 'eur';
  staticValue?: string;
}

const ITEMS: TItem[] = [
  {
    id: 'usd', symbol: 'USD/COP', name: 'Dólar Colombiano', change: +0.18, apiKey: 'usd',
    points: [0.44, 0.48, 0.43, 0.50, 0.47, 0.52, 0.50, 0.55, 0.53, 0.57, 0.55, 0.62],
  },
  {
    id: 'eur', symbol: 'EUR/COP', name: 'Euro / Peso', change: +0.03, apiKey: 'eur',
    points: [0.47, 0.49, 0.47, 0.51, 0.50, 0.52, 0.51, 0.54, 0.52, 0.55, 0.53, 0.57],
  },
  {
    id: 'colcap', symbol: 'COLCAP', name: 'Índice BVC', change: -0.42, staticValue: '2.261,53',
    points: [0.70, 0.65, 0.72, 0.68, 0.63, 0.67, 0.60, 0.64, 0.58, 0.55, 0.59, 0.52],
  },
  {
    id: 'uvr', symbol: 'UVR', name: 'Unidad de Valor Real', change: +0.01, staticValue: '405,12',
    points: [0.49, 0.50, 0.50, 0.51, 0.51, 0.52, 0.52, 0.53, 0.53, 0.54, 0.54, 0.55],
  },
  {
    id: 'brent', symbol: 'BRENT', name: 'Petróleo (USD/barril)', change: +0.85, staticValue: 'USD 82,40',
    points: [0.41, 0.47, 0.44, 0.51, 0.48, 0.55, 0.52, 0.58, 0.55, 0.62, 0.60, 0.66],
  },
];

const SW = 120; // sparkline width
const SH = 34;  // sparkline height

function Sparkline({ points, positive, id }: { points: number[]; positive: boolean; id: string }) {
  const step = SW / (points.length - 1);
  const toY  = (p: number) => 2 + (1 - p) * (SH - 4);
  const pts  = points.map((p, i) => [+(i * step).toFixed(1), +toY(p).toFixed(1)] as [number, number]);

  const lineStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const fillStr = `M ${pts.map(([x, y]) => `${x},${y}`).join(' L ')} L ${SW},${SH} L 0,${SH} Z`;
  const color   = positive ? '#4ade80' : '#f87171';
  const gid     = `sg-${id}`;

  return (
    <svg width={SW} height={SH} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      {/* Fill under the line */}
      <path d={fillStr} fill={`url(#${gid})`} />
      {/* Dashed baseline */}
      <line x1="0" y1={SH - 1} x2={SW} y2={SH - 1}
        stroke={color} strokeWidth="0.6" strokeDasharray="3,2" opacity="0.25" />
      {/* Sparkline */}
      <polyline points={lineStr} fill="none" stroke={color}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtN(v: number | null) {
  if (!v) return '—';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(v);
}

export function TickerStrip() {
  const { data: mkt, loading } = useMarketData();

  function getValue(item: TItem): string {
    if (item.apiKey === 'usd') return loading ? '…' : fmtN(mkt?.exchange.usdCop ?? null);
    if (item.apiKey === 'eur') return loading ? '…' : fmtN(mkt?.exchange.eurCop ?? null);
    return item.staticValue ?? '—';
  }

  return (
    <div className="overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
        {ITEMS.map(item => {
          const pos   = item.change >= 0;
          const color = pos ? '#4ade80' : '#f87171';
          return (
            <div
              key={item.id}
              className="bg-navy-800/60 border border-white/8 hover:border-white/16 rounded-xl px-4 py-3 transition-colors"
              style={{ width: 186, minWidth: 186 }}
            >
              {/* Ticker + company */}
              <p className="text-cream-100 text-[13px] font-bold tracking-wide leading-tight">{item.symbol}</p>
              <p className="text-cream-200/40 text-[10px] mt-0.5 mb-2.5 truncate">{item.name}</p>

              {/* Sparkline */}
              <Sparkline points={item.points} positive={pos} id={item.id} />

              {/* Value + change */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-cream-100/80 text-[11px] font-semibold tabular-nums">{getValue(item)}</p>
                <p className="text-[11px] font-bold tabular-nums" style={{ color }}>
                  {pos ? '+' : ''}{item.change.toFixed(2)}% {pos ? '▲' : '▼'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
