import { useMarketData } from '../hooks/useMarketData';
import type { NewsFeed } from '../hooks/useMarketData';

function fmtCOP(v: number | null): string {
  if (v === null) return '—';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(v);
}

function relDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3_600_000);
  const dy = Math.floor(diff / 86_400_000);
  if (h < 1) return 'hace un momento';
  if (h < 24) return `hace ${h}h`;
  if (dy === 1) return 'ayer';
  if (dy < 7) return `hace ${dy} días`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const LOADING_FEEDS: NewsFeed[] = [
  { category: 'l1', label: 'Economía Colombia', items: [] },
  { category: 'l2', label: 'Economía Mundial', items: [] },
  { category: 'l3', label: 'Jurídico Colombia', items: [] },
];

export function MarketWidget() {
  const { data, loading, refresh } = useMarketData();
  const feeds = loading ? LOADING_FEEDS : (data?.news ?? LOADING_FEEDS);

  return (
    <div className="space-y-3">

      {/* ── Exchange rate strip ────────────────────────────────────────── */}
      <div className="bg-navy-800/40 border border-white/8 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-cream-100 text-sm font-semibold">Indicadores de mercado</h2>
          <button
            onClick={refresh}
            className="text-cream-200/25 hover:text-gold-400 text-sm transition leading-none"
            title="Actualizar"
          >
            ↻
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/8">
          {/* USD/COP */}
          <div className="px-4 py-3.5">
            <p className="text-cream-200/35 text-[9.5px] uppercase tracking-wider mb-1">USD / COP</p>
            {loading ? (
              <div className="h-5 w-20 bg-white/8 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold tabular-nums leading-tight text-gold-400">
                {fmtCOP(data?.exchange.usdCop ?? null)}
              </p>
            )}
            <p className="text-cream-200/25 text-[9px] mt-0.5">Tasa diaria</p>
          </div>

          {/* EUR/COP */}
          <div className="px-4 py-3.5">
            <p className="text-cream-200/35 text-[9.5px] uppercase tracking-wider mb-1">EUR / COP</p>
            {loading ? (
              <div className="h-5 w-20 bg-white/8 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold tabular-nums leading-tight text-cream-100">
                {fmtCOP(data?.exchange.eurCop ?? null)}
              </p>
            )}
            <p className="text-cream-200/25 text-[9px] mt-0.5">Tasa diaria</p>
          </div>

          {/* UVT 2026 */}
          <div className="px-4 py-3.5">
            <p className="text-cream-200/35 text-[9.5px] uppercase tracking-wider mb-1">UVT 2026</p>
            <p className="text-lg font-bold tabular-nums leading-tight text-cream-100">$52.374</p>
            <p className="text-cream-200/25 text-[9px] mt-0.5">Resolución DIAN</p>
          </div>
        </div>

        {data?.exchange.updatedAt && !loading && (
          <div className="px-4 py-1.5 border-t border-white/5">
            <p className="text-[9px] text-cream-200/20">
              Actualizado: {new Date(data.exchange.updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              {' · '}open.er-api.com
            </p>
          </div>
        )}
      </div>

      {/* ── News feeds ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {feeds.map(feed => (
          <div key={feed.category} className="bg-navy-800/40 border border-white/8 rounded-xl overflow-hidden flex flex-col">
            <div className="px-3.5 py-2.5 border-b border-white/8 shrink-0">
              <h3 className="text-cream-100 text-xs font-semibold tracking-wide">{feed.label}</h3>
            </div>

            <div className="flex-1 divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="px-3.5 py-2.5 space-y-1.5">
                    <div className="h-3 w-full bg-white/8 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-white/8 rounded animate-pulse" />
                    <div className="h-2 w-1/3 bg-white/5 rounded animate-pulse" />
                  </div>
                ))
              ) : feed.items.length === 0 ? (
                <p className="px-3.5 py-5 text-cream-200/25 text-xs text-center">Sin noticias disponibles</p>
              ) : (
                feed.items.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3.5 py-2.5 hover:bg-white/3 transition group"
                  >
                    <p className="text-cream-100 text-[11px] leading-snug group-hover:text-gold-300 transition"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.source && (
                        <span className="text-[9px] text-gold-400/50 truncate max-w-[90px]">{item.source}</span>
                      )}
                      {item.pubDate && (
                        <span className="text-[9px] text-cream-200/25">{relDate(item.pubDate)}</span>
                      )}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
