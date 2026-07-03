import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Globe, Scale, Gavel,
  ThumbsUp, MessageCircle, TrendingUp as TrendIcon, RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import type { NewsItem } from '../hooks/useMarketData';
import { UVT_2026, SMMLV_2026, AUX_TRANSPORTE_2026 } from '../data/fiscalParams';
import { realClients, clientsMap } from '../data/clients';
import { obligaciones } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';

// ── Types ──────────────────────────────────────────────────────────────────────
type Cat = 'eco_co' | 'eco_world' | 'jur_nac' | 'jur_glob';

interface StaticNoticia {
  id: number; cat: Cat; fuente: string; hora: string;
  titular: string; resumen: string; likes: number; com: number;
  feat?: boolean; imagen?: string;
}

// Fallback news (used while live data loads)
const STATIC_NOTICIAS: StaticNoticia[] = [
  {
    id: 1, cat: 'eco_co', fuente: 'Portafolio', hora: 'hace 2h', feat: true,
    titular: 'El dólar cierra cerca de los $3.430 tras una semana de baja volatilidad',
    resumen: 'Operadores del mercado cambiario señalan que el peso se fortaleció levemente, impulsado por flujos de portafolio y un ligero repunte en los precios del crudo Brent.',
    likes: 24, com: 6,
    imagen: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  },
  {
    id: 2, cat: 'eco_world', fuente: 'Reuters', hora: 'hace 3h',
    titular: 'Mercados globales reaccionan a las nuevas cifras de inflación en EE. UU.',
    resumen: 'Las bolsas europeas y asiáticas operan mixtas a la espera de la decisión de tasas.',
    likes: 18, com: 9,
    imagen: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
  },
  {
    id: 3, cat: 'jur_nac', fuente: 'Ámbito Jurídico', hora: 'hace 5h',
    titular: 'Reforma tributaria: las claves del proyecto que cursa en el Congreso',
    resumen: 'Cambios propuestos en renta, IVA y retención que impactarían a las personas jurídicas.',
    likes: 41, com: 12,
    imagen: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
  },
  {
    id: 4, cat: 'eco_co', fuente: 'La República', hora: 'hace 6h',
    titular: 'Banco de la República mantiene su tasa de interés en la última reunión',
    resumen: 'La junta directiva privilegia el control de la inflación frente al crecimiento.',
    likes: 15, com: 4,
    imagen: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&q=80',
  },
  {
    id: 5, cat: 'jur_glob', fuente: '9A Research', hora: 'hace 1d',
    titular: 'OCDE avanza en las reglas de tributación mínima para multinacionales',
    resumen: 'El Pilar 2 redefine cómo se gravan las grandes empresas a nivel global.',
    likes: 33, com: 7,
    imagen: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  },
];

const CAT_META: Record<Cat, { label: string; Icon: LucideIcon; bg: string; isEco: boolean }> = {
  eco_co:    { label: 'Economía · Colombia', Icon: TrendingUp, bg: '#243560', isEco: true  },
  eco_world: { label: 'Economía · Mundial',  Icon: Globe,      bg: '#1B2A4A', isEco: true  },
  jur_nac:   { label: 'Jurídico · Nacional', Icon: Scale,      bg: '#2a2826', isEco: false },
  jur_glob:  { label: 'Jurídico · Global',   Icon: Gavel,      bg: '#0d1829', isEco: false },
};

// ── Unified display item ───────────────────────────────────────────────────────
interface DisplayItem {
  key: string;
  titular: string;
  resumen?: string;
  fuente: string;
  hora: string;
  cat: Cat;
  imagen?: string;
  link?: string;
  likes?: number;
  com?: number;
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

const CAT_BY_FEED: Record<string, Cat> = {
  'Economía Colombia': 'eco_co',
  'Economía Mundial':  'eco_world',
  'Jurídico Colombia': 'jur_nac',
};

function liveToDisplay(item: NewsItem, feedLabel: string, idx: number): DisplayItem {
  return {
    key: `live-${idx}-${item.pubDate}`,
    titular: item.title,
    fuente: item.source,
    hora: relDate(item.pubDate),
    cat: CAT_BY_FEED[feedLabel] ?? 'eco_co',
    link: item.link,
  };
}

function staticToDisplay(n: StaticNoticia): DisplayItem {
  return {
    key: `static-${n.id}`,
    titular: n.titular, resumen: n.resumen, fuente: n.fuente, hora: n.hora,
    cat: n.cat, imagen: n.imagen, likes: n.likes, com: n.com,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function CatBadge({ cat, small }: { cat: Cat; small?: boolean }) {
  const { label, isEco } = CAT_META[cat];
  return (
    <span className={`inline-flex font-semibold tracking-wide rounded-full whitespace-nowrap
      ${small ? 'text-[8px] px-1.5 py-[2px]' : 'text-[9.5px] px-2.5 py-[3px]'}
      ${isEco ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
               : 'bg-white/10 text-cream-100/75 border border-white/20'}`}>
      {label}
    </span>
  );
}

function SourceRow({ fuente, hora }: { fuente: string; hora: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
        <span className="text-navy-900 text-[8px] font-bold leading-none">9A</span>
      </div>
      <span className="text-cream-200/60 text-[11px] font-medium">{fuente}</span>
      <span className="text-cream-200/25 text-[11px]">·</span>
      <span className="text-cream-200/40 text-[11px]">{hora}</span>
    </div>
  );
}

function ImgArea({ cat, imagen, children, className = '' }: {
  cat: Cat; imagen?: string; children?: React.ReactNode; className?: string;
}) {
  const { Icon, bg, isEco } = CAT_META[cat];
  const accent = isEco ? '#C9A84C' : 'rgba(237,232,220,0.35)';

  return imagen ? (
    <div className={`overflow-hidden relative ${className}`} style={{ borderLeft: `3px solid ${accent}` }}>
      <img src={imagen} alt="" className="w-full h-full object-cover" />
      {children}
    </div>
  ) : (
    <div className={`flex items-center justify-center overflow-hidden relative ${className}`}
      style={{ backgroundColor: bg, borderLeft: `3px solid ${accent}` }}>
      <Icon size={64} strokeWidth={0.75} style={{ opacity: 0.10, color: 'white' }} />
      {children}
    </div>
  );
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

// ── Page ───────────────────────────────────────────────────────────────────────
export default function InicioPage() {
  const navigate = useNavigate();
  const { data: mkt, loading: mktLoading, refresh } = useMarketData();
  const [tick, setTick] = useState(0);

  // Auto-rotate every 10 seconds
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Build display items: live news first, fallback to static
  const allItems = useMemo<DisplayItem[]>(() => {
    const live = mkt?.news.flatMap((feed, fi) =>
      feed.items.map((item, ii) => liveToDisplay(item, feed.label, fi * 100 + ii))
    ) ?? [];
    return live.length >= 4 ? live : STATIC_NOTICIAS.map(staticToDisplay);
  }, [mkt]);

  const n = allItems.length;
  const heroItem  = allItems[tick % n];
  const gridItems = [1, 2, 3, 4].map(i => allItems[(tick + i) % n]);
  const isLive    = (mkt?.news.flatMap(f => f.items).length ?? 0) >= 4;

  const proximos = useMemo(() =>
    getAllVencimientos(realClients, obligaciones)
      .filter(v => v.estado === 'proximo' || v.estado === 'vencido')
      .sort((a, b) => (a.fechaExactaNit ?? a.fechaFin).localeCompare(b.fechaExactaNit ?? b.fechaFin))
      .slice(0, 4),
  []);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Top 3 widgets ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Próximos vencimientos */}
        <div className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-cream-100 text-xs font-semibold">Próximos vencimientos</h3>
            <button onClick={() => navigate('/informacion-general?tab=calendario')}
              className="text-gold-400/50 hover:text-gold-400 text-[10px] transition-colors">
              Ver todos →
            </button>
          </div>
          {proximos.length === 0 ? (
            <p className="px-4 py-5 text-center text-cream-200/30 text-xs">Sin vencimientos próximos</p>
          ) : (
            <div className="divide-y divide-white/5">
              {proximos.map(v => {
                const cliente = clientsMap[v.clienteId];
                const oblig   = obligaciones.find(o => o.id === v.obligacionId);
                const isVenc  = v.estado === 'vencido';
                const fecha   = v.fechaExactaLabel ?? v.rangoFechas;
                return (
                  <button key={v.id} onClick={() => navigate(`/empresa/${v.clienteId}`)}
                    className="w-full flex items-start justify-between gap-2 px-4 py-2.5 hover:bg-white/3 transition-colors text-left">
                    <div className="min-w-0">
                      <p className="text-cream-100 text-[11px] font-semibold truncate">{cliente?.nombre ?? v.clienteId}</p>
                      <p className="text-cream-200/40 text-[10px] truncate mt-0.5">{oblig?.nombre ?? v.obligacionId}</p>
                    </div>
                    <p className={`text-[10.5px] font-semibold tabular-nums shrink-0 mt-0.5 ${isVenc ? 'text-red-400' : 'text-amber-400'}`}>
                      {shortDate(fecha)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Mercados */}
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

        {/* 3. Indicadores 2026 */}
        <div className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8">
            <h3 className="text-cream-100 text-xs font-semibold">Indicadores 2026</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { label: 'UVT',                value: fmtFiscal(UVT_2026)            },
              { label: 'SMMLV',              value: fmtFiscal(SMMLV_2026)          },
              { label: 'Auxilio transporte',  value: fmtFiscal(AUX_TRANSPORTE_2026) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-cream-200/55 text-xs">{row.label}</p>
                <p className="text-gold-400 text-xs font-bold tabular-nums">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Noticias header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-cream-100">Inicio</h1>
          <p className="text-cream-200/35 text-xs mt-0.5">
            Noticias de economía y temas jurídicos · Colombia y el mundo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[9.5px] text-emerald-400/80 font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              EN VIVO
            </span>
          )}
          <span className="text-cream-200/25 text-[10px]">Rotación automática cada 10 s</span>
          <button onClick={refresh} title="Actualizar noticias"
            className="text-cream-200/25 hover:text-gold-400 transition-colors">
            <RefreshCw size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div key={`hero-${tick}`} className="rounded-xl overflow-hidden border border-white/8" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="relative h-56">
          <ImgArea cat={heroItem.cat} imagen={heroItem.imagen} className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(13,24,41,0.93) 0%, rgba(13,24,41,0.1) 65%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <CatBadge cat={heroItem.cat} />
              <h2 className="text-cream-100 text-[21px] font-bold leading-snug mt-2">
                {heroItem.titular}
              </h2>
            </div>
          </ImgArea>
        </div>
        <div className="bg-navy-800/70 px-5 py-3 flex items-center justify-between border-t border-white/6">
          <SourceRow fuente={heroItem.fuente} hora={heroItem.hora} />
          {heroItem.likes !== undefined && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                <ThumbsUp size={11} strokeWidth={1.8} /> {heroItem.likes}
              </span>
              <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                <MessageCircle size={11} strokeWidth={1.8} /> {heroItem.com}
              </span>
            </div>
          )}
          {heroItem.link && !heroItem.imagen && (
            <a href={heroItem.link} target="_blank" rel="noopener noreferrer"
              className="text-gold-400/60 hover:text-gold-400 text-[11px] transition-colors">
              Leer más →
            </a>
          )}
        </div>
      </div>

      {/* ── Grid cards (2 columnas) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gridItems.map((item, i) => (
          <div key={`grid-${tick}-${i}`}
            className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden flex flex-col hover:border-white/15 transition-colors"
            style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="relative h-[130px]">
              <ImgArea cat={item.cat} imagen={item.imagen} className="absolute inset-0 w-full h-full">
                <span className="absolute top-2.5 left-2.5"><CatBadge cat={item.cat} small /></span>
              </ImgArea>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <SourceRow fuente={item.fuente} hora={item.hora} />
              <h3 className="text-cream-100 text-[14px] font-semibold leading-snug mt-2 mb-1.5"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.titular}
              </h3>
              {item.resumen ? (
                <p className="text-cream-200/55 text-[12px] leading-relaxed flex-1"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.resumen}
                </p>
              ) : item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="text-gold-400/60 hover:text-gold-400 text-[11px] mt-auto pt-2 transition-colors">
                  Leer artículo →
                </a>
              ) : null}
              {item.likes !== undefined && (
                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-white/6">
                  <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                    <ThumbsUp size={11} strokeWidth={1.8} /> {item.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                    <MessageCircle size={11} strokeWidth={1.8} /> {item.com}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] text-cream-200/18 pt-3 border-t border-white/8">
        {isLive
          ? 'Noticias en tiempo real · open.er-api.com para tasas · Contenido de fuentes públicas'
          : 'Titulares de referencia · Imágenes: Unsplash (CC0) · Conectar a RSS real según evolucione el portal.'}
      </p>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
